// The plans: constants, the plan in force, and the map slots (all pure).
import { describe, expect, it } from 'vitest';
import {
  BILLING_INTERVALS,
  EDITORS_PER_MAP,
  INCLUDED_MAPS,
  LEAVING_PLAN_TTL_MINUTES,
  PEOPLE_PER_TRIP,
  PLANS,
  PLAN_IDS,
  TRANSFER_GRACE_DAYS,
  extraMapPriceText,
  formatPence,
  isTopPlan,
  planOf,
  planView,
  pricesView,
} from '../src/utils/constants/plans.js';
import { addMonths, effectivePlan, extraMapsPaid, grantIsActive, subscriptionCounts } from '../src/utils/plans.js';
import { inGrace, mapSlots } from '../src/utils/mapSlots.js';

const GB = 1000 ** 3;
const NOW = new Date('2026-11-16T12:00:00.000Z');
const days = (n) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

describe('plan constants', () => {
  it('has the three plans with their names, prices and limits', () => {
    expect(PLAN_IDS).toEqual(['FREE', 'REGULAR', 'PREMIUM']);
    expect(BILLING_INTERVALS).toEqual(['MONTH', 'YEAR']);
    expect(PLAN_IDS.map((id) => PLANS[id].name)).toEqual(['Economy', 'Business', 'First Class']);
    expect(PLAN_IDS.map((id) => PLANS[id].price)).toEqual([
      { MONTH: 0, YEAR: 0 },
      { MONTH: 499, YEAR: 4900 },
      { MONTH: 899, YEAR: 8900 },
    ]);
    expect(PLAN_IDS.map((id) => PLANS[id].extraMap)).toEqual([
      { MONTH: 399, YEAR: 3900 },
      { MONTH: 399, YEAR: 3900 },
      { MONTH: 599, YEAR: 5900 },
    ]);
    expect(PLAN_IDS.map((id) => PLANS[id].limits)).toEqual([
      { photosPerCountry: 30, keepsOriginals: false, videos: false, videosPerCountry: 0, storageCapBytes: null },
      { photosPerCountry: 200, keepsOriginals: true, videos: false, videosPerCountry: 0, storageCapBytes: 50 * GB },
      { photosPerCountry: 1000, keepsOriginals: true, videos: true, videosPerCountry: 20, storageCapBytes: 200 * GB },
    ]);
  });

  it('has the shared numbers', () => {
    expect(INCLUDED_MAPS).toBe(1);
    expect(EDITORS_PER_MAP).toBe(10);
    expect(PEOPLE_PER_TRIP).toBe(20);
    expect(TRANSFER_GRACE_DAYS).toBe(60);
    expect(LEAVING_PLAN_TTL_MINUTES).toBe(60);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(PLANS)).toBe(true);
    expect(Object.isFrozen(PLANS.FREE.limits)).toBe(true);
    expect(() => {
      'use strict';
      PLANS.FREE.limits.photosPerCountry = 9999;
    }).toThrow();
  });

  it('treats an unknown plan as FREE, and knows the top one', () => {
    expect(planOf('GOLD')).toBe(PLANS.FREE);
    expect(planOf(undefined)).toBe(PLANS.FREE);
    expect(isTopPlan('PREMIUM')).toBe(true);
    expect(isTopPlan('REGULAR')).toBe(false);
    expect(planView('REGULAR')).toEqual({
      id: 'REGULAR',
      name: 'Business',
      photosPerCountry: 200,
      keepsOriginals: true,
      videos: false,
      videosPerCountry: 0,
      storageCapBytes: 50 * GB,
    });
  });

  it('words prices', () => {
    expect(formatPence(399)).toBe('£3.99');
    expect(formatPence(3900)).toBe('£39');
    expect(formatPence(0)).toBe('£0');
    expect(formatPence(450)).toBe('£4.50');
    expect(extraMapPriceText('FREE')).toBe('An extra map costs £3.99 a month or £39 a year.');
    expect(extraMapPriceText('REGULAR')).toBe('An extra map costs £3.99 a month or £39 a year.');
    expect(extraMapPriceText('PREMIUM')).toBe('An extra map costs £5.99 a month or £59 a year.');
  });

  it('lists every price for GET /billing', () => {
    const prices = pricesView();
    expect(prices.currency).toBe('GBP');
    expect(prices.plans.PREMIUM).toEqual({ MONTH: 899, YEAR: 8900 });
    expect(prices.extraMap.PREMIUM).toEqual({ MONTH: 599, YEAR: 5900 });
    // A copy: changing it changes nothing
    prices.plans.PREMIUM.MONTH = 1;
    expect(PLANS.PREMIUM.price.MONTH).toBe(899);
  });
});

