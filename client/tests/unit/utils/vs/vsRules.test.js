// Vs mode's rules: the client's copy (for the mock) of the server's utils/vs.js
import { describe, expect, it } from 'vitest';
import * as client from '@/utils/vs/vsRules';
import * as server from '../../../../../server/src/utils/vs.js';

// A seeded random, so the comparison covers many shapes without changing between runs
const random = (seed) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

describe('the server’s rules, copied', () => {
  it('has the same categories, limits and default title', () => {
    expect([...client.VS_CATEGORIES]).toEqual([...server.VS_CATEGORIES]);
    expect({ ...client.VS_LIMITS }).toEqual({ ...server.VS_LIMITS });
    expect(client.VS_DEFAULT_TITLE).toBe(server.VS_DEFAULT_TITLE);
    expect([...client.MEDALS]).toEqual([...server.MEDALS]);
  });

  it('gives the same places, medals and table for any group', () => {
    const next = random(26);
    for (let round = 0; round < 200; round += 1) {
      const people = Array.from({ length: 1 + Math.floor(next() * 8) }, () =>
        next() < 0.15 ? { values: null } : { values: Object.fromEntries(client.VS_CATEGORIES.map((c) => [c, Math.floor(next() * 4)])) },
      );
      expect(client.compareAll(people)).toEqual(server.compareAll(people));
      const values = people.map((p) => p.values?.countries ?? null);
      expect(client.competitionPlaces(values)).toEqual(server.competitionPlaces(values));
      expect(client.medalsFor(values)).toEqual(server.medalsFor(values));
    }
  });
});

describe('the medals', () => {
  it('share a place on a tie and skip the next (1, 1, 3), never for 0 or alone', () => {
    expect(client.competitionPlaces([5, 9, 9, null, 2])).toEqual([3, 1, 1, null, 4]);
    expect(client.medalsFor([5, 9, 9, 2])).toEqual(['bronze', 'gold', 'gold', null]);
    expect(client.medalsFor([3, 0])).toEqual(['gold', null]);
    expect(client.medalsFor([3, null])).toEqual([null, null]);
  });

  it('places the table by golds, then silvers, then bronzes, leaving out anyone with no map', () => {
    const compared = client.compareAll([{ values: { countries: 3, flights: 1 } }, { values: { countries: 3, flights: 2 } }, { values: null }]);
    expect(compared.map(({ gold, silver, bronze, place }) => ({ gold, silver, bronze, place }))).toEqual([
      { gold: 1, silver: 1, bronze: 0, place: 2 },
      { gold: 2, silver: 0, bronze: 0, place: 1 },
      { gold: 0, silver: 0, bronze: 0, place: null },
    ]);
    expect(compared[2].medals.countries).toBeNull();
  });
});
