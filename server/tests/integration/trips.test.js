// Trips: CRUD, stops, trip travellers, completing a trip, per-person stats.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, signUp } from './helpers.js';

afterAll(cleanUp);

describe('trips', () => {
  let agent;
  let map;
  let travellers;

  beforeAll(async () => {
    ({ agent } = await signUp('Trav'));
    map = await defaultMapOf(agent);
    await agent.patch(`/api/maps/${map.id}`).send({ groupType: 'COUPLE' });
    const partner = data(await agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Partner' })).traveller;
    travellers = data(await agent.get(`/api/maps/${map.id}`)).map.travellers;
    expect(travellers.map((t) => t.id)).toContain(partner.id);
  });

  it('creates, reads, updates and deletes a trip', async () => {
    const created = await agent.post(`/api/maps/${map.id}/trips`).send({
      title: 'Spring in Japan',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      travellerIds: [travellers[0].id],
    });
    expect(created.status).toBe(201);
    const trip = data(created).trip;
    expect(trip).toMatchObject({ title: 'Spring in Japan', status: 'PLANNED', startDate: '2026-04-01', endDate: '2026-04-14', role: 'OWNER' });
    expect(trip.travellerIds).toEqual([travellers[0].id]);

    const list = data(await agent.get(`/api/maps/${map.id}/trips`)).trips;
    expect(list.map((t) => t.id)).toContain(trip.id);

    const renamed = await agent.patch(`/api/trips/${trip.id}`).send({ title: 'Cherry blossom', description: 'Kyoto first' });
    expect(renamed.status).toBe(200);
    expect(data(renamed).trip).toMatchObject({ title: 'Cherry blossom', description: 'Kyoto first' });

    // End before start is refused, against the stored start date too
    expect((await agent.patch(`/api/trips/${trip.id}`).send({ endDate: '2026-03-01' })).status).toBe(400);
    expect((await agent.patch(`/api/trips/${trip.id}`).send({ status: 'DONE' })).status).toBe(400);

    expect((await agent.delete(`/api/trips/${trip.id}`)).status).toBe(200);
    expect((await agent.get(`/api/trips/${trip.id}`)).status).toBe(404);
  });

  it('refuses travellers from another map', async () => {
    const other = await signUp('Elsewhere');
    const otherMap = await defaultMapOf(other.agent);
    const foreign = data(await other.agent.get(`/api/maps/${otherMap.id}`)).map.travellers[0];
    const res = await agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Mixed', travellerIds: [foreign.id] });
    expect(res.status).toBe(400);
  });

  it('adds, edits, reorders and removes stops', async () => {
    const trip = data(await agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Grand tour' })).trip;
    const eiffel = data(await agent.get('/api/landmarks?country=FR')).landmarks.find((l) => l.name === 'Eiffel Tower');

    const stops = [];
    for (const body of [
      { countryCode: 'FR', landmarkId: eiffel.id, arriveOn: '2026-07-01', leaveOn: '2026-07-04' },
      { countryCode: 'IT', placeName: 'Florence' },
      { countryCode: 'ES' },
    ]) {
      const res = await agent.post(`/api/trips/${trip.id}/stops`).send(body);
      expect(res.status).toBe(201);
      stops.push(data(res).trip.stops.at(-1));
    }
    expect(stops.map((s) => s.position)).toEqual([0, 1, 2]);
    expect(stops[0]).toMatchObject({ countryCode: 'FR', landmarkName: 'Eiffel Tower', arriveOn: '2026-07-01' });

    expect((await agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'ZZ' })).status).toBe(400);
    expect((await agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'FR', arriveOn: '2026-07-05', leaveOn: '2026-07-01' })).status).toBe(400);

    const edited = await agent.patch(`/api/trips/${trip.id}/stops/${stops[1].id}`).send({ placeName: 'Rome', notes: 'Colosseum at dawn' });
    expect(edited.status).toBe(200);
    expect(data(edited).trip.stops.find((s) => s.id === stops[1].id)).toMatchObject({ placeName: 'Rome', notes: 'Colosseum at dawn' });

    const order = [stops[2].id, stops[0].id, stops[1].id];
    const reordered = await agent.put(`/api/trips/${trip.id}/stops/order`).send({ stopIds: order });
    expect(reordered.status).toBe(200);
    expect(data(reordered).trip.stops.map((s) => s.id)).toEqual(order);

    // Every stop exactly once
    expect((await agent.put(`/api/trips/${trip.id}/stops/order`).send({ stopIds: [stops[0].id, stops[1].id] })).status).toBe(400);
    expect((await agent.put(`/api/trips/${trip.id}/stops/order`).send({ stopIds: [stops[0].id, stops[0].id, stops[1].id] })).status).toBe(400);

    const removed = await agent.delete(`/api/trips/${trip.id}/stops/${stops[2].id}`);
    expect(removed.status).toBe(200);
    expect(data(removed).trip.stops.map((s) => s.id)).toEqual([stops[0].id, stops[1].id]);
    expect((await agent.delete(`/api/trips/${trip.id}/stops/${stops[2].id}`)).status).toBe(404);
  });

  it('completing a trip marks its countries visited and counts them per traveller', async () => {
    const [me, partner] = travellers;
    const trip = data(await agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Nordic loop', travellerIds: [me.id] })).trip;
    await agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'NO' });
    await agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'SE' });
    // Already visited by hand: completing the trip must not overwrite it
    await agent.put(`/api/maps/${map.id}/visits/SE`).send({ status: 'LIVED' });

    const travellersRes = await agent.put(`/api/trips/${trip.id}/travellers`).send({ travellerIds: [me.id, partner.id] });
    expect(travellersRes.status).toBe(200);
    expect(data(travellersRes).trip.travellerIds.sort()).toEqual([me.id, partner.id].sort());

    const done = await agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' });
    expect(done.status).toBe(200);

    const visits = data(await agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'NO')).toMatchObject({ status: 'VISITED', source: 'TRIP' });
    expect(visits.find((v) => v.countryCode === 'SE')).toMatchObject({ status: 'LIVED', source: 'MANUAL' });

    // A stop added to a completed trip counts straight away
    await agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'FI' });
    const after = data(await agent.get(`/api/maps/${map.id}`)).map;
    expect(after.visits.find((v) => v.countryCode === 'FI')).toMatchObject({ source: 'TRIP' });

    const stats = data(await agent.get(`/api/maps/${map.id}/stats`)).stats;
    const byName = Object.fromEntries(stats.byTraveller.map((t) => [t.name, t.countries]));
    expect(byName).toMatchObject({ Trav: 3, Partner: 3 });
    expect(stats.trips).toBeGreaterThanOrEqual(1);
  });

  it('turns a "want to go" country into a visited one when the trip there is completed', async () => {
    await agent.put(`/api/maps/${map.id}/visits/IS`).send({ status: 'WANT_TO_GO' });
    const trip = data(await agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Iceland at last' })).trip;
    await agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'IS' });
    expect((await agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' })).status).toBe(200);

    const visits = data(await agent.get(`/api/maps/${map.id}`)).map.visits;
    expect(visits.find((v) => v.countryCode === 'IS')).toMatchObject({ status: 'VISITED', source: 'TRIP' });
  });
});
