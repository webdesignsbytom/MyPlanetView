// Strings between places (src/utils/mapStrings.js; docs/API.md "Strings")
import { describe, expect, it } from 'vitest';
import { MAP_STRINGS_MAX, autoStringPairs, parseStringInput, stringPair, stringPlace, stringView } from '../src/utils/mapStrings.js';

describe('stringPair', () => {
  it('keeps two places in code order, so one pair is one string', () => {
    expect(stringPair('JP', 'FR')).toEqual(['FR', 'JP']);
    expect(stringPair('FR', 'JP')).toEqual(['FR', 'JP']);
  });

  it('is nothing for a place and itself, or a missing end', () => {
    expect(stringPair('FR', 'FR')).toBeNull();
    expect(stringPair('FR', null)).toBeNull();
    expect(stringPair(undefined, 'FR')).toBeNull();
  });
});

describe('stringPlace', () => {
  it('ties a UK nation to the UK on a map that doesn’t split it', () => {
    expect(stringPlace('XC', false)).toBe('GB');
    expect(stringPlace('XC', true)).toBe('XC');
  });

  it('keeps everything else, the UK on a split map, a region and a pole too', () => {
    expect(stringPlace('GB', true)).toBe('GB');
    expect(stringPlace('XH', false)).toBe('XH');
    expect(stringPlace('XN', false)).toBe('XN');
  });
});

describe('parseStringInput', () => {
  it('takes two codes in any case and puts them in order', () => {
    expect(parseStringInput({ from: ' jp', to: 'fr ' })).toEqual({ ok: true, pair: ['FR', 'JP'] });
  });

  it('places a UK nation as the map does', () => {
    expect(parseStringInput({ from: 'XE', to: 'FR' }, { splitUk: false })).toEqual({ ok: true, pair: ['FR', 'GB'] });
    expect(parseStringInput({ from: 'XE', to: 'FR' }, { splitUk: true })).toEqual({ ok: true, pair: ['FR', 'XE'] });
  });

  it('refuses anything that isn’t two place codes', () => {
    for (const body of [null, {}, { from: 'FR' }, { from: 'FRA', to: 'JP' }, { from: 'F1', to: 'JP' }, { from: 4, to: 'JP' }]) {
      expect(parseStringInput(body)).toEqual({ ok: false, message: 'stringInvalid' });
    }
  });

  it('refuses a place and itself, after placing it', () => {
    expect(parseStringInput({ from: 'FR', to: 'fr' })).toEqual({ ok: false, message: 'stringSamePlace' });
    // England and Scotland are both the UK on a map that doesn't split it
    expect(parseStringInput({ from: 'XE', to: 'XC' }, { splitUk: false })).toEqual({ ok: false, message: 'stringSamePlace' });
  });
});

describe('autoStringPairs', () => {
  const trip = (status, startDate, countryCodes) => ({ status, startDate, countryCodes });
  const visit = (countryCode, firstVisitedOn = null, status = 'VISITED', createdAt = '2026-01-01') => ({ countryCode, status, firstVisitedOn, createdAt });

  it('follows each travelled trip’s stops in order, soonest trip first', () => {
    const pairs = autoStringPairs({
      trips: [trip('COMPLETED', '2024-05-01', ['ES', 'PT']), trip('COMPLETED', '2019-06-01', ['FR', 'IT', 'IT', 'GR'])],
    });
    expect(pairs).toEqual([
      ['FR', 'IT'],
      ['GR', 'IT'],
      ['ES', 'PT'],
    ]);
  });

  it('leaves out planned trips, and takes trips under way', () => {
    const pairs = autoStringPairs({ trips: [trip('PLANNED', '2027-01-01', ['JP', 'KR']), trip('ACTIVE', '2026-11-01', ['TH', 'VN'])] });
    expect(pairs).toEqual([['TH', 'VN']]);
  });

  it('joins the places no trip reached in the order first visited, undated ones last', () => {
    const pairs = autoStringPairs({
      trips: [trip('COMPLETED', '2019-06-01', ['FR', 'IT'])],
      visits: [visit('FR', '2019-06-01'), visit('BR'), visit('JP', '2010-03-01'), visit('AU', '2015-01-01'), visit('PE', null, 'WANT_TO_GO')],
    });
    expect(pairs).toEqual([
      ['FR', 'IT'],
      ['AU', 'JP'],
      ['AU', 'BR'],
    ]);
  });

  it('never ties the same pair twice', () => {
    const pairs = autoStringPairs({ trips: [trip('COMPLETED', '2019-01-01', ['FR', 'IT']), trip('COMPLETED', '2020-01-01', ['IT', 'FR'])] });
    expect(pairs).toEqual([['FR', 'IT']]);
  });

  it('places the UK’s nations as the map does', () => {
    const trips = [trip('COMPLETED', '2020-01-01', ['XE', 'XC', 'IE'])];
    expect(autoStringPairs({ trips, splitUk: true })).toEqual([
      ['XC', 'XE'],
      ['IE', 'XC'],
    ]);
    // On a map that doesn't split it, England and Scotland are both the UK
    expect(autoStringPairs({ trips, splitUk: false })).toEqual([['GB', 'IE']]);
  });

  it('is nothing for a map with nothing to join', () => {
    expect(autoStringPairs({})).toEqual([]);
    expect(autoStringPairs({ visits: [visit('FR')] })).toEqual([]);
  });
});

describe('the rest', () => {
  it('holds 500 strings a map', () => {
    expect(MAP_STRINGS_MAX).toBe(500);
  });

  it('shows a string as its id and two places', () => {
    expect(stringView({ id: 's1', fromCode: 'FR', toCode: 'JP', mapId: 'm', createdAt: new Date() })).toEqual({ id: 's1', from: 'FR', to: 'JP' });
  });
});
