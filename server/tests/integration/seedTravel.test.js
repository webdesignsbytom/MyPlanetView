// The demo couple's travels (prisma/seed/travel.js and moments.js, from data/demoTravels.js;
// 24 Nov 2026, the user's wish: 20 places in a clear order, every kind of trip, birth dates, the
// timeline, heritage sites ticked and the strings), seeded on two new accounts and read back
// through the API as the site reads them. No photos here (seedPhotos.test.js has them).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';
import { seedTravelDemo } from '../../prisma/seed/travel.js';
import { seedDemoMoments } from '../../prisma/seed/moments.js';
import { DEMO_FLIGHTS, DEMO_LANDMARK_TICKS, DEMO_MOMENTS, DEMO_STRINGS, DEMO_TRIPS } from '../../prisma/seed/data/demoTravels.js';

let owner;
let partner;
let map;

beforeAll(async () => {
  owner = await signUp('DemoOwner');
  partner = await signUp('DemoPartner');
  const accounts = { ownerEmail: owner.email, partnerEmail: partner.email };
  await seedTravelDemo(accounts);
  expect(await seedDemoMoments(accounts)).toEqual({ moments: DEMO_MOMENTS.length, covers: 0 });
  map = data(await owner.agent.get(`/api/maps/${(await defaultMapOf(owner.agent)).id}`)).map;
});

afterAll(cleanUp);

describe('the demo couple’s map', () => {
  it('is a couple’s map of 20 places on five continents, both travellers with a birth date', () => {
    expect(map).toMatchObject({ name: "Sam & Alex's travels", groupType: 'COUPLE', splitUk: false });
    expect(map.stats).toMatchObject({ countries: 20, continents: 5, specialPlaces: 0 });
    expect(map.travellers.map((t) => [t.name, t.birthDate])).toEqual([
      ['Sam', '1990-01-14'],
      ['Alex', '1991-06-03'],
    ]);
    expect(map.visits.filter((v) => v.status === 'WANT_TO_GO').map((v) => v.countryCode).sort()).toEqual(['IS', 'JP', 'PE']);
    // Every completed trip, home and back: more than twice round the world
    expect(map.stats.distanceKm).toBeGreaterThan(80000);
  });

  it('has every kind of trip, each with its stops in order and who went', async () => {
    const trips = data(await owner.agent.get(`/api/maps/${map.id}/trips`)).trips;
    expect(trips.map((t) => t.title).sort()).toEqual(DEMO_TRIPS.map((t) => t.title.replace('{partner}', 'Alex')).sort());
    const status = (title) => trips.find((t) => t.title === title).status;
    expect([status('Norway in November'), status('Japan in spring'), status('Italian summer')]).toEqual(['ACTIVE', 'PLANNED', 'COMPLETED']);
    const world = data(await owner.agent.get(`/api/trips/${trips.find((t) => t.title === 'A year off: around the world').id}`)).trip;
    expect(world.stops.map((s) => s.countryCode)).toEqual(['MA', 'JO', 'TZ', 'ZA', 'IN', 'MY', 'NZ', 'MX', 'CU']);
    expect((await prisma.trip.findUnique({ where: { id: world.id }, select: { linkAccess: true } })).linkAccess).toBe('ANYONE_WITH_LINK');
    const vienna = data(await owner.agent.get(`/api/trips/${trips.find((t) => t.title === 'Alex’s conference in Vienna').id}`)).trip;
    // Only Alex went (travellers are the map's; travellerIds who went)
    expect(vienna.travellerIds).toEqual([map.travellers.find((t) => t.name === 'Alex').id]);
  });

  it('puts the passport’s pages in the order first visited, with the heritage sites ticked as stamps', async () => {
    const { passport } = data(await owner.agent.get(`/api/maps/${map.id}/passport`));
    expect(passport.pages.map((p) => p.countryCode)).toEqual(['GB', 'IE', 'US', 'NL', 'ES', 'FR', 'PT', 'GR', 'TR', 'MA', 'JO', 'TZ', 'ZA', 'IN', 'MY', 'NZ', 'MX', 'CU', 'IT', 'AT']);
    expect(passport.totals.landmarks).toBe(DEMO_LANDMARK_TICKS.length);
    expect(map.tickedLandmarkIds).toHaveLength(DEMO_LANDMARK_TICKS.length);
  });

  it('ties the strings in that order, and has the flights, One Shots and states', async () => {
    expect(map.strings.map((s) => [s.from, s.to])).toEqual(expect.arrayContaining(DEMO_STRINGS));
    expect(map.strings).toHaveLength(19);
    const { flights, totals } = data(await owner.agent.get(`/api/maps/${map.id}/flights`));
    expect(flights).toHaveLength(DEMO_FLIGHTS.length);
    expect(totals.distanceKm).toBe(DEMO_FLIGHTS.reduce((sum, f) => sum + f.distanceKm, 0));
    const { oneShots } = data(await owner.agent.get(`/api/maps/${map.id}/one-shots`));
    expect(oneShots.map((t) => t.itemKey).sort()).toEqual(['african-elephant', 'giraffe', 'lion', 'puffin', 'rhino']);
    const states = data(await owner.agent.get(`/api/maps/${map.id}/subdivisions?country=US`)).subdivisions;
    expect(states.map((s) => s.code).sort()).toEqual(['US-CA', 'US-MA', 'US-NY']);
  });

  it('has the timeline: both births, the trips’ days on their trips, one hidden from viewers', async () => {
    const { moments } = data(await owner.agent.get(`/api/maps/${map.id}/moments?limit=60`));
    expect(moments).toHaveLength(DEMO_MOMENTS.length);
    expect(moments.filter((m) => m.kind === 'BORN').map((m) => m.title)).toEqual(['Sam was born', 'Alex was born']);
    const safari = moments.find((m) => m.kind === 'SAFARI');
    expect(safari).toMatchObject({ happenedOn: '2023-10-15', countryCode: 'TZ', tripId: expect.any(String) });
    expect(moments.filter((m) => m.hidden)).toHaveLength(1);
    // The partner, an editor, sees it all too
    expect(data(await partner.agent.get(`/api/maps/${map.id}/moments?limit=60`)).moments).toHaveLength(DEMO_MOMENTS.length);
  });
});
