import crypto from 'node:crypto';
import path from 'node:path';
import {
  BucketNamespace,
  MAX_UPLOAD_BYTES,
  ORPHAN_AGE_HOURS,
  ORPHAN_PHOTO_AGE_MINUTES,
  PHOTO_EXTENSIONS,
  PHOTO_UPLOAD_URL_TTL_SECONDS,
  PHOTO_URL_TTL_SECONDS,
  UNCONFIRMED_UPLOAD_LIMIT,
  UNCONFIRMED_UPLOAD_WINDOW_HOURS,
} from '../../utils/constants/mediaConstants.js';
import { prisma } from '../../prisma.js';
import {
  countUnconfirmedUploads,
  deleteUnusedMediaItems,
  findOrphanUploads,
  mediaKindFromContentType,
} from '../../domain/mediaGeneric.js';
import { publicMediaUrlFrom } from '../../utils/media/publicMediaUrl.js';
import {
  UPLOAD_IMAGE_TYPES,
  extensionForType,
  checkDeclaredUpload,
  checkStoredUpload,
  canAttachContactImage,
} from '../../utils/media/uploadRules.js';
import { DELETE_BATCH_MAX, chunk, deleteResult, distinctKeys, settleWithLimit } from '../../utils/media/batches.js';

// The AWS SDK and the two bucket clients (s3public.js, s3private.js) load on first use,
// not at start-up: most requests (sign-in, maps, trips without photos) never touch a
// bucket, and the SDK is the slowest import on a cold start.
let storagePromise = null;
const storage = () =>
  (storagePromise ??= Promise.all([
    import('@aws-sdk/client-s3'),
    import('./s3public.js'),
    import('./s3private.js'),
  ])
    .then(([sdk, pub, priv]) => ({ sdk, pub, priv }))
    .catch((err) => {
      storagePromise = null; // try again next time
      throw err;
    }));

// For cacheControlFor only. What each resource accepts is its exact `allowedTypes`.
const IMAGE_TYPES = /^(image)\/(png|jpe?g|webp|gif)$/i;
const VIDEO_TYPES = /^(video)\/(mp4|webm|quicktime|ogg|x-matroska)$/i;

// Resource registry (camelCase keys). `allowedTypes` are exact MIME types, each with
// an extension in uploadRules.js (never SVG or HTML); `maxBytes` caps the declared
// size, which the upload URL signs, and the real size checked on confirm.
export const MEDIA_CFG = {
  avatar: {
    prefix: `${BucketNamespace}/avatars/`,
    visibility: 'public',
    requiresAuth: true,
    allowedTypes: UPLOAD_IMAGE_TYPES,
    maxBytes: MAX_UPLOAD_BYTES.IMAGE,
  },
  contact: {
    prefix: `${BucketNamespace}/contact/`,
    visibility: 'public',
    // The public contact form: visitors upload without an account. Small images only,
    // and a form attaches one only while it's fresh and unused (isUsableContactImage).
    requiresAuth: false,
    allowedTypes: UPLOAD_IMAGE_TYPES,
    maxBytes: MAX_UPLOAD_BYTES.IMAGE,
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
    maxBytes: 0,
    generic: false,
  },
};

/** An error the generic media handlers answer with as it is (4xx). */
const httpError = (status, message) => Object.assign(new Error(message), { status });

export const PHOTO_PREFIX = MEDIA_CFG.photo.prefix;

const ALLOWED_PREFIXES = Object.values(MEDIA_CFG).map((c) => c.prefix);
const GENERIC_PREFIXES = Object.values(MEDIA_CFG)
  .filter((c) => c.generic !== false)
  .map((c) => c.prefix);
const GENERIC_RESOURCES = Object.keys(MEDIA_CFG).filter((name) => MEDIA_CFG[name].generic !== false);

export const TOO_MANY_UNCONFIRMED_UPLOADS = 'Too many unfinished uploads. Please try again later.';

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

