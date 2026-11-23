import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, TOM_MAP, db, freshStore, get, post, registerAllRoutes } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const trip = (key, fields = {}) => ({ key: `polarsteps:trip:${key}`, title: 'Road trip', status: 'COMPLETED', startDate: '2009-06-01', endDate: '2009-06-10', stops: [], ...fields });
const send = (trips, mapId = HOME_MAP) => post(`/api/maps/${mapId}/imports/polarsteps`, { trips });
const visit = (code) => db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === code);

describe('importing from Polarsteps', () => {
  it('makes the trips with their stops, on the importer’s traveller', async () => {
    const stops = [
      { countryCode: 'de', placeName: ' <i>Berlin</i> ', arriveOn: '2009-06-01', leaveOn: '2009-06-04' },
      { countryCode: 'ZZ', placeName: 'Nowhere' },
      { countryCode: 'FR', placeName: 'Paris', arriveOn: '2009-06-04' },
    ];
    const { status, data } = await send([trip('1', { stops })]);
    expect(status).toBe(201);
    const [{ tripId, created }] = data.trips;
    expect(created).toBe(true);
    const made = db().trips.find((t) => t.id === tripId);
    expect(made).toMatchObject({ title: 'Road trip', importedFrom: 'polarsteps:trip:1', travellerIds: ['trav-test'] });
    expect(db().stops.filter((s) => s.tripId === tripId).map((s) => [s.countryCode, s.placeName])).toEqual([
      ['DE', 'Berlin'],
      ['FR', 'Paris'],
    ]);
  });

  it('marks a completed trip’s countries visited, with earlier first visits', async () => {
    await send([trip('1', { stops: [{ countryCode: 'DE', arriveOn: '2009-06-02' }, { countryCode: 'ES', arriveOn: '2009-06-05' }] })]);
    expect(visit('DE')).toMatchObject({ status: 'VISITED', source: 'TRIP', firstVisitedOn: '2009-06-02' });
    expect(visit('ES').firstVisitedOn).toBe('2009-06-05');
    await send([trip('2', { status: 'PLANNED', stops: [{ countryCode: 'CL' }] })]);
    expect(visit('CL')).toBeUndefined();
  });

  it('adds nothing twice, and says what’s there already', async () => {
    const first = await send([trip('1')]);
    const again = await send([trip('1')]);
    expect(again.status).toBe(200);
    expect(again.data.trips).toEqual([{ key: 'polarsteps:trip:1', tripId: first.data.trips[0].tripId, created: false }]);
    db().photos.push({ id: 'p', mapId: HOME_MAP, importedFrom: 'polarsteps:photo:a' });
    expect((await get(`/api/maps/${HOME_MAP}/imports/polarsteps`)).data).toEqual({
      trips: [{ key: 'polarsteps:trip:1', tripId: first.data.trips[0].tripId }],
      photos: ['polarsteps:photo:a'],
      moments: [],
    });
  });

  it('drops dates out of order, and puts a UK stop in its nation on a split map', async () => {
    db().maps.find((m) => m.id === HOME_MAP).splitUk = true;
    const { data } = await send([trip('1', { startDate: '2009-06-10', endDate: '2009-06-01', stops: [{ countryCode: 'GB', latitude: 55.95, longitude: -3.19 }] })]);
    const made = db().trips.find((t) => t.id === data.trips[0].tripId);
    expect([made.startDate, made.endDate]).toEqual(['2009-06-10', null]);
    expect(db().stops.find((s) => s.tripId === made.id).countryCode).toBe('XC');
  });

  it('refuses an import it can’t read, and anyone but an editor', async () => {
    for (const trips of [[], 'x', Array.from({ length: 101 }, (_, i) => trip(String(i))), [trip('1', { key: 'other:1' })], [trip('1', { status: 'DONE' })], [trip('1', { stops: 'x' })]]) {
      expect((await send(trips)).status).toBe(400);
    }
    expect((await send([trip('1')], SAM_MAP)).status).toBe(403);
    expect((await send([trip('1')], TOM_MAP)).status).toBe(404);
    expect((await get(`/api/maps/${SAM_MAP}/imports/polarsteps`)).status).toBe(403);
  });
});
