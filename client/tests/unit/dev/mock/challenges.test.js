import { beforeEach, describe, expect, it } from 'vitest';
import {
  CHALLENGE_LIMITS,
  CHALLENGE_MEASURES,
  canCountMap,
  challengeStatus,
  challengeWindow,
  countedDates,
  parseChallengeInput,
  rankMembers,
  standing,
} from '@/dev/mock/challenges';
import * as server from '../../../../../server/src/utils/challenges.js';
import { HOME_MAP, JO_MAP, SAM_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const twoYears = { startsOn: '2025-01-01', endsOn: '2026-12-31' };
const counted = (measure, mapId, window = twoYears) => countedDates(db(), measure, mapId, challengeWindow(window)).length;

describe('the rules', () => {
  it('are the server’s measures and limits', () => {
    expect(CHALLENGE_MEASURES).toEqual([...server.CHALLENGE_MEASURES]);
    for (const [key, value] of Object.entries(CHALLENGE_LIMITS)) expect(server.CHALLENGE_LIMITS[key]).toBe(value);
  });

  it('runs from the first day to the end of the last, UTC', () => {
    const window = challengeWindow(twoYears);
    expect(window.from.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(window.before.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(challengeStatus(twoYears, new Date('2024-12-31T23:59:59Z'))).toBe('UPCOMING');
    expect(challengeStatus(twoYears, new Date('2026-12-31T23:59:59Z'))).toBe('RUNNING');
    expect(challengeStatus(twoYears, new Date('2027-01-01T00:00:00Z'))).toBe('ENDED');
  });

  it('stands and ranks as the server does', () => {
    const dates = ['2025-03-01', '2025-01-02', '2025-02-01'];
    expect(standing(dates, 2)).toEqual(server.standing(dates, 2));
    expect(standing(dates)).toEqual({ count: 3, reachedAt: null });
    const rows = [
      { userId: 'a', count: 3, reachedAt: null },
      { userId: 'b', count: 5, reachedAt: new Date('2025-05-01') },
      { userId: 'c', count: 4, reachedAt: new Date('2025-04-01') },
      { userId: 'd', count: 3, reachedAt: null },
      { userId: 'e', count: 7, reachedAt: null },
    ];
    const ranked = rankMembers(rows);
    expect(ranked).toEqual(server.rankMembers(rows));
    expect(ranked.map((r) => [r.userId, r.rank])).toEqual([
      ['c', 1],
      ['b', 2],
      ['e', 3],
      ['a', 4],
      ['d', 4],
    ]);
  });
});

describe('parseChallengeInput', () => {
  const good = { title: ' Most <b>new</b> countries ', measure: 'NEW_COUNTRIES', startsOn: '2027-01-01', endsOn: '2027-12-31', target: 10 };

  it('reads a new challenge, cleaning its title', () => {
    expect(parseChallengeInput(good)).toEqual({ ok: true, data: { title: 'Most new countries', measure: 'NEW_COUNTRIES', startsOn: '2027-01-01', endsOn: '2027-12-31', target: 10 } });
    expect(parseChallengeInput({ ...good, target: '' }).data.target).toBeNull();
  });

  it('refuses what the server refuses', () => {
    const bad = [
      null,
      [],
      { ...good, title: '' },
      { ...good, title: 'x'.repeat(81) },
      { ...good, measure: 'TRIPS' },
      { ...good, startsOn: '2027-02-30' },
      { ...good, endsOn: '2026-12-31' },
      { ...good, endsOn: '2029-01-02' },
      { ...good, target: 0 },
      { ...good, target: 501 },
      { ...good, target: 1.5 },
    ];
    for (const body of bad) {
      expect(parseChallengeInput(body).ok).toBe(false);
      expect(server.parseChallengeInput(body).ok).toBe(false);
    }
    expect(parseChallengeInput({ ...good, endsOn: '2026-12-31' }).message).toBe('dates');
  });

  it('keeps the measure on a change, and checks new dates against the old ones', () => {
    const existing = { measure: 'COUNTRIES', startsOn: '2025-01-01', endsOn: '2026-12-31' };
    expect(parseChallengeInput({ title: 'New name' }, { existing })).toEqual({ ok: true, data: { title: 'New name' } });
    expect(parseChallengeInput({ measure: 'LANDMARKS' }, { existing })).toEqual({ ok: false, message: 'measureFixed' });
    expect(parseChallengeInput({ endsOn: '2024-01-01' }, { existing }).message).toBe('dates');
  });
});

describe('countedDates', () => {
  it('gives the seed’s counts: the test user 2 countries, Jo 1, Sam 0', () => {
    expect(counted('COUNTRIES', HOME_MAP)).toBe(2);
    expect(counted('COUNTRIES', JO_MAP)).toBe(1);
    expect(counted('COUNTRIES', SAM_MAP)).toBe(0);
  });

  it('counts a country new only when its first photo ever is inside the dates', () => {
    expect(counted('NEW_COUNTRIES', HOME_MAP)).toBeLessThanOrEqual(counted('COUNTRIES', HOME_MAP));
    expect(counted('NEW_COUNTRIES', HOME_MAP, { startsOn: '2000-01-01', endsOn: '2001-01-01' })).toBe(0);
  });

  it('counts the landmarks first stamped, and the theme photos entered, inside the dates', () => {
    expect(counted('LANDMARKS', HOME_MAP)).toBeGreaterThan(0);
    expect(counted('LANDMARKS', HOME_MAP, { startsOn: '1990-01-01', endsOn: '1990-12-31' })).toBe(0);
    const now = new Date();
    const window = { startsOn: new Date(now.getTime() - 400 * 86400000).toISOString().slice(0, 10), endsOn: now.toISOString().slice(0, 10) };
    expect(counted('THEME_PHOTOS', HOME_MAP, window)).toBe(db().themeEntries.filter((e) => e.mapId === HOME_MAP && new Date(e.enteredAt) <= now).length);
    expect(countedDates(db(), 'TRIPS', HOME_MAP, challengeWindow(twoYears))).toEqual([]);
  });

  it('counts the UK’s nations on a split map, the UK only while none has a photo', () => {
    const photo = (id, countryCode) => ({ id, mapId: 'm', countryCode, takenAt: '2025-06-01T00:00:00Z' });
    const store = { photos: [photo('a', 'GB'), photo('b', 'XE'), photo('c', 'XC'), photo('d', 'AQ')], photoLandmarks: [] };
    expect(countedDates(store, 'COUNTRIES', 'm', challengeWindow(twoYears))).toHaveLength(2);
  });
});

describe('canCountMap', () => {
  it('counts a map someone owns or edits, never one they only view', () => {
    expect(canCountMap(db(), 'mock-user', HOME_MAP)).toBe(true);
    expect(canCountMap(db(), 'mock-alex', HOME_MAP)).toBe(true);
    expect(canCountMap(db(), 'mock-sam', HOME_MAP)).toBe(false);
    expect(canCountMap(db(), 'mock-user', SAM_MAP)).toBe(false);
  });
});
