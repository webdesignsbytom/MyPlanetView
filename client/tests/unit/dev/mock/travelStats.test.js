// @vitest-environment node
// The mock's richer travel stats (src/dev/mock/travelStats.js), a copy of the server's
// utils/travelStats.js: each function is checked on its own, then against the server's on
// the same trips and places.
import { describe, expect, it } from 'vitest';
import {
  PLACE_POSITIONS,
  countriesInWorld,
  daysAway,
  distanceKm,
  furthestFromHome,
  homeOf,
  travelExtras,
  tripDays,
  tripDistanceKm,
} from '@/dev/mock/travelStats';
import { COUNTRIES } from '@/utils/map/countries';
import * as server from '../../../../../server/src/utils/travelStats.js';

const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const day = (iso) => Math.floor(Date.parse(iso) / 86400000);

describe('PLACE_POSITIONS and countriesInWorld', () => {
  it('has a real position for every place with a pin', () => {
    const withPins = COUNTRIES.filter((c) => Number.isFinite(c.pinX) && Number.isFinite(c.pinY));
    expect(PLACE_POSITIONS.size).toBe(withPins.length);
    const fr = PLACE_POSITIONS.get('FR');
    expect(fr.latitude).toBeGreaterThan(42);
    expect(fr.latitude).toBeLessThan(51.5);
    expect(fr.longitude).toBeGreaterThan(-5);
    expect(fr.longitude).toBeLessThan(8.5);
  });

  it('counts the world’s countries, the UK as four nations on a split map', () => {
    const countries = COUNTRIES.filter((c) => !c.kind || c.kind === 'COUNTRY').length;
    expect(countriesInWorld(false)).toBe(countries);
    expect(countriesInWorld(true)).toBe(countries + 3);
  });
});

describe('distanceKm', () => {
  it('measures London to Paris at about 344 km, and nothing between a place and itself', () => {
    expect(distanceKm(LONDON, PARIS)).toBeGreaterThan(340);
    expect(distanceKm(LONDON, PARIS)).toBeLessThan(346);
    expect(distanceKm(LONDON, LONDON)).toBe(0);
  });

  it('is half the world from pole to pole', () => {
    expect(distanceKm({ latitude: 90, longitude: 0 }, { latitude: -90, longitude: 0 })).toBeCloseTo(Math.PI * 6371.0088, 3);
  });
});

describe('tripDays', () => {
  it('uses the trip’s own dates', () => {
    expect(tripDays({ startDate: '2025-07-02', endDate: '2025-07-16' })).toEqual([day('2025-07-02'), day('2025-07-16')]);
  });

  it('falls back to its stops’ first and last days', () => {
    const trip = { stops: [{ arriveOn: '2024-02-01', leaveOn: '2024-02-19' }, { arriveOn: '2024-01-08', leaveOn: null }] };
    expect(tripDays(trip)).toEqual([day('2024-01-08'), day('2024-02-19')]);
  });

  it('is null when nothing is dated, and one day with only an end date', () => {
    expect(tripDays({ stops: [] })).toBeNull();
    expect(tripDays({ endDate: '2020-01-05' })).toEqual([day('2020-01-05'), day('2020-01-05')]);
  });

  it('never ends before it starts', () => {
    expect(tripDays({ startDate: '2020-01-10', endDate: '2020-01-01' })).toEqual([day('2020-01-10'), day('2020-01-10')]);
  });

  it('takes a Date as well as a string', () => {
    expect(tripDays({ startDate: new Date('2021-03-04T15:00:00Z') })).toEqual([day('2021-03-04'), day('2021-03-04')]);
  });
});

describe('daysAway', () => {
  it('counts each day once, both ends included, when trips overlap', () => {
    const trips = [
      { startDate: '2025-01-01', endDate: '2025-01-10' },
      { startDate: '2025-01-05', endDate: '2025-01-12' },
      { startDate: '2025-01-03', endDate: '2025-01-04' },
      { startDate: '2025-02-01', endDate: '2025-02-01' },
    ];
    expect(daysAway(trips)).toBe(12 + 1);
  });

  it('is 0 with no dated trips', () => {
    expect(daysAway([])).toBe(0);
    expect(daysAway([{ stops: [] }])).toBe(0);
  });
});

describe('tripDistanceKm', () => {
  const positions = new Map([
    ['GB', LONDON],
    ['FR', PARIS],
  ]);

  it('goes from home through the stops in order and back', () => {
    const trip = { stops: [{ position: 0, countryCode: 'FR' }] };
    expect(tripDistanceKm(trip, positions, LONDON)).toBeCloseTo(2 * distanceKm(LONDON, PARIS), 6);
    expect(tripDistanceKm(trip, positions)).toBe(0);
  });

  it('puts a stop at its landmark rather than its country’s pin', () => {
    const rome = { latitude: 41.89, longitude: 12.49 };
    const trip = { stops: [{ position: 1, countryCode: 'FR' }, { position: 0, countryCode: 'IT', landmark: rome }] };
    expect(tripDistanceKm(trip, positions)).toBeCloseTo(distanceKm(rome, PARIS), 6);
  });

  it('skips stops with no known place, and is 0 without any', () => {
    expect(tripDistanceKm({ stops: [{ position: 0, countryCode: 'ZZ' }] }, positions, LONDON)).toBe(0);
    expect(tripDistanceKm({}, positions, LONDON)).toBe(0);
  });
});

