// Gifts of a year of a plan: the rules (src/utils/gifts.js), pure.
import { describe, expect, it } from 'vitest';
import { giftOffers, giftStatus, giftWindow, lifetimeCoversGift, parseGiftOrder, subscriptionCoversGift } from '../src/utils/gifts.js';
import { FOR_LIFE_ENDS_AT } from '../src/utils/promoCodes.js';

const NOW = new Date('2026-12-20T10:00:00Z');

describe('parseGiftOrder', () => {
  it('takes a paid plan, with a name and message cleaned', () => {
    expect(parseGiftOrder({ plan: 'PREMIUM', toName: ' <i>Jo</i> ', message: 'Happy Christmas!' })).toEqual({
      plan: 'PREMIUM',
      toName: 'Jo',
      message: 'Happy Christmas!',
    });
    expect(parseGiftOrder({ plan: 'REGULAR', toName: '', message: null })).toEqual({ plan: 'REGULAR', toName: null, message: null });
  });
  it('refuses Economy, an unknown plan, or text too long or not text', () => {
    expect(parseGiftOrder({ plan: 'FREE' })).toEqual({ error: 'invalidGiftPlan' });
    expect(parseGiftOrder({})).toEqual({ error: 'invalidGiftPlan' });
    expect(parseGiftOrder({ plan: 'REGULAR', toName: 'x'.repeat(61) })).toEqual({ error: 'invalidGiftText' });
    expect(parseGiftOrder({ plan: 'REGULAR', message: 'x'.repeat(301) })).toEqual({ error: 'invalidGiftText' });
    expect(parseGiftOrder({ plan: 'REGULAR', message: 42 })).toEqual({ error: 'invalidGiftText' });
  });
  it('offers both paid plans for a year at their yearly prices', () => {
    expect(giftOffers()).toEqual([
      { plan: 'REGULAR', name: 'Business', months: 12, pence: 4900 },
      { plan: 'PREMIUM', name: 'First Class', months: 12, pence: 9900 },
    ]);
  });
});

describe('giftStatus', () => {
  it('reads unpaid, ready, redeemed and refunded', () => {
    expect(giftStatus({})).toBe('UNPAID');
    expect(giftStatus({ paidAt: NOW })).toBe('READY');
    expect(giftStatus({ paidAt: NOW, redeemedAt: NOW })).toBe('REDEEMED');
    expect(giftStatus({ paidAt: NOW, refundedAt: NOW })).toBe('REFUNDED');
  });
});

describe('who a gift is no use to', () => {
  it('someone paying for that plan or better', () => {
    expect(subscriptionCoversGift({ plan: 'PREMIUM', status: 'active' }, 'REGULAR')).toBe(true);
    expect(subscriptionCoversGift({ plan: 'REGULAR', status: 'trialing' }, 'REGULAR')).toBe(true);
    expect(subscriptionCoversGift({ plan: 'REGULAR', status: 'active' }, 'PREMIUM')).toBe(false);
    expect(subscriptionCoversGift({ plan: 'PREMIUM', status: 'canceled' }, 'PREMIUM')).toBe(false);
    expect(subscriptionCoversGift(null, 'PREMIUM')).toBe(false);
  });
  it('someone with that plan or better for life', () => {
    const life = { plan: 'PREMIUM', startsAt: new Date('2026-01-01'), endsAt: FOR_LIFE_ENDS_AT };
    expect(lifetimeCoversGift([life], 'REGULAR', NOW)).toBe(true);
    expect(lifetimeCoversGift([{ ...life, plan: 'REGULAR' }], 'PREMIUM', NOW)).toBe(false);
    expect(lifetimeCoversGift([{ ...life, endsAt: new Date('2027-06-01') }], 'PREMIUM', NOW)).toBe(false);
  });
});

describe('giftWindow', () => {
  it('runs a year from now', () => {
    expect(giftWindow({ grants: [], plan: 'PREMIUM', now: NOW })).toEqual({ startsAt: NOW, endsAt: new Date('2027-12-20T10:00:00Z') });
  });
  it('starts after the same plan’s years already running or waiting, one after another', () => {
    const grants = [
      { plan: 'PREMIUM', startsAt: new Date('2026-06-01'), endsAt: new Date('2027-06-01') },
      { plan: 'PREMIUM', startsAt: new Date('2027-06-01'), endsAt: new Date('2028-06-01') },
      // Another plan's year doesn't hold it back
      { plan: 'REGULAR', startsAt: new Date('2026-01-01'), endsAt: new Date('2030-01-01') },
    ];
    expect(giftWindow({ grants, plan: 'PREMIUM', now: NOW })).toEqual({ startsAt: new Date('2028-06-01'), endsAt: new Date('2029-06-01') });
  });
  it('ignores a year that has ended', () => {
    const grants = [{ plan: 'PREMIUM', startsAt: new Date('2024-01-01'), endsAt: new Date('2025-01-01') }];
    expect(giftWindow({ grants, plan: 'PREMIUM', now: NOW }).startsAt).toEqual(NOW);
  });
});
