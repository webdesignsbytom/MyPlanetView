// @vitest-environment node
// The UN's 193 member states (src/utils/map/unMembers.js; 24 Nov 2026, the user's wish): a
// copy of the server's, and the statistics panel's count with the ones to go.
import { describe, expect, it } from 'vitest';
import * as server from '../../../../../server/src/utils/unMembers.js';
import { UN_MEMBER_CODES, UN_MEMBER_TOTAL, UN_PART_OF, unCountsFrom, unMemberOf, unMembersVisited } from '@/utils/map/unMembers';
import { COUNTRIES } from '@/utils/map/countries';

describe('the client’s copy of the server’s list', () => {
  it('is the same 193 and the same places counted for them', () => {
    expect(UN_MEMBER_TOTAL).toBe(193);
    expect(UN_MEMBER_CODES).toEqual(server.UN_MEMBER_CODES);
    expect(UN_PART_OF).toEqual(server.UN_PART_OF);
    for (const { code } of COUNTRIES) expect(unMemberOf(code)).toBe(server.unMemberOf(code));
  });

  it('counts each member once', () => {
    expect(unMembersVisited(['XE', 'XW', 'GB', 'XH', 'RE', 'TW'])).toEqual(['FR', 'GB', 'US']);
  });
});

describe('unCountsFrom', () => {
  const visit = (countryCode, status = 'VISITED') => ({ countryCode, status });

  it('counts the visited and lived-in places, never a wish', () => {
    const { visited, toGo, total } = unCountsFrom([visit('FR'), visit('DE', 'LIVED'), visit('JP', 'WANT_TO_GO'), visit('GL'), visit('IC')]);
    expect(visited).toEqual(['DE', 'ES', 'FR']);
    expect(total).toBe(193);
    expect(toGo).toHaveLength(190);
    expect(toGo.some((country) => country.code === 'JP')).toBe(true);
  });

  it('lists the ones to go A–Z by name', () => {
    const { toGo } = unCountsFrom([]);
    expect(toGo).toHaveLength(193);
    expect(toGo[0]).toEqual({ code: 'AF', name: 'Afghanistan' });
    expect(toGo.map((c) => c.name)).toEqual([...toGo.map((c) => c.name)].sort((a, b) => a.localeCompare(b, 'en-GB')));
  });

  it('has none to go once every one is visited', () => {
    expect(unCountsFrom(UN_MEMBER_CODES.map((code) => visit(code))).toGo).toEqual([]);
  });
});
