// @vitest-environment node
// The country posters (src/utils/map/posterData.js): every entry a known place, the UK's
// nations' fallbacks, and the files' addresses. The media address is mocked.
import { describe, expect, it, vi } from 'vitest';
import { POSTERS_BY_CODE, posterUrl, postersFor } from '@/utils/map/posterData';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

vi.mock('@/utils/media/mediaUrl', () => ({ mediaUrlFrom: ({ objectKey }) => `https://cdn.test/${objectKey}` }));

describe('the posters', () => {
  it('are each for a place on the map', () => {
    for (const code of Object.keys(POSTERS_BY_CODE)) expect(COUNTRY_BY_CODE[code], code).toBeDefined();
  });

  it('have a file name and a width/height ratio, no name twice', () => {
    const names = [];
    for (const [code, posters] of Object.entries(POSTERS_BY_CODE)) {
      expect(posters.length, code).toBeGreaterThan(0);
      for (const { name, ratio } of posters) {
        expect(name, code).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(ratio, code).toMatch(/^\d+\/\d+$/);
        names.push(name);
      }
    }
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('postersFor', () => {
  it('gives a place its own posters, the first the main one', () => {
    expect(postersFor('FR')).toBe(POSTERS_BY_CODE.FR);
  });

  it('gives England and Scotland the UK’s poster of them when they have none of their own', () => {
    for (const [code, name] of [
      ['XE', 'gb-england'],
      ['XC', 'gb-scotland'],
    ]) {
      const posters = postersFor(code);
      expect(posters.length, code).toBeGreaterThan(0);
      if (!POSTERS_BY_CODE[code]) expect(posters.map((p) => p.name)).toEqual([name]);
    }
  });

  it('gives nothing to a place with no poster (the placeholder card)', () => {
    expect(postersFor('ZZ')).toEqual([]);
    if (!POSTERS_BY_CODE.XW) expect(postersFor('XW')).toEqual([]);
  });
});

describe('posterUrl', () => {
  it('is the 800 px file in the posters’ folder', () => {
    expect(posterUrl('fr-paris', 'avif')).toBe('https://cdn.test/visitCountryPosters/fr-paris-800.avif');
    expect(posterUrl('fr-paris', 'webp')).toBe('https://cdn.test/visitCountryPosters/fr-paris-800.webp');
  });
});
