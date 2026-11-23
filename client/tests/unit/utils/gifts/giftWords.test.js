import { describe, expect, it } from 'vitest';
import { GIFT_MESSAGE_MAX, GIFT_STATUS_WORDS, GIFT_TO_NAME_MAX, giftPrice, giftTitle } from '@/utils/gifts/giftWords';
import { PLANS } from '@/utils/constants/plans';

describe('giftWords', () => {
  it('names a year of a plan', () => {
    expect(giftTitle({ months: 12, planName: 'First Class' })).toBe('A year of First Class');
    expect(giftTitle({ months: 12, name: 'Business' })).toBe('A year of Business');
  });

  // Every gift is a year today, so this never shows yet
  it('names some months of a plan without a stray "A"', () => {
    expect(giftTitle({ months: 6, name: 'Business' })).toBe('6 months of Business');
  });

  it('prefers the plan’s name to the gift’s own', () => {
    expect(giftTitle({ months: 12, planName: 'Business', name: 'Something else' })).toBe('A year of Business');
  });

  it('prices an offer in pounds', () => {
    expect(giftPrice({ pence: PLANS.PREMIUM.price.YEAR })).toBe('£99');
    expect(giftPrice({ pence: 4950 })).toBe('£49.50');
  });

  it('words every state a gift can be in, and keeps its limits', () => {
    expect(GIFT_STATUS_WORDS).toEqual({ READY: 'Ready to give', REDEEMED: 'Redeemed', REFUNDED: 'Refunded' });
    expect(Object.isFrozen(GIFT_STATUS_WORDS)).toBe(true);
    expect([GIFT_TO_NAME_MAX, GIFT_MESSAGE_MAX]).toEqual([60, 300]);
  });
});
