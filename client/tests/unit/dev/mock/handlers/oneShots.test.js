import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, db, del, freshStore, get, put, registerAllRoutes, setVerified, signOut } from '../mockApi';

// Mock mode's Life's One Shots (24 Nov 2026), as the server's controllers/oneShots.js
beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const url = (map = HOME_MAP, key = '') => `/api/maps/${map}/one-shots${key ? `/${key}` : ''}`;

describe('Life’s One Shots in mock mode', () => {
  it('lists the seed’s ticks, the latest seen first', async () => {
    const { data } = await get(url());
    expect(data.oneShots.map((t) => [t.itemKey, t.seenOn, t.countryCode])).toEqual([
      ['autumn-colours', '2014-10-01', 'US'],
      ['puffin', '2013-06-01', 'IE'],
    ]);
    expect(data.oneShots[1]).toMatchObject({ datePrecision: 'MONTH', notes: 'On the Skelligs', travellerIds: ['trav-test'], photo: null });
    // The seed's flights are London–Rome and Pisa–London: no line crossed
    expect(data.suggestions).toEqual([]);
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
    const { suggestions } = (await get(url())).data;
    expect(suggestions).toEqual([{ itemKey: 'equator', seenOn: '2019-03-02', from: 'FLIGHT', flight: { id: 'flight-nbo', fromAirport: 'LHR', toAirport: 'NBO', flownOn: '2019-03-02' } }]);
    expect((await get(url(SAM_MAP))).data.suggestions).toEqual([]);
  });

  it('shows through a map’s share link, without suggestions; never a closed one', async () => {
    const home = db().maps.find((m) => m.id === HOME_MAP);
    home.linkAccess = 'ANYONE_WITH_LINK';
    signOut();
    const { data } = await get(`/api/shared/${home.shareCode}/one-shots`);
    expect(data.oneShots).toHaveLength(2);
    expect(data.suggestions).toEqual([]);
    home.linkAccess = 'RESTRICTED';
    expect((await get(`/api/shared/${home.shareCode}/one-shots`)).status).toBe(404);
  });
});
