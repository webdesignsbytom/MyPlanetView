// The flight log (docs/API.md "Flights"; 23 Nov 2026): a map's flights from boarding passes or
// typed in, the distance and airports, for anyone on the map; its editors add and delete them.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp } from './helpers.js';

afterAll(cleanUp);

describe('the flight log', () => {
  let owner;
  let stranger;
  let viewer;
  let map;
  let trip;

  beforeAll(async () => {
    [owner, stranger, viewer] = await Promise.all([signUp('FlightOwner'), signUp('FlightStranger'), signUp('FlightViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'New York', startDate: '2026-06-01', endDate: '2026-06-08' })).trip;
  });

  const add = (agent, body) => agent.post(`/api/maps/${map.id}/flights`).send(body);

  it('logs a boarding pass’s flights on a trip, with their distance', async () => {
    const res = await add(owner.agent, {
      source: 'BOARDING_PASS',
      tripId: trip.id,
      flights: [
        { from: 'LHR', to: 'JFK', flownOn: '2026-06-01', carrier: 'BA', flightNumber: '117' },
        { from: 'JFK', to: 'LHR', flownOn: '2026-06-08', carrier: 'BA', flightNumber: '112' },
      ],
    });
    expect(res.status).toBe(201);
    const { flights, skipped } = data(res);
    expect(skipped).toBe(0);
    expect(flights).toHaveLength(2);
    expect(flights[0]).toMatchObject({ from: 'LHR', to: 'JFK', flownOn: '2026-06-01', carrier: 'BA', flightNumber: '117', tripId: trip.id, source: 'BOARDING_PASS' });
    expect(flights[0].distanceKm).toBeGreaterThan(5500);
  });

  it('never logs the same flight twice (a pass scanned again)', async () => {
    const again = data(await add(owner.agent, { source: 'BOARDING_PASS', flights: [{ from: 'LHR', to: 'JFK', flownOn: '2026-06-01', carrier: 'BA', flightNumber: '117' }] }));
    expect(again).toEqual({ flights: [], skipped: 1 });
    // One typed with no number is its own
    expect(data(await add(owner.agent, { flights: [{ from: 'LHR', to: 'CDG', flownOn: '2025-03-02' }] })).flights).toHaveLength(1);
  });

  it('refuses what isn’t a flight, and a trip of another map', async () => {
    expect((await add(owner.agent, { flights: [{ from: 'LHR', to: 'QQQ', flownOn: '2026-06-01' }] })).status).toBe(400);
    expect((await add(owner.agent, { flights: [] })).status).toBe(400);
    expect((await add(owner.agent, { source: 'TELEPATHY', flights: [{ from: 'LHR', to: 'CDG', flownOn: '2026-06-01' }] })).status).toBe(400);
    const otherMap = await defaultMapOf(stranger.agent);
    const otherTrip = data(await stranger.agent.post(`/api/maps/${otherMap.id}/trips`).send({ title: 'Theirs', startDate: '2026-01-01', endDate: '2026-01-02' })).trip;
    expect((await add(owner.agent, { tripId: otherTrip.id, flights: [{ from: 'LHR', to: 'CDG', flownOn: '2026-06-01' }] })).status).toBe(400);
  });

  it('anyone on the map reads the log with its totals; only editors add; strangers see nothing', async () => {
    const log = data(await viewer.agent.get(`/api/maps/${map.id}/flights`));
    expect(log.flights.map((f) => `${f.from}-${f.to}`)).toEqual(['JFK-LHR', 'LHR-JFK', 'LHR-CDG']);
    expect(log.totals).toMatchObject({ flights: 3, airports: ['CDG', 'JFK', 'LHR'], airlines: 1, longest: { distanceKm: expect.any(Number) } });
    expect(log.totals.distanceKm).toBeGreaterThan(11000);
    expect((await add(viewer.agent, { flights: [{ from: 'LHR', to: 'CDG', flownOn: '2026-06-01' }] })).status).toBe(403);
    expect((await stranger.agent.get(`/api/maps/${map.id}/flights`)).status).toBe(404);
    expect((await anon().get(`/api/maps/${map.id}/flights`)).status).toBe(401);
  });

  it('an unverified editor can’t add one', async () => {
    const unverified = await signUp('FlightUnverified', { verified: false });
    const own = await defaultMapOf(unverified.agent);
    expect((await unverified.agent.post(`/api/maps/${own.id}/flights`).send({ flights: [{ from: 'LHR', to: 'CDG', flownOn: '2026-06-01' }] })).status).toBe(403);
  });

  it('deleting the trip keeps its flights; an editor deletes a flight', async () => {
    expect((await owner.agent.delete(`/api/trips/${trip.id}`)).status).toBe(200);
    const { flights } = data(await owner.agent.get(`/api/maps/${map.id}/flights`));
    expect(flights.every((f) => f.tripId === null)).toBe(true);
    const [first] = flights;
    expect((await viewer.agent.delete(`/api/flights/${first.id}`)).status).toBe(403);
    expect((await stranger.agent.delete(`/api/flights/${first.id}`)).status).toBe(404);
    expect((await owner.agent.delete(`/api/flights/${first.id}`)).status).toBe(200);
    expect((await owner.agent.delete(`/api/flights/${first.id}`)).status).toBe(404);
  });

  it('"Your data" carries the log', async () => {
    const file = data(await owner.agent.get(`/api/users/export/maps/${map.id}`));
    expect(file.map.flights).toHaveLength(2);
    expect(file.map.flights[0]).toMatchObject({ from: 'LHR', to: 'CDG', flownOn: '2025-03-02', source: 'MANUAL' });
  });
});
