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
        { size: 'PRINT', contentType: 'image/jpeg', bytes: 5000 },
      ],
    });
    expect(res.status).toBe(200);
    const { photoId, uploads } = data(res);
    for (const upload of uploads) {
      expect(upload.key).toMatch(new RegExp(`^myplanetview/photos/${map.id}/${photoId}/${upload.size.toLowerCase()}-`));
      expect(upload.url).toContain('X-Amz-Signature=');
      expect(upload.headers['Content-Type']).toBeTruthy();
      // The PUT must send exactly this type and this many bytes
      expect(new URL(upload.url).searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
      expect(upload.bytes).toBe(upload.size === 'THUMB' ? 1000 : 5000);
    }
    // Recorded, but not confirmed (no size yet)
    const items = await prisma.mediaItem.findMany({ where: { key: { in: uploads.map((u) => u.key) } } });
    expect(items.every((i) => i.bytes === null && i.visibility === 'PRIVATE' && i.ownerId === owner.user.id)).toBe(true);
  });

  it('refuses a presign without both copies, with a bad type, without a size or over the size cap', async () => {
    const url = `/api/maps/${map.id}/photos/presign`;
    expect((await owner.agent.post(url).send({ files: [{ size: 'THUMB', contentType: 'image/jpeg', bytes: 10 }] })).status).toBe(400);
    expect(
      (await owner.agent.post(url).send({
        files: [
          { size: 'THUMB', contentType: 'image/jpeg' },
          { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
        ],
      })).status
    ).toBe(400);
    expect(
      (await owner.agent.post(url).send({
        files: [
          { size: 'THUMB', contentType: 'image/svg+xml', bytes: 10 },
          { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
        ],
      })).status
    ).toBe(400);
    // No HEIC, not even as the original (the client refuses it; docs/SITE-DESIGN.md)
    expect(
      (await owner.agent.post(url).send({
        files: [
          { size: 'THUMB', contentType: 'image/jpeg', bytes: 10 },
          { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 10 },
          { size: 'ORIGINAL', contentType: 'image/heic', bytes: 10 },
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

  it('takes the chosen country when the GPS position is at sea, and lists photos with no country', async () => {
    const AT_SEA = { latitude: 0, longitude: -30 }; // the middle of the Atlantic
    const fallback = data(await uploadPhoto(owner.agent, map.id, { ...AT_SEA, countryCode: 'PT' })).photo;
    expect(fallback).toMatchObject({ countryCode: 'PT', latitude: AT_SEA.latitude });
    // A GPS country always wins over the chosen one
    expect(data(await uploadPhoto(owner.agent, map.id, { ...NEAR_EIFFEL, countryCode: 'PT' })).photo.countryCode).toBe('FR');

    const atSea = data(await uploadPhoto(owner.agent, map.id, AT_SEA)).photo;
    const noLocation = data(await uploadPhoto(owner.agent, map.id, {})).photo;
    expect(atSea.countryCode).toBeNull();
    expect(noLocation.countryCode).toBeNull();

    const unplaced = data(await owner.agent.get(`/api/maps/${map.id}/photos?unplaced=1`)).photos;
    expect(unplaced.map((p) => p.id).sort()).toEqual([atSea.id, noLocation.id].sort());
    expect((await owner.agent.get(`/api/maps/${map.id}/photos?unplaced=1&country=FR`)).status).toBe(400);
    expect((await owner.agent.get(`/api/maps/${map.id}/photos?unplaced=maybe`)).status).toBe(400);

    // Choosing a country places it
    await owner.agent.patch(`/api/photos/${noLocation.id}`).send({ countryCode: 'IS' });
    const after = data(await owner.agent.get(`/api/maps/${map.id}/photos?unplaced=1`)).photos;
    expect(after.map((p) => p.id)).toEqual([atSea.id]);
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
          { size: 'PRINT', contentType: 'image/jpeg', bytes: 10 },
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
    expect(await prisma.mediaItem.count({ where: { key: { in: presign.uploads.map((u) => u.key) } } })).toBe(3);
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
    // Verified, so the viewer is added directly
    owner = await signUp('Own', { verified: true });
    viewer = await signUp('Look', { verified: true });
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
    const owner = await signUp('Host', { verified: true });
    const guest = await signUp('Guest', { verified: true });
    const map = await defaultMapOf(owner.agent);
    const tripA = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ startDate: '2019-04-10', endDate: '2019-04-12', title: 'Shared trip' })).trip;
    const tripB = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ startDate: '2019-04-10', endDate: '2019-04-12', title: 'Private trip' })).trip;
    const inA = data(await uploadPhoto(owner.agent, map.id, { tripId: tripA.id, countryCode: 'PT' })).photo;
    const inB = data(await uploadPhoto(owner.agent, map.id, { tripId: tripB.id, countryCode: 'ES' })).photo;
    const loose = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'GR' })).photo;

    expect((await owner.agent.post(`/api/trips/${tripA.id}/members`).send({ email: guest.email, role: 'EDITOR' })).status).toBe(201);

    // The trip, yes (but not its map, so the page doesn't link back to it)
    expect(data(await guest.agent.get(`/api/trips/${tripA.id}`)).trip).toMatchObject({ title: 'Shared trip', role: 'EDITOR', canOpenMap: false });
    expect(data(await owner.agent.get(`/api/trips/${tripA.id}`)).trip.canOpenMap).toBe(true);
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

describe('a trip cover', () => {
  it('is cleared when its photo moves to another trip, and kept when another photo moves', async () => {
    const { agent } = await signUp('Cover');
    const map = await defaultMapOf(agent);
    const newTrip = async (title) => data(await agent.post(`/api/maps/${map.id}/trips`).send({ title, startDate: '2019-04-10', endDate: '2019-04-12' })).trip;
    const [rome, lisbon] = [await newTrip('Rome'), await newTrip('Lisbon')];
    const cover = data(await uploadPhoto(agent, map.id, { tripId: rome.id, countryCode: 'IT' })).photo;
    const other = data(await uploadPhoto(agent, map.id, { tripId: rome.id, countryCode: 'IT' })).photo;
    expect((await agent.patch(`/api/trips/${rome.id}`).send({ coverPhotoId: cover.id })).status).toBe(200);

    // Another photo leaving the trip leaves the cover alone
    expect((await agent.patch(`/api/photos/${other.id}`).send({ tripId: lisbon.id })).status).toBe(200);
    expect((await prisma.trip.findUnique({ where: { id: rome.id } })).coverPhotoId).toBe(cover.id);

    // The cover itself moving to Lisbon: Rome has no cover, and Lisbon doesn't gain one
    expect((await agent.patch(`/api/photos/${cover.id}`).send({ tripId: lisbon.id })).status).toBe(200);
    expect((await prisma.trip.findUnique({ where: { id: rome.id } })).coverPhotoId).toBe(null);
    expect((await prisma.trip.findUnique({ where: { id: lisbon.id } })).coverPhotoId).toBe(null);
  });
});
