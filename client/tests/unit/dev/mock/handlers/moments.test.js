import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MOMENT_MESSAGES } from '@/dev/mock/moments';
import { HOME_MAP, JO_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, patch, post, registerAllRoutes } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const good = { kind: 'SAW_OR_DID', title: 'Tapas crawl', countryCode: 'ES' };
const ids = (res) => res.data.moments.map((m) => m.id);

describe('listing moments', () => {
  it('lists a map’s moments, hidden ones for editors only, 404 with no role', async () => {
    expect(ids(await get(`/api/maps/${HOME_MAP}/moments`))).toContain('moment-party');
    expect(ids(await get(`/api/maps/${SAM_MAP}/moments`))).toEqual(['moment-angkor']);
    expect((await get(`/api/maps/${TOM_MAP}/moments`)).status).toBe(404);
    expect((await get(`/api/maps/${HOME_MAP}/moments`, { country: 'ZZ' })).status).toBe(400);
  });

  it('lists a trip’s moments for anyone on the trip, the trip-only editor too', async () => {
    expect(ids(await get('/api/trips/trip-jo-lisbon/moments'))).toEqual(['moment-nata']);
    expect(ids(await get('/api/trips/trip-italy/moments'))).toEqual(['moment-gelato']);
    expect((await get('/api/trips/trip-tom-stag/moments')).status).toBe(404);
  });
});

describe('adding a moment', () => {
  it('adds one for an editor, with its pin private unless shared', { timeout: 20000 }, async () => {
    const { status, data } = await post(`/api/maps/${HOME_MAP}/moments`, { ...good, spot: { latitude: 41.3874, longitude: 2.1686 }, travellerIds: ['trav-alex'] });
    expect(status).toBe(201);
    expect(data.moment).toMatchObject({ title: 'Tapas crawl', countryCode: 'ES', spot: { latitude: 41.3874, longitude: 2.1686, shared: false }, hidden: false, travellerIds: ['trav-alex'] });
  });

  it('lets a trip-only editor add one to their trip, with the trip’s photos only', async () => {
    const lisbon = { kind: 'SAW_OR_DID', title: 'Tram 28', countryCode: 'PT', tripId: 'trip-jo-lisbon' };
    expect((await post(`/api/maps/${JO_MAP}/moments`, lisbon)).status).toBe(201);
    expect((await post(`/api/maps/${JO_MAP}/moments`, { ...lisbon, photoIds: ['photo-lisbon'] })).status).toBe(201);
    expect((await post(`/api/maps/${JO_MAP}/moments`, { ...lisbon, tripId: null })).status).toBe(404);
  });

  it('refuses a viewer, a stranger and a bad moment', async () => {
    expect((await post(`/api/maps/${SAM_MAP}/moments`, good)).status).toBe(403);
    expect((await post(`/api/maps/${TOM_MAP}/moments`, good)).status).toBe(404);
    expect((await post(`/api/maps/${HOME_MAP}/moments`, { ...good, kind: 'NOPE' })).message).toBe(MOMENT_MESSAGES.kind);
    expect((await post(`/api/maps/${HOME_MAP}/moments`, { ...good, tripId: 'trip-sam-asia' })).status).toBe(404);
  });

  it('takes an import once, by its key', async () => {
    const story = { ...good, importedFrom: 'polarsteps:moment:42' };
    expect((await post(`/api/maps/${HOME_MAP}/moments`, story)).status).toBe(201);
    expect((await post(`/api/maps/${HOME_MAP}/moments`, story)).status).toBe(409);
    expect((await post(`/api/maps/${HOME_MAP}/moments`, { ...good, importedFrom: 'other' })).status).toBe(400);
  });
});

describe('changing and deleting a moment', () => {
  it('changes one for an editor, and moves it to another of the map’s trips', async () => {
    const { data } = await patch('/api/moments/moment-flamenco', { title: 'Flamenco!', tripId: 'trip-italy', countryCode: 'ES' });
    expect(data.moment).toMatchObject({ title: 'Flamenco!', tripId: 'trip-italy' });
    expect((await patch('/api/moments/moment-flamenco', { tripId: 'trip-sam-asia' })).status).toBe(400);
  });

  it('gives a viewer 404 for a hidden moment and 403 for a shown one', async () => {
    expect((await patch('/api/moments/moment-passport', { title: 'x' })).status).toBe(404);
    expect((await patch('/api/moments/moment-angkor', { title: 'x' })).status).toBe(403);
    expect((await del('/api/moments/moment-passport')).status).toBe(404);
    expect((await del('/api/moments/moment-angkor')).status).toBe(403);
    expect((await patch('/api/moments/nope', { title: 'x' })).status).toBe(404);
  });

  it('keeps a trip-only editor to their trip: no moving it, only its photos', async () => {
    expect((await patch('/api/moments/moment-nata', { tripId: null })).message).toBe(MOMENT_MESSAGES.tripChangeNeedsMap);
    expect((await patch('/api/moments/moment-nata', { title: 'Nata!' })).data.moment.title).toBe('Nata!');
    expect((await get('/api/trips/trip-jo-lisbon/moments')).data.moments[0].title).toBe('Nata!');
  });

  it('wants a pinned moment’s pin moved with it to another country', { timeout: 20000 }, async () => {
    expect((await patch('/api/moments/moment-engaged', { countryCode: 'BE', landmarkId: null })).message).toBe(MOMENT_MESSAGES.spotWrongCountry);
    expect((await patch('/api/moments/moment-engaged', { countryCode: 'BE', landmarkId: null, spot: null })).data.moment.spot).toBeNull();
  });

  it('deletes one for an editor', async () => {
    expect((await del('/api/moments/moment-born')).data).toEqual({ message: 'Moment deleted.' });
    expect(db().moments.some((m) => m.id === 'moment-born')).toBe(false);
  });
});
