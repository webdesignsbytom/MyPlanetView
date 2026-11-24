import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MESSAGES } from '@/dev/mock/countryMaps';
import { HOME_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, patch, post, put, registerAllRoutes } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const samsPin = () => {
  db().pins.push({ id: 'pin-bkk', mapId: SAM_MAP, countryCode: 'TH', name: 'Bangkok', notes: null, latitude: 13.75, longitude: 100.5, hidden: false, createdAt: 'x' });
  db().pinVisits.push({ id: 'v-bkk', pinId: 'pin-bkk', visitedOn: null, datePrecision: null, notes: null, photoIds: [], createdAt: 'x' });
};

describe('states on a country map', () => {
  it('lists a country’s states for anyone on the map', async () => {
    expect((await get(`/api/maps/${HOME_MAP}/subdivisions`, { country: 'US' })).data.subdivisions.map((s) => s.code)).toEqual(['US-NY', 'US-MA', 'US-CA']);
    expect((await get(`/api/maps/${SAM_MAP}/subdivisions`, { country: 'TH' })).data.subdivisions).toEqual([]);
    expect((await get(`/api/maps/${HOME_MAP}/subdivisions`, { country: 'AQ' })).message).toBe(MESSAGES.countryMapNotFound);
    expect((await get(`/api/maps/${TOM_MAP}/subdivisions`, { country: 'GB' })).status).toBe(404);
  });

  it('marks and clears a state for an editor, never a viewer', async () => {
    const { data } = await put(`/api/maps/${HOME_MAP}/subdivisions/US-CA`, { status: 'VISITED' });
    expect(data).toEqual({ subdivision: { code: 'US-CA', status: 'VISITED' }, implied: [] });
    expect((await put(`/api/maps/${HOME_MAP}/subdivisions/US-CA`, { status: 'GONE' })).status).toBe(400);
    expect((await put(`/api/maps/${HOME_MAP}/subdivisions/XX-1`, { status: 'VISITED' })).status).toBe(404);
    expect((await del(`/api/maps/${HOME_MAP}/subdivisions/US-CA`)).data).toEqual({ message: 'State cleared.' });
    expect((await put(`/api/maps/${SAM_MAP}/subdivisions/TH-10`, { status: 'VISITED' })).status).toBe(403);
    expect((await del(`/api/maps/${SAM_MAP}/subdivisions/TH-10`)).status).toBe(403);
    expect((await put(`/api/maps/${TOM_MAP}/subdivisions/GB-SCB`, { status: 'VISITED' })).status).toBe(404);
  });
});

describe('pins', () => {
  it('lists a country’s pins and shows one, hiding hidden ones from viewers', async () => {
    expect((await get(`/api/maps/${HOME_MAP}/pins`, { country: 'FR' })).data.pins.map((p) => p.id)).toEqual(['pin-paris']);
    expect((await get('/api/pins/pin-paris')).data.pin.visits).toHaveLength(2);
    samsPin();
    db().pins.at(-1).hidden = true;
    expect((await get(`/api/maps/${SAM_MAP}/pins`, { country: 'TH' })).data.pins).toEqual([]);
    expect((await get('/api/pins/pin-bkk')).status).toBe(404);
    expect((await get(`/api/maps/${HOME_MAP}/pins`, { country: 'ZZ' })).status).toBe(400);
    expect((await get(`/api/maps/${TOM_MAP}/pins`, { country: 'GB' })).status).toBe(404);
    expect((await get('/api/pins/nope')).status).toBe(404);
  });

  it('makes a pin inside its country for an editor', { timeout: 20000 }, async () => {
    const { status, data } = await post(`/api/maps/${HOME_MAP}/pins`, { countryCode: 'FR', name: 'Lyon', latitude: 45.764, longitude: 4.8357 });
    expect(status).toBe(201);
    expect(data.pin).toMatchObject({ name: 'Lyon', hidden: true, visits: [] });
    expect((await post(`/api/maps/${HOME_MAP}/pins`, { countryCode: 'FR', name: 'Rome', latitude: 41.9, longitude: 12.5 })).message).toBe(MESSAGES.wrongCountry);
    expect((await post(`/api/maps/${SAM_MAP}/pins`, { countryCode: 'TH', name: 'x', latitude: 13.75, longitude: 100.5 })).status).toBe(403);
  });

  it('changes and deletes a pin, and its visits', { timeout: 20000 }, async () => {
    expect((await patch('/api/pins/pin-paris', { name: 'Paris, again', hidden: true })).data.pin).toMatchObject({ name: 'Paris, again', hidden: true });
    expect((await patch('/api/pins/pin-paris', { name: '' })).status).toBe(400);
    const added = await post('/api/pins/pin-paris/visits', { visitedOn: '2026-06', datePrecision: 'MONTH', notes: 'Summer' });
    expect(added.status).toBe(201);
    expect(added.data.pin.visits).toHaveLength(3);
    expect((await post('/api/pins/pin-paris/visits', { visitedOn: 'soon', datePrecision: 'DAY' })).status).toBe(400);
    expect((await patch('/api/pins/pin-paris/visits/pin-visit-paris-2019', { notes: 'Engaged!' })).data.pin.visits.find((v) => v.id === 'pin-visit-paris-2019').notes).toBe('Engaged!');
    expect((await patch('/api/pins/pin-paris/visits/nope', { notes: 'x' })).status).toBe(404);
    expect((await del('/api/pins/pin-paris/visits/pin-visit-paris-2019')).data.pin.visits).toHaveLength(2);
    expect((await del('/api/pins/pin-paris/visits/nope')).status).toBe(404);
    expect((await del('/api/pins/pin-paris')).data).toEqual({ message: 'Pin deleted.' });
    expect(db().pins).toEqual([]);
  });

  it('lets a viewer read a pin but not change it', async () => {
    samsPin();
    expect((await get('/api/pins/pin-bkk')).data.pin.name).toBe('Bangkok');
    expect((await patch('/api/pins/pin-bkk', { name: 'x' })).status).toBe(403);
    expect((await del('/api/pins/pin-bkk')).status).toBe(403);
    expect((await post('/api/pins/pin-bkk/visits', {})).status).toBe(403);
    expect((await patch('/api/pins/pin-bkk/visits/v-bkk', {})).status).toBe(403);
    expect((await del('/api/pins/pin-bkk/visits/v-bkk')).status).toBe(403);
  });
});
