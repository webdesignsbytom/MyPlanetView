import { beforeEach, describe, expect, it } from 'vitest';
import {
  LOCKED_MAP_MESSAGE,
  MOCK_PLAN_CHOICES,
  PEOPLE_CAP_MESSAGES,
  VIDEO_MESSAGES,
  addMonths,
  billingView,
  countryCapProblem,
  effectivePlan,
  extraMapsPaid,
  grantIsActive,
  graceForNewOwner,
  isLive,
  isMapLocked,
  mapPlanFields,
  mapPlanId,
  mapSlots,
  mapSlotsMessage,
  mockPlanChoice,
  photoCounts,
  photoSizesProblem,
  recordInviteOffer,
  setMockPlan,
  uploadRules,
  usableInviteOffer,
  videoCounts,
  videoNotAllowed,
} from '@/dev/mock/plans';
import * as serverPlans from '../../../../../server/src/utils/plans.js';
import * as serverSlots from '../../../../../server/src/utils/mapSlots.js';
import * as serverLimits from '../../../../../server/src/utils/planLimits.js';
import { FRAN, FRAN_MAP, HOME_MAP, SAM, SAM_MAP, USER, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const DAY = 86400000;
const iso = (days) => new Date(Date.now() + days * DAY).toISOString();
const map = (id) => db().maps.find((m) => m.id === id);
const grant = (fields) => ({ id: `g-${Math.random()}`, userId: SAM, plan: 'PREMIUM', startsAt: iso(-1), endsAt: iso(30), ...fields });
const addMap = (id, fields = {}) => db().maps.push({ id, name: id, ownerId: USER, isDefault: false, graceUntil: null, createdAt: iso(-10), ...fields });

describe('effectivePlan', () => {
  it('gives the server’s answer for subscriptions and grants together', () => {
    const subs = [
      null,
      { userId: SAM, plan: 'REGULAR', status: 'active', extraMaps: 0 },
      { userId: SAM, plan: 'REGULAR', status: 'past_due', extraMaps: 0 },
      { userId: SAM, plan: 'PREMIUM', status: 'canceled', extraMaps: 0 },
      { userId: SAM, plan: 'FREE', status: 'active', extraMaps: 2 },
    ];
    const grantSets = [[], [grant({ plan: 'REGULAR' })], [grant({ endsAt: iso(-1) })], [grant({}), grant({ plan: 'REGULAR', endsAt: iso(90) })]];
    for (const sub of subs) {
      for (const grants of grantSets) {
        db().subscriptions = sub ? [sub] : [];
        db().planGrants = grants;
        const server = serverPlans.effectivePlan({ subscription: sub, grants, now: new Date() });
        const mock = effectivePlan(SAM);
        expect([mock.plan, mock.source, mock.grant?.id ?? null]).toEqual([server.plan, server.source, server.grant?.id ?? null]);
      }
    }
  });

  it('puts the seed’s test user on Business, Fran on First Class, Sam on Economy', () => {
    expect(effectivePlan(USER)).toMatchObject({ plan: 'REGULAR', source: 'STRIPE' });
    expect(effectivePlan(FRAN).plan).toBe('PREMIUM');
    expect(effectivePlan(SAM)).toMatchObject({ plan: 'FREE', source: 'FREE', grant: null });
  });

  it('counts extra maps only while the subscription counts', () => {
    expect(extraMapsPaid(USER)).toBe(1);
    db().subscriptions[0].status = 'canceled';
    expect(extraMapsPaid(USER)).toBe(0);
    expect(isLive(db().subscriptions[0])).toBe(false);
    expect(isLive({ status: 'past_due' })).toBe(true);
    expect(isLive(null)).toBe(false);
  });

  it('runs a grant from its start to just before its end', () => {
    const g = grant({ startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-02-01T00:00:00Z' });
    expect(grantIsActive(g, Date.parse('2026-01-15T00:00:00Z'))).toBe(true);
    expect(grantIsActive(g, Date.parse('2026-02-01T00:00:00Z'))).toBe(false);
    expect(serverPlans.grantIsActive(g, new Date('2026-02-01T00:00:00Z'))).toBe(false);
  });

  it('adds calendar months as the server does, keeping to the month’s last day', () => {
    for (const [date, months] of [
      ['2026-01-31T10:00:00Z', 1],
      ['2024-01-31T00:00:00Z', 1],
      ['2026-03-15T08:30:00Z', 12],
      ['2026-12-31T00:00:00Z', 2],
    ]) {
      expect(addMonths(date, months).toISOString()).toBe(serverPlans.addMonths(new Date(date), months).toISOString());
    }
    expect(addMonths('2026-01-31T00:00:00Z', 1).toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });
});

describe('mapSlots', () => {
  const compare = (ownerId) => {
    const mine = db().maps.filter((m) => m.ownerId === ownerId);
    const server = serverSlots.mapSlots({ maps: mine.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })), extraMapsPaid: extraMapsPaid(ownerId) });
    const mock = mapSlots(ownerId);
    expect(mock).toEqual({
      economyIds: server.economyIds,
      lockedIds: server.lockedIds,
      tiers: server.tiers,
      slots: server.slots,
      used: server.used,
      canCreate: server.canCreate,
    });
    return mock;
  };

  it('gives the test user the main map and one paid extra on Business, then two on Economy, then locks', () => {
    addMap('m1', { createdAt: iso(-30) });
    addMap('m2', { createdAt: iso(-20) });
    addMap('m3', { createdAt: iso(-10) });
    addMap('m4', { createdAt: iso(-5) });
    const slots = compare(USER);
    expect(slots.tiers).toEqual({ [HOME_MAP]: 'PLAN', m1: 'PLAN', m2: 'ECONOMY', m3: 'ECONOMY', m4: 'LOCKED' });
    expect(slots.canCreate).toBe(false);
    expect(isMapLocked(map('m4'))).toBe(true);
    expect(mapPlanId(map('m1'))).toBe('REGULAR');
    expect(mapPlanId(map('m2'))).toBe('FREE');
  });

  it('puts a chosen upgrade on the plan first, and a map in its grace on it always', () => {
    addMap('m1', { createdAt: iso(-30) });
    addMap('m2', { createdAt: iso(-20), upgradedAt: iso(-1) });
    addMap('m3', { createdAt: iso(-10), graceUntil: iso(30) });
    const slots = compare(USER);
    expect(slots.tiers).toMatchObject({ m2: 'PLAN', m3: 'PLAN', m1: 'ECONOMY' });
  });

  it('agrees with the server for Sam (no plan, one map) and with no maps at all', () => {
    expect(compare(SAM).canCreate).toBe(true);
    expect(compare('nobody')).toMatchObject({ slots: 1, used: 0, canCreate: true });
  });

  it('gives a transferred map grace only when its new owner has no free slot', () => {
    expect(graceForNewOwner(SAM_MAP, USER)).toBeNull();
    addMap('m1');
    addMap('m2');
    addMap('m3');
    const grace = graceForNewOwner(SAM_MAP, USER);
    expect(Date.parse(grace) - Date.now()).toBeGreaterThan(59 * DAY);
  });
});

describe('the caps', () => {
  it('asks each plan for the server’s copies', () => {
    for (const planId of ['FREE', 'REGULAR', 'PREMIUM']) {
      for (const sizes of [['THUMB', 'DISPLAY'], ['THUMB', 'DISPLAY', 'ORIGINAL'], ['THUMB', 'DISPLAY', 'PRINT']]) {
        expect(photoSizesProblem(sizes, planId)).toBe(serverLimits.checkPhotoSizesForPlan(sizes, planId));
      }
    }
  });

  it('says a country is full in the server’s words', () => {
    const home = map(HOME_MAP);
    expect(countryCapProblem(home, 'FR')).toBeNull();
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `x${i}`, mapId: HOME_MAP, countryCode: 'FR' }));
    db().photos.push(...many);
    const count = db().photos.filter((p) => p.mapId === HOME_MAP && p.countryCode === 'FR').length;
    expect(countryCapProblem(home, 'FR')).toBe(serverLimits.checkCountryCap({ count, planId: 'REGULAR', countryName: 'France' }));
    expect(countryCapProblem(home, 'FR')).toBe('200 of 200 photos of France on this map. Upgrade to add more.');
  });

  it('caps the photos with no country as one more gallery', () => {
    const sams = map(SAM_MAP);
    db().photos.push(...Array.from({ length: 30 }, (_, i) => ({ id: `n${i}`, mapId: SAM_MAP, countryCode: null })));
    expect(countryCapProblem(sams, null)).toBe('30 of 30 photos with no country on this map. Upgrade to add more.');
  });

  it('takes videos on First Class only, 20 a country', () => {
    expect(videoNotAllowed(map(HOME_MAP))).toBe(VIDEO_MESSAGES.notOnPlan);
    expect(VIDEO_MESSAGES.notOnPlan).toBe(serverLimits.VIDEO_MESSAGES.notOnPlan);
    const fran = map(FRAN_MAP);
    expect(videoNotAllowed(fran)).toBeNull();
    const code = db().photos.find((p) => p.mapId === FRAN_MAP).countryCode;
    expect(countryCapProblem(fran, code, 'VIDEO')).toBeNull();
    db().photos.push(...Array.from({ length: 20 }, (_, i) => ({ id: `v${i}`, mapId: FRAN_MAP, countryCode: code, kind: 'VIDEO' })));
    const count = db().photos.filter((p) => p.mapId === FRAN_MAP && p.countryCode === code && p.kind === 'VIDEO').length;
    expect(countryCapProblem(fran, code, 'VIDEO')).toMatch(new RegExp(`^${Math.min(count, 20)} of 20 videos of .+ on this map\\.$`));
  });

  it('words the people caps and locked maps as the server', () => {
    expect(PEOPLE_CAP_MESSAGES.editors).toBe('A map can have up to 5 editors.');
    expect(PEOPLE_CAP_MESSAGES.tripPeople).toBe('A trip can have up to 20 people.');
    expect(LOCKED_MAP_MESSAGE).toBe(serverLimits.LOCKED_MAP_MESSAGE);
    expect(mapSlotsMessage('FREE')).toMatch(/^You have your 3 free maps/);
  });
});

