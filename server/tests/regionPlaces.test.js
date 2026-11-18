import { describe, it, expect } from 'vitest';
import { REGION_CODES, REGION_PARENT, isRegion, regionParent } from '../src/utils/regionPlaces.js';
import { PARENT_PLACE, withParentPlaces } from '../src/utils/specialPlaces.js';
import { countedCountryCodes, placeOnMap } from '../src/utils/ukNations.js';
import { buildMapStats } from '../src/utils/mapStats.js';
import { countryAtPosition } from '../src/utils/countryLookup.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';
import * as clientCopy from '../../client/src/utils/map/regionPlaces.js';

// Regions (docs/API.md "Regions"): Bali, the Galápagos, Goa, Hawaii, New Caledonia and
// Tasmania, each part of a country, with its own visit, never counted as a country

describe('regions', () => {
  it('are the seeded REGION rows, each part of a country (never another region or a special place)', () => {
    const rows = COUNTRIES.filter((c) => c.kind === 'REGION').map((c) => c.code);
    expect([...rows].sort()).toEqual([...REGION_CODES].sort());
    for (const code of REGION_CODES) {
      const parent = COUNTRIES.find((c) => c.code === REGION_PARENT[code]);
      expect(parent, code).toBeDefined();
      expect(parent.kind, code).toBeUndefined();
    }
    expect(regionParent('XB')).toBe('ID');
    expect(regionParent('FR')).toBeNull();
    expect(isRegion('NC')).toBe(true);
    expect(isRegion('ID')).toBe(false);
  });

  it('match the client copy', () => {
    expect(clientCopy.REGION_PARENT).toEqual(REGION_PARENT);
  });

  it('bring their country with a visit', () => {
    expect(PARENT_PLACE.XT).toBe('AU');
    expect(withParentPlaces(['XB'])).toEqual(['XB', 'ID']);
    expect(withParentPlaces(['NC', 'FR'])).toEqual(['NC', 'FR']);
  });

  it("keep photos, stops and moments with the country: a region's place on a map is its country's", () => {
    expect(placeOnMap('XB', false)).toBe('ID');
    expect(placeOnMap('NC', true)).toBe('FR');
    expect(placeOnMap('XE', false)).toBe('GB');
    expect(placeOnMap('JP', false)).toBe('JP');
  });

  it('never count as countries', () => {
    expect(countedCountryCodes(['XB', 'ID', 'XH'], false)).toEqual(['ID']);
    expect(countedCountryCodes(['XT', 'XE', 'GB'], true)).toEqual(['XE']);
  });

  it('have their own stat, and open no continent', () => {
    const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
    const stats = buildMapStats({
      visits: [
        { countryCode: 'XH', status: 'VISITED' },
        { countryCode: 'US', status: 'VISITED' },
        { countryCode: 'XT', status: 'WANT_TO_GO' },
        { countryCode: 'XA', status: 'LIVED' },
      ],
      continentByCode,
    });
    // Hawaii is in Oceania, but the US gives North America only; the Galápagos alone
    // (Ecuador not marked) opens no continent either
    expect(stats).toMatchObject({ countries: 1, regions: 2, specialPlaces: 0, continents: 1 });
  });

  it("are their country's in the GPS lookups (a photo in Bali is in Indonesia)", () => {
    expect(countryAtPosition(-8.5, 115.26)).toBe('ID'); // Ubud
    expect(countryAtPosition(-42.88, 147.33)).toBe('AU'); // Hobart
    expect(countryAtPosition(21.3, -157.85)).toBe('US'); // Honolulu
    expect(countryAtPosition(-22.27, 166.45)).toBe('FR'); // Nouméa
    expect(countryAtPosition(-0.74, -90.31)).toBe('EC'); // Puerto Ayora
  });
});
