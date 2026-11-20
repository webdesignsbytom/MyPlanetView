// "Download my data" (docs/API.md, "Your data"): the account, each map you own, its photos
// with links to their best copies, and your photos on other people's maps. Your own data
// only: someone else's map is a 404.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGINAL_SIZES, anon, cleanUp, data, defaultMapOf, givePlan, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('data export', () => {
  let owner;
  let friend;
  let map;
  let friendsMap;
  let trip;
  const ids = {};

  beforeAll(async () => {
    owner = await signUp('ExportOwner');
    friend = await signUp('ExportFriend');
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    map = await defaultMapOf(owner.agent);
    friendsMap = await defaultMapOf(friend.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: friend.email, role: 'EDITOR' });
    await friend.agent.post(`/api/maps/${friendsMap.id}/members`).send({ email: owner.email, role: 'EDITOR' });

    await owner.agent.put(`/api/maps/${map.id}/visits/PT`).send({ status: 'VISITED', notes: 'Pastéis de nata' });
    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon' })).trip;
    await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'PT', placeName: 'Alfama' });
    await owner.agent.post(`/api/maps/${map.id}/moments`).send({ kind: 'SAW_OR_DID', title: 'Tram 28', countryCode: 'PT' });
    await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_COUNT', target: 10 });

    // Business keeps originals; one with a position, one on the trip; the friend adds one
    ids.located = data(await uploadPhoto(owner.agent, map.id, { sizes: ORIGINAL_SIZES, latitude: 38.7139, longitude: -9.1394, countryCode: 'PT' })).photo.id;
    ids.onTrip = data(await uploadPhoto(owner.agent, map.id, { sizes: ORIGINAL_SIZES, countryCode: 'PT', tripId: trip.id })).photo.id;
    ids.byFriend = data(await uploadPhoto(friend.agent, map.id, { countryCode: 'PT', sizes: ORIGINAL_SIZES })).photo.id;
    // ...and the owner adds one to the friend's (Economy) map
    ids.elsewhere = data(await uploadPhoto(owner.agent, friendsMap.id, { countryCode: 'JP', caption: 'Shibuya' })).photo.id;
  });

  it('gives the account, its plan, and the maps and trips it’s on, never cached', async () => {
    const res = await owner.agent.get('/api/users/export');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    const file = data(res);
    expect(file).toMatchObject({
      format: 'my-planet-view-data',
      version: 1,
      account: { name: 'ExportOwner', email: owner.email, emailVerified: true },
      plan: { inForce: { id: 'REGULAR', name: 'Business', from: 'STRIPE' }, subscription: { plan: 'REGULAR', status: 'active' } },
      mapsYouOwn: [{ id: map.id, name: 'My map', isDefault: true }],
      mapsSharedWithYou: [{ id: friendsMap.id, owner: 'ExportFriend', role: 'EDITOR' }],
      photosOnOtherMaps: 1,
    });
    expect(Date.parse(file.linksWorkUntil) - Date.parse(file.exportedAt)).toBe(7 * 86400000);
  });

  it('gives a map you own with its countries, trips, moments, goals and people', async () => {
    const res = await owner.agent.get(`/api/users/export/maps/${map.id}`);
    expect(res.status).toBe(200);
    const exported = data(res).map;
    expect(exported).toMatchObject({ id: map.id, name: 'My map', photoCount: 3 });
    expect(exported.countries).toEqual([expect.objectContaining({ countryCode: 'PT', status: 'VISITED', notes: 'Pastéis de nata' })]);
    expect(exported.trips).toEqual([
      expect.objectContaining({ id: trip.id, title: 'Lisbon', stops: [expect.objectContaining({ countryCode: 'PT', placeName: 'Alfama' })] }),
    ]);
    expect(exported.moments).toEqual([expect.objectContaining({ title: 'Tram 28', countryCode: 'PT' })]);
    expect(exported.goals).toEqual([expect.objectContaining({ kind: 'COUNTRY_COUNT', target: 10 })]);
    expect(exported.sharedWith).toEqual([expect.objectContaining({ name: 'ExportFriend', role: 'EDITOR' })]);
    expect(exported.travellers.length).toBeGreaterThan(0);
  });

  it('gives its photos, newest first, each with a week-long link to its original', async () => {
    const res = await owner.agent.get(`/api/users/export/maps/${map.id}/photos`);
    expect(res.status).toBe(200);
    const { photos, nextCursor } = data(res);
    expect(nextCursor).toBeNull();
    expect(photos.map((p) => p.id)).toEqual([ids.byFriend, ids.onTrip, ids.located]);
    const located = photos.find((p) => p.id === ids.located);
    expect(located).toMatchObject({ kind: 'PHOTO', countryCode: 'PT', latitude: 38.7139, longitude: -9.1394, uploadedByYou: true });
    expect(located.file).toMatchObject({ copy: 'ORIGINAL', contentType: expect.stringMatching(/^image\//) });
    expect(located.file.url).toContain('X-Amz-Expires=604800');
    expect(decodeURIComponent(located.file.url)).toMatch(/attachment; filename="photo-2026-06-01-[0-9a-f]{8}\.(jpg|png|webp)"/);
    expect(photos.find((p) => p.id === ids.onTrip).tripId).toBe(trip.id);
    expect(photos.find((p) => p.id === ids.byFriend)).toMatchObject({ uploadedByYou: false, uploadedBy: 'ExportFriend' });
  });

  it('gives your photos on other people’s maps, with whose map they’re on', async () => {
    const res = await owner.agent.get('/api/users/export/uploads');
    expect(res.status).toBe(200);
    const { photos } = data(res);
    expect(photos).toEqual([expect.objectContaining({ id: ids.elsewhere, caption: 'Shibuya', mapId: friendsMap.id, mapOwner: 'ExportFriend' })]);
    // An Economy map keeps the print copy
    expect(photos[0].file.copy).toBe('PRINT');
  });

  it('gives nobody else’s map: an editor, a stranger and a bad id all get 404', async () => {
    const stranger = await signUp('ExportStranger');
    for (const agent of [friend.agent, stranger.agent]) {
      expect((await agent.get(`/api/users/export/maps/${map.id}`)).status).toBe(404);
      expect((await agent.get(`/api/users/export/maps/${map.id}/photos`)).status).toBe(404);
    }
    expect((await owner.agent.get('/api/users/export/maps/not-a-map')).status).toBe(404);
    expect((await owner.agent.get(`/api/users/export/maps/${map.id}/photos?cursor=nonsense`)).status).toBe(400);
    expect((await anon().get('/api/users/export')).status).toBe(401);
  });

  // 19 Nov 2026, the user's decision: taken off a map, you no longer get the photos you'd added there
  it('leaves out photos on a map you’ve been taken off', async () => {
    expect((await friend.agent.delete(`/api/maps/${friendsMap.id}/members/${owner.user.id}`)).status).toBe(200);
    expect(data(await owner.agent.get('/api/users/export/uploads')).photos).toEqual([]);
    expect(data(await owner.agent.get('/api/users/export')).photosOnOtherMaps).toBe(0);
  });
});
