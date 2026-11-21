// Give a month, get a month (src/utils/referrals.js), pure.
import { describe, expect, it } from 'vitest';
import { PROMO_CODE_PATTERN, FOR_LIFE_ENDS_AT } from '../src/utils/promoCodes.js';
import { REFERRAL_REWARDS_PER_YEAR, firstNameOf, paysByCard, referralCodeFor, referralRewardFor, referralTotals } from '../src/utils/referrals.js';

const NOW = new Date('2026-11-21T12:00:00Z');

describe('referralCodeFor', () => {
  it('is the first name and four random characters, a valid promo code', () => {
    const code = referralCodeFor('Sam Carter', Buffer.from([0, 1, 2, 3]));
    expect(code).toBe('SAM2345');
    expect(PROMO_CODE_PATTERN.test(code)).toBe(true);
    expect(referralCodeFor('Zoë', Buffer.from([0, 0, 0, 0]))).toBe('ZOE2222');
    expect(referralCodeFor('Bartholomew-Jones', Buffer.from([0, 0, 0, 0]))).toBe('BARTHOLO2222');
    expect(referralCodeFor('李', Buffer.from([0, 0, 0, 0]))).toBe('FRIEND2222');
    expect(referralCodeFor(null).startsWith('FRIEND')).toBe(true);
  });
});

describe('referralRewardFor', () => {
  const card = { stripeCustomerId: 'cus_1', plan: 'PREMIUM', status: 'active' };
  it('takes a month of their plan off the next invoice when they pay by card', () => {
    expect(paysByCard(card)).toBe(true);
    expect(referralRewardFor({ subscription: card, now: NOW })).toEqual({ kind: 'CREDIT', amountPence: 999 });
    expect(referralRewardFor({ subscription: { ...card, plan: 'REGULAR', status: 'trialing' }, now: NOW })).toEqual({ kind: 'CREDIT', amountPence: 499 });
  });
  it('else gives a month of Business, or of the plan a membership gives them', () => {
    expect(referralRewardFor({ now: NOW })).toEqual({ kind: 'GRANT', plan: 'REGULAR' });
    expect(referralRewardFor({ subscription: { ...card, status: 'canceled' }, now: NOW })).toEqual({ kind: 'GRANT', plan: 'REGULAR' });
    // Extra maps alone are no plan to take a month off
    expect(referralRewardFor({ subscription: { ...card, plan: 'FREE' }, now: NOW })).toEqual({ kind: 'GRANT', plan: 'REGULAR' });
    const grant = { plan: 'PREMIUM', startsAt: new Date('2026-11-01'), endsAt: new Date('2027-11-01') };
    expect(referralRewardFor({ grants: [grant], now: NOW })).toEqual({ kind: 'GRANT', plan: 'PREMIUM' });
  });
  it('gives nothing past twelve a year, or to a plan that’s theirs for life', () => {
    expect(referralRewardFor({ subscription: card, rewardsThisYear: REFERRAL_REWARDS_PER_YEAR, now: NOW })).toEqual({ kind: 'CAPPED' });
    const forLife = { plan: 'PREMIUM', startsAt: new Date('2026-01-01'), endsAt: FOR_LIFE_ENDS_AT };
    expect(referralRewardFor({ grants: [forLife], now: NOW })).toEqual({ kind: 'CAPPED' });
  });
});

describe('referralTotals', () => {
  it('counts the months given, and those left in the last year', () => {
    const rewards = [
      { kind: 'GRANT', createdAt: new Date('2026-10-01') },
      { kind: 'CREDIT', createdAt: new Date('2025-01-01') },
      { kind: 'CAPPED', createdAt: new Date('2026-11-01') },
    ];
    expect(referralTotals(rewards, NOW)).toEqual({ monthsEarned: 2, monthsLeftThisYear: 11 });
    expect(referralTotals([], NOW)).toEqual({ monthsEarned: 0, monthsLeftThisYear: 12 });
  });
  it('names the friend by first name', () => {
    expect(firstNameOf('Sam Carter')).toBe('Sam');
    expect(firstNameOf('  ')).toBeNull();
    expect(firstNameOf(null)).toBeNull();
  });
});
