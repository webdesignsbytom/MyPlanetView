import { describe, it, expect } from 'vitest';
import { countedCountryCodes, isUkNation, placeOnMap, ukNationAt, withUk } from '../src/utils/ukNations.js';
import { countryAtPosition } from '../src/utils/countryLookup.js';

describe('the UK’s nations', () => {
  it('knows the four codes', () => {
    expect(['XE', 'XC', 'XW', 'XI'].every(isUkNation)).toBe(true);
    expect(isUkNation('GB')).toBe(false);
    expect(isUkNation('IE')).toBe(false);
  });

  it('keeps a nation as the UK on a map that doesn’t split it, and everything else as it is', () => {
    expect(placeOnMap('XC', false)).toBe('GB');
    expect(placeOnMap('XC', true)).toBe('XC');
    expect(placeOnMap('GB', true)).toBe('GB');
    expect(placeOnMap('FR', false)).toBe('FR');
  });

  it('counts the nations one each on a split map, and the UK only while no nation is visited', () => {
    expect(countedCountryCodes(['XE', 'XC', 'FR'], true)).toEqual(['XE', 'XC', 'FR']);
    expect(countedCountryCodes(['GB', 'XE', 'FR'], true)).toEqual(['XE', 'FR']);
    expect(countedCountryCodes(['GB', 'FR'], true)).toEqual(['GB', 'FR']);
    expect(countedCountryCodes(['GB', 'FR', 'GB'], false)).toEqual(['GB', 'FR']);
    // A map that doesn't split the UK never has nations; if one slipped in, it isn't counted
    expect(countedCountryCodes(['GB', 'XE'], false)).toEqual(['GB']);
  });

  it('meets a goal listing the UK with any nation', () => {
    expect(withUk(['XW', 'FR'])).toEqual(['XW', 'FR', 'GB']);
    expect(withUk(['XW', 'GB'])).toEqual(['XW', 'GB']);
    expect(withUk(['FR'])).toEqual(['FR']);
  });

  // [place, latitude, longitude, nation]
  const PLACES = [
    ['London', 51.5074, -0.1278, 'XE'],
    ['Edinburgh', 55.9533, -3.1883, 'XC'],
    ['Cardiff', 51.4816, -3.1791, 'XW'],
    ['Belfast', 54.5973, -5.9301, 'XI'],
    ['Stornoway, Lewis (undrawn)', 58.2093, -6.3889, 'XC'],
    ['Kirkwall, Orkney (undrawn)', 58.9809, -2.9605, 'XC'],
    ['Lerwick, Shetland', 60.1546, -1.1451, 'XC'],
    ['Holyhead, Anglesey', 53.3094, -4.6326, 'XW'],
    ['Newport, Isle of Wight', 50.6996, -1.2924, 'XE'],
    ['Hugh Town, Isles of Scilly', 49.9136, -6.3153, 'XE'],
    ['Berwick-upon-Tweed (England, north of the Tweed)', 55.7704, -2.0061, 'XE'],
    ['Gretna (Scotland, at the border)', 55.0015, -3.0645, 'XC'],
    ['Chester (England, by Wales)', 53.1934, -2.8931, 'XE'],
    ['Monmouth (Wales, by England)', 51.8116, -2.7163, 'XW'],
    ['Hay-on-Wye (Wales, on the border)', 52.0739, -3.1265, 'XW'],
    ['Derry (by the Irish border)', 54.9966, -7.3086, 'XI'],
    ['Giant’s Causeway', 55.2408, -6.5116, 'XI'],
    ['the end of Brighton’s pier (at sea)', 50.8155, -0.1367, 'XE'],
  ];

  it.each(PLACES)('puts %s in its nation', (_place, latitude, longitude, nation) => {
    expect(ukNationAt(latitude, longitude)).toBe(nation);
  });

  it('only looks positions the country lookup finds in the UK up (they all are)', () => {
    for (const [place, latitude, longitude] of PLACES) {
      expect([place, countryAtPosition(latitude, longitude)]).toEqual([place, 'GB']);
    }
  });

  it('gives no nation for an invalid position', () => {
    expect(ukNationAt(Number.NaN, 0)).toBe(null);
  });
});
