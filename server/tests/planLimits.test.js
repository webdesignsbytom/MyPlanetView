// The plan limits on photos and people, the leaving plan, and Stripe's subscription
// state (all pure).
import { describe, expect, it } from 'vitest';
import {
  LOCKED_MAP_MESSAGE,
  PEOPLE_CAP_MESSAGES,
  bestCopySize,
  checkCountryCap,
  checkEditorCap,
  checkPhotoSizesForPlan,
  checkStorageCap,
  checkTripPeopleCap,
  countryFullMessage,
} from '../src/utils/planLimits.js';
import { heirFor, heirOf, parseLeavingPlan, usableLeavingPlan } from '../src/utils/leavingPlan.js';
import {
  hasLiveSubscription,
  shouldApplySubscriptionEvent,
  subscriptionStateFrom,
} from '../src/utils/stripeState.js';
import { PHOTO_CONTENT_TYPES, PHOTO_MAX_BYTES } from '../src/utils/constants/mediaConstants.js';
import { PHOTO_SIZES } from '../src/utils/travelValidation.js';

const GB = 1000 ** 3;

describe('which copies a photo keeps', () => {
  it('Economy: a PRINT copy, never the original', () => {
    expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY', 'PRINT'], 'FREE')).toBeNull();
    expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY', 'ORIGINAL'], 'FREE')).toBe(
      'Economy keeps a print-quality copy, not the original.'
    );
    expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY', 'ORIGINAL', 'PRINT'], 'FREE')).toBe(
      'Economy keeps a print-quality copy, not the original.'
    );
    expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY'], 'FREE')).toMatch(/PRINT copy/);
  });

  it('Business and First Class: the original (optional), never a print copy', () => {
    for (const plan of ['REGULAR', 'PREMIUM']) {
      expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY', 'ORIGINAL'], plan)).toBeNull();
      expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY'], plan)).toBeNull();
      expect(checkPhotoSizesForPlan(['THUMB', 'DISPLAY', 'PRINT'], plan)).toMatch(/no print copy/);
    }
  });

  it('the best copy is the original, else the print copy', () => {
    expect(bestCopySize(['THUMB', 'DISPLAY', 'ORIGINAL'])).toBe('ORIGINAL');
    expect(bestCopySize(['THUMB', 'DISPLAY', 'PRINT'])).toBe('PRINT');
    expect(bestCopySize(['THUMB', 'DISPLAY'])).toBeNull();
  });

  it('the print copy is a JPEG of at most 5 MB', () => {
    expect(PHOTO_SIZES).toContain('PRINT');
    expect(PHOTO_CONTENT_TYPES.PRINT).toEqual(['image/jpeg']);
    expect(PHOTO_MAX_BYTES.PRINT).toBe(5 * 1024 * 1024);
  });
});

describe('photos per country', () => {
  it('allows up to the plan’s cap, counting what is there now', () => {
    expect(checkCountryCap({ count: 29, planId: 'FREE', countryName: 'France' })).toBeNull();
    expect(checkCountryCap({ count: 30, planId: 'FREE', countryName: 'France' })).toBe(
      '30 of 30 photos of France on this map. Upgrade to add more.'
    );
    expect(checkCountryCap({ count: 199, planId: 'REGULAR', countryName: 'Japan' })).toBeNull();
    expect(checkCountryCap({ count: 200, planId: 'REGULAR', countryName: 'Japan' })).toBe(
      '200 of 200 photos of Japan on this map. Upgrade to add more.'
    );
  });

  it('has no upgrade line on First Class, and writes thousands with a comma', () => {
    expect(checkCountryCap({ count: 1000, planId: 'PREMIUM', countryName: 'Italy' })).toBe(
      '1,000 of 1,000 photos of Italy on this map.'
    );
  });

  it('never says more than the cap (a map over it after a downgrade)', () => {
    expect(checkCountryCap({ count: 150, planId: 'FREE', countryName: 'Spain' })).toBe(
      '30 of 30 photos of Spain on this map. Upgrade to add more.'
    );
    expect(countryFullMessage({ count: 30, cap: 30, countryName: 'France', planId: 'FREE' })).toMatch(/^30 of 30/);
  });
});

