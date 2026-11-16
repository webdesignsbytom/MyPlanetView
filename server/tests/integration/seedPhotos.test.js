// The seed's demo photos (prisma/seed/photos.js): real photos on a map, files in the
// (fake) private bucket, made as an upload makes them.
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, inBucket, prisma, signUp } from './helpers.js';
import { SEED_PHOTOS_DIR, seedDemoPhotos } from '../../prisma/seed/photos.js';

afterAll(cleanUp);

const manifest = JSON.parse(fs.readFileSync(path.join(SEED_PHOTOS_DIR, 'photos.json'), 'utf8'));

describe('the seed’s demo photos', () => {
  let owner;
  let partner;
  let map;
  let trip;

  beforeAll(async () => {
    owner = await signUp('SeedOwner');
    partner = await signUp('SeedPartner');
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: partner.email, role: 'EDITOR' })).status).toBe(201);
    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Paris to Rome by train' })).trip;
    expect(await seedDemoPhotos({ ownerEmail: owner.email, partnerEmail: partner.email })).toEqual({ photos: manifest.length });
  });

  it('puts every photo on the owner’s map, with its three files in the private bucket', async () => {
    const photos = await prisma.photo.findMany({
      where: { mapId: map.id },
      select: { caption: true, uploaderId: true, variants: { select: { size: true, media: { select: { key: true, bytes: true, visibility: true, ownerId: true } } } } },
    });
    expect(photos).toHaveLength(manifest.length);
    for (const photo of photos) {
      expect(photo.variants.map((v) => v.size).sort()).toEqual(['DISPLAY', 'ORIGINAL', 'THUMB']);
      for (const { media } of photo.variants) {
        expect(media.key).toMatch(/^myplanetview\/photos\/seed\/[a-z-]+\/(thumb\.webp|display\.webp|original\.jpg)$/);
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
    expect(onTrip.map((p) => p.caption)).toEqual(manifest.filter((p) => p.trip === 'paris-rome').map((p) => p.caption));
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
