import { describe, it, expect } from 'vitest';
import { GOAL_REGIONS, changesWhatsAsked, goalProgress, parseGoalInput, regionCodes } from '../src/utils/goals.js';

const known = new Set(['FR', 'IT', 'ES', 'JP', 'XN', 'AQ', 'DK', 'NO', 'SE']);
const isKnownCode = (code) => known.has(code);
const parse = (body, existing) => parseGoalInput(body, { existing, isKnownCode });

describe('goal input', () => {
  it('takes each kind with its own field only', () => {
    expect(parse({ kind: 'COUNTRY_COUNT', target: 30, title: ' 30 before 30 ' })).toEqual({
      ok: true,
      data: { kind: 'COUNTRY_COUNT', target: 30, title: '30 before 30' },
    });
    expect(parse({ kind: 'COUNTRY_LIST', countryCodes: ['JP', 'XN'] }).data).toEqual({ kind: 'COUNTRY_LIST', countryCodes: ['JP', 'XN'] });
    expect(parse({ kind: 'REGION', region: 'scandinavia' }).ok).toBe(true);
    expect(parse({ kind: 'REGION', region: 'EUROPE' }).ok).toBe(true);
    expect(parse({ kind: 'LANDMARK_COUNT', target: 10, deadline: '2027-12-31' }).data.deadline).toEqual(new Date('2027-12-31T00:00:00Z'));
  });

  it('refuses anything else', () => {
    expect(parse({ kind: 'COUNTRY_COUNT' }).ok).toBe(false);
    expect(parse({ kind: 'COUNTRY_COUNT', target: 0 }).ok).toBe(false);
    expect(parse({ kind: 'COUNTRY_COUNT', target: 5, region: 'EUROPE' }).ok).toBe(false);
    expect(parse({ kind: 'COUNTRY_LIST', countryCodes: [] }).ok).toBe(false);
    expect(parse({ kind: 'COUNTRY_LIST', countryCodes: ['FR', 'FR'] }).ok).toBe(false);
    expect(parse({ kind: 'COUNTRY_LIST', countryCodes: ['ZZ'] }).ok).toBe(false);
    expect(parse({ kind: 'REGION', region: 'ANTARCTICA' }).ok).toBe(false);
    expect(parse({ kind: 'REGION', region: 'narnia' }).ok).toBe(false);
    expect(parse({ kind: 'TRAVEL', target: 3 }).ok).toBe(false);
    expect(parse({ kind: 'COUNTRY_COUNT', target: 3, deadline: '2027-02-30' }).ok).toBe(false);
  });

  it('changes a goal without changing its kind', () => {
    const existing = { kind: 'COUNTRY_COUNT', target: 5 };
    expect(parse({ target: 10 }, existing)).toEqual({ ok: true, data: { target: 10 } });
    expect(parse({ title: null }, existing)).toEqual({ ok: true, data: { title: null } });
    expect(parse({ kind: 'REGION', region: 'EUROPE' }, existing).ok).toBe(false);
    expect(changesWhatsAsked({ title: 'x' })).toBe(false);
    expect(changesWhatsAsked({ deadline: null })).toBe(true);
  });
});

describe('goal progress', () => {
  const facts = {
    visited: new Set(['FR', 'IT', 'ES', 'XN']),
    // Italy has a photo from 2025, France from 2027; Spain was ticked by hand
    firstPhotoAt: new Map([['IT', new Date('2025-05-01T10:00:00Z')], ['FR', new Date('2027-03-01T10:00:00Z')]]),
    stamps: [{ firstShotAt: new Date('2025-05-01T10:00:00Z') }, { firstShotAt: new Date('2027-03-01T10:00:00Z') }],
    countriesByContinent: new Map([['EUROPE', ['FR', 'IT', 'ES', 'DE']], ['ANTARCTICA', ['AQ', 'XS']]]),
  };
  const now = new Date('2026-06-01T00:00:00Z');

  it('counts marked countries without a deadline, special places left out', () => {
    expect(goalProgress({ kind: 'COUNTRY_COUNT', target: 3 }, facts, now)).toMatchObject({ have: 3, need: 3, met: true });
  });

  it('counts only what a photo proves by the deadline, and says when it was missed', () => {
    const by2026 = goalProgress({ kind: 'COUNTRY_COUNT', target: 2, deadline: new Date('2026-01-01') }, facts, now);
    expect(by2026).toMatchObject({ have: 1, need: 2, met: false, missed: true });
    const by2028 = goalProgress({ kind: 'COUNTRY_COUNT', target: 2, deadline: new Date('2028-01-01') }, facts, now);
    expect(by2028).toMatchObject({ have: 2, met: true, missed: false });
    // The deadline's whole day counts
    const sameDay = goalProgress({ kind: 'LANDMARK_COUNT', target: 1, deadline: new Date('2025-05-01') }, facts, now);
    expect(sameDay.met).toBe(true);
  });

  it('lists what is done on a bucket list or in a region', () => {
    const list = goalProgress({ kind: 'COUNTRY_LIST', countryCodes: ['ES', 'JP', 'XN'] }, facts, now);
    expect(list).toMatchObject({ have: 2, need: 3, met: false, done: ['ES', 'XN'] });
    const europe = goalProgress({ kind: 'REGION', region: 'EUROPE' }, facts, now);
    expect(europe).toMatchObject({ have: 3, need: 4 });
    expect(regionCodes('scandinavia', facts.countriesByContinent)).toEqual(['DK', 'NO', 'SE']);
    expect(GOAL_REGIONS).not.toContain('ANTARCTICA');
  });
});

describe('goals on a map that splits the UK', () => {
  const facts = (visited, splitUk) => ({
    visited: new Set(visited),
    firstPhotoAt: new Map(),
    stamps: [],
    countriesByContinent: new Map([['EUROPE', ['GB', 'XE', 'XC', 'XW', 'XI', 'FR', 'AQ']]]),
    splitUk,
  });

  it('counts each nation as a country', () => {
    expect(goalProgress({ kind: 'COUNTRY_COUNT', target: 3 }, facts(['XE', 'XC', 'FR', 'GB'], true))).toMatchObject({ have: 3, met: true });
  });

  it('meets a goal naming the UK with any nation, and one naming a nation with the UK once the map is one country again', () => {
    expect(goalProgress({ kind: 'COUNTRY_LIST', countryCodes: ['GB', 'FR'] }, facts(['XW', 'FR'], true))).toMatchObject({ have: 2, met: true });
    expect(goalProgress({ kind: 'COUNTRY_LIST', countryCodes: ['XC'] }, facts(['GB'], false))).toMatchObject({ have: 1, met: true });
    expect(goalProgress({ kind: 'COUNTRY_LIST', countryCodes: ['XC'] }, facts(['XE'], true))).toMatchObject({ have: 0, met: false });
  });

  it('gives a continent the nations instead of the UK, and the British Isles all four and Ireland', () => {
    const europe = facts([], true).countriesByContinent;
    expect(regionCodes('EUROPE', europe, true)).toEqual(['XE', 'XC', 'XW', 'XI', 'FR']);
    expect(regionCodes('EUROPE', europe, false)).toEqual(['GB', 'FR']);
    expect(regionCodes('british-isles', europe, true)).toEqual(['XE', 'XC', 'XW', 'XI', 'IE']);
  });
});
