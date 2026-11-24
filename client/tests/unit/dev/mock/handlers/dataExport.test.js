import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, JO_MAP, SAM_MAP, USER, db, freshStore, get, post, put, registerAllRoutes } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

describe('"Download my data": the account part', () => {
  it('gives the account, its plan and the maps and trips shared with it', async () => {
    const { data } = await get('/api/users/export');
    expect(data).toMatchObject({ format: 'my-planet-view-data', version: 1, site: 'My Planet View' });
    expect(Date.parse(data.linksWorkUntil) - Date.parse(data.exportedAt)).toBe(7 * 86400000);
    expect(data.account).toMatchObject({ id: USER, name: 'Charlie Reid', email: 'test@myplanetview.local', emailVerified: true, signedUpWithPromoCode: null });
    expect(data.plan.inForce).toEqual({ id: 'REGULAR', name: 'Business', from: 'STRIPE' });
    expect(data.plan.subscription).toMatchObject({ plan: 'REGULAR', interval: 'MONTH', extraMaps: 1 });
    expect(data.mapsYouOwn.map((m) => m.id)).toEqual([HOME_MAP]);
    expect(data.mapsSharedWithYou.map((m) => [m.id, m.role])).toEqual(expect.arrayContaining([[SAM_MAP, 'VIEWER']]));
    expect(data.tripsSharedWithYou).toEqual([expect.objectContaining({ id: 'trip-jo-lisbon', role: 'EDITOR', map: "Jo's family trips", owner: 'Jo Patel' })]);
    expect(data.photosOnOtherMaps).toBe(0);
  });

  // handlers/dataExport.js:246 ends the account part without the gifts bought, which the
  // server's utils/dataExport.js puts in it (`giftsBought`)
  it('lists the gifts bought under the plan, as the server’s export does', async () => {
    await post('/api/billing/gift-checkout', { plan: 'REGULAR' });
    const { data } = await get('/api/users/export');
    expect(data.plan.giftsBought).toEqual([expect.objectContaining({ plan: 'REGULAR', months: 12 })]);
  });
});

describe('"Download my data": each owned map', () => {
  it('gives the whole map: travellers, countries, trips, moments, states, pins, goals and badges', async () => {
    const { data } = await get(`/api/users/export/maps/${HOME_MAP}`);
    const map = data.map;
    expect(map).toMatchObject({ id: HOME_MAP, groupType: 'COUPLE', shareCode: 'K7QXM2PA9RTW', photoCount: 16 });
    expect(map.travellers.map((t) => [t.name, t.isYou])).toEqual([
      ['Charlie', true],
      ['Alex', false],
    ]);
    expect(map.countries.map((c) => c.countryCode)).toEqual([...map.countries.map((c) => c.countryCode)].sort());
    expect(map.sharedWith.map((m) => m.name)).toEqual(['Alex Morgan', 'Sam Rivers']);
    expect(map.invites.map((i) => i.email)).toEqual(['jo@example.test']);
    expect(map.trips.find((t) => t.id === 'trip-italy').stops.map((s) => s.placeName)).toEqual(['Rome', 'Florence', 'Cinque Terre']);
    expect(map.groupTripsAdded).toEqual([expect.objectContaining({ tripId: 'trip-tom-stag', fromMap: "Tom's map" })]);
    expect(map.moments.find((m) => m.id === 'moment-born').spot).toEqual({ latitude: 53.4808, longitude: -2.2426, shared: false });
    expect(map.moments.some((m) => m.hidden)).toBe(true);
    expect(map.statesVisited.map((s) => s.code)).toEqual(['US-NY', 'US-MA', 'US-CA']);
    expect(map.pins[0].visits).toHaveLength(2);
    expect(map.goals).toHaveLength(3);
    expect(map.badges.length).toBeGreaterThan(0);
  });

  // handlers/dataExport.js:195 ends the map without its designs and ticked landmarks, which
  // the server's export carries (`designs`, `landmarksBeenTo`)
  it('carries the map’s designs and the landmarks ticked "been here"', async () => {
    await put(`/api/maps/${HOME_MAP}/landmarks/lm-mount-fuji/been`);
    const { data } = await get(`/api/users/export/maps/${HOME_MAP}`);
    expect(data.map.landmarksBeenTo).toHaveLength(13);
    expect(data.map.landmarksBeenTo).toContainEqual(expect.objectContaining({ landmarkId: 'lm-mount-fuji' }));
    expect(data.map.landmarksBeenTo).toContainEqual(expect.objectContaining({ landmarkId: 'lm-petra', name: 'Petra' }));
    expect(Array.isArray(data.map.designs)).toBe(true);
  });

  it('answers 404 for a map the user doesn’t own', async () => {
    expect((await get(`/api/users/export/maps/${SAM_MAP}`)).status).toBe(404);
    expect((await get(`/api/users/export/maps/${SAM_MAP}/photos`)).status).toBe(404);
  });

  it('pages the map’s photos newest first, with their GPS, matches and best copy', async () => {
    const { data } = await get(`/api/users/export/maps/${HOME_MAP}/photos`);
    expect(data.photos).toHaveLength(16);
    expect(data.nextCursor).toBeNull();
    const eiffel = data.photos.find((p) => p.id === 'photo-eiffel');
    expect(eiffel).toMatchObject({ latitude: 48.8583, uploadedByYou: true, uploadedBy: 'Charlie Reid', file: { copy: 'ORIGINAL' } });
    expect(eiffel.landmarks.map((l) => l.landmarkId)).toEqual(['lm-eiffel-tower', 'lm-paris-banks-of-the-seine']);
    expect(data.photos.find((p) => p.id === 'photo-hidden').hidden).toBe(true);
    expect((await get(`/api/users/export/maps/${HOME_MAP}/photos`, { cursor: 'nope' })).status).toBe(400);
  });

  it('pages 500 at a time', async () => {
    db().photos.push(...Array.from({ length: 600 }, (_, i) => ({ id: `x${i}`, mapId: HOME_MAP, uploaderId: USER, createdAt: new Date(Date.UTC(2020, 0, 1, 0, 0, i)).toISOString() })));
    const first = await get(`/api/users/export/maps/${HOME_MAP}/photos`);
    expect(first.data.photos).toHaveLength(500);
    const rest = await get(`/api/users/export/maps/${HOME_MAP}/photos`, { cursor: first.data.nextCursor });
    expect(rest.data.photos).toHaveLength(116);
    expect(rest.data.nextCursor).toBeNull();
  });
});

describe('"Download my data": photos on other people’s maps', () => {
  it('lists the photos the user put on maps and trips shared with them', async () => {
    db().photos.push({ id: 'mine-on-jo', mapId: JO_MAP, uploaderId: USER, tripId: 'trip-jo-lisbon', countryCode: 'PT', createdAt: new Date().toISOString(), image: { kind: 'asset', name: 'pt' } });
    db().photos.push({ id: 'mine-nowhere', mapId: 'map-tom', uploaderId: USER, createdAt: new Date().toISOString() });
    const { data } = await get('/api/users/export/uploads');
    expect(data.photos.map((p) => [p.id, p.map, p.mapOwner])).toEqual([['mine-on-jo', "Jo's family trips", 'Jo Patel']]);
    expect((await get('/api/users/export')).data.photosOnOtherMaps).toBe(1);
  });
});