describe('what the map views carry', () => {
  it('counts photos and videos per country, hidden ones too', () => {
    expect(photoCounts(HOME_MAP).PT).toBe(1);
    expect(videoCounts(HOME_MAP)).toEqual({});
    expect(Object.values(videoCounts(FRAN_MAP)).reduce((a, b) => a + b, 0)).toBe(4);
  });

  it('gives the upload rules of the map’s own plan', () => {
    expect(uploadRules(map(HOME_MAP))).toMatchObject({ keepsOriginals: true, photosPerCountry: 200, videos: null, locked: false });
    expect(uploadRules(map(SAM_MAP))).toMatchObject({ keepsOriginals: false, photosPerCountry: 30, videos: null });
    expect(uploadRules(map(FRAN_MAP)).videos).toMatchObject({ perCountry: 20, maxSeconds: 180, contentTypes: ['video/mp4', 'video/quicktime'] });
  });

  it('gives the plan fields for the owner and editors', () => {
    const fields = mapPlanFields(map(HOME_MAP));
    expect(fields).toMatchObject({ plan: { id: 'REGULAR' }, accountPlan: { id: 'REGULAR' }, tier: 'PLAN', upgraded: false, locked: false, graceUntil: null });
    expect(fields.photoCounts.FR).toBeGreaterThan(0);
  });
});

