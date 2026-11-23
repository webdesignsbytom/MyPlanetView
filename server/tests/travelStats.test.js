// The richer travel stats (src/utils/travelStats.js), pure; and the inverse projection they
// read the places' pins with.
import { describe, expect, it } from 'vitest';
import {
  daysAway,
  daysByPlace,
  daysByYear,
  distanceKm,
  furthestFromHome,
  homeOf,
  lifeAwayShare,
  longestTrip,
  travelExtras,
  tripDays,
  tripDistanceKm,
} from '../src/utils/travelStats.js';
import { positionFromMap, projectToMap } from '../src/utils/projection.js';

const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };
const positions = new Map([
  ['GB', LONDON],
  ['XE', { latitude: 52.5, longitude: -1.5 }],
  ['FR', PARIS],
  ['AU', SYDNEY],
  ['XT', { latitude: -42, longitude: 146.5 }],
]);

describe('positionFromMap', () => {
  it('turns a pin back into the position it was projected from', () => {
    for (const [lat, lng] of [[51.5, -0.13], [-33.87, 151.21], [0, 0], [-75, 100], [89.95, 10]]) {
      const { x, y } = projectToMap(lat, lng);
      const back = positionFromMap(x, y);
      expect(back.latitude).toBeCloseTo(lat, 0);
      expect(back.longitude).toBeCloseTo(lng, 0);
    }
    expect(positionFromMap(0, -40)).toBeNull();
  });
});

describe('distanceKm', () => {
  it('is the great-circle distance', () => {
    expect(distanceKm(LONDON, PARIS)).toBeGreaterThan(340);
    expect(distanceKm(LONDON, PARIS)).toBeLessThan(345);
    expect(Math.round(distanceKm(LONDON, SYDNEY) / 100)).toBe(170);
    expect(distanceKm(LONDON, LONDON)).toBe(0);
  });
});

describe('days away', () => {
  it('counts a trip’s days, both ends included, from its dates or else its stops’', () => {
    expect(tripDays({ startDate: '2025-06-01', endDate: '2025-06-07' })).toHaveLength(2);
    const [a, b] = tripDays({ startDate: '2025-06-01', endDate: '2025-06-07' });
    expect(b - a + 1).toBe(7);
    const [c, d] = tripDays({ stops: [{ arriveOn: '2025-07-10', leaveOn: '2025-07-12' }, { arriveOn: '2025-07-12', leaveOn: null }] });
    expect(d - c + 1).toBe(3);
    expect(tripDays({ startDate: new Date('2025-08-01T00:00:00Z') })).toEqual([expect.any(Number), expect.any(Number)]);
    expect(tripDays({ stops: [{}] })).toBeNull();
  });
  it('counts a day two trips share once', () => {
    expect(
      daysAway([
        { startDate: '2025-06-01', endDate: '2025-06-07' },
        { startDate: '2025-06-05', endDate: '2025-06-10' },
        { startDate: '2025-06-02', endDate: '2025-06-03' },
        { startDate: '2025-12-24', endDate: '2025-12-24' },
        { title: 'undated' },
      ]),
    ).toBe(11);
  });
});

// Time away in more detail (23 Nov 2026, the user's wish)
describe('days away each year', () => {
  it('splits a trip over New Year between the years, newest first, a shared day once', () => {
    expect(
      daysByYear([
        { startDate: '2024-12-28', endDate: '2025-01-03' },
        { startDate: '2025-01-02', endDate: '2025-01-05' },
        { startDate: '2023-08-01', endDate: '2023-08-01' },
        { title: 'undated' },
      ]),
    ).toEqual([
      { year: 2025, days: 5 },
      { year: 2024, days: 4 },
      { year: 2023, days: 1 },
    ]);
    expect(daysByYear([])).toEqual([]);
  });
  it('counts a leap year’s whole year', () => {
    expect(daysByYear([{ startDate: '2024-01-01', endDate: '2024-12-31' }])).toEqual([{ year: 2024, days: 366 }]);
  });
});

describe('days in each place', () => {
  it('gives a trip to one place all its days, however its stops are dated', () => {
    const trip = { startDate: '2025-07-02', endDate: '2025-07-16', stops: [{ position: 0, countryCode: 'IT', arriveOn: '2025-07-02' }, { position: 1, countryCode: 'IT' }] };
    expect(daysByPlace([trip])).toEqual([{ countryCode: 'IT', days: 15 }]);
  });
  it('gives each place its stops’ days on a trip to several, the travel day in both', () => {
    const trip = {
      startDate: '2025-05-01',
      endDate: '2025-05-10',
      stops: [
        { position: 0, countryCode: 'FR', arriveOn: '2025-05-01', leaveOn: '2025-05-04' },
        // Only its arrival: until the next stop's arrival
        { position: 1, countryCode: 'ES', arriveOn: '2025-05-04' },
        // Undated: left out
        { position: 2, countryCode: 'AD' },
        // Only its arrival, the last: until the trip ends
        { position: 3, countryCode: 'PT', arriveOn: '2025-05-08' },
      ],
    };
    expect(daysByPlace([trip])).toEqual([
      { countryCode: 'ES', days: 5 },
      { countryCode: 'FR', days: 4 },
      { countryCode: 'PT', days: 3 },
    ]);
  });
  it('adds up a place over several trips, a day two trips share once, most days first', () => {
    const trips = [
      { startDate: '2024-03-01', endDate: '2024-03-03', stops: [{ position: 0, countryCode: 'FR' }] },
      { startDate: '2024-03-03', endDate: '2024-03-04', stops: [{ position: 0, countryCode: 'FR' }] },
      { startDate: '2025-01-01', endDate: '2025-01-04', stops: [{ position: 0, countryCode: 'BE' }] },
      // No stops, or no dates: nowhere to count
      { startDate: '2025-02-01', endDate: '2025-02-02', stops: [] },
      { stops: [{ position: 0, countryCode: 'DE' }] },
    ];
    expect(daysByPlace(trips)).toEqual([
      { countryCode: 'BE', days: 4 },
      { countryCode: 'FR', days: 4 },
    ]);
  });
});