describe('subscriptions that count', () => {
  it('counts active, trialing and past_due only', () => {
    for (const status of ['active', 'trialing', 'past_due']) expect(subscriptionCounts({ status })).toBe(true);
    for (const status of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', null]) {
      expect(subscriptionCounts({ status })).toBe(false);
    }
    expect(subscriptionCounts(null)).toBe(false);
  });

  it('pays for extra maps only while it counts', () => {
    expect(extraMapsPaid({ status: 'active', extraMaps: 3 })).toBe(3);
    expect(extraMapsPaid({ status: 'past_due', extraMaps: 2 })).toBe(2);
    expect(extraMapsPaid({ status: 'canceled', extraMaps: 3 })).toBe(0);
    expect(extraMapsPaid(null)).toBe(0);
    expect(extraMapsPaid({ status: 'active', extraMaps: -1 })).toBe(0);
  });
});

describe('effectivePlan', () => {
  const grant = (plan, startsAt, endsAt) => ({ plan, startsAt, endsAt });

  it('is FREE with nothing', () => {
    expect(effectivePlan({ now: NOW })).toEqual({ plan: 'FREE', source: 'FREE', grant: null });
    expect(effectivePlan({ subscription: null, grants: [], now: NOW })).toMatchObject({ plan: 'FREE', source: 'FREE' });
  });

  it('takes a subscription whose status counts', () => {
    expect(effectivePlan({ subscription: { plan: 'REGULAR', status: 'active' }, now: NOW })).toMatchObject({
      plan: 'REGULAR',
      source: 'STRIPE',
    });
    expect(effectivePlan({ subscription: { plan: 'PREMIUM', status: 'past_due' }, now: NOW }).plan).toBe('PREMIUM');
    expect(effectivePlan({ subscription: { plan: 'PREMIUM', status: 'canceled' }, now: NOW })).toMatchObject({
      plan: 'FREE',
      source: 'FREE',
    });
    expect(effectivePlan({ subscription: { plan: 'PREMIUM', status: 'unpaid' }, now: NOW }).plan).toBe('FREE');
  });

  it('a subscription that only pays for extra maps gives no plan', () => {
    expect(effectivePlan({ subscription: { plan: 'FREE', status: 'active', extraMaps: 2 }, now: NOW })).toMatchObject({
      plan: 'FREE',
      source: 'FREE',
    });
  });

  it('takes a grant only while it runs (start inclusive, end exclusive)', () => {
    const g = grant('PREMIUM', days(-1), days(30));
    expect(effectivePlan({ grants: [g], now: NOW })).toMatchObject({ plan: 'PREMIUM', source: 'COMPLIMENTARY', grant: g });
    expect(effectivePlan({ grants: [grant('PREMIUM', days(1), days(30))], now: NOW }).plan).toBe('FREE');
    expect(effectivePlan({ grants: [grant('PREMIUM', days(-30), NOW)], now: NOW }).plan).toBe('FREE');
    expect(effectivePlan({ grants: [grant('PREMIUM', NOW, days(1))], now: NOW }).plan).toBe('PREMIUM');
    expect(grantIsActive(grant('REGULAR', '2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z'), NOW)).toBe(true);
  });

  it('takes the higher of the subscription and a grant', () => {
    const sub = { plan: 'REGULAR', status: 'active' };
    expect(effectivePlan({ subscription: sub, grants: [grant('PREMIUM', days(-1), days(1))], now: NOW })).toMatchObject({
      plan: 'PREMIUM',
      source: 'COMPLIMENTARY',
    });
    const premium = { plan: 'PREMIUM', status: 'active' };
    const result = effectivePlan({ subscription: premium, grants: [grant('REGULAR', days(-1), days(1))], now: NOW });
    expect(result).toMatchObject({ plan: 'PREMIUM', source: 'STRIPE' });
    // The grant is still reported, for the account page
    expect(result.grant).toMatchObject({ plan: 'REGULAR' });
  });

  it('prefers the subscription on a tie', () => {
    const result = effectivePlan({
      subscription: { plan: 'PREMIUM', status: 'active' },
      grants: [grant('PREMIUM', days(-1), days(1))],
      now: NOW,
    });
    expect(result).toMatchObject({ plan: 'PREMIUM', source: 'STRIPE' });
  });

  it('picks the best grant, the longest-running on a tie', () => {
    const short = grant('PREMIUM', days(-1), days(5));
    const long = grant('PREMIUM', days(-1), days(50));
    const lower = grant('REGULAR', days(-1), days(500));
    expect(effectivePlan({ grants: [short, lower, long], now: NOW }).grant).toBe(long);
  });

  it('ignores grants of unknown plans', () => {
    expect(effectivePlan({ grants: [grant('GOLD', days(-1), days(1))], now: NOW }).plan).toBe('FREE');
  });
});

