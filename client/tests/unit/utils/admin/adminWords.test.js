import { describe, expect, it } from 'vitest';
import { giftStatusWords, giftWords, jobState, referralWords, storageWords, whenWords } from '@/utils/admin/adminWords';

// Words for the admin overview and the gifts and referrals page (the audit, 26 Nov 2026)
describe('adminWords', () => {
  it('says when, in UTC', () => {
    expect(whenWords('2026-11-26T08:00:30.000Z')).toBe('26 Nov 2026, 08:00 UTC');
    expect(whenWords(null)).toBeNull();
    expect(whenWords('not a date')).toBeNull();
  });

  it('says how much is stored', () => {
    expect(storageWords(0)).toBe('Nothing yet');
    expect(storageWords(null)).toBe('Nothing yet');
    expect(storageWords(2_500)).toBe('3 KB');
    expect(storageWords(340_000_000)).toBe('340 MB');
    expect(storageWords(1_234_000_000)).toBe('1.2 GB');
    expect(storageWords(45_000_000_000)).toBe('45 GB');
    expect(storageWords(2_100_000_000_000)).toBe('2.1 TB');
  });

  it('says how a daily job went: a problem outranks being late, late outranks a warning', () => {
    expect(jobState({ lastRunAt: null })).toEqual({ label: 'Not run yet', tone: 'warning' });
    expect(jobState({ lastRunAt: 'x', level: 'INFO', problems: [], warnings: [], late: false })).toEqual({ label: 'Ran fine', tone: 'good' });
    expect(jobState({ lastRunAt: 'x', level: 'WARNING', problems: [], warnings: ['w'], late: false })).toEqual({ label: 'Ran, with a warning', tone: 'warning' });
    expect(jobState({ lastRunAt: 'x', level: 'WARNING', problems: [], warnings: ['w'], late: true }).label).toBe('Late: no run in over a day');
    expect(jobState({ lastRunAt: 'x', level: 'ERROR', problems: ['p'], warnings: [], late: true })).toEqual({ label: 'Had a problem', tone: 'critical' });
  });

  it('says what a gift is and how it stands', () => {
    expect(giftWords({ months: 12, plan: 'REGULAR', planName: 'Business', amountPence: 4900 })).toBe('A year of Business, £49');
    expect(giftWords({ months: 6, plan: 'PREMIUM', amountPence: 4950 })).toBe('6 months of First Class, £49.50');
    expect(giftStatusWords('READY')).toBe('Paid, not redeemed yet');
    expect(giftStatusWords('REFUNDED')).toBe('Refunded: it no longer works');
    expect(giftStatusWords('ODD')).toBe('ODD');
  });

  it('says what a referral reward gave', () => {
    expect(referralWords({ kind: 'CREDIT', amountPence: 499 })).toBe('£4.99 off their bill');
    expect(referralWords({ kind: 'GRANT', grant: { planName: 'Business' } })).toBe('A month of Business');
    expect(referralWords({ kind: 'CAPPED' })).toBe('Nothing: 12 this year already');
  });
});
