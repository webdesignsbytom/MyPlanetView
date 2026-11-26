// "On this day" emails: the rules (src/utils/onThisDay.js), pure.
import { describe, expect, it } from 'vitest';
import {
  anniversaryDay,
  anniversaryOf,
  anniversaryWords,
  canSendAgain,
  inCountry,
  memoryWords,
  photoLinkToken,
  pickAnniversary,
  pickMemory,
  tokenMatches,
  unsubscribeToken,
} from '../src/utils/onThisDay.js';

describe('anniversaryOf', () => {
  it('looks for today in earlier years', () => {
    expect(anniversaryOf(new Date('2026-11-21T08:00:00Z'))).toEqual({ month: 11, days: [21], before: new Date('2026-01-01T00:00:00Z') });
  });
  it('gives a leap-day photo its day on 28 February in other years', () => {
    expect(anniversaryOf(new Date('2027-02-28T08:00:00Z')).days).toEqual([28, 29]);
    expect(anniversaryOf(new Date('2028-02-28T08:00:00Z')).days).toEqual([28]);
    expect(anniversaryOf(new Date('2028-02-29T08:00:00Z')).days).toEqual([29]);
  });
});

describe('canSendAgain', () => {
  const now = new Date('2026-11-21T08:00:00Z');
  it('sends the first, then once a week (a run a little early still counts)', () => {
    expect(canSendAgain(null, now)).toBe(true);
    expect(canSendAgain(new Date('2026-11-14T08:30:00Z'), now)).toBe(true);
    expect(canSendAgain(new Date('2026-11-18T08:00:00Z'), now)).toBe(false);
  });
});

describe('pickMemory', () => {
  const photos = [
    { photoId: 'a', countryName: null, landmarkName: null },
    { photoId: 'b', countryName: 'Japan', landmarkName: null },
    { photoId: 'c', countryName: 'Japan', landmarkName: 'Fushimi Inari-taisha' },
    { photoId: 'd', countryName: 'Italy', landmarkName: 'Colosseum' },
  ];
  it('takes one at a landmark first, the same for the same day', () => {
    const pick = pickMemory(photos, '2026-11-21:user');
    expect(['c', 'd']).toContain(pick.photoId);
    expect(pickMemory([...photos].reverse(), '2026-11-21:user').photoId).toBe(pick.photoId);
  });
  it('then one in a country, then any', () => {
    expect(pickMemory(photos.slice(0, 2), 'x').photoId).toBe('b');
    expect(pickMemory(photos.slice(0, 1), 'x').photoId).toBe('a');
    expect(pickMemory([], 'x')).toBeNull();
  });
});

describe('memoryWords', () => {
  it('says how long ago, and where', () => {
    expect(memoryWords({ years: 3, landmarkName: 'Fushimi Inari-taisha', countryName: 'Japan' })).toEqual({
      subject: '3 years ago today: Fushimi Inari-taisha',
      headline: '3 years ago today you were in Japan',
      caption: 'Fushimi Inari-taisha, Japan',
    });
    expect(memoryWords({ years: 1, countryName: 'United Kingdom' })).toMatchObject({
      subject: 'A year ago today: United Kingdom',
      headline: 'A year ago today you were in the United Kingdom',
    });
    expect(memoryWords({ years: 2, mapName: 'Our travels' })).toEqual({
      subject: '2 years ago today, on your map',
      headline: '2 years ago today, from “Our travels”',
      caption: '',
    });
  });
  it('puts "the" before the names that take it', () => {
    expect(inCountry('Netherlands')).toBe('in the Netherlands');
    expect(inCountry('Faroe Islands')).toBe('in the Faroe Islands');
    expect(inCountry('France')).toBe('in France');
  });
});

describe('signed links', () => {
  it('match only their own value and secret', () => {
    const token = unsubscribeToken('user-1', 's3cret');
    expect(tokenMatches(token, unsubscribeToken('user-1', 's3cret'))).toBe(true);
    expect(tokenMatches(token, unsubscribeToken('user-2', 's3cret'))).toBe(false);
    expect(tokenMatches(token, unsubscribeToken('user-1', 'other'))).toBe(false);
    expect(tokenMatches(photoLinkToken('user-1', 's3cret'), token)).toBe(false);
    expect(tokenMatches(undefined, token)).toBe(false);
  });
});

describe('anniversaries (moments dated to the day)', () => {
  it('reads the viewer’s own today, and nothing else', () => {
    expect(anniversaryDay('2026-11-21')).toEqual({ month: 11, days: [21], before: new Date('2026-01-01T00:00:00Z') });
    expect(anniversaryDay('2027-02-28').days).toEqual([28, 29]);
    expect(anniversaryDay('2026-02-30')).toBeNull();
    expect(anniversaryDay('21/11/2026')).toBeNull();
    expect(anniversaryDay(undefined)).toBeNull();
  });
  it('picks a day of life (a wedding, a birth) before any other moment', () => {
    const moments = [
      { momentId: 'a', kind: 'SAW_OR_DID' },
      { momentId: 'b', kind: 'WEDDING' },
      { momentId: 'c', kind: 'CELEBRATION' },
    ];
    expect(pickAnniversary(moments, 'x').momentId).toBe('b');
    expect(['a', 'c']).toContain(pickAnniversary([moments[0], moments[2]], 'x').momentId);
    expect(pickAnniversary([], 'x')).toBeNull();
    expect(pickAnniversary(undefined, 'x')).toBeNull();
  });
  it('says it in words', () => {
    expect(anniversaryWords({ years: 10, title: 'Our wedding', countryName: 'Italy' })).toEqual({
      subject: '10 years ago today: Our wedding',
      headline: '10 years ago today, in Italy',
      caption: 'Our wedding',
    });
    expect(anniversaryWords({ years: 1, title: 'Mia was born', countryName: 'United Kingdom' }).headline).toBe('A year ago today, in the United Kingdom');
  });
});

describe('the day’s memory emails (the audit, 26 Nov 2026)', () => {
  it('reads MEMORY_EMAILS_PER_DAY: a whole number from 0, else 60', async () => {
    const { memoryEmailsPerDay, MEMORY_EMAILS_PER_DAY_DEFAULT } = await import('../src/utils/onThisDay.js');
    expect(MEMORY_EMAILS_PER_DAY_DEFAULT).toBe(60);
    expect(memoryEmailsPerDay(undefined)).toBe(60);
    expect(memoryEmailsPerDay('')).toBe(60);
    expect(memoryEmailsPerDay('  ')).toBe(60);
    expect(memoryEmailsPerDay('0')).toBe(0);
    expect(memoryEmailsPerDay('250')).toBe(250);
    expect(memoryEmailsPerDay('-5')).toBe(60);
    expect(memoryEmailsPerDay('12.5')).toBe(60);
    expect(memoryEmailsPerDay('lots')).toBe(60);
  });

  it('knows Resend’s quota errors', async () => {
    const { isQuotaError } = await import('../src/utils/onThisDay.js');
    expect(isQuotaError('daily_quota_exceeded')).toBe(true);
    expect(isQuotaError('monthly_quota_exceeded')).toBe(true);
    expect(isQuotaError('rate_limit_exceeded')).toBe(false);
    expect(isQuotaError('validation_error')).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
  });
});
