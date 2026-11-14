// Photos with the private bucket mocked: upload checks, GPS, what viewers may see, deletion.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, inBucket, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

// Close to the Eiffel Tower (within its 400 m match radius)
const NEAR_EIFFEL = { latitude: 48.8575, longitude: 2.2952 };

describe('photo upload', () => {
  let owner;
  let map;

  beforeAll(async () => {
    owner = await signUp('Snap');
    map = await defaultMapOf(owner.agent);
  });

  it('presigns uploads into the private bucket, under this map and photo', async () => {
    const res = await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({
      files: [
        { size: 'THUMB', contentType: 'image/jpeg', bytes: 1000 },
        { size: 'DISPLAY', contentType: 'image/webp', bytes: 5000 },
      ],
    });
    expect(res.status).toBe(200);
    const { photoId, uploads } = data(res);
    for (const upload of uploads) {
      expect(upload.key).toMatch(new RegExp(`^myplanetview/photos/${map.id}/${photoId}/${upload.size.toLowerCase()}-`));
      expect(upload.url).toContain('X-Amz-Signature=');
      expect(upload.headers['Content-Type']).toBeTruthy();
    }
    // Recorded, but not confirmed (no size yet)
    const items = await prisma.mediaItem.findMany({ where: { key: { in: uploads.map((u) => u.key) } } });
    expect(items.every((i) => i.bytes === null && i.visibility === 'PRIVATE' && i.ownerId === owner.user.id)).toBe(true);
  });

  it('refuses a presign without both copies, with a bad type or over the size cap', async () => {
    const url = `/api/maps/${map.id}/photos/presign`;
    expect((await owner.agent.post(url).send({ files: [{ size: 'THUMB', contentType: 'image/jpeg', bytes: 10 }] })).status).toBe(400);
    expect(
      (await owner.agent.post(url).send({
        files: [
          { size: 'THUMB', contentType: 'image/svg+xml', bytes: 10 },
          { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
        ],
      })).status
    ).toBe(400);
    expect(
      (await owner.agent.post(url).send({
        files: [
          { size: 'THUMB', contentType: 'image/jpeg', bytes: 10 },
          { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 50 * 1024 * 1024 },
        ],
      })).status
    ).toBe(413);
  });

  it('saves a GPS photo: country, PHOTO visit and a landmark suggestion', async () => {
    const res = await uploadPhoto(owner.agent, map.id, { ...NEAR_EIFFEL, caption: 'Paris' });
    expect(res.status).toBe(201);
    const photo = data(res).photo;
    expect(photo).toMatchObject({ caption: 'Paris', countryCode: 'FR', latitude: NEAR_EIFFEL.latitude, longitude: NEAR_EIFFEL.longitude });
    expect(photo.thumbUrl).toContain('X-Amz-Signature=');
    expect(photo.displayUrl).toContain('X-Amz-Signature=');
    expect(photo.originalUrl).toContain('X-Amz-Signature=');
    expect(photo.landmarks).toEqual([expect.objectContaining({ name: 'Eiffel Tower', confirmed: false, source: 'GPS' })]);

    const visits = data(await owner.agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'FR')).toMatchObject({ status: 'VISITED', source: 'PHOTO' });

    // The sizes are now recorded from what the bucket holds
    const items = await prisma.mediaItem.findMany({ where: { photoVariant: { photoId: photo.id } } });
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.bytes > 0)).toBe(true);

    // Saving the same photo twice is refused
    const variants = await prisma.photoVariant.findMany({ where: { photoId: photo.id }, include: { media: true } });
    const again = await owner.agent.post(`/api/maps/${map.id}/photos`).send({
      photoId: photo.id,
      width: 10,
      height: 10,
      variants: variants.map((v) => ({ size: v.size, key: v.media.key, width: 10, height: 10 })),
    });
    expect(again.status).toBe(409);
  });

  it('takes the chosen country when there is no GPS', async () => {
    const res = await uploadPhoto(owner.agent, map.id, { countryCode: 'PE' });
    expect(res.status).toBe(201);
    expect(data(res).photo).toMatchObject({ countryCode: 'PE', latitude: null, longitude: null, landmarks: [] });
  });

  it('a photo from a "want to go" country marks it visited, but never downgrades "lived"', async () => {
    await owner.agent.put(`/api/maps/${map.id}/visits/BR`).send({ status: 'WANT_TO_GO' });
    await owner.agent.put(`/api/maps/${map.id}/visits/CL`).send({ status: 'LIVED' });
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'BR' })).status).toBe(201);
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'CL' })).status).toBe(201);

    const visits = data(await owner.agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'BR')).toMatchObject({ status: 'VISITED', source: 'PHOTO' });
    expect(visits.find((v) => v.countryCode === 'CL')).toMatchObject({ status: 'LIVED', source: 'MANUAL' });
  });

  it('correcting a photo’s country marks the corrected country visited', async () => {
    // A border photo put in the wrong country is moved to the right one
    const photo = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'ZW' })).photo;
    const moved = await owner.agent.patch(`/api/photos/${photo.id}`).send({ countryCode: 'ZM' });
    expect(moved.status).toBe(200);
    expect(data(moved).photo.countryCode).toBe('ZM');
    const visits = data(await owner.agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'ZM')).toMatchObject({ status: 'VISITED', source: 'PHOTO' });
  });

  it('refuses a file that never arrived, or arrived bigger than allowed, and cleans up', async () => {
    const missing = await uploadPhoto(owner.agent, map.id, { put: { DISPLAY: null } });
    expect(missing.status).toBe(400);
    // Nothing from the failed upload is kept: files and their rows
    expect(missing.uploadedKeys.some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: missing.uploadedKeys } } })).toBe(0);

    const huge = await uploadPhoto(owner.agent, map.id, { put: { THUMB: { bytes: 2 * 1024 * 1024, contentType: 'image/jpeg' } } });
    expect(huge.status).toBe(413);

    const wrongType = await uploadPhoto(owner.agent, map.id, { put: { THUMB: { bytes: 100, contentType: 'text/html' } } });
    expect(wrongType.status).toBe(400);
  });

  it('refuses keys from another map or someone else’s upload', async () => {
    const other = await signUp('Thief');
    const otherMap = await defaultMapOf(other.agent);
    const presign = data(
      await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({
        files: [
          { size: 'THUMB', contentType: 'image/jpeg', bytes: 10 },
          { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
        ],
      })
    );
    for (const u of presign.uploads) globalThis.__fakeR2.set(u.key, { bytes: 10, contentType: 'image/jpeg' });
    // The other user tries to save the owner's uploaded files on their own map
    const res = await other.agent.post(`/api/maps/${otherMap.id}/photos`).send({
      photoId: presign.photoId,
      width: 10,
      height: 10,
      variants: presign.uploads.map((u) => ({ size: u.size, key: u.key, width: 10, height: 10 })),
    });
    expect(res.status).toBe(400);
    // ...and their failed attempt can't delete the owner's files
    expect(presign.uploads.every((u) => inBucket(u.key))).toBe(true);
    expect(await prisma.mediaItem.count({ where: { key: { in: presign.uploads.map((u) => u.key) } } })).toBe(2);
    // The owner can still save them on their own map
    const mine = await owner.agent.post(`/api/maps/${map.id}/photos`).send({
      photoId: presign.photoId,
      countryCode: 'FR',
      width: 10,
      height: 10,
      variants: presign.uploads.map((u) => ({ size: u.size, key: u.key, width: 10, height: 10 })),
    });
    expect(mine.status).toBe(201);
  });
});

