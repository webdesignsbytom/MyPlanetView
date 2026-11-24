// The seed's demo photos (prisma/seed/photos.js): real photos on a map, files in the
// (fake) private bucket, made as an upload makes them.
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, givePlan, inBucket, prisma, signUp } from './helpers.js';
import { SEED_PHOTOS_DIR, seedDemoPhotos } from '../../prisma/seed/photos.js';
import { deleteStoredFiles } from '../../prisma/seed/utils.js';
import { PHOTO_PREFIX } from '../../src/services/s3/mediaService.js';

// An upload's key: the map's folder, the photo's folder, `<size>-<random>.<ext>`
const uploadKey = (mapId, photoId) =>
  new RegExp(`^${PHOTO_PREFIX}${mapId}/${photoId}/(thumb|display|print|original)-[A-Za-z0-9]+\\.(webp|jpg)$`);

// A map's owner and editor, its "Italian summer" trip (the demo couple's, data/demoTravels.js),
// and the seed's photos on it
async function seededMap(name, { plan } = {}) {
  const owner = await signUp(`${name}Owner`);
  const partner = await signUp(`${name}Partner`);
  if (plan) await givePlan(owner.user.id, { plan });
  const map = await defaultMapOf(owner.agent);
  expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: partner.email, role: 'EDITOR' })).status).toBe(201);
  const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ startDate: '2025-07-02', endDate: '2025-07-16', title: 'Italian summer' })).trip;
  return { owner, partner, map, trip };
}

const filesOf = (mapId) =>
  prisma.photo.findMany({
    where: { mapId },
    select: {
      id: true,
      caption: true,
      uploaderId: true,
      variants: { select: { size: true, media: { select: { key: true, bytes: true, visibility: true, ownerId: true, originalFilename: true } } } },
    },
  });

afterAll(cleanUp);

const manifest = JSON.parse(fs.readFileSync(path.join(SEED_PHOTOS_DIR, 'photos.json'), 'utf8'));

describe('the seed’s demo photos', () => {
  let owner;
  let partner;
  let map;
  let trip;

  beforeAll(async () => {
    ({ owner, partner, map, trip } = await seededMap('Seed'));
    expect(await seedDemoPhotos({ ownerEmail: owner.email, partnerEmail: partner.email })).toEqual({ photos: manifest.length });
  });

  it('uploads every photo as an Economy user would: thumb, display and print copy, at an upload’s keys', async () => {
    const photos = await filesOf(map.id);
    expect(photos).toHaveLength(manifest.length);
    for (const photo of photos) {
      // Economy keeps a print copy, never the original (utils/planLimits.js)
      expect(photo.variants.map((v) => v.size).sort()).toEqual(['DISPLAY', 'PRINT', 'THUMB']);
      for (const { media } of photo.variants) {
        expect(media.key).toMatch(uploadKey(map.id, photo.id));
        expect(media.originalFilename).toBeNull();
        expect(inBucket(media.key)).toBe(true);
        expect(media.bytes).toBeGreaterThan(0);
        expect(media.visibility).toBe('PRIVATE');
        // The files are the uploader's, as with an upload
        expect(media.ownerId).toBe(photo.uploaderId);
      }
    }
    const byPartner = manifest.filter((p) => p.uploader === 'partner').map((p) => p.caption).sort();
    expect(photos.filter((p) => p.uploaderId === partner.user.id).map((p) => p.caption).sort()).toEqual(byPartner);
  });

  it('shows them through the API in the manifest’s order, with the trip’s on the trip', async () => {
    const france = data(await owner.agent.get(`/api/maps/${map.id}/photos?country=FR`)).photos;
    expect(france.map((p) => p.caption)).toEqual(manifest.filter((p) => p.countryCode === 'FR').map((p) => p.caption));
    expect(france.every((p) => p.thumbUrl)).toBe(true);

    const onTrip = data(await owner.agent.get(`/api/trips/${trip.id}/photos`)).photos;
    expect(onTrip.map((p) => p.caption)).toEqual(manifest.filter((p) => p.trip === 'italy').map((p) => p.caption));
    expect(onTrip).toHaveLength(3);
  });

  it('marks their countries visited and suggests the landmarks they were taken at', async () => {
    const visits = data(await owner.agent.get(`/api/maps/${map.id}`)).map.visits;
    const countries = [...new Set(manifest.map((p) => p.countryCode))];
    for (const code of countries) expect(visits.find((v) => v.countryCode === code)).toMatchObject({ status: 'VISITED', source: 'PHOTO' });

    // Every other photo's nearest landmark is confirmed (passport stamps); the rest are suggestions
    const suggested = await prisma.photoLandmark.count({ where: { mapId: map.id, source: 'GPS', confirmed: false } });
    const stamped = await prisma.photoLandmark.count({ where: { mapId: map.id, confirmed: true } });
    expect(suggested).toBeGreaterThan(0);
    expect(stamped).toBeGreaterThan(0);
    const passport = data(await owner.agent.get(`/api/maps/${map.id}/passport`)).passport;
    expect(passport.totals.landmarks).toBe(stamped);
  });
});

describe('the seed’s demo photos on a paid map', () => {
  it('keeps each photo’s original instead of a print copy, as a Business upload does', async () => {
    const { owner, partner, map } = await seededMap('SeedPaid', { plan: 'REGULAR' });
    await seedDemoPhotos({ ownerEmail: owner.email, partnerEmail: partner.email });
    const photos = await filesOf(map.id);
    expect(photos).toHaveLength(manifest.length);
    for (const photo of photos) {
      expect(photo.variants.map((v) => v.size).sort()).toEqual(['DISPLAY', 'ORIGINAL', 'THUMB']);
      for (const { media } of photo.variants) expect(media.key).toMatch(uploadKey(map.id, photo.id));
    }
  });
});

describe('re-seeding', () => {
  it('deletes the stored files the rows point at before the wipe, so none are left behind', async () => {
    const { owner, partner, map } = await seededMap('SeedAgain');
    await seedDemoPhotos({ ownerEmail: owner.email, partnerEmail: partner.email });
    const keys = (await filesOf(map.id)).flatMap((p) => p.variants.map((v) => v.media.key));
    expect(keys).toHaveLength(manifest.length * 3);
    expect(keys.every(inBucket)).toBe(true);

    const result = await deleteStoredFiles({ where: { ownerId: { in: [owner.user.id, partner.user.id] } } });
    expect(result).toEqual({ files: keys.length, removed: keys.length, failed: 0 });
    expect(keys.some(inBucket)).toBe(false);
  });
});