describe('homeOf', () => {
  const travellers = [
    { userId: null, birthCountryCode: 'IE' },
    { userId: 'owner', birthCountryCode: 'GB' },
  ];

  it('is the map’s own home first', () => {
    expect(homeOf({ homeCountryCode: 'ES', ownerId: 'owner', travellers })).toBe('ES');
  });

  it('else the owner’s own traveller’s birth country, else the first traveller’s with one', () => {
    expect(homeOf({ ownerId: 'owner', travellers })).toBe('GB');
    expect(homeOf({ ownerId: 'someone', travellers })).toBe('IE');
    expect(homeOf({ travellers: [{ birthCountryCode: null }] })).toBeNull();
    expect(homeOf({})).toBeNull();
  });
});

describe('furthestFromHome', () => {
  it('finds the visited place furthest from home, rounded to whole km', () => {
    const result = furthestFromHome(['FR', 'AU', 'US'], PLACE_POSITIONS, 'GB');
    expect(result.countryCode).toBe('AU');
    expect(Number.isInteger(result.km)).toBe(true);
    expect(result.km).toBeGreaterThan(14000);
  });

  it('leaves out home and its parts (the UK’s nations, a country’s regions)', () => {
    expect(furthestFromHome(['GB', 'XE', 'XC'], PLACE_POSITIONS, 'GB')).toBeNull();
    expect(furthestFromHome(['XH'], PLACE_POSITIONS, 'US')).toBeNull();
  });

  it('is null without a home it knows', () => {
    expect(furthestFromHome(['FR'], PLACE_POSITIONS, null)).toBeNull();
    expect(furthestFromHome(['FR'], PLACE_POSITIONS, 'ZZ')).toBeNull();
  });
});

describe('travelExtras', () => {
  it('rounds the distance and carries the home', () => {
    const extras = travelExtras({
      completedTrips: [{ startDate: '2025-07-02', endDate: '2025-07-16', stops: [{ position: 0, countryCode: 'IT' }] }],
      visitedCodes: ['IT', 'GB'],
      positions: PLACE_POSITIONS,
      homeCountryCode: 'GB',
    });
    expect(extras.homeCountryCode).toBe('GB');
    expect(extras.daysAway).toBe(15);
    expect(Number.isInteger(extras.distanceKm)).toBe(true);
    expect(extras.distanceKm).toBeGreaterThan(2500);
    expect(extras.furthest.countryCode).toBe('IT');
  });

  it('is all zeros and nulls with nothing given', () => {
    expect(travelExtras({})).toEqual({ homeCountryCode: null, daysAway: 0, distanceKm: 0, furthest: null });
  });
});

describe('the same answers as the server', () => {
  const trips = [
    { startDate: '2025-07-02', endDate: '2025-07-16', stops: [{ position: 0, countryCode: 'IT' }, { position: 1, countryCode: 'FR', landmark: PARIS }] },
    { startDate: null, endDate: null, stops: [{ position: 0, countryCode: 'TH', arriveOn: '2024-01-08', leaveOn: '2024-02-01' }, { position: 1, countryCode: 'VN', arriveOn: '2024-02-01', leaveOn: '2024-02-19' }] },
    { startDate: '2025-07-10', endDate: '2025-07-20', stops: [{ position: 0, countryCode: 'XE' }] },
    { stops: [] },
  ];

  it('for each trip’s days and distance', () => {
    for (const trip of trips) {
      expect(tripDays(trip)).toEqual(server.tripDays(trip));
      expect(tripDistanceKm(trip, PLACE_POSITIONS, LONDON)).toBe(server.tripDistanceKm(trip, PLACE_POSITIONS, LONDON));
    }
    expect(daysAway(trips)).toBe(server.daysAway(trips));
  });

  it('for the home, the furthest place and the extras', () => {
    const travellers = [{ userId: 'u', birthCountryCode: 'AU' }];
    expect(homeOf({ ownerId: 'u', travellers })).toBe(server.homeOf({ ownerId: 'u', travellers }));
    for (const home of ['GB', 'AU', 'US', 'JP']) {
      const codes = ['GB', 'XE', 'FR', 'AU', 'US', 'XH', 'JP', 'NZ', 'AQ', 'XS'];
      expect(furthestFromHome(codes, PLACE_POSITIONS, home)).toEqual(server.furthestFromHome(codes, PLACE_POSITIONS, home));
      const input = { completedTrips: trips, visitedCodes: codes, positions: PLACE_POSITIONS, homeCountryCode: home };
      expect(travelExtras(input)).toEqual(server.travelExtras(input));
    }
  });

  it('for distances', () => {
    expect(distanceKm(LONDON, PARIS)).toBe(server.distanceKm(LONDON, PARIS));
  });
});