describe('what viewers see', () => {
  let owner;
  let viewer;
  let map;
  let gpsPhoto;
  let hiddenPhoto;

  beforeAll(async () => {
    owner = await signUp('Own');
    viewer = await signUp('Look');
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);

    gpsPhoto = data(await uploadPhoto(owner.agent, map.id, NEAR_EIFFEL)).photo;
    hiddenPhoto = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'IT' })).photo;
    expect((await owner.agent.patch(`/api/photos/${hiddenPhoto.id}`).send({ hidden: true })).status).toBe(200);
  });

  it('gives a viewer the copies, but never GPS, originals, hidden photos or unconfirmed matches', async () => {
    const list = data(await viewer.agent.get(`/api/maps/${map.id}/photos`));
    expect(list.photos.map((p) => p.id)).toEqual([gpsPhoto.id]);
    const item = list.photos[0];
    expect(item).not.toHaveProperty('latitude');
    expect(item).not.toHaveProperty('hidden');
    expect(item.landmarks).toEqual([]); // the GPS suggestion isn't confirmed yet

    const opened = data(await viewer.agent.get(`/api/photos/${gpsPhoto.id}`)).photo;
    expect(opened.displayUrl).toContain('X-Amz-Signature=');
    expect(opened).not.toHaveProperty('originalUrl');
    expect(opened).not.toHaveProperty('latitude');
    expect(opened).not.toHaveProperty('longitude');

    expect((await viewer.agent.get(`/api/photos/${hiddenPhoto.id}`)).status).toBe(404);

    // Stats count only what the viewer may see
    expect(data(await viewer.agent.get(`/api/maps/${map.id}/stats`)).stats.photos).toBe(1);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/stats`)).stats.photos).toBe(2);
  });

  it('shows confirmed landmarks to viewers once the owner confirms them', async () => {
    const eiffelId = gpsPhoto.landmarks[0].id;
    expect((await owner.agent.patch(`/api/photos/${gpsPhoto.id}/landmarks/${eiffelId}`).send({ confirmed: true })).status).toBe(200);
    const item = data(await viewer.agent.get(`/api/maps/${map.id}/photos`)).photos[0];
    expect(item.landmarks).toEqual([{ id: eiffelId, name: 'Eiffel Tower', confirmed: true }]);
    expect(data(await viewer.agent.get(`/api/maps/${map.id}/stats`)).stats.landmarks).toBe(1);
  });

  it("won't let a viewer change, delete or upload", async () => {
    expect((await viewer.agent.patch(`/api/photos/${gpsPhoto.id}`).send({ caption: 'mine now' })).status).toBe(403);
    expect((await viewer.agent.delete(`/api/photos/${gpsPhoto.id}`)).status).toBe(403);
    expect((await viewer.agent.post(`/api/photos/${gpsPhoto.id}/landmarks`).send({ landmarkId: gpsPhoto.landmarks[0].id })).status).toBe(403);
    expect((await uploadPhoto(viewer.agent, map.id, { countryCode: 'FR' })).status).toBe(403);
  });

  it('lets the owner add and remove a manual landmark match', async () => {
    const colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');
    const added = await owner.agent.post(`/api/photos/${hiddenPhoto.id}/landmarks`).send({ landmarkId: colosseum.id });
    expect(added.status).toBe(201);
    expect(data(added).photo.landmarks).toEqual([expect.objectContaining({ id: colosseum.id, source: 'MANUAL', confirmed: true })]);
    expect((await owner.agent.delete(`/api/photos/${hiddenPhoto.id}/landmarks/${colosseum.id}`)).status).toBe(200);
    expect((await owner.agent.delete(`/api/photos/${hiddenPhoto.id}/landmarks/${colosseum.id}`)).status).toBe(404);
  });

  it('deletes a photo with its files and rows', async () => {
    const variants = await prisma.photoVariant.findMany({ where: { photoId: hiddenPhoto.id }, include: { media: true } });
    const keys = variants.map((v) => v.media.key);
    expect(keys.every(inBucket)).toBe(true);

    expect((await owner.agent.delete(`/api/photos/${hiddenPhoto.id}`)).status).toBe(200);
    expect(keys.some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: keys } } })).toBe(0);
    expect((await owner.agent.get(`/api/photos/${hiddenPhoto.id}`)).status).toBe(404);
  });
});

describe('a trip-only member', () => {
  it('sees and edits that trip and its photos, and nothing else on the map', async () => {
    const owner = await signUp('Host');
    const guest = await signUp('Guest');
    const map = await defaultMapOf(owner.agent);
    const tripA = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Shared trip' })).trip;
    const tripB = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Private trip' })).trip;
    const inA = data(await uploadPhoto(owner.agent, map.id, { tripId: tripA.id, countryCode: 'PT' })).photo;
    const inB = data(await uploadPhoto(owner.agent, map.id, { tripId: tripB.id, countryCode: 'ES' })).photo;
    const loose = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'GR' })).photo;

    expect((await owner.agent.post(`/api/trips/${tripA.id}/members`).send({ email: guest.email, role: 'EDITOR' })).status).toBe(201);

    // The trip, yes
    expect(data(await guest.agent.get(`/api/trips/${tripA.id}`)).trip).toMatchObject({ title: 'Shared trip', role: 'EDITOR' });
    const shared = data(await guest.agent.get('/api/trips/shared-with-me')).trips;
    expect(shared.map((t) => t.id)).toEqual([tripA.id]);
    const photos = data(await guest.agent.get(`/api/trips/${tripA.id}/photos`)).photos;
    expect(photos.map((p) => p.id)).toEqual([inA.id]);
    expect((await guest.agent.get(`/api/photos/${inA.id}`)).status).toBe(200);
    expect((await guest.agent.patch(`/api/photos/${inA.id}`).send({ caption: 'Lisbon' })).status).toBe(200);

    // Uploading into the shared trip works; onto the map without it doesn't
    expect((await uploadPhoto(guest.agent, map.id, { tripId: tripA.id, countryCode: 'PT' })).status).toBe(201);
    expect((await uploadPhoto(guest.agent, map.id, { countryCode: 'PT' })).status).toBe(404);

    // Moving a photo out of the trip needs the map
    expect((await guest.agent.patch(`/api/photos/${inA.id}`).send({ tripId: null })).status).toBe(403);

    // The rest of the map, no
    expect((await guest.agent.get(`/api/maps/${map.id}`)).status).toBe(404);
    expect((await guest.agent.get(`/api/maps/${map.id}/photos`)).status).toBe(404);
    expect((await guest.agent.get(`/api/trips/${tripB.id}`)).status).toBe(404);
    expect((await guest.agent.get(`/api/trips/${tripB.id}/photos`)).status).toBe(404);
    expect((await guest.agent.get(`/api/photos/${inB.id}`)).status).toBe(404);
    expect((await guest.agent.get(`/api/photos/${loose.id}`)).status).toBe(404);
    // Filtering the trip's list by another trip doesn't escape it
    expect(data(await guest.agent.get(`/api/trips/${tripA.id}/photos?tripId=${tripB.id}`)).photos.map((p) => p.id)).not.toContain(inB.id);
  });
});
