import { describe, it, expect } from 'vitest';
import { buildMapStats } from '../src/utils/mapStats.js';

const continentByCode = new Map([
  ['FR', 'EUROPE'],
  ['IT', 'EUROPE'],
  ['JP', 'ASIA'],
  ['PE', 'SOUTH_AMERICA'],
]);

describe('buildMapStats', () => {
  it('counts visited and lived-in countries, not wish-list ones', () => {
    const stats = buildMapStats({
      visits: [
        { countryCode: 'FR', status: 'VISITED' },
        { countryCode: 'IT', status: 'LIVED' },
        { countryCode: 'JP', status: 'WANT_TO_GO' },
      ],
      continentByCode,
    });
    expect(stats.countries).toBe(2);
    expect(stats.continents).toBe(1);
  });

  it('counts continents across visited countries', () => {
    const stats = buildMapStats({
      visits: [
        { countryCode: 'FR', status: 'VISITED' },
        { countryCode: 'JP', status: 'VISITED' },
        { countryCode: 'PE', status: 'VISITED' },
      ],
      continentByCode,
    });
    expect(stats.continents).toBe(3);
  });

  it('gives each traveller the countries of the completed trips they went on', () => {
    const stats = buildMapStats({
      travellers: [
        { id: 't1', name: 'Sarah' },
        { id: 't2', name: 'Tom' },
      ],
      completedTrips: [
        { travellerIds: ['t1', 't2'], countryCodes: ['FR', 'IT'] },
        { travellerIds: ['t1'], countryCodes: ['JP', 'FR'] },
      ],
    });
    expect(stats.byTraveller).toEqual([
      { travellerId: 't1', name: 'Sarah', countries: 3 },
      { travellerId: 't2', name: 'Tom', countries: 2 },
    ]);
  });

  it('counts special places apart from countries, and Antarctica as a continent', () => {
    const stats = buildMapStats({
      visits: [
        { countryCode: 'FR', status: 'VISITED' },
        { countryCode: 'AQ', status: 'VISITED' },
        { countryCode: 'XS', status: 'LIVED' },
        { countryCode: 'XN', status: 'WANT_TO_GO' },
        { countryCode: 'QN', status: 'VISITED' },
      ],
      continentByCode: new Map([['FR', 'EUROPE'], ['AQ', 'ANTARCTICA'], ['XS', 'ANTARCTICA'], ['XN', null], ['QN', null]]),
      travellers: [{ id: 't1', name: 'Sam' }],
      completedTrips: [{ travellerIds: ['t1'], countryCodes: ['FR', 'AQ', 'XS'] }],
    });
    expect(stats).toMatchObject({ countries: 1, specialPlaces: 3, continents: 2 });
    // A traveller's countries are countries only
    expect(stats.byTraveller).toEqual([{ travellerId: 't1', name: 'Sam', countries: 1 }]);
  });

  it('passes the counts through and starts at zero', () => {
    expect(buildMapStats({ photoCount: 12, landmarkCount: 3, tripCount: 2 })).toEqual({
      countries: 0,
      specialPlaces: 0,
      regions: 0,
      continents: 0,
      photos: 12,
      landmarks: 3,
      trips: 2,
      byTraveller: [],
      // The travel extras (tests/travelStats.test.js): nothing to count yet
      countriesInWorld: null,
      homeCountryCode: null,
      daysAway: 0,
      distanceKm: 0,
      furthest: null,
    });
  });

  it('says how many countries the world has, with the UK whole or as its nations', () => {
    const worldTotals = { whole: 226, splitUk: 229 };
    expect(buildMapStats({ worldTotals }).countriesInWorld).toBe(226);
    expect(buildMapStats({ worldTotals, splitUk: true }).countriesInWorld).toBe(229);
  });
});

describe('buildMapStats on a map that splits the UK', () => {
  const ukContinents = new Map([['GB', 'EUROPE'], ['XE', 'EUROPE'], ['XC', 'EUROPE'], ['XW', 'EUROPE'], ['FR', 'EUROPE']]);
  const visit = (countryCode, status = 'VISITED') => ({ countryCode, status });

  it('counts each nation as a country, and the UK only while none of its nations is marked', () => {
    const visits = [visit('XE'), visit('XC', 'LIVED'), visit('FR'), visit('GB')];
    expect(buildMapStats({ visits, continentByCode: ukContinents, splitUk: true }).countries).toBe(3);
    expect(buildMapStats({ visits: [visit('GB'), visit('FR')], continentByCode: ukContinents, splitUk: true }).countries).toBe(2);
  });

  it('counts a traveller’s nations from their completed trips', () => {
    const stats = buildMapStats({
      splitUk: true,
      travellers: [{ id: 't1', name: 'Sam' }],
      completedTrips: [{ travellerIds: ['t1'], countryCodes: ['XE', 'XW', 'XE'] }],
    });
    expect(stats.byTraveller).toEqual([{ travellerId: 't1', name: 'Sam', countries: 2 }]);
  });
});
