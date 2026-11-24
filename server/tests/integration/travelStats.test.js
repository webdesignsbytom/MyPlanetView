// The richer travel stats (docs/API.md "Stats"): how much of the world, days away, the
// distance travelled and the place furthest from home, from the map's completed trips and its
// home (its own setting, else a traveller's birth country).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp } from './helpers.js';

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

  // Time away in more detail (23 Nov 2026, the user's wish)
  it('splits the days by year and by place, names the longest trip, and counts each traveller’s', async () => {
    const [me] = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers;
    const trip = data(
      await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'New Year in Spain', startDate: '2025-12-29', endDate: '2026-01-02', travellerIds: [me.id] }),
    ).trip;
    expect((await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'ES' })).status).toBe(201);
    expect((await owner.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' })).status).toBe(200);

    const stats = await statsOf();
    // 1 to 20 June 2025, then 29 to 31 December, and 1 and 2 January 2026
    expect(stats.daysByYear).toEqual([
      { year: 2026, days: 2 },
      { year: 2025, days: 23 },
    ]);
    // Paris's trip is France's 9 days; Spain's all 5; "Rome and Sydney" has undated stops
    expect(stats.daysByPlace).toEqual(expect.arrayContaining([{ countryCode: 'FR', days: 9 }, { countryCode: 'ES', days: 5 }]));
    expect(stats.longestTrip).toEqual({ tripId: expect.any(String), title: 'Rome and Sydney', days: 14 });
    const mine = stats.byTraveller.find((t) => t.travellerId === me.id);
    expect(mine.daysAway).toBe(5);
    // A viewer sees the same
    expect(await statsOf(viewer)).toMatchObject({ daysByYear: stats.daysByYear, longestTrip: stats.longestTrip });
  });

  // 23 Nov 2026, the user's wish: an optional date of birth, asked when people are added to a
  // map, gives each traveller the share of their life spent away, for the map's editors only
  it('keeps a traveller’s date of birth for the map’s editors, with the share of a life away', async () => {
    const [me] = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers;
    const set = (birthDate) => owner.agent.patch(`/api/maps/${map.id}/travellers/${me.id}`).send({ birthDate });
    // Born mid-2025: their 5 days in Spain are about 1% of their life so far
    const saved = await set('2025-06-01');
    expect(saved.status).toBe(200);
    expect(data(saved).traveller).toMatchObject({ id: me.id, birthDate: '2025-06-01' });
    for (const bad of ['1899-12-31', '2999-01-01', '1990-02-30', 'yesterday']) {
      const res = await set(bad);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Give a date of birth from 1 January 1900 up to today, or leave it empty.');
    }

    const forOwner = data(await owner.agent.get(`/api/maps/${map.id}`)).map;
    expect(forOwner.travellers.find((t) => t.id === me.id).birthDate).toBe('2025-06-01');
    const row = forOwner.stats.byTraveller.find((t) => t.travellerId === me.id);
    expect(row.lifeAwayShare).toBeGreaterThan(0);
    expect(row.lifeAwayShare).toBeLessThan(2);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/stats`)).stats.byTraveller[0]).toHaveProperty('lifeAwayShare');

    // A viewer sees neither, nor does a share link
    const forViewer = data(await viewer.agent.get(`/api/maps/${map.id}`)).map;
    expect(forViewer.travellers.every((t) => !('birthDate' in t))).toBe(true);
    expect(forViewer.stats.byTraveller.every((t) => !('lifeAwayShare' in t))).toBe(true);
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = data(await anon().get(`/api/shared/${shareCode}`)).map;
    expect(shared.travellers.every((t) => !('birthDate' in t))).toBe(true);
    expect(shared.stats.byTraveller.every((t) => !('lifeAwayShare' in t))).toBe(true);

    // In "Your data"; cleared with null
    expect(data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.travellers.find((t) => t.id === me.id).birthDate).toBe('2025-06-01');
    expect(data(await set(null)).traveller.birthDate).toBeNull();
  });

  it('takes a date of birth for each traveller of a new map, and for one added later', async () => {
    const created = await owner.agent.post('/api/maps').send({
      name: 'Family travels',
      groupType: 'FAMILY',
      travellers: [{ name: 'Mum', birthDate: '1980-01-02' }, { name: 'Kid' }],
    });
    expect(created.status).toBe(201);
    const fresh = data(created).map;
    expect(fresh.travellers.map((t) => [t.name, t.birthDate])).toEqual([
      ['Mum', '1980-01-02'],
      ['Kid', null],
    ]);
    const added = await owner.agent.post(`/api/maps/${fresh.id}/travellers`).send({ name: 'Baby', birthDate: '2026-11-01' });
    expect(added.status).toBe(201);
    expect(data(added).traveller.birthDate).toBe('2026-11-01');
    expect((await owner.agent.post('/api/maps').send({ name: 'Bad', groupType: 'SOLO', travellers: [{ name: 'X', birthDate: '1800-01-01' }] })).status).toBe(400);
    await owner.agent.delete(`/api/maps/${fresh.id}`);
  });

  // Collector's counts (24 Nov 2026, the user's wish): the UN's 193, a count beside the map's own
  it('counts the UN member states been to, for everyone who opens the map', async () => {
    const counter = await signUp('UnCounter');
    const own = await defaultMapOf(counter.agent);
    const mark = (code, status = 'VISITED') => counter.agent.put(`/api/maps/${own.id}/visits/${code}`).send({ status });
    const counts = async () => (await counter.agent.get(`/api/maps/${own.id}`).then(data)).map.stats;
    expect((await counts()).unCountries).toBe(0);
    // A member, a part of one (the Canaries are Spain), a territory, and a wish
    for (const [code, status] of [['FR'], ['IC'], ['GL'], ['JP', 'WANT_TO_GO'], ['XE']]) expect((await mark(code, status)).status).toBe(200);
    const stats = await counts();
    // France, Spain and the UK (England), never Greenland or a wish; the map's own count differs
    expect(stats.unCountries).toBe(3);
    expect(stats.countries).toBe(4);
  });

  it('goes in "Your data"', async () => {
    await owner.agent.patch(`/api/maps/${map.id}`).send({ homeCountryCode: 'IE' });
    expect(data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.homeCountryCode).toBe('IE');
  });
});
