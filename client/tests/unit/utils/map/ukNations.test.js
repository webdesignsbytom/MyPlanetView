// @vitest-environment node
// The UK's four nations (src/utils/map/ukNations.js): a copy of the server's rules
// (server/tests/ukNations.test.js has the same cases), plus the client's own colours and
// what stays per country (offers, guides).
import { describe, expect, it } from 'vitest';
import {
  UK,
  UK_NATION_CODES,
  UK_NATION_COLOUR,
  countedCountryCodes,
  countryOf,
  isUkNation,
  landmarkPlace,
  placeOnMap,
} from '@/utils/map/ukNations';
import { COUNTRY_COLOUR } from '@/utils/map/countryStyle';
import { UK_NATION_PLACES } from '@/utils/map/countries';

describe('the UK’s nations', () => {
  it('knows the four codes', () => {
    expect(UK).toBe('GB');
    expect(UK_NATION_CODES).toEqual(['XE', 'XC', 'XW', 'XI']);
    expect(UK_NATION_CODES.every(isUkNation)).toBe(true);
    expect(isUkNation('GB')).toBe(false);
    expect(isUkNation('IE')).toBe(false);
    expect(isUkNation(undefined)).toBe(false);
  });

  it('are the country list’s NATION rows', () => {
    expect(UK_NATION_PLACES.map((place) => place.code).sort()).toEqual([...UK_NATION_CODES].sort());
  });
});

describe('placeOnMap', () => {
  it('keeps a nation as the UK on a map that doesn’t split it, and everything else as it is', () => {
    expect(placeOnMap('XC', false)).toBe('GB');
    expect(placeOnMap('XC', true)).toBe('XC');
    expect(placeOnMap('GB', true)).toBe('GB');
    expect(placeOnMap('GB', false)).toBe('GB');
    expect(placeOnMap('FR', false)).toBe('FR');
  });

  it('keeps a region’s photos, stops and moments with its country, on any map', () => {
    expect(placeOnMap('XB', false)).toBe('ID');
    expect(placeOnMap('NC', true)).toBe('FR');
    // South Georgia is the UK's, on a split map too (no nation is chosen for it)
    expect(placeOnMap('GS', true)).toBe('GB');
    expect(placeOnMap('GS', false)).toBe('GB');
  });

  it('leaves special places alone', () => {
    expect(placeOnMap('AQ', false)).toBe('AQ');
    expect(placeOnMap('XS', true)).toBe('XS');
  });
});

describe('countedCountryCodes', () => {
  it('counts the nations one each on a split map, and the UK only while no nation is visited', () => {
    expect(countedCountryCodes(['XE', 'XC', 'FR'], true)).toEqual(['XE', 'XC', 'FR']);
    expect(countedCountryCodes(['GB', 'XE', 'FR'], true)).toEqual(['XE', 'FR']);
    expect(countedCountryCodes(['GB', 'FR'], true)).toEqual(['GB', 'FR']);
  });

  it('counts each code once, and never a nation on a map that doesn’t split the UK', () => {
    expect(countedCountryCodes(['GB', 'FR', 'GB'], false)).toEqual(['GB', 'FR']);
    expect(countedCountryCodes(['GB', 'XE'], false)).toEqual(['GB']);
  });

  it('never counts a region as a country', () => {
    expect(countedCountryCodes(['XB', 'ID', 'XH'], false)).toEqual(['ID']);
    expect(countedCountryCodes(['XT', 'XE', 'GB'], true)).toEqual(['XE']);
    expect(countedCountryCodes(['GS'], true)).toEqual([]);
  });

  it('counts nothing for no visits', () => {
    expect(countedCountryCodes([], true)).toEqual([]);
  });
});

describe('landmarkPlace', () => {
  const bigBen = { countryCode: 'GB', nation: 'XE' };

  it('puts a UK landmark in its nation on a split map', () => {
    expect(landmarkPlace(bigBen, true)).toBe('XE');
  });

  it('keeps it in the UK on a map that doesn’t split it, or when it has no nation', () => {
    expect(landmarkPlace(bigBen, false)).toBe('GB');
    expect(landmarkPlace({ countryCode: 'GB', nation: null }, true)).toBe('GB');
  });

  it('keeps every other landmark in its country', () => {
    expect(landmarkPlace({ countryCode: 'FR' }, true)).toBe('FR');
    // A nation on a landmark outside the UK means nothing
    expect(landmarkPlace({ countryCode: 'IE', nation: 'XI' }, true)).toBe('IE');
  });
});

describe('countryOf', () => {
  it('is the UK for a nation and the country for a region', () => {
    expect(countryOf('XE')).toBe('GB');
    expect(countryOf('XI')).toBe('GB');
    expect(countryOf('XB')).toBe('ID');
    expect(countryOf('XH')).toBe('US');
  });

  it('is the place itself for anything else', () => {
    expect(countryOf('GB')).toBe('GB');
    expect(countryOf('FR')).toBe('FR');
    expect(countryOf('AQ')).toBe('AQ');
  });
});

describe('the nations’ colours', () => {
  it('gives each nation one of the seven pastels, England the UK’s own', () => {
    expect(Object.keys(UK_NATION_COLOUR).sort()).toEqual([...UK_NATION_CODES].sort());
    for (const colour of Object.values(UK_NATION_COLOUR)) expect(colour >= 1 && colour <= 7).toBe(true);
    expect(UK_NATION_COLOUR.XE).toBe(COUNTRY_COLOUR.GB);
  });

  it('never gives two nations, or Northern Ireland and Ireland, the same one', () => {
    expect(new Set(Object.values(UK_NATION_COLOUR)).size).toBe(4);
    expect(UK_NATION_COLOUR.XI).not.toBe(COUNTRY_COLOUR.IE);
  });
});
