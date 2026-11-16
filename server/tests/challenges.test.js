import { describe, expect, it } from 'vitest';
import { CHALLENGE_LIMITS, challengeStatus, challengeWindow, parseChallengeInput, rankMembers, standing } from '../src/utils/challenges.js';

const day = (text) => new Date(`${text}T00:00:00.000Z`);

describe('a challenge’s dates', () => {
  const challenge = { startsOn: day('2027-01-01'), endsOn: day('2027-01-31') };

  it('counts from the first day to the end of the last (UTC)', () => {
    expect(challengeWindow(challenge)).toEqual({ from: day('2027-01-01'), before: day('2027-02-01') });
  });

  it('is upcoming, running, then ended', () => {
    expect(challengeStatus(challenge, new Date('2026-12-31T23:59:59Z'))).toBe('UPCOMING');
    expect(challengeStatus(challenge, new Date('2027-01-31T23:59:59Z'))).toBe('RUNNING');
    expect(challengeStatus(challenge, new Date('2027-02-01T00:00:00Z'))).toBe('ENDED');
  });
});

describe('the leaderboard', () => {
  it('knows when someone reached the target', () => {
    const dates = ['2027-01-09', '2027-01-02', '2027-01-20'].map(day);
    expect(standing(dates, 2)).toEqual({ count: 3, reachedAt: day('2027-01-09') });
    expect(standing(dates, 4)).toEqual({ count: 3, reachedAt: null });
    expect(standing(dates)).toEqual({ count: 3, reachedAt: null });
  });

  it('puts the first to the target first, then counts; equal places share a rank', () => {
    const ranked = rankMembers([
      { name: 'Ann', count: 6, reachedAt: day('2027-01-20') },
      { name: 'Bo', count: 5, reachedAt: day('2027-01-10') },
      { name: 'Cy', count: 4, reachedAt: null },
      { name: 'Di', count: 4, reachedAt: null },
      { name: 'Ed', count: 1, reachedAt: null },
    ]);
    expect(ranked.map((r) => [r.name, r.rank])).toEqual([['Bo', 1], ['Ann', 2], ['Cy', 3], ['Di', 3], ['Ed', 5]]);
  });

  it('ranks by count without a target', () => {
    const ranked = rankMembers([{ name: 'A', count: 2, reachedAt: null }, { name: 'B', count: 7, reachedAt: null }]);
    expect(ranked.map((r) => [r.name, r.rank])).toEqual([['B', 1], ['A', 2]]);
  });
});

describe('a challenge’s details', () => {
  const good = { title: '  Most new  countries ', measure: 'NEW_COUNTRIES', startsOn: '2027-01-01', endsOn: '2027-12-31', target: 5 };

  it('cleans a new one', () => {
    expect(parseChallengeInput(good)).toEqual({
      ok: true,
      data: { title: 'Most new countries', measure: 'NEW_COUNTRIES', startsOn: day('2027-01-01'), endsOn: day('2027-12-31'), target: 5 },
    });
    expect(parseChallengeInput({ ...good, target: null }).data.target).toBeNull();
  });

  it('refuses a bad measure, dates out of order or too long, and a bad target', () => {
    expect(parseChallengeInput({ ...good, measure: 'PHOTOS' }).ok).toBe(false);
    expect(parseChallengeInput({ ...good, endsOn: '2026-12-31' })).toEqual({ ok: false, message: 'challengeDates' });
    expect(parseChallengeInput({ ...good, endsOn: '2029-01-02' })).toEqual({ ok: false, message: 'challengeDates' });
    expect(parseChallengeInput({ ...good, startsOn: '2027-02-30' }).ok).toBe(false);
    for (const target of [0, 1.5, CHALLENGE_LIMITS.target + 1, '5']) expect(parseChallengeInput({ ...good, target }).ok, String(target)).toBe(false);
    expect(parseChallengeInput({ ...good, title: 'x'.repeat(CHALLENGE_LIMITS.title + 1) }).ok).toBe(false);
  });

  it('checks only what a change sends, against the dates it keeps; the measure never changes', () => {
    const existing = { measure: 'COUNTRIES', startsOn: day('2027-01-01'), endsOn: day('2027-01-31') };
    expect(parseChallengeInput({ endsOn: '2027-02-28' }, { existing })).toEqual({ ok: true, data: { endsOn: day('2027-02-28') } });
    expect(parseChallengeInput({ startsOn: '2027-03-01' }, { existing })).toEqual({ ok: false, message: 'challengeDates' });
    expect(parseChallengeInput({ measure: 'LANDMARKS' }, { existing })).toEqual({ ok: false, message: 'challengeMeasureFixed' });
  });
});