describe('the share of a life spent away', () => {
  it('is the days away over the days since birth, both included, to one decimal', () => {
    // Born 1 Jan 2000, today 31 Dec 2009: 3,653 days alive
    expect(lifeAwayShare(365, '2000-01-01', new Date('2009-12-31T12:00:00Z'))).toBe(10);
    expect(lifeAwayShare(100, new Date('2000-01-01T00:00:00Z'), new Date('2009-12-31T00:00:00Z'))).toBe(2.7);
    expect(lifeAwayShare(0, '2000-01-01', new Date('2009-12-31'))).toBe(0);
  });
  it('is never more than all of it, and null without a date of birth or with one after today', () => {
    expect(lifeAwayShare(50, '2026-11-20', new Date('2026-11-23'))).toBe(100);
    expect(lifeAwayShare(10, null, new Date('2026-11-23'))).toBeNull();
    expect(lifeAwayShare(10, '2027-01-01', new Date('2026-11-23'))).toBeNull();
  });
});

describe('the longest trip', () => {
  it('is the one with the most days, the first of equals, or none', () => {
    const trips = [
      { id: 'a', title: 'Weekend', startDate: '2025-01-01', endDate: '2025-01-02' },
      { id: 'b', title: 'Big one', startDate: '2025-03-01', endDate: '2025-03-20' },
      { id: 'c', title: 'Also big', startDate: '2025-06-01', endDate: '2025-06-20' },
      { id: 'd', title: 'Undated' },
    ];
    expect(longestTrip(trips)).toEqual({ tripId: 'b', title: 'Big one', days: 20 });
    expect(longestTrip([{ id: 'd' }])).toBeNull();
  });
});

describe('distance travelled', () => {
  const trip = {
    stops: [
      { position: 1, countryCode: 'AU' },
      { position: 0, countryCode: 'FR', landmark: { latitude: 48.8584, longitude: 2.2945 } },
    ],
  };
  it('goes from home through the stops in order and home again; a landmark is where it is', () => {
    const km = tripDistanceKm(trip, positions, LONDON);
    const expected = distanceKm(LONDON, { latitude: 48.8584, longitude: 2.2945 }) + distanceKm({ latitude: 48.8584, longitude: 2.2945 }, SYDNEY) + distanceKm(SYDNEY, LONDON);
    expect(km).toBeCloseTo(expected, 6);
    // No home: stop to stop
    expect(tripDistanceKm(trip, positions, null)).toBeCloseTo(distanceKm({ latitude: 48.8584, longitude: 2.2945 }, SYDNEY), 6);
    expect(tripDistanceKm({ stops: [] }, positions, LONDON)).toBe(0);
  });
});

describe('home', () => {
  const travellers = [
    { id: 't1', userId: null, birthCountryCode: 'IE' },
    { id: 't2', userId: 'owner', birthCountryCode: 'GB' },
  ];
  it('is the map’s own, else the owner’s traveller’s birth country, else the first one known', () => {
    expect(homeOf({ homeCountryCode: 'ID', ownerId: 'owner', travellers })).toBe('ID');
    expect(homeOf({ ownerId: 'owner', travellers })).toBe('GB');
    expect(homeOf({ ownerId: 'someone', travellers })).toBe('IE');
    expect(homeOf({ travellers: [{ id: 'x', birthCountryCode: null }] })).toBeNull();
  });
});

describe('furthest from home', () => {
  it('is the visited place furthest away, never home or a part of it', () => {
    expect(furthestFromHome(['FR', 'AU', 'GB', 'XE'], positions, 'GB')).toEqual({ countryCode: 'AU', km: Math.round(distanceKm(LONDON, SYDNEY)) });
    expect(furthestFromHome(['XT', 'FR'], positions, 'AU')).toEqual({ countryCode: 'FR', km: expect.any(Number) });
    expect(furthestFromHome(['GB', 'XE'], positions, 'GB')).toBeNull();
    expect(furthestFromHome(['FR'], positions, null)).toBeNull();
  });
});

describe('travelExtras', () => {
  it('puts them together', () => {
    const extras = travelExtras({
      completedTrips: [{ id: 't1', title: 'Paris', startDate: '2025-06-01', endDate: '2025-06-07', stops: [{ position: 0, countryCode: 'FR' }] }],
      visitedCodes: ['FR', 'GB'],
      positions,
      homeCountryCode: 'GB',
    });
    expect(extras).toEqual({
      homeCountryCode: 'GB',
      daysAway: 7,
      daysByYear: [{ year: 2025, days: 7 }],
      daysByPlace: [{ countryCode: 'FR', days: 7 }],
      longestTrip: { tripId: 't1', title: 'Paris', days: 7 },
      distanceKm: Math.round(2 * distanceKm(LONDON, PARIS)),
      furthest: { countryCode: 'FR', km: Math.round(distanceKm(LONDON, PARIS)) },
    });
  });
});
