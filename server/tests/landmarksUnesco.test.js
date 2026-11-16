// Checks the World Heritage landmarks (prisma/seed/data/landmarksUnesco.js, loaded with
// the passport) without a database, as landmarkData.test.js does for the 177.
import { describe, it, expect } from 'vitest';
import { LANDMARKS } from '../prisma/seed/data/landmarks.js';
import { UNESCO_LANDMARKS, UNESCO_IN_EXISTING } from '../prisma/seed/data/landmarksUnesco.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';
import { countryAtPosition, distanceToCountry } from '../src/utils/countryLookup.js';
import { projectToMap } from '../src/utils/projection.js';
import { MAX_MATCH_RADIUS_M } from '../src/utils/landmarkMatch.js';
import { slugify } from '../src/utils/slug.js';

const countryCodes = new Set(COUNTRIES.map((c) => c.code));
const ALL = [...LANDMARKS, ...UNESCO_LANDMARKS];
const KEYS = ['category', 'countryCode', 'isUnesco', 'latitude', 'longitude', 'matchRadiusM', 'name', 'wikidataId'];
const CATEGORIES = ['building', 'monument', 'site', 'old town', 'natural', 'mountain', 'island', 'archipelago', 'park', 'range'];

// Greek islands off Turkey, where the map found Turkey until their shapes were added
// (Natural Earth, 16 Nov 2026; Patmos is a circle in the lookup)
const AEGEAN_ISLANDS = {
  Q876685: 'GR', // Medieval City of Rhodes
  Q16363506: 'GR', // Pythagoreion and Heraion of Samos
  Q17132271: 'GR', // Patmos
};

describe('World Heritage landmarks', () => {
  it('stand for every inscription on the 2026 list, each once', () => {
    // 1,273 inscriptions after the 2026 session
    expect(UNESCO_LANDMARKS.length + UNESCO_IN_EXISTING.length).toBe(1273);
    for (const l of UNESCO_LANDMARKS) {
      expect(Object.keys(l).sort(), l.name).toEqual(KEYS);
      expect(l.isUnesco, l.name).toBe(true);
      expect(CATEGORIES, l.name).toContain(l.category);
    }
  });

  it('give each landmark its own Wikidata item, across both files', () => {
    for (const l of UNESCO_LANDMARKS) expect(l.wikidataId, l.name).toMatch(/^Q\d+$/);
    expect(new Set(ALL.map((l) => l.wikidataId)).size).toBe(ALL.length);
  });

  it('give each landmark its own name and slug, across both files', () => {
    for (const l of UNESCO_LANDMARKS) {
      expect(l.name, l.name).toBe(l.name.trim());
      expect(l.name.length, l.name).toBeLessThanOrEqual(50);
    }
    expect(new Set(ALL.map((l) => slugify(l.name))).size).toBe(ALL.length);
  });

  it('list only existing landmarks as already being World Heritage Sites', () => {
    const existing = new Set(LANDMARKS.map((l) => l.wikidataId));
    const added = new Set(UNESCO_LANDMARKS.map((l) => l.wikidataId));
    expect(new Set(UNESCO_IN_EXISTING).size).toBe(UNESCO_IN_EXISTING.length);
    for (const id of UNESCO_IN_EXISTING) {
      expect(existing.has(id), id).toBe(true);
      expect(added.has(id), id).toBe(false);
    }
  });

  it('put every landmark in a seeded country, at a real position, with a sensible radius', () => {
    for (const l of UNESCO_LANDMARKS) {
      expect(countryCodes.has(l.countryCode), l.name).toBe(true);
      expect(projectToMap(l.latitude, l.longitude), l.name).not.toBeNull();
      expect(l.matchRadiusM, l.name).toBeGreaterThanOrEqual(300);
      expect(l.matchRadiusM, l.name).toBeLessThanOrEqual(MAX_MATCH_RADIUS_M);
    }
  });

  it('land in, or right beside, their own country on the map', () => {
    // As for the 177: the map is coarse (a unit is ~20 km at the equator), so a point
    // on a border may land just inside the neighbour; further than this is wrong.
    const BORDER_UNITS = 4;
    const wrong = UNESCO_LANDMARKS.filter((l) => {
      const found = countryAtPosition(l.latitude, l.longitude);
      if (!found || found === l.countryCode) return false;
      const distance = distanceToCountry(l.countryCode, l.latitude, l.longitude);
      return distance === null || distance > BORDER_UNITS;
    }).map((l) => `${l.name} (${l.countryCode}) lands in ${countryAtPosition(l.latitude, l.longitude)}`);
    expect(wrong).toEqual([]);
  });

  it('find Greece on the Aegean islands off Turkey', () => {
    for (const [id, code] of Object.entries(AEGEAN_ISLANDS)) {
      const l = UNESCO_LANDMARKS.find((x) => x.wikidataId === id);
      expect(l?.countryCode, id).toBe(code);
      expect(countryAtPosition(l.latitude, l.longitude), l.name).toBe(code);
    }
  });
});
