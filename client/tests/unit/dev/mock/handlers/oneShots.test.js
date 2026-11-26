import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, db, del, freshStore, get, put, registerAllRoutes, setVerified, signOut } from '../mockApi';

// Mock mode's Life's One Shots (24 Nov 2026), as the server's controllers/oneShots.js
beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const url = (map = HOME_MAP, key = '') => `/api/maps/${map}/one-shots${key ? `/${key}` : ''}`;

describe('Life’s One Shots in mock mode', () => {
  it('lists the seed’s ticks, the latest seen first', async () => {
    const { data } = await get(url());
    // The safari's four and a puffin at home (data/demoTravels.js)
    expect(data.oneShots.map((t) => [t.itemKey, t.seenOn, t.countryCode])).toEqual([
      ['rhino', '2023-11-10', 'ZA'],
      ['giraffe', '2023-10-18', 'TZ'],
      ['african-elephant', '2023-10-16', 'TZ'],
      ['lion', '2023-10-15', 'TZ'],
      ['puffin', '2013-06-01', 'IE'],
    ]);
    expect(data.oneShots[4]).toMatchObject({ datePrecision: 'MONTH', notes: 'On the Skelligs', travellerIds: ['trav-test'], photo: null });
    // The year around the world crossed the equator (Amman to Kilimanjaro) and the date line
    // (Auckland to Mexico City)
    expect(data.suggestions.map((s) => [s.itemKey, s.seenOn, `${s.flight.fromAirport}-${s.flight.toAirport}`])).toEqual([
      ['equator', '2023-10-13', 'AMM-JRO'],
      ['date-line', '2024-01-26', 'AKL-MEX'],
    ]);
  });

  it('ticks one, marking its country visited, then changes it, then takes it off', async () => {
    const made = await put(url(HOME_MAP, 'northern-lights'), { seenOn: '2023-02-14', countryCode: 'NO', travellerIds: ['trav-test'] });
    expect(made.status).toBe(201);
    expect(made.data).toMatchObject({ created: true, countryCode: 'NO', oneShot: { itemKey: 'northern-lights', seenOn: '2023-02-14', datePrecision: 'DAY', source: 'MANUAL' } });
    expect(db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === 'NO')).toMatchObject({ status: 'VISITED', source: 'MANUAL' });

    const changed = await put(url(HOME_MAP, 'northern-lights'), { notes: 'Tromsø', photoId: 'photo-eiffel' });
    expect(changed.status).toBe(200);
    expect(changed.data.oneShot).toMatchObject({ notes: 'Tromsø', photo: { id: 'photo-eiffel', thumbUrl: expect.any(String) } });

    expect((await del(url(HOME_MAP, 'northern-lights'))).data).toEqual({ itemKey: 'northern-lights', ticked: false });
    expect((await get(url())).data.oneShots.map((t) => t.itemKey)).not.toContain('northern-lights');
  });

  // 26 Nov 2026, the user's wish: "a photo/multiple photos of you with" it
  it('keeps up to 5 of the map’s photos in order, the first on its card, never a video', async () => {
    const ids = ['photo-dam', 'photo-eiffel', 'photo-colosseum'];
    const saved = await put(url(HOME_MAP, 'lion'), { photoIds: ids });
    expect(saved.status).toBe(200);
    expect(saved.data.oneShot.photos.map((p) => p.id)).toEqual(ids);
    expect(saved.data.oneShot.photo).toMatchObject({ id: 'photo-dam', thumbUrl: expect.any(String), displayUrl: expect.any(String) });
    expect(db().oneShots.find((t) => t.itemKey === 'lion').photoIds).toEqual(ids);
    // Leaving them out keeps them; an empty list takes them off
    expect((await put(url(HOME_MAP, 'lion'), { notes: 'Big mane' })).data.oneShot.photos).toHaveLength(3);
    expect((await put(url(HOME_MAP, 'lion'), { photoIds: [] })).data.oneShot).toMatchObject({ photos: [], photo: null });

    expect((await put(url(HOME_MAP, 'lion'), { photoIds: ['photo-bangkok'] })).message).toBe("Choose up to 5 of this map's own photos (not videos).");
    const photo = db().photos.find((p) => p.mapId === HOME_MAP);
    db().photos.push({ ...photo, id: 'video-safari', kind: 'VIDEO' });
    expect((await put(url(HOME_MAP, 'lion'), { photoIds: ['video-safari'] })).status).toBe(400);
    expect((await put(url(HOME_MAP, 'lion'), { photoIds: ['a', 'b', 'c', 'd', 'e', 'f'].map((c) => `photo-${c}`) })).status).toBe(400);
  });

  it('shows a hidden photo to editors only, and reads an older store’s single photo', async () => {
    await put(url(HOME_MAP, 'lion'), { photoIds: ['photo-hidden', 'photo-dam'] });
    expect((await get(url())).data.oneShots.find((t) => t.itemKey === 'lion').photos.map((p) => p.id)).toEqual(['photo-hidden', 'photo-dam']);
    // Through the map's link, a viewer's view: the hidden one left out, the next on the card
    db().maps.find((m) => m.id === HOME_MAP).linkAccess = 'ANYONE_WITH_LINK';
    const shared = (await get('/api/shared/K7QX-M2PA-9RTW/one-shots')).data.oneShots.find((t) => t.itemKey === 'lion');
    expect(shared.photos.map((p) => p.id)).toEqual(['photo-dam']);
    expect(shared.photo.id).toBe('photo-dam');
    const tick = db().oneShots.find((t) => t.itemKey === 'puffin');
    delete tick.photoIds;
    tick.photoId = 'photo-eiffel';
    expect((await get(url())).data.oneShots.find((t) => t.itemKey === 'puffin').photo.id).toBe('photo-eiffel');
    const exported = (await get(`/api/users/export/maps/${HOME_MAP}`)).data.map.oneShots;
    expect(exported.find((t) => t.item === 'lion').photoIds).toEqual(['photo-hidden', 'photo-dam']);
    expect(exported.find((t) => t.item === 'puffin').photoIds).toEqual(['photo-eiffel']);
  });

  it('refuses what the server refuses', async () => {
    expect((await put(url(HOME_MAP, 'unicorn'), {})).status).toBe(404);
    expect((await put(url(HOME_MAP, 'lion'), { seenOn: '2024-02-31' })).status).toBe(400);
    expect((await put(url(HOME_MAP, 'lion'), { countryCode: 'QQ' })).status).toBe(400);
    expect((await put(url(HOME_MAP, 'lion'), { travellerIds: ['trav-sam'] })).status).toBe(400);
    expect((await put(url(HOME_MAP, 'lion'), { source: 'FLIGHT' })).status).toBe(400);
    // A map the test user only views
    expect((await put(url(SAM_MAP, 'lion'), {})).status).toBe(403);
    setVerified(false);
    expect((await put(url(HOME_MAP, 'lion'), {})).status).toBe(403);
  });

  it('suggests the lines a flight crossed, for editors only', async () => {
    db().flights.push({ id: 'flight-nbo', mapId: HOME_MAP, tripId: null, from: 'LHR', to: 'NBO', flownOn: '2019-03-02', carrier: 'BA', flightNumber: '65', distanceKm: 6800, source: 'MANUAL', createdAt: new Date().toISOString() });
    // The seed's own crossed the equator later: the first flight across a line is the one offered
    const { suggestions } = (await get(url())).data;
    expect(suggestions[0]).toEqual({ itemKey: 'equator', seenOn: '2019-03-02', from: 'FLIGHT', flight: { id: 'flight-nbo', fromAirport: 'LHR', toAirport: 'NBO', flownOn: '2019-03-02' } });
    expect((await get(url(SAM_MAP))).data.suggestions).toEqual([]);
  });

  it('shows through a map’s share link, without suggestions; never a closed one', async () => {
    const home = db().maps.find((m) => m.id === HOME_MAP);
    home.linkAccess = 'ANYONE_WITH_LINK';
    signOut();
    const { data } = await get(`/api/shared/${home.shareCode}/one-shots`);
    expect(data.oneShots).toHaveLength(5);
    expect(data.suggestions).toEqual([]);
    home.linkAccess = 'RESTRICTED';
    expect((await get(`/api/shared/${home.shareCode}/one-shots`)).status).toBe(404);
  });
});
