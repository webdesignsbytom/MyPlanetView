// Demo photos for the seeded USER's map: the 16 test photos in the repo's seed-photos/
// folder (from Wikimedia Commons; credits in its README). Each one becomes a real photo,
// exactly as an upload by that person makes it:
// - its files go to the PRIVATE bucket at the keys an upload gets (buildPhotoKey:
//   `<photos prefix><mapId>/<photoId>/<size>-<random>.<ext>`), owned by the uploader;
// - the copies the map's owner's plan keeps: THUMB and DISPLAY, plus the PRINT copy on
//   Economy (as the browser makes it: seed-photos/<slug>/print.jpg, from
//   images/src/tools/seed-print-copies.mjs) or the ORIGINAL on a paid plan;
// - then a MediaItem per file, the Photo with its PhotoVariants, a PHOTO visit for its
//   country and GPS landmark suggestions (createPhotoInDB, in one transaction).
// The partner (the seeded ADMIN, an editor of the map) uploaded some of them, and the
// trip's photos are on the trip. Every other photo with a suggestion has its nearest
// landmark confirmed, as the owner would, so the demo passport has stamps and the rest
// still show the "confirm" step.
//
// The keys are new each run, so the seed deletes the last run's files before wiping the
// tables (deleteStoredFiles in utils.js). Without STORAGE_PRIVATE_BUCKET this step is
// skipped, and the rest still seeds.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../src/prisma.js';
import { seedAccounts } from './users.js';
import { buildPhotoKey, PHOTO_PREFIX, putPrivateObject } from '../../src/services/s3/mediaService.js';
import { loadUploadRules } from '../../src/services/travel/plans.js';
import { confirmPhotoLandmarkInDB, createPhotoInDB } from '../../src/domain/photos.js';
import { findLandmarksInBox } from '../../src/domain/places.js';
import { mediaKindFromContentType } from '../../src/domain/mediaGeneric.js';
import { boundingBox, matchLandmarks } from '../../src/utils/landmarkMatch.js';
import { countryAtPosition } from '../../src/utils/countryLookup.js';
import { DEMO_TRIPS } from './data/demoTravels.js';
import { named } from './travel.js';

export const SEED_PHOTOS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../seed-photos');

// The trips the manifest's `trip` names (the demo couple's trips' keys, data/demoTravels.js),
// by the title travel.js gives them
const TRIP_TITLES = Object.fromEntries(DEMO_TRIPS.map((trip) => [trip.key, named(trip.title)]));

const emailOf = (role) => seedAccounts.find((a) => a.role === role).email;

/**
 * `ownerEmail` owns the map the photos go on (its default map), `partnerEmail` is the
 * editor who uploaded some of them; both default to the seeded accounts.
 * -> `{ photos }`, the number made, or `{ skipped: true }` without a private bucket.
 */
export async function seedDemoPhotos({ dir = SEED_PHOTOS_DIR, ownerEmail = emailOf('USER'), partnerEmail = emailOf('ADMIN') } = {}) {
  if (!process.env.STORAGE_PRIVATE_BUCKET) {
    console.log('⏭️  Demo photos skipped: STORAGE_PRIVATE_BUCKET isn’t set, so there is nowhere to put them');
    return { skipped: true };
  }

  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'photos.json'), 'utf8'));
  const [owner, partner] = await Promise.all(
    [ownerEmail, partnerEmail].map((email) => prisma.user.findUniqueOrThrow({ where: { email }, select: { id: true } })),
  );
  const map = await prisma.travelMap.findFirstOrThrow({ where: { ownerId: owner.id, isDefault: true }, select: { id: true } });
  const trips = await prisma.trip.findMany({ where: { mapId: map.id }, select: { id: true, title: true } });
  const tripId = (name) => (name ? trips.find((t) => t.title === TRIP_TITLES[name])?.id ?? null : null);
  // The copies an upload to this map sends: the owner's plan decides (utils/planLimits.js)
  const rules = await loadUploadRules(map.id);
  const sizes = ['THUMB', 'DISPLAY', rules?.keepsOriginals ? 'ORIGINAL' : 'PRINT'];

  // A new photo goes first in its galleries, so the last one saved shows first:
  // saving them in reverse keeps the manifest's order
  let suggested = 0;
  for (const entry of [...manifest].reverse()) {
    const uploaderId = entry.uploader === 'partner' ? partner.id : owner.id;
    const photoId = crypto.randomUUID();
    const variants = [];

    // Files first, then the rows: a row never points at a file that isn't there
    for (const size of sizes) {
      const file = entry.files[size];
      if (!file) throw new Error(`seed-photos/photos.json: ${entry.slug} has no ${size} copy`);
      const body = await fs.readFile(path.join(dir, entry.slug, file.file));
      const key = buildPhotoKey({ mapId: map.id, photoId, size, contentType: file.contentType });
      await putPrivateObject({ key, body, contentType: file.contentType });
      // As presign records it and confirm completes it (no file name is kept for photos)
      const media = await prisma.mediaItem.create({
        data: {
          key,
          resource: 'photo',
          kind: mediaKindFromContentType(file.contentType),
          visibility: 'PRIVATE',
          contentType: file.contentType,
          bytes: body.length,
          ownerId: uploaderId,
        },
        select: { id: true },
      });
      variants.push({ size, mediaId: media.id, bytes: body.length, contentType: file.contentType, width: file.width, height: file.height });
    }

    const hasGps = entry.latitude !== null && entry.longitude !== null;
    const position = { latitude: entry.latitude, longitude: entry.longitude };
    const landmarkMatches = hasGps
      ? matchLandmarks(position, await findLandmarksInBox(boundingBox(entry.latitude, entry.longitude)))
      : [];
    await createPhotoInDB({
      photo: {
        id: photoId,
        mapId: map.id,
        uploaderId,
        tripId: tripId(entry.trip),
        // As an upload: the GPS position decides, the chosen country when there's none
        countryCode: (hasGps ? countryAtPosition(entry.latitude, entry.longitude) : null) ?? entry.countryCode,
        caption: entry.caption,
        takenAt: new Date(entry.takenAt),
        latitude: hasGps ? entry.latitude : null,
        longitude: hasGps ? entry.longitude : null,
        width: entry.files.ORIGINAL.width,
        height: entry.files.ORIGINAL.height,
      },
      variants,
      landmarkMatches,
    });
    if (landmarkMatches.length) {
      if (suggested % 2 === 0) await confirmPhotoLandmarkInDB(photoId, landmarkMatches[0].landmarkId);
      suggested += 1;
    }
  }

  console.log(
    `✅ Seeded ${manifest.length} demo photos on ${ownerEmail}'s map (${sizes.join(', ')}; files in the private bucket under ${PHOTO_PREFIX}${map.id}/)`,
  );
  return { photos: manifest.length };
}