/** A type this resource accepts (exact MIME match). */
export const isAllowedUploadType = (resource, contentType) =>
  Boolean(MEDIA_CFG[resource]?.allowedTypes.includes(contentType));

// Helpers
function randomBase32(n = 16) {
  return crypto
    .randomBytes(n)
    .toString('base64url')
    .replace(/_/g, '')
    .replace(/-/g, '');
}

// The extension comes from the type (uploadRules.js), never from `filename`, which
// only gives the readable part of the name.
export function buildObjectKey({ resource, userId, filename, contentType }) {
  const cfg = MEDIA_CFG[resource];
  if (!cfg) throw httpError(400, 'Unknown media resource.');

  const prefix = cfg.prefix;
  const ext = extensionForType(contentType);
  if (!ext) throw httpError(400, 'That file type can’t be uploaded here.');
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

/**
 * Refuse (429) a presign that would leave the user with more than `limit` unconfirmed
 * uploads of these resources over the last day. `adding` is how many this presign makes.
 */
export async function assertUnconfirmedUploadsUnder({ userId, resources, limit, adding = 1 }) {
  if (!userId) return;
  const since = new Date(Date.now() - UNCONFIRMED_UPLOAD_WINDOW_HOURS * 60 * 60 * 1000);
  const pending = await countUnconfirmedUploads({ ownerId: userId, resources, since });
  if (pending + adding > limit) throw httpError(429, TOO_MANY_UNCONFIRMED_UPLOADS);
}

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

// ── Deleting stored files ─────────────────────────────────────────────────────

/** The client and bucket a key lives in. */
const bucketOf = ({ pub, priv }, key) =>
  isPrivateKey(key)
    ? { client: priv.default, bucket: priv.PRIVATE_BUCKET }
    : { client: pub.default, bucket: pub.PUBLIC_BUCKET };

// One key per request; also the fallback when a whole DeleteObjects request fails
const deleteOne = async (store, key) => {
  const { client, bucket } = bucketOf(store, key);
  await client.send(new store.sdk.DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

let warnedBatchFallback = false;

/**
 * Up to 1,000 keys of one bucket in one DeleteObjects request. If the request itself
 * fails (not single keys), the keys are deleted one by one, eight at a time.
 * DeleteObjects needs a body checksum: SDK 3.729+ sends x-amz-checksum-crc32 even with
 * requestChecksumCalculation WHEN_REQUIRED (it's a required checksum), which R2 has
 * accepted since February 2025. -> `{ removed, failed }`
 */
async function deleteChunk(store, client, bucket, keys) {
  if (keys.length === 1) {
    try {
      await deleteOne(store, keys[0]);
      return { removed: keys, failed: [] };
    } catch (err) {
      console.error('[media] delete failed (left for clean-up):', keys[0], err?.message);
      return { removed: [], failed: keys };
    }
  }
  try {
    const reply = await client.send(
      new store.sdk.DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      })
    );
    const result = deleteResult(keys, reply);
    if (result.failed.length) {
      console.error(`[media] ${result.failed.length} file(s) not deleted (left for clean-up):`, reply.Errors?.[0]?.Code);
    }
    return result;
  } catch (err) {
    if (!warnedBatchFallback) {
      warnedBatchFallback = true;
      console.error('[media] DeleteObjects failed; deleting one file at a time instead:', err?.name, err?.message);
    }
    const settled = await settleWithLimit(keys, 8, (key) => deleteOne(store, key));
    return {
      removed: settled.filter((r) => r.ok).map((r) => r.item),
      failed: settled.filter((r) => !r.ok).map((r) => r.item),
    };
  }
}

/** Delete stored files (either bucket), in batches. Never throws: -> `{ removed, failed }` */
async function deleteFiles(keys) {
  const list = distinctKeys(keys);
  const removed = [];
  const failed = [];
  if (!list.length) return { removed, failed };
  let store;
  try {
    store = await storage();
  } catch (err) {
    console.error('[media] storage unavailable (files left for clean-up):', err?.message);
    return { removed, failed: list };
  }
  const groups = [list.filter(isPrivateKey), list.filter((k) => !isPrivateKey(k))];
  for (const group of groups) {
    if (!group.length) continue;
    const { client, bucket } = bucketOf(store, group[0]);
    for (const part of chunk(group, DELETE_BATCH_MAX)) {
      const result = await deleteChunk(store, client, bucket, part);
      removed.push(...result.removed);
      failed.push(...result.failed);
    }
  }
  return { removed, failed };
}

/**
 * Delete stored files, then the MediaItem rows of the ones that went (never a row a
 * photo or an avatar still uses). A file that couldn't be deleted keeps its row, so the
 * daily clean-up finds it and tries again. -> `{ deleted, failed }`
 */
async function deleteFilesAndRecords(keys) {
  const { removed, failed } = await deleteFiles(keys);
  let deleted = 0;
  for (const part of chunk(removed, DELETE_BATCH_MAX)) {
    try {
      deleted += (await deleteUnusedMediaItems(part)).count;
    } catch (err) {
      // The files are gone; the rows stay unused, and the clean-up removes them
      console.error('[media] deleting upload rows failed (left for clean-up):', err?.message);
    }
  }
  return { deleted, failed: failed.length };
}

// One file and its MediaItem row (no permission check). Throws if the file can't go.
async function deleteObjectAndRecord(key) {
  const store = await storage();
  await deleteOne(store, key);
  await prisma.mediaItem.delete({ where: { key } }).catch(() => {});
}

// Presign PUT for new object. The URL signs `contentType` and `bytes`, so the bucket
// takes only that type at exactly that size (signedUpload.js).
export async function mintUploadUrl({
  resource,
  userId,
  filename,
  contentType,
  bytes,
  cache = 'immutable',
}) {
  const cfg = MEDIA_CFG[resource];
  if (!cfg || cfg.generic === false) throw httpError(400, 'Unknown media resource.');

  if (cfg.requiresAuth && !userId) throw httpError(401, 'Sign in to upload this file.');

  const declared = checkDeclaredUpload({ contentType, bytes }, cfg);
  if (!declared.ok) throw httpError(declared.status, declared.message);

  // A signed-in user can't pile up uploads they never confirm (visitors' contact
  // uploads are rate limited per IP instead)
  await assertUnconfirmedUploadsUnder({ userId, resources: GENERIC_RESOURCES, limit: UNCONFIRMED_UPLOAD_LIMIT.generic });

  const key = buildObjectKey({ resource, userId, filename, contentType });
  await recordMediaItem({ key, resource, cfg, userId, contentType, filename });
  const { pub, priv } = await storage();

  if (cfg.visibility === 'private') {
    const url = await priv.signPrivatePutObject({
      bucket: priv.PRIVATE_BUCKET,
      key,
      contentType,
      contentLength: bytes,
      expiresIn: 600,
    });

    return { url, key, expiresIn: 600, contentType, bytes, visibility: cfg.visibility, maxBytes: cfg.maxBytes };
  }

  const cacheControl = cacheControlFor(contentType, cache);

  const { url, expiresIn } = await pub.s3PresignPut({
    bucket: pub.PUBLIC_BUCKET,
    key,
    contentType,
    contentLength: bytes,
    cacheControl,
    expiresIn: 600,
  });

  return {
    url,
    key,
    expiresIn,
    contentType,
    bytes,
    visibility: cfg.visibility,
    maxBytes: cfg.maxBytes,
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
  const { pub, priv } = await storage();

  if (isPrivateKey(key)) {
    const url = await priv.signPrivateGetObject({
      bucket: priv.PRIVATE_BUCKET,
      key,
      expiresIn,
    });

    return { url, expiresIn };
  }

  const { url } = await pub.s3PresignGet({ bucket: pub.PUBLIC_BUCKET, key, expiresIn });

  return { url, expiresIn };
}

/** What the bucket holds for a key: `{ bytes, contentType }`, or null if it isn't there. */
async function headStoredObject(key) {
  const store = await storage();
  const { client, bucket } = bucketOf(store, key);
  try {
    const head = await client.send(new store.sdk.HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { bytes: head.ContentLength ?? 0, contentType: head.ContentType || null };
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return null;
    throw err;
  }
}

// Confirm upload: HEAD the object and check its real type and size against what was
// presigned and the resource's rules. Only a confirmed upload (bytes set) can be used.
export async function confirmUpload({ key, user }) {
  assertAllowedKey(key);
  assertGenericKey(key);

  const item = await prisma.mediaItem.findUnique({ where: { key } });
  // Someone else's upload answers like a missing one. Anonymous (contact) uploads have
  // no owner: their random key is the only secret.
  if (!item || (item.ownerId && item.ownerId !== user?.id)) throw httpError(404, 'Unknown media key.');

  const cfg = MEDIA_CFG[item.resource];
  if (!cfg || cfg.generic === false || !key.startsWith(cfg.prefix)) throw httpError(400, 'Key prefix not allowed');

  const stored = await headStoredObject(key);
  const check = checkStoredUpload(stored, {
    contentType: item.contentType,
    allowedTypes: cfg.allowedTypes,
    maxBytes: cfg.maxBytes,
  });
  if (!check.ok) {
    // Delete what arrived. The MediaItem row stays unconfirmed (unusable) until the
    // daily clean-up, which also removes anything PUT again on the still-valid URL.
    if (!check.missing) await deleteOne(await storage(), key);
    throw httpError(400, check.message);
  }

  await prisma.mediaItem.update({ where: { key }, data: { bytes: stored.bytes } });
  return { key, bytes: stored.bytes };
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

// A contact form may attach this key: a confirmed contact image of an allowed type,
// uploaded within the last hour and not on another form (uploadRules.js)
export async function isUsableContactImage(key) {
  if (!keyHasPrefix(key, 'contact')) return false;
  const [item, usedBy] = await Promise.all([
    prisma.mediaItem.findUnique({
      where: { key },
      select: { resource: true, bytes: true, contentType: true, createdAt: true },
    }),
    prisma.contactForm.findFirst({ where: { imageKey: key }, select: { id: true } }),
  ]);
  return canAttachContactImage({
    item,
    alreadyUsed: Boolean(usedBy),
    allowedTypes: MEDIA_CFG.contact.allowedTypes,
  });
}

const ORPHAN_BATCH = 500;

/**
 * Delete uploads nothing uses: photo files after `photoOlderThanMinutes` (a photo
 * can't be saved after PHOTO_SAVE_WINDOW_MINUTES), everything else after
 * `olderThanHours`. Never a file a PhotoVariant or an avatar uses, nor a contact image
 * a form shows (left out by the query, so they can't hold up the batches).
 *
 * Works through them oldest first, `batchSize` at a time (one query, one DeleteObjects
 * per bucket and one row delete per batch), until none are left or `deadline` (a
 * Date.now() value) passes. -> `{ checked, deleted, failed, batches, complete }`
 */
export async function deleteOrphanUploads({
  olderThanHours = ORPHAN_AGE_HOURS,
  photoOlderThanMinutes = ORPHAN_PHOTO_AGE_MINUTES,
  batchSize = ORPHAN_BATCH,
  deadline = Infinity,
} = {}) {
  if (!Number.isFinite(olderThanHours) || olderThanHours <= 0 || !Number.isFinite(photoOlderThanMinutes) || photoOlderThanMinutes <= 0) {
    throw new RangeError('deleteOrphanUploads: the ages must be positive numbers');
  }
  const now = Date.now();
  const cutoff = new Date(now - olderThanHours * 60 * 60 * 1000);
  const photoCutoff = new Date(now - photoOlderThanMinutes * 60 * 1000);

  const totals = { checked: 0, deleted: 0, failed: 0, batches: 0, complete: false };
  let after = null;
  while (Date.now() < deadline) {
    const rows = await findOrphanUploads({ cutoff, photoCutoff, after, take: batchSize });
    if (rows.length) {
      const result = await deleteFilesAndRecords(rows.map((row) => row.key));
      totals.batches++;
      totals.checked += rows.length;
      totals.deleted += result.deleted;
      totals.failed += result.failed;
      // Rows that failed stay behind `after`, so the next batch moves on
      after = rows[rows.length - 1];
    }
    if (rows.length < batchSize) {
      totals.complete = true;
      break;
    }
  }
  return totals;
}

// ── Travel photos (private bucket; access is checked by the photo routes) ────

/** `<namespace>/photos/<mapId>/<photoId>/<size>-<random>.<ext>` */
export function buildPhotoKey({ mapId, photoId, size, contentType }) {
  const ext = PHOTO_EXTENSIONS[contentType] || 'bin';
  return `${PHOTO_PREFIX}${mapId}/${photoId}/${String(size).toLowerCase()}-${randomBase32(8)}.${ext}`;
}

/** The folder every file of one photo sits in (used to check confirmed keys). */
export const photoKeyFolder = ({ mapId, photoId }) => `${PHOTO_PREFIX}${mapId}/${photoId}/`;

/** Refuse (429) a photo presign that would leave the user more than the cap of unconfirmed photo files. */
export const assertPhotoUploadsUnderCap = (userId, adding) =>
  assertUnconfirmedUploadsUnder({ userId, resources: ['photo'], limit: UNCONFIRMED_UPLOAD_LIMIT.photo, adding });

/**
 * Record the file (bytes stay null until confirmed) and presign its upload. The URL
 * signs `contentType` and `bytes` (the caller checks them against PHOTO_MAX_BYTES).
 */
export async function presignPhotoUpload({ key, contentType, bytes, userId }) {
  await recordMediaItem({ key, resource: 'photo', cfg: MEDIA_CFG.photo, userId, contentType });
  const { priv } = await storage();
  const url = await priv.signPrivatePutObject({
    bucket: priv.PRIVATE_BUCKET,
    key,
    contentType,
    contentLength: bytes,
    expiresIn: PHOTO_UPLOAD_URL_TTL_SECONDS,
  });
  return { url, expiresIn: PHOTO_UPLOAD_URL_TTL_SECONDS };
}

/** What R2 actually holds for a photo key: `{ bytes, contentType }`, or null if it isn't there. */
export const headPrivateObject = (key) => {
  if (!isPrivateKey(key)) throw httpError(400, 'Key prefix not allowed');
  return headStoredObject(key);
};

/**
 * A signed GET for a photo file. Signed at the start of the current hour and
 * valid for two, so the URL stays the same for at least an hour (cacheable).
 */
export async function signPhotoUrl(key) {
  const hourStart = new Date();
  hourStart.setUTCMinutes(0, 0, 0);
  const { priv } = await storage();
  return priv.signPrivateGetObject({
    bucket: priv.PRIVATE_BUCKET,
    key,
    expiresIn: PHOTO_URL_TTL_SECONDS,
    signingDate: hourStart,
  });
}

/** Delete one stored file and its MediaItem row (no permission check). */
export const deleteStoredObject = (key) => deleteObjectAndRecord(key);

/**
 * Delete many stored files and their MediaItem rows: one DeleteObjects request per
 * 1,000 files of a bucket, then the rows. Call it after the rows that point at the files
 * (PhotoVariant) are gone: a failure then leaves only unused files and rows, which the
 * daily clean-up removes. Never throws. -> how many were deleted
 */
export async function deleteStoredObjects(keys) {
  const { deleted } = await deleteFilesAndRecords(keys);
  return deleted;
}
