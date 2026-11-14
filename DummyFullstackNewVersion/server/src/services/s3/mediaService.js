import crypto from 'node:crypto';
import path from 'node:path';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
// Public S3 helpers
import s3Public, {
  s3PresignPut,
  s3PresignGet,
  s3DeleteObject,
  PUBLIC_BUCKET,
} from './s3public.js';
// Private S3 client + helpers
import s3Private, {
  PRIVATE_BUCKET,
  signPrivateGetObject,
  signPrivatePutObject,
} from './s3private.js';
import {
  BucketNamespace,
  MAX_UPLOAD_BYTES,
  PHOTO_EXTENSIONS,
  PHOTO_UPLOAD_URL_TTL_SECONDS,
  PHOTO_URL_TTL_SECONDS,
} from '../../utils/constants/mediaConstants.js';
import { prisma } from '../../prisma.js';
import { mediaKindFromContentType } from '../../domain/mediaGeneric.js';
import { publicMediaUrlFrom } from '../../utils/media/publicMediaUrl.js';

// No SVG anywhere: an SVG is an XML document that can carry <script>
const IMAGE_TYPES = /^(image)\/(png|jpe?g|webp|gif)$/i;
const AVATAR_TYPES = IMAGE_TYPES;
const VIDEO_TYPES = /^(video)\/(mp4|webm|quicktime|ogg|x-matroska)$/i;

// Resource registry (camelCase keys)
export const MEDIA_CFG = {
  avatar: {
    prefix: `${BucketNamespace}/avatars/`,
    visibility: 'public',
    requiresAuth: true,
    allowedTypes: [AVATAR_TYPES],
  },
  contact: {
    prefix: `${BucketNamespace}/contact/`,
    visibility: 'public',
    requiresAuth: false,
    // Images only
    allowedTypes: [IMAGE_TYPES],
    // Admin/dev-only view (app-level; bucket is still public)
    restrictedView: true,
  },
  // Travel photos: private bucket, only through the photo routes (which check
  // map and trip roles). The generic /media-services routes refuse these keys.
  photo: {
    prefix: `${BucketNamespace}/photos/`,
    visibility: 'private',
    requiresAuth: true,
    allowedTypes: [],
    generic: false,
  },
};

export const PHOTO_PREFIX = MEDIA_CFG.photo.prefix;

const ALLOWED_PREFIXES = Object.values(MEDIA_CFG).map((c) => c.prefix);
const GENERIC_PREFIXES = Object.values(MEDIA_CFG)
  .filter((c) => c.generic !== false)
  .map((c) => c.prefix);

// Validators
export function assertAllowedKey(key) {
  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    const err = new Error('Key prefix not allowed');
    err.status = 400;
    throw err;
  }
}

// The generic routes (presign, view, confirm, delete) only handle generic resources
function assertGenericKey(key) {
  if (!GENERIC_PREFIXES.some((p) => String(key).startsWith(p))) {
    const err = new Error('Key prefix not allowed');
    err.status = 400;
    throw err;
  }
}

export function assertContentTypeAllowed(contentType, allowedTypes) {
  if (!contentType || !allowedTypes?.some((re) => re.test(contentType))) {
    const err = new Error('Unsupported content type for this resource.');
    err.status = 400;
    throw err;
  }
}

// Helpers
function randomBase32(n = 16) {
  return crypto
    .randomBytes(n)
    .toString('base64url')
    .replace(/_/g, '')
    .replace(/-/g, '');
}

export function buildObjectKey({ resource, userId, filename }) {
  const cfg = MEDIA_CFG[resource];
  if (!cfg) {
    const err = new Error(`Unknown media resource: ${resource}`);
    err.status = 400;
    throw err;
  }

  const prefix = cfg.prefix;
  const ext = (
    path.extname(filename || '').replace('.', '') || 'bin'
  ).toLowerCase();
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const who = userId ? String(userId) : 'anon';
  const stem = path
    .basename(filename || 'file', path.extname(filename || 'file'))
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .slice(0, 64);
  const rand = randomBase32(8);

  return `${prefix}${who}/${yyyy}/${mm}/${stem || 'upload'}_${rand}.${ext}`;
}

export function cacheControlFor(contentType, variant = 'immutable') {
  if (
    variant === 'immutable' &&
    (IMAGE_TYPES.test(contentType) || VIDEO_TYPES.test(contentType))
  ) {
    return 'public, max-age=31536000, immutable';
  }
  if (variant === 'short') return 'public, max-age=60';
  return undefined;
}

const isPrivateKey = (key) =>
  Object.values(MEDIA_CFG)
    .filter((c) => c.visibility === 'private')
    .some((c) => key.startsWith(c.prefix));

const resourceCfgForKey = (key) =>
  Object.values(MEDIA_CFG).find((c) => key.startsWith(c.prefix));

