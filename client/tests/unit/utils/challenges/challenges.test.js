import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_MAX_DAYS,
  CHALLENGE_TARGET_MAX,
  CHALLENGE_TITLE_MAX,
  challengeBodyFrom,
  challengeFormFrom,
  emptyChallengeForm,
} from '@/utils/challenges/challengeForm';
import {
  CHALLENGE_MEASURES,
  CHALLENGE_MEASURE_ORDER,
  STATUS_WORDS,
  countWords,
  dateRange,
  measureLabel,
  ordinal,
} from '@/utils/challenges/challengeWords';
// The server's rules: the client copies them
import { CHALLENGE_LIMITS, CHALLENGE_MEASURES as SERVER_MEASURES } from '../../../../../server/src/utils/challenges.js';

const form = (extra = {}) => ({
  title: 'Most new countries',
  measure: 'NEW_COUNTRIES',
  startsOn: '2027-01-01',
  endsOn: '2027-12-31',
  target: '',
  mapId: 'map-1',
  ...extra,
});

describe('the challenge rules', () => {
  it('match the server’s', () => {
    expect(CHALLENGE_MEASURE_ORDER).toEqual([...SERVER_MEASURES]);
    expect(CHALLENGE_TITLE_MAX).toBe(CHALLENGE_LIMITS.title);
    expect(CHALLENGE_TARGET_MAX).toBe(CHALLENGE_LIMITS.target);
    expect(CHALLENGE_MAX_DAYS).toBe(CHALLENGE_LIMITS.days);
  });

  it('words every measure', () => {
    for (const measure of CHALLENGE_MEASURE_ORDER) {
      expect(Object.keys(CHALLENGE_MEASURES[measure]).sort()).toEqual(['description', 'label', 'many', 'one']);
    }
  });
});

describe('emptyChallengeForm and challengeFormFrom', () => {
  it('starts a new challenge on this calendar year, counting new countries', () => {
    expect(emptyChallengeForm('2026-11-23')).toEqual({
      title: '',
      measure: 'NEW_COUNTRIES',
      startsOn: '2026-01-01',
      endsOn: '2026-12-31',
      target: '',
      mapId: '',
    });
  });

  it('fills the form from a challenge, its target as text', () => {
    const challenge = { title: 'Race', measure: 'LANDMARKS', startsOn: '2026-03-01', endsOn: '2026-06-30', target: 12 };
    expect(challengeFormFrom(challenge)).toEqual({ ...challenge, target: '12', mapId: '' });
    expect(challengeFormFrom({ ...challenge, target: null }).target).toBe('');
  });
});

describe('challengeBodyFrom', () => {
  it('makes a new challenge’s body, the title tidied and no target as null', () => {
    expect(challengeBodyFrom(form({ title: '  Most   new\tcountries ' }))).toEqual({
      ok: true,
      body: { title: 'Most new countries', startsOn: '2027-01-01', endsOn: '2027-12-31', target: null, measure: 'NEW_COUNTRIES', mapId: 'map-1' },
    });
    expect(challengeBodyFrom(form({ target: ' 25 ' })).body.target).toBe(25);
  });

  it('says what is wrong with each field', () => {
    const result = challengeBodyFrom({ title: '  ', measure: 'STEPS', startsOn: '2027-02-30', endsOn: 'soon', target: 'ten', mapId: '' });
    expect(result).toEqual({
      ok: false,
      errors: {
        title: 'Give it a title.',
        measure: 'Choose what it counts.',
        startsOn: 'Choose the first day.',
        endsOn: 'Choose the last day.',
        target: `A whole number from 1 to ${CHALLENGE_TARGET_MAX}, or empty.`,
        mapId: 'Choose the map that counts for you.',
      },
    });
  });

  it('refuses a title over the limit', () => {
    expect(challengeBodyFrom(form({ title: 'x'.repeat(CHALLENGE_TITLE_MAX) })).ok).toBe(true);
    expect(challengeBodyFrom(form({ title: 'x'.repeat(CHALLENGE_TITLE_MAX + 1) })).errors.title).toBe(`At most ${CHALLENGE_TITLE_MAX} characters.`);
  });

  it('wants the last day on or after the first, and at most two years on', () => {
    expect(challengeBodyFrom(form({ endsOn: '2027-01-01' })).ok).toBe(true);
    expect(challengeBodyFrom(form({ endsOn: '2026-12-31' })).errors.endsOn).toBe('The last day comes after the first.');
    // 730 days after 1 Jan 2027 is 1 Jan 2029 (2028 is a leap year)
    expect(challengeBodyFrom(form({ endsOn: '2028-12-31' })).ok).toBe(true);
    expect(challengeBodyFrom(form({ endsOn: '2029-01-01' })).errors.endsOn).toBe('A challenge can last up to two years.');
  });

  it('takes targets from 1 to the most, whole numbers only', () => {
    for (const target of ['0', '-1', '1.5', String(CHALLENGE_TARGET_MAX + 1), '1e2x']) {
      expect(challengeBodyFrom(form({ target })).ok, target).toBe(false);
    }
    expect(challengeBodyFrom(form({ target: '1' })).ok).toBe(true);
    expect(challengeBodyFrom(form({ target: String(CHALLENGE_TARGET_MAX) })).ok).toBe(true);
  });

  it('sends only what changed for a change, never the measure or a map', () => {
    const existing = { title: 'Most new countries', measure: 'NEW_COUNTRIES', startsOn: '2027-01-01', endsOn: '2027-12-31', target: null };
    expect(challengeBodyFrom(form({ mapId: '' }), { existing })).toEqual({ ok: true, body: {} });
    expect(challengeBodyFrom(form({ mapId: '', target: '5', endsOn: '2027-06-30', measure: 'nonsense' }), { existing })).toEqual({
      ok: true,
      body: { endsOn: '2027-06-30', target: 5 },
    });
  });

  it('can ask for a map on a change too', () => {
    const existing = { title: 'A', startsOn: '2027-01-01', endsOn: '2027-12-31', target: null };
    expect(challengeBodyFrom(form({ mapId: '' }), { existing, needsMap: true }).errors).toEqual({ mapId: 'Choose the map that counts for you.' });
  });
});

describe('the challenge words', () => {
  it('labels a measure, or gives it back', () => {
    expect(measureLabel('THEME_PHOTOS')).toBe('Photos in the monthly themes');
    expect(measureLabel('STEPS')).toBe('STEPS');
  });

  it('counts in the measure’s words', () => {
    expect(countWords('NEW_COUNTRIES', 3)).toBe('3 new countries');
    expect(countWords('LANDMARKS', 1)).toBe('1 landmark');
    expect(countWords('COUNTRIES', 1200)).toBe('1,200 countries');
    expect(countWords('THEME_PHOTOS', 0)).toBe('0 theme photos');
    expect(countWords('STEPS', 4)).toBe('4');
  });

  it('words where a challenge stands and its dates', () => {
    expect(STATUS_WORDS).toEqual({ UPCOMING: 'Starts soon', RUNNING: 'On now', ENDED: 'Finished' });
    expect(dateRange({ startsOn: '2027-01-01', endsOn: '2027-12-31' })).toBe('1 Jan 2027 to 31 Dec 2027');
  });

  it('writes ordinals, the teens included', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111, 112].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st', '111th', '112th',
    ]);
  });
});
