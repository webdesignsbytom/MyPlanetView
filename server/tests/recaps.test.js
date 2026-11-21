// "Your year in travel": the counting (src/utils/recaps.js), pure.
import { describe, expect, it } from 'vitest';
import { buildRecap, parseRecapYear, recapHasAnything, stampsOf, tripsInYear, yearRange } from '../src/utils/recaps.js';

const NOW = new Date('2026-11-21T12:00:00Z');
const continents = new Map([
  ['FR', 'EUROPE'],
  ['JP', 'ASIA'],
  ['GB', 'EUROPE'],
  ['XE', 'EUROPE'],
  ['XC', 'EUROPE'],
  ['AQ', 'ANTARCTICA'],
  ['ID', 'ASIA'],
  ['PE', 'SOUTH_AMERICA'],
]);

describe('parseRecapYear', () => {
  it('takes a year from 1900 to next year', () => {
    expect(parseRecapYear('2026', NOW)).toBe(2026);
    expect(parseRecapYear(2027, NOW)).toBe(2027);
    expect(parseRecapYear('1900', NOW)).toBe(1900);
  });
  it('refuses anything else', () => {
    for (const value of ['2028', '1899', '26', '2026.5', 'abcd', '', undefined, null, '02026']) {
      expect(parseRecapYear(value, NOW)).toBeNull();
    }
  });
  it('makes a UTC range', () => {
    expect(yearRange(2026)).toEqual({ from: new Date('2026-01-01T00:00:00Z'), to: new Date('2027-01-01T00:00:00Z') });
  });
});

describe('tripsInYear', () => {
  const stops = (...codes) => codes.map(([countryCode, arriveOn = null]) => ({ countryCode, arriveOn: arriveOn ? new Date(arriveOn) : null }));
  const trip = (id, status, startDate, endDate, list) => ({
    id,
    title: id,
    status,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    stops: list,
  });

  it('takes trips done or under way that touch the year, and their stops in it', () => {
    const trips = [
      trip('japan', 'COMPLETED', '2026-04-01', '2026-04-14', stops(['JP', '2026-04-02'])),
      trip('new-year', 'COMPLETED', '2025-12-28', '2026-01-03', stops(['FR', '2025-12-28'], ['GB', '2026-01-02'])),
      trip('planned', 'PLANNED', '2026-08-01', '2026-08-10', stops(['PE'])),
      trip('old', 'COMPLETED', '2019-05-01', '2019-05-09', stops(['ID'])),
      trip('undated', 'COMPLETED', null, null, stops(['PE', '2026-03-01'])),
      trip('undated-old', 'COMPLETED', null, null, stops(['ID', '2018-03-01'])),
    ];
    const got = tripsInYear(trips, 2026);
    expect(got.map((t) => t.id)).toEqual(['japan', 'new-year', 'undated']);
    expect(got.find((t) => t.id === 'new-year').codes).toEqual(['GB']);
    expect(got.find((t) => t.id === 'japan').codes).toEqual(['JP']);
  });

  it('counts a stop with no date with its trip', () => {
    expect(tripsInYear([trip('t', 'ACTIVE', '2026-06-01', null, stops(['FR']))], 2026)[0].codes).toEqual(['FR']);
  });
});

describe('buildRecap', () => {
  const visits = [
    { countryCode: 'JP', status: 'VISITED', firstVisitedOn: new Date('2026-04-02') },
    { countryCode: 'FR', status: 'VISITED', firstVisitedOn: new Date('2015-07-01') },
    { countryCode: 'PE', status: 'WANT_TO_GO', firstVisitedOn: new Date('2026-02-01') },
    { countryCode: 'AQ', status: 'VISITED', firstVisitedOn: new Date('2026-01-10') },
  ];

  it('counts the places, countries, new ones and continents', () => {
    const recap = buildRecap({
      year: 2026,
      photoGroups: [
        { countryCode: 'FR', kind: 'PHOTO', count: 30 },
        { countryCode: 'JP', kind: 'PHOTO', count: 120 },
        { countryCode: 'JP', kind: 'VIDEO', count: 2 },
        { countryCode: null, kind: 'PHOTO', count: 4 },
      ],
      visits,
      trips: [{ id: 't', title: 'Japan', status: 'COMPLETED', startDate: null, endDate: null, codes: ['JP', 'ID'] }],
      moments: [{ countryCode: 'FR' }],
      continentByCode: continents,
    });
    expect(recap.places).toEqual(['AQ', 'FR', 'ID', 'JP']);
    expect(recap.countries).toBe(3);
    expect(recap.specialPlaces).toBe(1);
    // A "want to go" with a date isn't a first visit
    expect(recap.newCountries).toEqual(['JP']);
    expect(recap.continents).toBe(3);
    expect(recap.photos).toBe(154);
    expect(recap.videos).toBe(2);
    expect(recap.topCountries).toEqual([
      { countryCode: 'JP', photos: 120 },
      { countryCode: 'FR', photos: 30 },
    ]);
    expect(recap.photoCountries).toEqual(['JP', 'FR']);
    expect(recap.moments).toBe(1);
    expect(recap.trips).toEqual([{ id: 't', title: 'Japan', status: 'COMPLETED', startDate: null, endDate: null }]);
    expect(recapHasAnything(recap)).toBe(true);
  });

  it('counts the UK as the map does', () => {
    const split = buildRecap({ year: 2026, splitUk: true, photoGroups: [{ countryCode: 'XE', kind: 'PHOTO', count: 1 }, { countryCode: 'XC', kind: 'PHOTO', count: 1 }] });
    expect(split.countries).toBe(2);
    const whole = buildRecap({ year: 2026, photoGroups: [{ countryCode: 'GB', kind: 'PHOTO', count: 1 }] });
    expect(whole.countries).toBe(1);
  });

  it('is empty for a year with nothing', () => {
    const recap = buildRecap({ year: 2001, visits });
    expect(recap.places).toEqual([]);
    expect(recapHasAnything(recap)).toBe(false);
  });
});

describe('stampsOf', () => {
  it('counts each landmark once and lists them A to Z', () => {
    const rows = [
      { landmarkId: 'b', name: 'Fushimi Inari', countryCode: 'JP' },
      { landmarkId: 'a', name: 'Eiffel Tower', countryCode: 'FR' },
      { landmarkId: 'b', name: 'Fushimi Inari', countryCode: 'JP' },
    ];
    expect(stampsOf(rows)).toEqual({
      count: 2,
      landmarks: [
        { id: 'a', name: 'Eiffel Tower', countryCode: 'FR' },
        { id: 'b', name: 'Fushimi Inari', countryCode: 'JP' },
      ],
    });
  });
});