// One MediaItem row per uploaded object
async function recordMediaItem({ key, resource, cfg, userId, contentType, filename }) {
  await prisma.mediaItem.upsert({
    where: { key },
    update: {
      resource,
      kind: mediaKindFromContentType(contentType),
      visibility: cfg.visibility === 'private' ? 'PRIVATE' : 'PUBLIC',
      contentType,
      ownerId: userId || undefined,
      originalFilename: filename || undefined,
    },
    create: {
      key,
      resource,
      kind: mediaKindFromContentType(contentType),
      visibility: cfg.visibility === 'private' ? 'PRIVATE' : 'PUBLIC',
      contentType,
      ownerId: userId || undefined,
      originalFilename: filename || undefined,
    },
  });
}

// Delete S3 object + MediaItem row (no permission check)
async function deleteObjectAndRecord(key) {
  if (isPrivateKey(key)) {
    await s3Private.send(new DeleteObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }));
  } else {
    await s3DeleteObject({ bucket: PUBLIC_BUCKET, key });
  }
  await prisma.mediaItem.delete({ where: { key } }).catch(() => {});
}

// Presign PUT for new object
export async function mintUploadUrl({
  resource,
  userId,
  filename,
  contentType,
  cache = 'immutable',
}) {
  const cfg = MEDIA_CFG[resource];
  if (!cfg || cfg.generic === false) {
    const err = new Error(`Unknown media resource: ${resource}`);
    err.status = 400;
    throw err;
  }

  if (cfg.requiresAuth && !userId) {
    const err = new Error('This resource requires an authenticated user to upload.');
    err.status = 401;
    throw err;
  }

  assertContentTypeAllowed(contentType, cfg.allowedTypes);

  const key = buildObjectKey({ resource, userId, filename });
  await recordMediaItem({ key, resource, cfg, userId, contentType, filename });

  const kind = mediaKindFromContentType(contentType);
  const maxBytes = MAX_UPLOAD_BYTES[kind];

  if (cfg.visibility === 'private') {
    const url = await signPrivatePutObject({
      bucket: PRIVATE_BUCKET,
      key,
      contentType,
      expiresIn: 600,
    });

    return { url, key, expiresIn: 600, contentType, visibility: cfg.visibility, maxBytes };
  }

  const cacheControl = cacheControlFor(contentType, cache);

  const { url, expiresIn } = await s3PresignPut({
    bucket: PUBLIC_BUCKET,
    key,
    contentType,
    cacheControl,
    expiresIn: 600,
  });

  return {
    url,
    key,
    expiresIn,
    contentType,
    visibility: cfg.visibility,
    maxBytes,
    // Direct public URL (no signing needed)
    publicUrl: publicMediaUrlFrom(key),
  };
}

// Presign GET (short-lived view)
export async function signDownloadUrl({ key, ttl = 300, user }) {
  assertAllowedKey(key);
  assertGenericKey(key);

  const cfg = resourceCfgForKey(key);
  if (cfg?.restrictedView) {
    const role = String(user?.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'DEVELOPER') {
      const err = new Error('Not authorized to view this object.');
      err.status = 403;
      throw err;
    }
  }

  const expiresIn = Math.max(1, Math.min(ttl, 7 * 24 * 60 * 60));

  if (isPrivateKey(key)) {
    const url = await signPrivateGetObject({
      bucket: PRIVATE_BUCKET,
      key,
      expiresIn,
    });

    return { url, expiresIn };
  }

  const { url } = await s3PresignGet({ bucket: PUBLIC_BUCKET, key, expiresIn });

  return { url, expiresIn };
}

// Confirm upload (enforces real size cap via HeadObject)
export async function confirmUpload({ key }) {
  assertAllowedKey(key);
  assertGenericKey(key);

  const item = await prisma.mediaItem.findUnique({ where: { key } });
  if (!item) {
    const err = new Error('Unknown media key.');
    err.status = 404;
    throw err;
  }

  const bucket = isPrivateKey(key) ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const client = isPrivateKey(key) ? s3Private : s3Public;

  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const actualBytes = head.ContentLength ?? 0;
  const maxBytes = MAX_UPLOAD_BYTES[item.kind];

  if (maxBytes && actualBytes > maxBytes) {
    await deleteObjectAndRecord(key);
    const err = new Error(
      `File too large (${actualBytes} bytes) — max for ${item.kind.toLowerCase()} is ${maxBytes} bytes.`
    );
    err.status = 413;
    throw err;
  }

  await prisma.mediaItem.update({ where: { key }, data: { bytes: actualBytes } });
  return { key, bytes: actualBytes };
}

