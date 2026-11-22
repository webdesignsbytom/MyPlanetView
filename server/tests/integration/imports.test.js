// Importing from Polarsteps (docs/API.md "Importing from Polarsteps"): the trips with their
// stops, then photos and step stories through the usual routes with their keys; run again,
// nothing is added twice. Editors only; places follow the map.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const TRIP = {
  key: 'polarsteps:trip:10825444',
  title: 'Britain and France',
  status: 'COMPLETED',
  startDate: '2019-05-01',
  endDate: '2019-05-12',
  stops: [
    // In Edinburgh: on a map that splits the UK, Scotland by its position
    { countryCode: 'GB', placeName: 'Edinburgh', arriveOn: '2019-05-01', latitude: 55.9533, longitude: -3.1883 },
    { countryCode: 'FR', placeName: 'Paris', arriveOn: '2019-05-06', leaveOn: '2019-05-12' },
    // A place the map doesn't have: left out
    { countryCode: 'ZZ', placeName: 'Nowhere', arriveOn: '2019-05-07' },
  ],
};

describe('importing from Polarsteps', () => {
  let owner;
  let viewer;
  let stranger;
  let map;
  let tripId;
  const importTrips = (who, trips) => who.agent.post(`/api/maps/${map.id}/imports/polarsteps`).send({ trips });
  const imported = (who) => who.agent.get(`/api/maps/${map.id}/imports/polarsteps`);

  beforeAll(async () => {
    [owner, viewer, stranger] = await Promise.all(['ImportOwner', 'ImportViewer', 'ImportStranger'].map((n) => signUp(n)));
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    // France first visited later than the trip: the import makes it earlier
    expect((await owner.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED', firstVisitedOn: '2021-01-01' })).status).toBe(200);
  });

  it('imports a trip with its stops, its countries visited and first visits', async () => {
    const res = await importTrips(owner, [TRIP]);
    expect(res.status).toBe(201);
    const [result] = data(res).trips;
    expect(result).toMatchObject({ key: TRIP.key, created: true });
    tripId = result.tripId;

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { stops: { orderBy: { position: 'asc' } }, travellers: true } });
    expect(trip).toMatchObject({ title: 'Britain and France', status: 'COMPLETED', importedFrom: TRIP.key });
    expect(trip.stops.map((s) => [s.countryCode, s.placeName])).toEqual([
      ['XC', 'Edinburgh'],
      ['FR', 'Paris'],
    ]);
    // The importer's own traveller went
    expect(trip.travellers).toHaveLength(1);

    const visits = await prisma.countryVisit.findMany({ where: { mapId: map.id }, select: { countryCode: true, firstVisitedOn: true } });
    const byCode = Object.fromEntries(visits.map((v) => [v.countryCode, v.firstVisitedOn?.toISOString().slice(0, 10) ?? null]));
    expect(byCode.XC).toBe('2019-05-01');
    expect(byCode.FR).toBe('2019-05-06');
  });

  it('never imports the same trip twice', async () => {
    const res = await importTrips(owner, [TRIP]);
    expect(res.status).toBe(200);
    expect(data(res).trips).toEqual([{ key: TRIP.key, tripId, created: false }]);
    expect(await prisma.trip.count({ where: { mapId: map.id, importedFrom: TRIP.key } })).toBe(1);
  });

  it('takes photos and stories with their keys, once each', async () => {
    const photo = await uploadPhoto(owner.agent, map.id, { tripId, countryCode: 'FR', importedFrom: 'polarsteps:photo:98177523/IMG_1.jpg' });
    expect(photo.status).toBe(201);
    const again = await uploadPhoto(owner.agent, map.id, { tripId, countryCode: 'FR', importedFrom: 'polarsteps:photo:98177523/IMG_1.jpg' });
    expect(again.status).toBe(409);
    expect(await prisma.photo.count({ where: { mapId: map.id } })).toBe(1);
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', importedFrom: 'polarsteps:trip:1' })).status).toBe(400);

    const story = {
      kind: 'SAW_OR_DID',
      title: 'Eiffel Tower at night',
      text: 'Sparkling on the hour.',
      countryCode: 'FR',
      happenedOn: '2019-05-07',
      tripId,
      photoIds: [data(photo).photo.id],
      importedFrom: 'polarsteps:moment:98177523',
    };
    expect((await owner.agent.post(`/api/maps/${map.id}/moments`).send(story)).status).toBe(201);
    expect((await owner.agent.post(`/api/maps/${map.id}/moments`).send(story)).status).toBe(409);

    expect(data(await imported(owner))).toEqual({
      trips: [{ key: TRIP.key, tripId }],
      photos: ['polarsteps:photo:98177523/IMG_1.jpg'],
      moments: ['polarsteps:moment:98177523'],
    });
  });

  it('is for editors: a viewer gets a 403, a stranger a 404, a bad import a 400', async () => {
    expect((await importTrips(viewer, [TRIP])).status).toBe(403);
    expect((await imported(viewer)).status).toBe(403);
    expect((await importTrips(stranger, [TRIP])).status).toBe(404);
    expect((await importTrips(owner, [{ ...TRIP, key: 'nope' }])).status).toBe(400);
  });
});
