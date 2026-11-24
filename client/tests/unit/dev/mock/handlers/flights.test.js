// Mock mode's flight log (dev/mock/handlers/flights.js): the server's rules over the store.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, del, freshStore, get, post, registerAllRoutes, setVerified, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

describe('the mock flight log', () => {
  it('reads the seeded flights with their totals', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/flights`);
    // Every trip's flights (data/demoTravels.js), the newest first
    expect(data.flights.map((f) => `${f.from}-${f.to}`).slice(0, 6)).toEqual(['DUB-BGO', 'DUB-VIE', 'VCE-DUB', 'DUB-VCE', 'PSA-LGW', 'LHR-FCO']);
    expect(data.totals).toMatchObject({ flights: 26, distanceKm: 91175, airlines: 13 });
    expect(data.totals.airports).toHaveLength(26);
    signOut();
    expect((await get(`/api/maps/${HOME_MAP}/flights`)).status).toBe(401);
  });

  it('adds flights with their distance, once each, and refuses what isn’t one', async () => {
    const body = { source: 'BOARDING_PASS', flights: [{ from: 'lhr', to: 'jfk', flownOn: '2026-06-01', carrier: 'ba', flightNumber: '117' }] };
    const made = await post(`/api/maps/${HOME_MAP}/flights`, body);
    expect(made.status).toBe(201);
    expect(made.data.flights[0]).toMatchObject({ from: 'LHR', to: 'JFK', carrier: 'BA', flightNumber: '117', source: 'BOARDING_PASS' });
    expect(made.data.flights[0].distanceKm).toBeGreaterThan(5500);
    expect((await post(`/api/maps/${HOME_MAP}/flights`, body)).data).toEqual({ flights: [], skipped: 1 });
    expect((await post(`/api/maps/${HOME_MAP}/flights`, { flights: [{ from: 'LHR', to: 'QQQ', flownOn: '2026-06-01' }] })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/flights`, { tripId: 'trip-sam-asia', flights: [{ from: 'LHR', to: 'CDG', flownOn: '2026-06-01' }] })).status).toBe(400);
    setVerified(false);
    expect((await post(`/api/maps/${HOME_MAP}/flights`, { flights: [{ from: 'LHR', to: 'CDG', flownOn: '2026-06-01' }] })).status).toBe(403);
  });

  it('deletes one for an editor', async () => {
    expect((await del('/api/flights/flight-rome-out')).status).toBe(200);
    expect((await get(`/api/maps/${HOME_MAP}/flights`)).data.flights).toHaveLength(25);
    expect((await del('/api/flights/flight-rome-out')).status).toBe(404);
  });
});