describe('the storage safety net', () => {
  it('Economy has none', () => {
    expect(checkStorageCap({ storedBytes: 900 * GB, addingBytes: 10 * GB, planId: 'FREE' })).toBeNull();
  });

  it('Business stops at 50 GB a map, First Class at 200 GB', () => {
    expect(checkStorageCap({ storedBytes: 50 * GB - 100, addingBytes: 100, planId: 'REGULAR' })).toBeNull();
    expect(checkStorageCap({ storedBytes: 50 * GB - 100, addingBytes: 101, planId: 'REGULAR' })).toBe(
      'This map has used its 50 GB of photo storage. Delete some photos to add more.'
    );
    expect(checkStorageCap({ storedBytes: 100 * GB, addingBytes: GB, planId: 'PREMIUM' })).toBeNull();
    expect(checkStorageCap({ storedBytes: 200 * GB, addingBytes: 1, planId: 'PREMIUM' })).toMatch(/200 GB/);
  });
});

describe('people', () => {
  it('a map takes up to 10 editors', () => {
    expect(checkEditorCap({ editors: 9 })).toBeNull();
    expect(checkEditorCap({ editors: 10 })).toBe('A map can have up to 10 editors.');
    expect(PEOPLE_CAP_MESSAGES.editors).toBe('A map can have up to 10 editors.');
  });

  it('a trip takes up to 20 people', () => {
    expect(checkTripPeopleCap({ people: 19 })).toBeNull();
    expect(checkTripPeopleCap({ people: 20 })).toBe('A trip can have up to 20 people.');
  });

  it('a locked map says why', () => {
    expect(LOCKED_MAP_MESSAGE).toMatch(/^This map isn't paid for, so it can't take new photos\./);
  });
});

describe('the leaving plan', () => {
  const owned = [
    { id: 'map-a', memberIds: ['mum', 'gran'] },
    { id: 'map-b', memberIds: [] },
  ];

  it('takes every owned map once, with a member as each transfer’s target', () => {
    const body = { maps: [{ mapId: 'map-a', action: 'TRANSFER', toUserId: 'mum' }, { mapId: 'map-b', action: 'DELETE' }] };
    expect(parseLeavingPlan(body, owned)).toEqual({
      value: {
        maps: [{ mapId: 'map-a', action: 'TRANSFER', toUserId: 'mum' }, { mapId: 'map-b', action: 'DELETE' }],
        leavePhotos: true,
      },
    });
    expect(parseLeavingPlan({ ...body, leavePhotos: false }, owned).value.leavePhotos).toBe(false);
    expect(parseLeavingPlan({ maps: [] }, [])).toEqual({ value: { maps: [], leavePhotos: true } });
  });

  it('refuses anything else', () => {
    const transferA = { mapId: 'map-a', action: 'TRANSFER', toUserId: 'mum' };
    const deleteB = { mapId: 'map-b', action: 'DELETE' };
    const bad = [
      null,
      [],
      { maps: 'all' },
      { maps: [transferA] }, // map-b missing
      { maps: [transferA, deleteB, deleteB] }, // twice
      { maps: [transferA, deleteB, { mapId: 'someone-elses', action: 'DELETE' }] },
      { maps: [{ ...transferA, toUserId: 'stranger' }, deleteB] },
      { maps: [{ mapId: 'map-a', action: 'TRANSFER' }, deleteB] },
      { maps: [transferA, { ...deleteB, toUserId: 'mum' }] },
      { maps: [{ ...transferA, action: 'KEEP' }, deleteB] },
      { maps: [transferA, deleteB], leavePhotos: 'yes' },
    ];
    for (const body of bad) expect(parseLeavingPlan(body, owned)).toEqual({ error: true });
  });

  it('is used only within the hour after it was saved', () => {
    const saved = new Date('2026-11-16T12:00:00.000Z');
    const profile = { leavingPlan: { maps: [], leavePhotos: false }, leavingPlanAt: saved };
    expect(usableLeavingPlan(profile, new Date('2026-11-16T12:59:00.000Z'))).toEqual({ maps: [], leavePhotos: false });
    expect(usableLeavingPlan(profile, new Date('2026-11-16T13:01:00.000Z'))).toBeNull();
    expect(usableLeavingPlan(profile, new Date('2026-11-16T11:00:00.000Z'))).toBeNull();
    expect(usableLeavingPlan(null)).toBeNull();
    expect(usableLeavingPlan({ leavingPlan: null, leavingPlanAt: saved }, saved)).toBeNull();
  });

  it('picks each map’s next owner: the plan’s choice, else the longest-standing active editor', () => {
    const members = [
      { userId: 'viewer', role: 'VIEWER', user: { isActive: true } },
      { userId: 'sleepy', role: 'EDITOR', user: { isActive: false } },
      { userId: 'mum', role: 'EDITOR', user: { isActive: true } },
    ];
    const map = { id: 'm', members };
    expect(heirFor(map, undefined)).toBe('mum');
    expect(heirFor(map, { action: 'TRANSFER', toUserId: 'viewer' })).toBe('viewer');
    expect(heirFor(map, { action: 'DELETE' })).toBeNull();
    // Someone who has left the map since falls back to the default
    expect(heirFor(map, { action: 'TRANSFER', toUserId: 'gone' })).toBe('mum');
    expect(heirFor({ id: 'solo', members: [] }, undefined)).toBeNull();
    expect(heirOf([{ userId: 'sleepy', user: { isActive: false } }])).toBe('sleepy');
  });
});

