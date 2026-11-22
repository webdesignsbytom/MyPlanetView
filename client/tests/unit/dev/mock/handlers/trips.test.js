import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ALEX, HOME_MAP, JO_MAP, SAM_MAP, USER, db, del, freshStore, get, patch, post, put, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const trip = (id) => db().trips.find((t) => t.id === id);
const visit = (mapId, code) => db().visits.find((v) => v.mapId === mapId && v.countryCode === code);
const stops = (tripId) => db().stops.filter((s) => s.tripId === tripId).sort((a, b) => a.position - b.position);

describe('reading trips', () => {
  it('lists the trips shared with the test user on their own', async () => {
    const { data } = await get('/api/trips/shared-with-me');
    expect(data.trips).toEqual([expect.objectContaining({ id: 'trip-jo-lisbon', role: 'EDITOR', mapName: "Jo's family trips" })]);
    signOut();
    expect((await get('/api/trips/shared-with-me')).status).toBe(401);
  });

  it('opens a trip for anyone on it or its map, 404 for anyone else', async () => {
    expect((await get('/api/trips/trip-italy')).data.trip).toMatchObject({ role: 'OWNER', canDelete: true, ads: { every: null } });
    expect((await get('/api/trips/trip-sam-asia')).data.trip.role).toBe('VIEWER');
    expect((await get('/api/trips/trip-jo-lisbon')).data.trip).toMatchObject({ role: 'EDITOR', canDelete: false, canOpenMap: false });
    expect((await get('/api/trips/trip-tom-stag')).status).toBe(404);
  });

  it('lists a trip’s photos in its order, hidden ones for editors only', async () => {
    expect((await get('/api/trips/trip-italy/photos')).data.photos).toHaveLength(3);
    db().photos.find((p) => p.id === 'photo-bangkok').hidden = true;
    expect((await get('/api/trips/trip-sam-asia/photos')).data.photos).toEqual([]);
    expect((await get('/api/trips/trip-tom-stag/photos')).status).toBe(404);
  });
});

describe('changing a trip', () => {
  it('lets a trip-only editor change it, and completing it marks its countries on every map showing it', async () => {
    const { data } = await patch('/api/trips/trip-jo-lisbon', { title: ' Lisbon long weekend ', status: 'PLANNED' });
    expect(data.trip.title).toBe('Lisbon long weekend');
    db().tripMaps.push({ tripId: 'trip-jo-lisbon', mapId: HOME_MAP, addedById: USER });
    db().stops.push({ id: 'stop-porto', tripId: 'trip-jo-lisbon', position: 1, countryCode: 'ES' });
    await patch('/api/trips/trip-jo-lisbon', { status: 'COMPLETED' });
    expect(visit(JO_MAP, 'ES')).toMatchObject({ status: 'VISITED', source: 'TRIP' });
    expect(visit(HOME_MAP, 'ES').source).toBe('MANUAL');
  });

  it('turns a planned trip’s countries from "want to go" to visited when it’s completed', async () => {
    await patch('/api/trips/trip-japan', { status: 'COMPLETED' });
    expect(visit(HOME_MAP, 'JP')).toMatchObject({ status: 'VISITED', source: 'TRIP' });
  });

  it('refuses a title, status or cover that isn’t one, and a viewer', async () => {
    expect((await patch('/api/trips/trip-italy', { title: '' })).status).toBe(400);
    expect((await patch('/api/trips/trip-italy', { status: 'DREAMT' })).status).toBe(400);
    expect((await patch('/api/trips/trip-italy', { coverPhotoId: 'photo-eiffel' })).status).toBe(400);
    expect((await patch('/api/trips/trip-italy', { coverPhotoId: 'photo-florence-cathedral' })).data.trip.coverPhotoId).toBe('photo-florence-cathedral');
    expect((await patch('/api/trips/trip-sam-asia', { title: 'x' })).status).toBe(403);
  });

  it('sets who went, only the map’s travellers', async () => {
    expect((await put('/api/trips/trip-italy/travellers', { travellerIds: ['trav-alex', 'trav-alex'] })).data.trip.travellerIds).toEqual(['trav-alex']);
    expect((await put('/api/trips/trip-italy/travellers', { travellerIds: ['trav-sam'] })).status).toBe(400);
  });
});

