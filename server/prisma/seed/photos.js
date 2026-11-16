// Demo photos for the seeded USER's map: the 16 test photos in the repo's seed-photos/
// folder (from Wikimedia Commons; credits in its README). Each one becomes a real photo,
// as an upload makes it: its three files go to the PRIVATE bucket, then a MediaItem per
// file, the Photo with its PhotoVariants, a PHOTO visit for its country and GPS landmark
// suggestions (createPhotoInDB, in one transaction). The partner (the seeded ADMIN, an
// editor of the map) uploaded some of them, and the trip's photos are on the trip.
//
// The files' keys don't change between runs (`<photos prefix>seed/<slug>/<size>.<ext>`),
// so seeding again overwrites them instead of leaving the last run's files behind (the
// seed wipes the rows that pointed at them, and the daily clean-up finds files by their
// rows). Without STORAGE_PRIVATE_BUCKET this step is skipped, and the rest still seeds.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../src/prisma.js';
import { seedAccounts } from './users.js';
import { PHOTO_PREFIX, putPrivateObject } from '../../src/services/s3/mediaService.js';
import { createPhotoInDB } from '../../src/domain/photos.js';
import { findLandmarksInBox } from '../../src/domain/places.js';
import { mediaKindFromContentType } from '../../src/domain/mediaGeneric.js';
import { boundingBox, matchLandmarks } from '../../src/utils/landmarkMatch.js';
import { countryAtPosition } from '../../src/utils/countryLookup.js';

export const SEED_PHOTOS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../seed-photos');

const SIZES = ['THUMB', 'DISPLAY', 'ORIGINAL'];
// The trips the manifest's `trip` names, by their title in travel.js
const TRIP_TITLES = { 'paris-rome': 'Paris to Rome by train' };

const seedKey = (slug, file) => `${PHOTO_PREFIX}seed/${slug}/${file}`;

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

  // A new photo goes first in its galleries, so the last one saved shows first:
  // saving them in reverse keeps the manifest's order
  for (const entry of [...manifest].reverse()) {
    const uploaderId = entry.uploader === 'partner' ? partner.id : owner.id;
    const variants = [];

    // Files first, then the rows: a row never points at a file that isn't there
    for (const size of SIZES) {
      const file = entry.files[size];
      const body = await fs.readFile(path.join(dir, entry.slug, file.file));
      const key = seedKey(entry.slug, file.file);
      await putPrivateObject({ key, body, contentType: file.contentType });
      const media = await prisma.mediaItem.create({
        data: {
          key,
          resource: 'photo',
          kind: mediaKindFromContentType(file.contentType),
          visibility: 'PRIVATE',
          contentType: file.contentType,
          bytes: body.length,
          ownerId: uploaderId,
          originalFilename: `${entry.slug}-${size.toLowerCase()}`,
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
        id: crypto.randomUUID(),
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
  }

  console.log(`✅ Seeded ${manifest.length} demo photos on ${ownerEmail}'s map (files in the private bucket under ${PHOTO_PREFIX}seed/)`);
  return { photos: manifest.length };
}
