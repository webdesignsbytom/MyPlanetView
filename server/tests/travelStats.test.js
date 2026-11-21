// The richer travel stats (src/utils/travelStats.js), pure; and the inverse projection they
// read the places' pins with.
import { describe, expect, it } from 'vitest';
import { daysAway, distanceKm, furthestFromHome, homeOf, travelExtras, tripDays, tripDistanceKm } from '../src/utils/travelStats.js';
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
      completedTrips: [{ startDate: '2025-06-01', endDate: '2025-06-07', stops: [{ position: 0, countryCode: 'FR' }] }],
      visitedCodes: ['FR', 'GB'],
      positions,
      homeCountryCode: 'GB',
    });
    expect(extras).toEqual({
      homeCountryCode: 'GB',
      daysAway: 7,
      distanceKm: Math.round(2 * distanceKm(LONDON, PARIS)),
      furthest: { countryCode: 'FR', km: Math.round(distanceKm(LONDON, PARIS)) },
    });
  });
});