describe('deleting a trip', () => {
  it('needs an editor of the map, not only of the trip', async () => {
    expect((await del('/api/trips/trip-jo-lisbon')).message).toBe("Only the map's owner and its editors can delete a trip.");
    expect((await del('/api/trips/trip-sam-asia')).status).toBe(403);
  });

  it('deletes the trip, its stops and links, keeping its photos and moments', async () => {
    expect((await del('/api/trips/trip-italy')).status).toBe(200);
    expect(trip('trip-italy')).toBeUndefined();
    expect(stops('trip-italy')).toEqual([]);
    expect(db().photos.find((p) => p.id === 'photo-colosseum').tripId).toBeNull();
    expect(db().moments.find((m) => m.id === 'moment-gelato').tripId).toBeNull();
  });
});

describe('stops', () => {
  it('adds a stop, marking its country on a completed trip', async () => {
    const { status, data } = await post('/api/trips/trip-italy/stops', { countryCode: 'sm', placeName: ' San Marino ' });
    expect(status).toBe(201);
    expect(data.trip.stops.at(-1)).toMatchObject({ countryCode: 'SM', placeName: 'San Marino', position: 3 });
    expect(visit(HOME_MAP, 'SM')).toMatchObject({ source: 'TRIP' });
    expect((await post('/api/trips/trip-italy/stops', {})).status).toBe(400);
    expect((await post('/api/trips/trip-italy/stops', { countryCode: 'IT', landmarkId: 'lm-nope' })).status).toBe(400);
  });

  it('reorders, changes and deletes stops, keeping positions in step', async () => {
    const ids = stops('trip-italy').map((s) => s.id);
    expect((await put('/api/trips/trip-italy/stops/order', { stopIds: [...ids].reverse() })).data.trip.stops.map((s) => s.id)).toEqual([...ids].reverse());
    expect((await put('/api/trips/trip-italy/stops/order', { stopIds: ids.slice(1) })).status).toBe(400);
    expect((await patch('/api/trips/trip-italy/stops/stop-rome', { countryCode: 'VA' })).data.trip.stops.find((s) => s.id === 'stop-rome').countryCode).toBe('VA');
    expect(visit(HOME_MAP, 'VA')).toBeDefined();
    expect((await patch('/api/trips/trip-italy/stops/nope', {})).status).toBe(404);
    await del('/api/trips/trip-italy/stops/stop-cinque');
    expect(stops('trip-italy').map((s) => s.position)).toEqual([0, 1]);
    expect((await del('/api/trips/trip-italy/stops/stop-cinque')).status).toBe(404);
  });

  it('keeps a stop in a UK nation as the UK on a map that doesn’t split it', async () => {
    expect((await post('/api/trips/trip-japan/stops', { countryCode: 'XC' })).data.trip.stops.at(-1).countryCode).toBe('GB');
  });
});

describe('group trips', () => {
  it('adds a trip to another map the person edits, marking its countries there if completed', async () => {
    db().mapMembers.push({ mapId: SAM_MAP, userId: USER, role: 'EDITOR' });
    db().mapMembers = db().mapMembers.filter((m) => !(m.mapId === SAM_MAP && m.role === 'VIEWER'));
    const { status } = await post('/api/trips/trip-italy/maps', { mapId: SAM_MAP });
    expect(status).toBe(201);
    expect(visit(SAM_MAP, 'IT')).toMatchObject({ source: 'TRIP' });
    expect((await post('/api/trips/trip-italy/maps', { mapId: SAM_MAP })).status).toBe(200);
  });

  it('refuses its own map, no map, a map the person only views, and one they have no role on', async () => {
    expect((await post('/api/trips/trip-italy/maps', { mapId: HOME_MAP })).status).toBe(400);
    expect((await post('/api/trips/trip-italy/maps', {})).status).toBe(400);
    expect((await post('/api/trips/trip-italy/maps', { mapId: SAM_MAP })).status).toBe(403);
    expect((await post('/api/trips/trip-italy/maps', { mapId: 'map-tom' })).status).toBe(404);
    expect((await post('/api/trips/trip-tom-stag/maps', { mapId: HOME_MAP })).status).toBe(404);
  });

  it('lets the person who added it, or the map’s owner, take it off', async () => {
    expect((await del(`/api/trips/trip-tom-stag/maps/${HOME_MAP}`)).status).toBe(200);
    expect(db().tripMaps).toEqual([]);
    db().tripMaps.push({ tripId: 'trip-sam-asia', mapId: SAM_MAP, addedById: ALEX });
    expect((await del(`/api/trips/trip-sam-asia/maps/${SAM_MAP}`)).status).toBe(403);
    expect((await del('/api/trips/trip-sam-asia/maps/nope')).status).toBe(404);
    signOut();
    expect((await del(`/api/trips/trip-sam-asia/maps/${SAM_MAP}`)).status).toBe(401);
  });
});
