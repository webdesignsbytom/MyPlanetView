import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  REFUND_DAYS,
  billingFrom,
  extraMapPrice,
  extraMapSentence,
  forgetPendingMap,
  goToUrl,
  hasSubscription,
  planCardLabel,
  planPrice,
  priceText,
  readPendingMap,
  savePendingMap,
} from '@/utils/plans/billing';

afterEach(() => vi.useRealTimers());

describe('hasSubscription', () => {
  it('counts a subscription until it has ended', () => {
    for (const status of ['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused']) expect(hasSubscription({ status })).toBe(true);
    expect(hasSubscription({ status: 'canceled' })).toBe(false);
    expect(hasSubscription({ status: 'incomplete_expired' })).toBe(false);
    expect(hasSubscription({ status: null })).toBe(false);
    expect(hasSubscription(null)).toBe(false);
  });
});

describe('prices', () => {
  it('words a price and its interval', () => {
    expect(priceText(499, 'MONTH')).toBe('£4.99 a month');
    expect(priceText(4900, 'YEAR')).toBe('£49 a year');
    expect(priceText(399, undefined)).toBe('£3.99');
    expect(REFUND_DAYS).toBe(14);
  });

  it('takes the server’s prices when it sent them, else the constants', () => {
    expect(planPrice(null, 'REGULAR', 'MONTH')).toBe(499);
    expect(planPrice({ prices: { plans: { REGULAR: { MONTH: 550 } } } }, 'REGULAR', 'MONTH')).toBe(550);
    expect(extraMapPrice({ plan: 'PREMIUM' }, 'YEAR')).toBe(5900);
    expect(extraMapPrice({ plan: 'PREMIUM', prices: { extraMap: { PREMIUM: { YEAR: 6000 } } } }, 'YEAR')).toBe(6000);
    expect(extraMapPrice(null, 'MONTH')).toBe(399);
  });

  it('says what an extra map costs on the account’s plan', () => {
    expect(extraMapSentence({ plan: 'FREE' })).toBe('An extra map is £3.99 a month or £39 a year.');
    expect(extraMapSentence({ plan: 'PREMIUM' })).toBe('An extra map is £5.99 a month or £59 a year.');
  });

  it('takes the new billing from an answer, else null', () => {
    expect(billingFrom({ billing: { plan: 'REGULAR' } })).toEqual({ plan: 'REGULAR' });
    expect(billingFrom({ url: 'https://checkout.example' })).toBeNull();
    expect(billingFrom(undefined)).toBeNull();
  });
});

describe('goToUrl', () => {
  it('sends the browser to the address', () => {
    goToUrl('#account-plan');
    expect(window.location.hash).toBe('#account-plan');
  });
});

describe('the new map waiting for its payment', () => {
  it('keeps it for the same account for an hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T10:00:00Z'));
    savePendingMap('u1', { name: 'Japan 2027', groupType: 'SOLO' });
    expect(readPendingMap('u1')).toEqual({ name: 'Japan 2027', groupType: 'SOLO' });
    expect(readPendingMap('u2')).toBeNull();
    vi.setSystemTime(new Date('2026-11-22T11:00:00Z'));
    expect(readPendingMap('u1')).not.toBeNull();
    vi.setSystemTime(new Date('2026-11-22T11:00:00.001Z'));
    expect(readPendingMap('u1')).toBeNull();
  });

  it('is in this tab’s session storage, and goes when forgotten', () => {
    savePendingMap('u1', { name: 'A' });
    expect(JSON.parse(sessionStorage.getItem('mpv:pendingNewMap'))).toMatchObject({ userId: 'u1', body: { name: 'A' } });
    forgetPendingMap();
    expect(readPendingMap('u1')).toBeNull();
  });

  it('ignores a kept body with no name, or one that isn’t JSON', () => {
    sessionStorage.setItem('mpv:pendingNewMap', JSON.stringify({ userId: 'u1', body: { name: 5 }, savedAt: Date.now() }));
    expect(readPendingMap('u1')).toBeNull();
    sessionStorage.setItem('mpv:pendingNewMap', '{oops');
    expect(readPendingMap('u1')).toBeNull();
  });
});

describe('planCardLabel', () => {
  it('signed out, each card starts a map', () => {
    expect(planCardLabel({ planId: 'FREE', signedIn: false })).toBe('Start your map');
    expect(planCardLabel({ planId: 'REGULAR', signedIn: false, currentPlan: 'REGULAR' })).toBe('Start with Business');
  });

  it('signed in, the account’s plan is "Your plan", a lower one "Move to", a higher one "Choose"', () => {
    expect(planCardLabel({ planId: 'REGULAR', signedIn: true, currentPlan: 'REGULAR' })).toBe('Your plan');
    expect(planCardLabel({ planId: 'FREE', signedIn: true, currentPlan: 'PREMIUM' })).toBe('Move to Economy');
    expect(planCardLabel({ planId: 'REGULAR', signedIn: true, currentPlan: 'PREMIUM' })).toBe('Move to Business');
    expect(planCardLabel({ planId: 'PREMIUM', signedIn: true, currentPlan: 'FREE' })).toBe('Choose First Class');
    expect(planCardLabel({ planId: 'FREE', signedIn: true, currentPlan: 'FREE' })).toBe('Your plan');
  });

  it('signed in with the plan not known yet, every card is "Choose"', () => {
    expect(planCardLabel({ planId: 'FREE', signedIn: true })).toBe('Choose Economy');
    expect(planCardLabel({ planId: 'PREMIUM', signedIn: true, currentPlan: null })).toBe('Choose First Class');
  });
});
