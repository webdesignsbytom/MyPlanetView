import { describe, expect, it } from 'vitest';
import { UN_MEMBER_CODES, UN_MEMBER_TOTAL, UN_PART_OF, unMemberOf, unMembersVisited } from '../src/utils/unMembers.js';
import { COUNTRIES } from '../prisma/seed/data/countries.js';

// The UN's 193 member states (24 Nov 2026, the user's wish: a collector's count beside the map's own)
describe('the UN member states', () => {
  it('are 193, each once, each a country on our map', () => {
    expect(UN_MEMBER_TOTAL).toBe(193);
    expect(new Set(UN_MEMBER_CODES).size).toBe(193);
    const countries = new Map(COUNTRIES.map((c) => [c.code, c]));
    for (const code of UN_MEMBER_CODES) expect(countries.get(code)?.kind ?? 'COUNTRY').toBe('COUNTRY');
    expect(UN_MEMBER_CODES.filter((code) => !countries.has(code))).toEqual([]);
  });

  it('count a member for itself, and for the places that are part of it', () => {
    expect(unMemberOf('FR')).toBe('FR');
    // The UK's nations, the regions, the Canaries, France's overseas departments
    expect(['XE', 'XC', 'XW', 'XI'].map(unMemberOf)).toEqual(['GB', 'GB', 'GB', 'GB']);
    expect(unMemberOf('XH')).toBe('US');
    expect(unMemberOf('XB')).toBe('ID');
    expect(unMemberOf('IC')).toBe('ES');
    expect(unMemberOf('RE')).toBe('FR');
    expect(unMemberOf('BQ')).toBe('NL');
  });

  it('count none for territories, places outside the UN, Antarctica and the poles', () => {
    for (const code of ['GL', 'PR', 'GI', 'FO', 'BM', 'TW', 'XK', 'PS', 'VA', 'EH', 'AQ', 'XN', 'XS', 'QN', 'QS']) expect(unMemberOf(code)).toBeNull();
  });

  it('name only members as what places are part of', () => {
    for (const member of Object.values(UN_PART_OF)) expect(UN_MEMBER_CODES).toContain(member);
  });

  it('are counted once each, A–Z', () => {
    expect(unMembersVisited(['XE', 'GB', 'XC', 'IC', 'ES', 'GL', 'FR'])).toEqual(['ES', 'FR', 'GB']);
    expect(unMembersVisited([])).toEqual([]);
  });

  it('cover every place on our map: each is a member, part of one, or counted for none on purpose', () => {
    const none = ['AS', 'AI', 'AW', 'BM', 'VG', 'KY', 'CW', 'FK', 'FO', 'PF', 'GI', 'GL', 'GU', 'XK', 'MS', 'MP', 'PS', 'PR', 'BL', 'MF', 'SX', 'TW', 'TC', 'VI', 'VA', 'EH', 'AQ', 'XN', 'QN', 'XS', 'QS'];
    const unsorted = COUNTRIES.map((c) => c.code).filter((code) => !unMemberOf(code) && !none.includes(code));
    // A place added to the map later has to be sorted here too
    expect(unsorted).toEqual([]);
  });
});
