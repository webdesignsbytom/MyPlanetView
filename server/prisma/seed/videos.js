// Sample videos for the First Class seed account (docs/API.md, "Videos"): the clips listed
// in the repo's seed-videos/videos.json, each a `video.mp4` downloaded by hand into its
// folder (seed-videos/README.md; the files aren't in git). Each becomes a real video as an
// upload makes it: its poster frames and its file go to the PRIVATE bucket under fixed keys,
// then a MediaItem per file and the Photo row (kind VIDEO) with createPhotoInDB.
// Clips that are missing, unreadable, too long, too big or still holding a location are
// skipped with a message; without STORAGE_PRIVATE_BUCKET the step is skipped.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../src/prisma.js';
import { seedAccountOnPlan } from './users.js';
import { PHOTO_PREFIX, putPrivateObject } from '../../src/services/s3/mediaService.js';
import { createPhotoInDB } from '../../src/domain/photos.js';
import { mediaKindFromContentType } from '../../src/domain/mediaGeneric.js';
import { readMp4Info } from '../../src/utils/mp4Info.js';
import { VIDEO_MAX_SECONDS } from '../../src/utils/constants/plans.js';
import { VIDEO_MAX_BYTES } from '../../src/utils/constants/mediaConstants.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SEED_VIDEOS_DIR = path.resolve(here, '../../../seed-videos');
const POSTERS_DIR = path.resolve(here, '../../../media/visitCountryPosters');

const seedKey = (slug, file) => `${PHOTO_PREFIX}seed/videos/${slug}/${file}`;

/** The clip's poster frame: its own, else its country's poster (WebP, 800 px). */
async function posterFor(dir, entry) {
  for (const [file, contentType] of [['poster.webp', 'image/webp'], ['poster.jpg', 'image/jpeg']]) {
    const own = path.join(dir, entry.slug, file);
    if (existsSync(own)) return { body: await fs.readFile(own), contentType, ext: file.split('.').pop(), width: 800, height: 450 };
  }
  const country = path.join(POSTERS_DIR, `${entry.countryCode.toLowerCase()}-800.webp`);
  if (existsSync(country)) return { body: await fs.readFile(country), contentType: 'image/webp', ext: 'webp', width: 800, height: 1000 };
  return null;
}

/** Why a clip can't be seeded, or null. */
function problemWith(info, bytes) {
  if (!info || !info.durationS) return 'not an MP4 or MOV the seed can read';
  if (info.hasLocation) return 'it still holds a location (the app overwrites it before upload; do the same first)';
  if (info.durationS > VIDEO_MAX_SECONDS) return `${info.durationS} s is over the ${VIDEO_MAX_SECONDS} s limit`;
  if (bytes > VIDEO_MAX_BYTES) return 'over 500 MB';
  return null;
}

/**
 * -> `{ videos }` (how many were made), or `{ skipped: true }` without a private bucket.
 * `ownerEmail` owns the map they go on (its default map): the First Class account.
 */
export async function seedDemoVideos({ dir = SEED_VIDEOS_DIR, ownerEmail = seedAccountOnPlan('PREMIUM').email } = {}) {
  if (!process.env.STORAGE_PRIVATE_BUCKET) {
    console.log('⏭️  Demo videos skipped: STORAGE_PRIVATE_BUCKET isn’t set, so there is nowhere to put them');
    return { skipped: true };
  }
  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'videos.json'), 'utf8'));
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail }, select: { id: true } });
  const map = await prisma.travelMap.findFirstOrThrow({ where: { ownerId: owner.id, isDefault: true }, select: { id: true } });

  let made = 0;
  // Saved in reverse, so the gallery shows them in the manifest's order (a new one goes first)
  for (const entry of [...manifest].reverse()) {
    const file = path.join(dir, entry.slug, 'video.mp4');
    if (!existsSync(file)) {
      console.log(`⏭️  ${entry.slug}: no video.mp4 yet (seed-videos/README.md says where to get it)`);
      continue;
    }
    const body = await fs.readFile(file);
    const info = readMp4Info(body);
    const problem = problemWith(info, body.length);
    const poster = problem ? null : await posterFor(dir, entry);
    if (problem || !poster) {
      console.log(`⏭️  ${entry.slug}: skipped, ${problem ?? 'no poster frame and no country poster'}`);
      continue;
    }

    // Files first, then the rows: a row never points at a file that isn't there
    const files = [
      { size: 'THUMB', key: seedKey(entry.slug, `thumb.${poster.ext}`), body: poster.body, contentType: poster.contentType, width: poster.width, height: poster.height },
      { size: 'DISPLAY', key: seedKey(entry.slug, `display.${poster.ext}`), body: poster.body, contentType: poster.contentType, width: poster.width, height: poster.height },
      { size: 'ORIGINAL', key: seedKey(entry.slug, 'video.mp4'), body, contentType: 'video/mp4', width: info.width ?? 1280, height: info.height ?? 720 },
    ];
    const variants = [];
    for (const f of files) {
      await putPrivateObject({ key: f.key, body: f.body, contentType: f.contentType });
      const media = await prisma.mediaItem.create({
        data: {
          key: f.key,
          resource: 'photo',
          kind: mediaKindFromContentType(f.contentType),
          visibility: 'PRIVATE',
          contentType: f.contentType,
          bytes: f.body.length,
          ownerId: owner.id,
          originalFilename: `${entry.slug}-${f.size.toLowerCase()}`,
        },
        select: { id: true },
      });
      variants.push({ size: f.size, mediaId: media.id, bytes: f.body.length, contentType: f.contentType, width: f.width, height: f.height });
    }
    await createPhotoInDB({
      photo: {
        id: crypto.randomUUID(),
        mapId: map.id,
        uploaderId: owner.id,
        tripId: null,
        kind: 'VIDEO',
        durationS: info.durationS,
        countryCode: entry.countryCode,
        caption: entry.caption,
        takenAt: new Date(entry.takenAt),
        latitude: null,
        longitude: null,
        width: info.width ?? 1280,
        height: info.height ?? 720,
      },
      variants,
      landmarkMatches: [],
    });
    made += 1;
  }
  console.log(`✅ Seeded ${made} of ${manifest.length} demo videos on ${ownerEmail}'s map`);
  return { videos: made };
}