describe('addMonths', () => {
  it('adds calendar months in UTC, ending a short month on its last day', () => {
    expect(addMonths(new Date('2026-11-16T12:00:00.000Z'), 12).toISOString()).toBe('2027-11-16T12:00:00.000Z');
    expect(addMonths(new Date('2027-01-31T08:00:00.000Z'), 1).toISOString()).toBe('2027-02-28T08:00:00.000Z');
    expect(addMonths(new Date('2028-01-31T08:00:00.000Z'), 1).toISOString()).toBe('2028-02-29T08:00:00.000Z');
    expect(addMonths(new Date('2026-12-15T00:00:00.000Z'), 36).toISOString()).toBe('2029-12-15T00:00:00.000Z');
  });
});

describe('mapSlots', () => {
  const map = (id, createdAt, extra = {}) => ({ id, isDefault: false, createdAt: new Date(createdAt), graceUntil: null, ...extra });
  const home = map('home', '2026-01-01', { isDefault: true });

  it('keeps the default map active, always', () => {
    const slots = mapSlots({ maps: [home], extraMapsPaid: 0, now: NOW });
    expect(slots).toEqual({ activeIds: ['home'], lockedIds: [], slots: 1, used: 1, canCreate: false });
  });

  it('a new account with only its default map has no room for another unpaid map', () => {
    expect(mapSlots({ maps: [home], now: NOW }).canCreate).toBe(false);
    expect(mapSlots({ maps: [home], extraMapsPaid: 1, now: NOW }).canCreate).toBe(true);
  });

  it('activates the paid extra maps oldest first, and locks the rest', () => {
    const maps = [map('c', '2026-03-01'), home, map('a', '2026-02-01'), map('b', '2026-02-15')];
    const slots = mapSlots({ maps, extraMapsPaid: 2, now: NOW });
    expect(slots.activeIds.sort()).toEqual(['a', 'b', 'home']);
    expect(slots.lockedIds).toEqual(['c']);
    expect(slots).toMatchObject({ slots: 3, used: 3, canCreate: false });
  });

  it('locks every extra map when nothing is paid (nothing is deleted)', () => {
    const slots = mapSlots({ maps: [home, map('a', '2026-02-01'), map('b', '2026-03-01')], extraMapsPaid: 0, now: NOW });
    expect(slots.activeIds).toEqual(['home']);
    expect(slots.lockedIds).toEqual(['a', 'b']);
  });

  it('keeps a map in its grace period active without using a paid slot', () => {
    const graced = map('given', '2020-01-01', { graceUntil: days(10) });
    const own = map('own', '2026-05-01');
    const slots = mapSlots({ maps: [home, graced, own], extraMapsPaid: 1, now: NOW });
    expect(slots.activeIds.sort()).toEqual(['given', 'home', 'own']);
    // Grace maps count as used, so there's no room for a new one
    expect(slots).toMatchObject({ used: 3, slots: 2, canCreate: false });
    expect(inGrace(graced, NOW)).toBe(true);
  });

  it('after its grace, a handed-over map queues behind the owner’s own maps', () => {
    const handed = map('given', '2020-01-01', { graceUntil: days(-1) });
    const own = map('own', '2026-05-01');
    const slots = mapSlots({ maps: [home, handed, own], extraMapsPaid: 1, now: NOW });
    expect(slots.activeIds.sort()).toEqual(['home', 'own']);
    expect(slots.lockedIds).toEqual(['given']);
    // Paying for another brings it back
    expect(mapSlots({ maps: [home, handed, own], extraMapsPaid: 2, now: NOW }).lockedIds).toEqual([]);
  });

  it('gives the included slot to the oldest map when there is no default', () => {
    const slots = mapSlots({ maps: [map('b', '2026-03-01'), map('a', '2026-02-01')], extraMapsPaid: 0, now: NOW });
    expect(slots.activeIds).toEqual(['a']);
    expect(slots.lockedIds).toEqual(['b']);
  });

  it('has room for the first map of an account with none', () => {
    expect(mapSlots({ maps: [], now: NOW })).toMatchObject({ used: 0, slots: 1, canCreate: true });
  });

  it('breaks createdAt ties by id, so the answer never flips', () => {
    const maps = [home, map('y', '2026-02-01'), map('x', '2026-02-01')];
    expect(mapSlots({ maps, extraMapsPaid: 1, now: NOW }).lockedIds).toEqual(['y']);
  });
});