describe('the mock badge’s plan controls', () => {
  it('lists the choices and reads the test user’s', () => {
    expect(MOCK_PLAN_CHOICES.map((c) => c.value)).toEqual(['FREE', 'REGULAR', 'PREMIUM', 'COMP_PREMIUM']);
    expect(mockPlanChoice(USER)).toBe('REGULAR');
  });

  it('sets a paid plan, Economy with extra maps, nothing, or a free First Class year', () => {
    setMockPlan(USER, 'PREMIUM', 2);
    expect(effectivePlan(USER).plan).toBe('PREMIUM');
    expect(extraMapsPaid(USER)).toBe(2);
    setMockPlan(USER, 'FREE', 1);
    expect(effectivePlan(USER).plan).toBe('FREE');
    expect(extraMapsPaid(USER)).toBe(1);
    setMockPlan(USER, 'FREE', 0);
    expect(db().subscriptions.some((s) => s.userId === USER)).toBe(false);
    setMockPlan(USER, 'COMP_PREMIUM', 0);
    expect(mockPlanChoice(USER)).toBe('COMP_PREMIUM');
    const g = db().planGrants.find((x) => x.userId === USER);
    expect(Math.round((Date.parse(g.endsAt) - Date.parse(g.startsAt)) / DAY)).toBeGreaterThanOrEqual(365);
  });
});

