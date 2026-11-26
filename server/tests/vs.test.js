// Vs mode (26 Nov 2026, the user's wish; src/utils/vs.js): places, medals and the medal table. Pure.
import { describe, expect, it } from 'vitest';
import { VS_CATEGORIES, VS_DEFAULT_TITLE, VS_LIMITS, compareAll, competitionPlaces, medalTable, medalsFor, parseVsMapId, parseVsTitle } from '../src/utils/vs.js';
import { redactUrl } from '../src/utils/redactUrl.js';

describe('competitionPlaces', () => {
  it('ranks highest first, ties sharing a place and the next skipping', () => {
    expect(competitionPlaces([5, 9, 5, 2])).toEqual([2, 1, 2, 4]);
    expect(competitionPlaces([3, 3, 3])).toEqual([1, 1, 1]);
  });

  it('gives no place to someone with no map that counts', () => {
    expect(competitionPlaces([4, null, 7])).toEqual([2, null, 1]);
  });
});

describe('medalsFor', () => {
  it('gives gold, silver and bronze to the first three places', () => {
    expect(medalsFor([10, 30, 20, 5])).toEqual(['bronze', 'gold', 'silver', null]);
  });

  it('shares a medal on a tie, the next place skipping', () => {
    expect(medalsFor([8, 8, 3, 1])).toEqual(['gold', 'gold', 'bronze', null]);
    expect(medalsFor([9, 4, 4, 4])).toEqual(['gold', 'silver', 'silver', 'silver']);
  });

  it('never gives one for nothing, nor to one person alone, nor to someone not counted', () => {
    expect(medalsFor([3, 0, 0])).toEqual(['gold', null, null]);
    expect(medalsFor([12])).toEqual([null]);
    expect(medalsFor([12, null])).toEqual([null, null]);
    expect(medalsFor([12, null, 4])).toEqual(['gold', null, 'silver']);
  });
});

describe('medalTable', () => {
  it('counts each person’s medals and places them by golds, then silvers, then bronzes', () => {
    const table = medalTable([
      { a: 'gold', b: 'silver', c: null },
      { a: 'silver', b: 'gold', c: 'gold' },
      { a: 'bronze', b: 'bronze', c: 'silver' },
      { a: 'gold', b: 'silver', c: null },
    ]);
    expect(table).toEqual([
      { gold: 1, silver: 1, bronze: 0, place: 2 },
      { gold: 2, silver: 1, bronze: 0, place: 1 },
      { gold: 0, silver: 1, bronze: 2, place: 4 },
      { gold: 1, silver: 1, bronze: 0, place: 2 },
    ]);
  });
});

describe('compareAll', () => {
  it('compares every category, someone with no map counted in none', () => {
    const values = (n) => Object.fromEntries(VS_CATEGORIES.map((c) => [c, n]));
    const [high, low, none] = compareAll([{ values: values(10) }, { values: { ...values(2), flights: 20 } }, { values: null }]);
    expect(high.gold).toBe(VS_CATEGORIES.length - 1);
    expect(high.medals.flights).toBe('silver');
    expect(low.medals.flights).toBe('gold');
    expect(high.place).toBe(1);
    expect(low.place).toBe(2);
    // No map that counts: no medals, and no place in the table
    expect(none).toMatchObject({ gold: 0, silver: 0, bronze: 0, place: null });
    expect(Object.values(none.medals).every((m) => m === null)).toBe(true);
  });
});

describe('inputs and limits', () => {
  it('compares ten things, with at most 8 people', () => {
    expect(VS_CATEGORIES).toHaveLength(10);
    expect(VS_LIMITS.members).toBe(8);
  });

  it('cleans a title, the usual one when it’s empty', () => {
    expect(parseVsTitle('  Family <b>league</b> ')).toBe('Family league');
    expect(parseVsTitle('')).toBe(VS_DEFAULT_TITLE);
    expect(parseVsTitle(undefined)).toBe(VS_DEFAULT_TITLE);
    expect(parseVsTitle('x'.repeat(200))).toHaveLength(VS_LIMITS.title);
  });

  it('takes a map id only', () => {
    expect(parseVsMapId('0f0e8a8e-5a1b-4c3d-9e7f-1234567890ab')).toEqual({ ok: true, mapId: '0f0e8a8e-5a1b-4c3d-9e7f-1234567890ab' });
    expect(parseVsMapId('map')).toEqual({ ok: false });
  });

  it('keeps a join code out of the logs', () => {
    expect(redactUrl('/api/vs/join/VS22-FRND-8MAX')).toBe('/api/vs/join/:code');
  });
});
