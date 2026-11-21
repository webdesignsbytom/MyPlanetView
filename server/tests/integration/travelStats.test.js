// The richer travel stats (docs/API.md "Stats"): how much of the world, days away, the
// distance travelled and the place furthest from home, from the map's completed trips and its
// home (its own setting, else a traveller's birth country).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, signUp } from './helpers.js';

afterAll(cleanUp);

describe('travel stats', () => {
  let owner;
  let viewer;
  let map;
  const statsOf = async (who = owner) => data(await who.agent.get(`/api/maps/${map.id}`)).map.stats;

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('StatsOwner'), signUp('StatsViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
  });

  it('starts with nothing to count, and the world’s countries', async () => {
    const stats = await statsOf();
    expect(stats).toMatchObject({ daysAway: 0, distanceKm: 0, furthest: null, homeCountryCode: null });
    // The map splits the UK by default: its four nations count instead of the UK
    expect(stats.countriesInWorld).toBeGreaterThan(200);
    expect(data(await owner.agent.patch(`/api/maps/${map.id}`).send({ splitUk: false })).map.stats.countriesInWorld).toBe(stats.countriesInWorld - 3);
  });

  it('takes its home from a traveller’s birth country, or its own setting', async () => {
    const [me] = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers;
    await owner.agent.patch(`/api/maps/${map.id}/travellers/${me.id}`).send({ birthCountryCode: 'GB' });
    expect((await statsOf()).homeCountryCode).toBe('GB');

    // Its own: a UK nation is the UK, a pole isn't a home, nor is a made-up code
    expect(data(await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'ID' })).map).toMatchObject({ homeCountryCode: 'ID', stats: { homeCountryCode: 'ID' } });
    expect(data(await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'XC' })).map.homeCountryCode).toBe('GB');
    expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'XN' })).status).toBe(400);
    expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'ZZ' })).status).toBe(400);
    expect((await viewer.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'FR' })).status).toBe(403);
    // Cleared: back to the birth country
    expect(data(await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: null })).map).toMatchObject({ homeCountryCode: null, stats: { homeCountryCode: 'GB' } });
  });

  it('counts a completed trip’s days and distance, home and back, and the furthest place', async () => {
    const colosseum = data(await owner.agent.get('/api/landmarks?country=IT')).landmarks.find((l) => l.name === 'Colosseum');
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Rome and Sydney', startDate: '2025-06-01', endDate: '2025-06-14' })).trip;
    expect((await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'IT', landmarkId: colosseum.id })).status).toBe(201);
    expect((await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'AU' })).status).toBe(201);
    // Planned: nothing yet
    expect(await statsOf()).toMatchObject({ daysAway: 0, distanceKm: 0 });

    expect((await owner.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' })).status).toBe(200);
    // An overlapping trip shares its days
    const second = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Paris', startDate: '2025-06-12', endDate: '2025-06-20' })).trip;
    await owner.agent.post(`/api/trips/${second.id}/stops`).send({ countryCode: 'FR' });
    await owner.agent.patch(`/api/trips/${second.id}`).send({ status: 'COMPLETED' });

    const stats = await statsOf();
    expect(stats.daysAway).toBe(20);
    // UK → Rome → Australia → UK is about 1,400 + 15,500 + 16,700 km, then UK → France → UK
    expect(stats.distanceKm).toBeGreaterThan(32_000);
    expect(stats.distanceKm).toBeLessThan(37_000);
    expect(stats.furthest).toMatchObject({ countryCode: 'AU' });
    expect(stats.furthest.km).toBeGreaterThan(15_000);
    // Viewers see the same, and so does the stats route
    expect(await statsOf(viewer)).toMatchObject({ daysAway: 20, furthest: { countryCode: 'AU' } });
    expect(data(await owner.agent.get(`/api/maps/${map.id}/stats`)).stats).toMatchObject({ daysAway: 20, distanceKm: stats.distanceKm });
  });

  it('goes in "Your data"', async () => {
    await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'IE' });
    expect(data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.homeCountryCode).toBe('IE');
  });
});