describe('the invite offer', () => {
  it('records an offer for a paid map, unless the account has a promo code or one already', () => {
    const user = { id: 'new', promoCodeId: null };
    recordInviteOffer(user, 'FREE');
    expect(user.inviteOfferPlan).toBeUndefined();
    recordInviteOffer(user, 'PREMIUM');
    expect(user.inviteOfferPlan).toBe('PREMIUM');
    recordInviteOffer(user, 'REGULAR');
    expect(user.inviteOfferPlan).toBe('PREMIUM');
    const promo = { id: 'p', promoCodeId: 'x' };
    recordInviteOffer(promo, 'PREMIUM');
    expect(promo.inviteOfferPlan).toBeUndefined();
  });

  it('is usable for that plan or a lower paid one, for 7 days, until used or subscribed', () => {
    const user = { id: 'new' };
    recordInviteOffer(user, 'PREMIUM');
    expect(usableInviteOffer(user)).toEqual({ plan: 'PREMIUM', endsAt: user.inviteOfferEndsAt });
    expect(usableInviteOffer(user, { plan: 'REGULAR' })).not.toBeNull();
    expect(usableInviteOffer(user, { plan: 'FREE' })).toBeNull();
    expect(usableInviteOffer({ ...user, inviteOfferPlan: 'REGULAR' }, { plan: 'PREMIUM' })).toBeNull();
    expect(usableInviteOffer({ ...user, inviteOfferUsedAt: iso(0) })).toBeNull();
    expect(usableInviteOffer({ ...user, inviteOfferEndsAt: iso(-1) })).toBeNull();
    expect(usableInviteOffer({ ...user, id: USER })).toBeNull();
    expect(usableInviteOffer(null)).toBeNull();
  });
});

describe('billingView', () => {
  it('answers GET /billing for the test user', () => {
    expect(billingView(USER)).toMatchObject({
      plan: 'REGULAR',
      planName: 'Business',
      source: 'STRIPE',
      interval: 'MONTH',
      status: 'active',
      cancelAtPeriodEnd: false,
      grant: null,
      promoTrial: null,
      inviteOffer: null,
      includedMaps: 1,
      freeEconomyMaps: 2,
      extraMapsPaid: 1,
      ownedMaps: 1,
      economyMapIds: [],
      lockedMapIds: [],
      paymentsEnabled: true,
    });
  });

  it('offers a promo code’s free month only with no live subscription', () => {
    expect(billingView('mock-jo').promoTrial).not.toBeNull();
    expect(billingView('mock-jo').plan).toBe('FREE');
  });
});
