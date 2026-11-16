// Sample videos for the First Class seed account (docs/API.md, "Videos"): the clips listed
// in the repo's seed-videos/videos.json, each a `video.mp4` downloaded by hand into its
// folder (seed-videos/README.md; the files aren't in git). Each is uploaded to Cloudflare
// Stream from here (a whole-file upload, up to 200 MB), then saved as a video on the
// account's default map, PROCESSING until Stream has converted it (its notice, or the
// first time an editor opens it, makes it READY). Clips that are missing, unreadable, too
// long, too big or still holding a location are skipped with a message; without Stream's
// settings the step is skipped.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../src/prisma.js';
import { seedAccountOnPlan } from './users.js';
import { createPhotoInDB } from '../../src/domain/photos.js';
import { readMp4Info } from '../../src/utils/mp4Info.js';
import { videoStateFrom } from '../../src/utils/streamTokens.js';
import { VIDEO_MAX_SECONDS } from '../../src/utils/constants/plans.js';
import { streamEnabled } from '../../src/services/stream/streamConfig.js';
import { updateVideo, uploadFile } from '../../src/services/stream/streamApi.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SEED_VIDEOS_DIR = path.resolve(here, '../../../seed-videos');
// Stream's whole-file upload takes up to 200 MB (the app's own uploads go up to 500 MB, resumably)
const SEED_MAX_BYTES = 200 * 1024 * 1024;

/** Why a clip can't be seeded, or null. */
function problemWith(info, bytes) {
  if (!info || !info.durationS) return 'not an MP4 or MOV the seed can read';
  if (info.hasLocation) return 'it still holds a location (the app takes it out before upload; do the same first)';
  if (info.durationS > VIDEO_MAX_SECONDS) return `${info.durationS} s is over the ${VIDEO_MAX_SECONDS} s limit`;
  if (bytes > SEED_MAX_BYTES) return 'over 200 MB (the seed’s whole-file upload limit)';
  return null;
}

/**
 * -> `{ videos }` (how many were made), or `{ skipped: true }` without Stream's settings.
 * `ownerEmail` owns the map they go on (its default map): the First Class account.
 */
export async function seedDemoVideos({ dir = SEED_VIDEOS_DIR, ownerEmail = seedAccountOnPlan('PREMIUM').email } = {}) {
  if (!streamEnabled()) {
    console.log('⏭️  Demo videos skipped: Cloudflare Stream isn’t set up (the CLOUDFLARE_* keys in .env.example)');
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
    const buffer = await fs.readFile(file);
    const info = readMp4Info(buffer);
    const problem = problemWith(info, buffer.length);
    if (problem) {
      console.log(`⏭️  ${entry.slug}: skipped, ${problem}`);
      continue;
    }

    const photoId = crypto.randomUUID();
    const video = await uploadFile({ buffer, name: photoId });
    await updateVideo(video.uid, { meta: { photoId, mapId: map.id, seed: entry.slug } });
    await createPhotoInDB({
      photo: {
        id: photoId,
        mapId: map.id,
        uploaderId: owner.id,
        tripId: null,
        kind: 'VIDEO',
        durationS: info.durationS,
        streamUid: video.uid,
        videoState: videoStateFrom(video),
        videoBytes: buffer.length,
        countryCode: entry.countryCode,
        caption: entry.caption,
        takenAt: new Date(entry.takenAt),
        latitude: null,
        longitude: null,
        width: info.width ?? 1280,
        height: info.height ?? 720,
      },
      variants: [],
      landmarkMatches: [],
    });
    made += 1;
  }
  console.log(`✅ Seeded ${made} of ${manifest.length} demo videos on ${ownerEmail}'s map (in Cloudflare Stream)`);
  return { videos: made };
}