// Hard delete
export async function hardDeleteObject({ key, user }) {
  assertAllowedKey(key);
  assertGenericKey(key);

  const item = await prisma.mediaItem.findUnique({ where: { key } });

  const role = String(user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'DEVELOPER';
  const isOwner = Boolean(item?.ownerId) && item.ownerId === user?.id;

  // Owner or admin/dev only
  if (!isOwner && !isAdmin) {
    const err = new Error('Not authorized to delete this object.');
    err.status = 403;
    throw err;
  }

  await deleteObjectAndRecord(key);
}

// for controllers/utilities
export const keyHasPrefix = (key, resource) => {
  const cfg = MEDIA_CFG[resource];
  return typeof key === 'string' && cfg ? key.startsWith(cfg.prefix) : false;
};

// Upload exists for this resource and passed confirm-upload (real size checked)
export async function isConfirmedUpload(key, resource) {
  if (!keyHasPrefix(key, resource)) return false;
  const item = await prisma.mediaItem.findUnique({
    where: { key },
    select: { resource: true, bytes: true },
  });
  return Boolean(item && item.resource === resource && item.bytes !== null);
}

const ORPHAN_AGE_HOURS = 24;
const ORPHAN_BATCH = 500;

// Delete uploads nothing references (older than a day)
export async function deleteOrphanUploads({ olderThanHours = ORPHAN_AGE_HOURS } = {}) {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  // Never a saved photo's file; an unconfirmed photo upload (no PhotoVariant
  // after a day) is fair game like any other unattached upload
  const candidates = await prisma.mediaItem.findMany({
    where: {
      createdAt: { lt: cutoff },
      usedAsAvatarBy: { is: null },
      photoVariant: { is: null },
    },
    select: { key: true },
    take: ORPHAN_BATCH,
  });
  const keys = candidates.map((item) => item.key);
  if (!keys.length) return { checked: 0, deleted: 0 };

  // Contact forms reference uploads by key
  const contactRefs = await prisma.contactForm.findMany({
    where: { imageKey: { in: keys } },
    select: { imageKey: true },
  });
  const referenced = new Set(contactRefs.map((ref) => ref.imageKey));

  let deleted = 0;
  for (const key of keys) {
    if (referenced.has(key)) continue;
    try {
      await deleteObjectAndRecord(key);
      deleted++;
    } catch (err) {
      console.error('[media] orphan cleanup failed:', key, err.message);
    }
  }

  return { checked: keys.length, deleted };
}

// ── Travel photos (private bucket; access is checked by the photo routes) ────

/** `<namespace>/photos/<mapId>/<photoId>/<size>-<random>.<ext>` */
export function buildPhotoKey({ mapId, photoId, size, contentType }) {
  const ext = PHOTO_EXTENSIONS[contentType] || 'bin';
  return `${PHOTO_PREFIX}${mapId}/${photoId}/${String(size).toLowerCase()}-${randomBase32(8)}.${ext}`;
}

/** The folder every file of one photo sits in (used to check confirmed keys). */
export const photoKeyFolder = ({ mapId, photoId }) => `${PHOTO_PREFIX}${mapId}/${photoId}/`;

/** Record the file (bytes stay null until confirmed) and presign its upload. */
export async function presignPhotoUpload({ key, contentType, userId }) {
  await recordMediaItem({ key, resource: 'photo', cfg: MEDIA_CFG.photo, userId, contentType });
  const url = await signPrivatePutObject({
    bucket: PRIVATE_BUCKET,
    key,
    contentType,
    expiresIn: PHOTO_UPLOAD_URL_TTL_SECONDS,
  });
  return { url, expiresIn: PHOTO_UPLOAD_URL_TTL_SECONDS };
}

/** What R2 actually holds for a key: `{ bytes, contentType }`, or null if it isn't there. */
export async function headPrivateObject(key) {
  try {
    const head = await s3Private.send(new HeadObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }));
    return { bytes: head.ContentLength ?? 0, contentType: head.ContentType || null };
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return null;
    throw err;
  }
}

/**
 * A signed GET for a photo file. Signed at the start of the current hour and
 * valid for two, so the URL stays the same for at least an hour (cacheable).
 */
export async function signPhotoUrl(key) {
  const hourStart = new Date();
  hourStart.setUTCMinutes(0, 0, 0);
  return signPrivateGetObject({
    bucket: PRIVATE_BUCKET,
    key,
    expiresIn: PHOTO_URL_TTL_SECONDS,
    signingDate: hourStart,
  });
}

/** Delete one stored file and its MediaItem row (no permission check). */
export const deleteStoredObject = (key) => deleteObjectAndRecord(key);

/** Delete many stored files; failures are logged and left for the orphan clean-up. */
export async function deleteStoredObjects(keys) {
  let deleted = 0;
  for (const key of keys) {
    try {
      await deleteObjectAndRecord(key);
      deleted++;
    } catch (err) {
      console.error('[media] delete failed (left for clean-up):', key, err.message);
    }
  }
  return deleted;
}