describe('Stripe subscription state', () => {
  const prices = {
    price_reg_m: { kind: 'plan', plan: 'REGULAR', interval: 'MONTH' },
    price_prem_y: { kind: 'plan', plan: 'PREMIUM', interval: 'YEAR' },
    price_extra_m: { kind: 'extraMap', interval: 'MONTH' },
    price_extra_prem_y: { kind: 'extraMap', interval: 'YEAR' },
  };
  const priceKind = (id) => prices[id] ?? null;
  const sub = (items, extra = {}) => ({
    id: 'sub_1',
    status: 'active',
    cancel_at_period_end: false,
    items: { data: items.map(([price, quantity, end]) => ({ price: { id: price }, quantity, current_period_end: end })) },
    ...extra,
  });

  it('reads the plan line, the extra-map quantity and the period end', () => {
    const state = subscriptionStateFrom(sub([['price_reg_m', 1, 1800000000], ['price_extra_m', 2, 1800000000]]), priceKind);
    expect(state).toEqual({
      stripeSubscriptionId: 'sub_1',
      plan: 'REGULAR',
      interval: 'MONTH',
      extraMaps: 2,
      status: 'active',
      currentPeriodEnd: new Date(1800000000 * 1000),
      cancelAtPeriodEnd: false,
    });
  });

  it('a subscription of extra maps only is FREE, on that line’s interval', () => {
    expect(subscriptionStateFrom(sub([['price_extra_prem_y', 3]]), priceKind)).toMatchObject({
      plan: 'FREE',
      interval: 'YEAR',
      extraMaps: 3,
    });
  });

  it('ignores prices the site doesn’t sell, and reads the cancel flag or date', () => {
    expect(subscriptionStateFrom(sub([['price_other', 1], ['price_prem_y', 1]]), priceKind)).toMatchObject({ plan: 'PREMIUM' });
    expect(subscriptionStateFrom(sub([['price_prem_y', 1]], { cancel_at_period_end: true }), priceKind).cancelAtPeriodEnd).toBe(true);
    expect(subscriptionStateFrom(sub([['price_prem_y', 1]], { cancel_at: 1800000000 }), priceKind).cancelAtPeriodEnd).toBe(true);
  });

  it('a deleted subscription is FREE with no extra maps, canceled', () => {
    expect(subscriptionStateFrom(sub([['price_reg_m', 1], ['price_extra_m', 2]]), priceKind, { deleted: true })).toMatchObject({
      plan: 'FREE',
      extraMaps: 0,
      status: 'canceled',
      cancelAtPeriodEnd: false,
    });
  });

  it('knows a live subscription', () => {
    expect(hasLiveSubscription({ stripeSubscriptionId: 'sub_1', status: 'active' })).toBe(true);
    expect(hasLiveSubscription({ stripeSubscriptionId: 'sub_1', status: 'past_due' })).toBe(true);
    expect(hasLiveSubscription({ stripeSubscriptionId: 'sub_1', status: 'incomplete' })).toBe(true);
    expect(hasLiveSubscription({ stripeSubscriptionId: 'sub_1', status: 'canceled' })).toBe(false);
    expect(hasLiveSubscription({ stripeSubscriptionId: null, status: null })).toBe(false);
    expect(hasLiveSubscription(null)).toBe(false);
  });

  it('skips late events: about an old ended subscription, or reviving a canceled one', () => {
    const row = { stripeSubscriptionId: 'sub_new', status: 'active' };
    expect(shouldApplySubscriptionEvent(row, { id: 'sub_old', status: 'canceled' })).toBe(false);
    expect(shouldApplySubscriptionEvent(row, { id: 'sub_old' }, { deleted: true })).toBe(false);
    expect(shouldApplySubscriptionEvent(row, { id: 'sub_new', status: 'past_due' })).toBe(true);
    const canceled = { stripeSubscriptionId: 'sub_1', status: 'canceled' };
    expect(shouldApplySubscriptionEvent(canceled, { id: 'sub_1', status: 'active' })).toBe(false);
    // A new subscription after a canceled one is applied
    expect(shouldApplySubscriptionEvent(canceled, { id: 'sub_2', status: 'active' })).toBe(true);
    expect(shouldApplySubscriptionEvent(null, { id: 'sub_1', status: 'active' })).toBe(true);
  });
});
