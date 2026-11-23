// Checks the seeded reference data without a database.
import { describe, it, expect } from 'vitest';
import { LANDMARKS } from '../prisma/seed/data/landmarks.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';
import { countryAtPosition, distanceToCountry } from '../src/utils/countryLookup.js';
import { projectToMap } from '../src/utils/projection.js';
import { MAX_MATCH_RADIUS_M } from '../src/utils/landmarkMatch.js';
import { slugify } from '../src/utils/slug.js';
import { SPECIAL_PLACE_CODES } from '../src/utils/specialPlaces.js';
import { UK_NATION_CODES } from '../src/utils/ukNations.js';
import { REGION_CODES } from '../src/utils/regionPlaces.js';

const countryCodes = new Set(COUNTRIES.map((c) => c.code));
const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

describe('countries seed', () => {
  it('has unique codes, names and slugs, each with a pin on the map', () => {
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length);
    expect(new Set(COUNTRIES.map((c) => c.slug)).size).toBe(COUNTRIES.length);
    for (const c of COUNTRIES) {
      expect(c.pinX).toBeGreaterThan(0);
      expect(c.pinX).toBeLessThan(2000);
      // Countries sit within the shapes (y 0 to 857); special places reach the pole lines
      expect(c.pinY, c.code).toBeGreaterThanOrEqual(c.kind === 'SPECIAL' ? -16.6 : 0);
      expect(c.pinY, c.code).toBeLessThanOrEqual(c.kind === 'SPECIAL' ? 1020.6 : 857);
    }
  });

  it('has 226 countries, the five special places, the UK’s four nations and six regions, matching utils/specialPlaces.js, utils/ukNations.js and utils/regionPlaces.js', () => {
    const special = COUNTRIES.filter((c) => c.kind === 'SPECIAL');
    const nations = COUNTRIES.filter((c) => c.kind === 'NATION');
    const regions = COUNTRIES.filter((c) => c.kind === 'REGION');
    expect(COUNTRIES.length - special.length - nations.length - regions.length).toBe(226);
    expect(regions.map((c) => c.code).sort()).toEqual([...REGION_CODES].sort());
    expect(nations.map((c) => c.code).sort()).toEqual([...UK_NATION_CODES].sort());
    expect(nations.every((c) => c.continent === 'EUROPE')).toBe(true);
    expect(special.map((c) => c.code).sort()).toEqual([...SPECIAL_PLACE_CODES].sort());
    // Antarctica and the South Pole give the seventh continent; the others have none
    expect(Object.fromEntries(special.map((c) => [c.code, c.continent]))).toEqual({
      AQ: 'ANTARCTICA',
      XN: null,
      QN: null,
      XS: 'ANTARCTICA',
      QS: null,
    });
    // Each pole's pin is its real position on the map
    expect([COUNTRY_BY_CODE.XN.pinX, COUNTRY_BY_CODE.XN.pinY]).toEqual(Object.values(projectToMap(90, 0)));
    expect([COUNTRY_BY_CODE.XS.pinX, COUNTRY_BY_CODE.XS.pinY]).toEqual(Object.values(projectToMap(-90, 0)));
    expect([COUNTRY_BY_CODE.QN.pinX, COUNTRY_BY_CODE.QN.pinY]).toEqual(Object.values(projectToMap(85.762, 139.298)));
    expect([COUNTRY_BY_CODE.QS.pinX, COUNTRY_BY_CODE.QS.pinY]).toEqual(Object.values(projectToMap(-63.851, 135.078)));
  });
});

describe('landmarks seed', () => {
  it('keeps the old map’s 177 monuments, the 24 added on 23 Nov 2026 for the places with none and the 10 famous places added for their 3D models, one name each', () => {
    expect(LANDMARKS).toHaveLength(211);
    expect(new Set(LANDMARKS.map((l) => slugify(l.name))).size).toBe(LANDMARKS.length);
  });

  it('gives each landmark its own Wikidata item (the reference loader upserts by it)', () => {
    for (const l of LANDMARKS) expect(l.wikidataId, l.name).toMatch(/^Q\d+$/);
    expect(new Set(LANDMARKS.map((l) => l.wikidataId)).size).toBe(LANDMARKS.length);
  });

  it('puts every landmark in a seeded country, at a real position, with a sensible radius', () => {
    for (const l of LANDMARKS) {
      expect(countryCodes.has(l.countryCode), l.name).toBe(true);
      expect(projectToMap(l.latitude, l.longitude), l.name).not.toBeNull();
      expect(l.matchRadiusM, l.name).toBeGreaterThanOrEqual(300);
      expect(l.matchRadiusM, l.name).toBeLessThanOrEqual(MAX_MATCH_RADIUS_M);
    }
  });

  it('lands in, or right beside, its own country on the map (catches swapped or mistyped coordinates)', () => {
    // The map is coarse (a unit is ~20 km at the equator): a landmark on a
    // border (Victoria Falls, Kaesong) may land just inside the neighbour.
    // Anything further than this from its own country has wrong coordinates.
    const BORDER_UNITS = 4;
    const wrong = LANDMARKS.filter((l) => {
      const found = countryAtPosition(l.latitude, l.longitude);
      if (!found || found === l.countryCode) return false;
      const distance = distanceToCountry(l.countryCode, l.latitude, l.longitude);
      return distance === null || distance > BORDER_UNITS;
    }).map((l) => `${l.name} (${l.countryCode}) lands in ${countryAtPosition(l.latitude, l.longitude)}`);
    expect(wrong).toEqual([]);
  });

  it('finds the micro-states the map has no shape for', () => {
    expect(countryAtPosition(41.9022, 12.4539)).toBe('VA'); // St. Peter's
    expect(countryAtPosition(43.7313, 7.4199)).toBe('MC'); // Prince's Palace
    expect(countryAtPosition(43.9366, 12.4475)).toBe('SM'); // Guaita Tower
    expect(countryAtPosition(47.1394, 9.5244)).toBe('LI'); // Vaduz Castle
    expect(countryAtPosition(1.2834, 103.8607)).toBe('SG'); // Marina Bay Sands
    expect(countryAtPosition(41.8902, 12.4922)).toBe('IT'); // the Colosseum stays in Italy
  });
});
