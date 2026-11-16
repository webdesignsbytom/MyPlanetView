import { describe, it, expect } from 'vitest';
import { REGIONS } from '../src/utils/constants/regions.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';

describe('regions', () => {
  it('name only countries on the map, each once', () => {
    const codes = new Set(COUNTRIES.filter((c) => c.kind !== 'SPECIAL').map((c) => c.code));
    for (const [key, region] of Object.entries(REGIONS)) {
      expect(region.codes.length, key).toBeGreaterThan(1);
      expect(new Set(region.codes).size, key).toBe(region.codes.length);
      for (const code of region.codes) expect(codes.has(code), `${key} ${code}`).toBe(true);
    }
  });
});
