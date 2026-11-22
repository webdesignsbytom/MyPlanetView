// services/billing: one Stripe customer per account (customers.js), the promo codes'
// sign-up and free-month rules (promo.js) and Stripe's price ids (stripe.js). Stripe and
// the database queries are fakes here; the routes are tested against Postgres in
// tests/integration/billing.test.js and promoCodes.test.js.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  claimStripeCustomer: vi.fn(),
  findPromoCodeByCode: vi.fn(),
  countPromoUses: vi.fn(),
  claimPromoCodeInDB: vi.fn(),
  findProfilePromo: vi.fn(),
  giveLifetimePlanInDB: vi.fn(),
}));
vi.mock('../src/domain/billing.js', () => ({ claimStripeCustomer: db.claimStripeCustomer }));
vi.mock('../src/domain/promoCodes.js', () => ({
  findPromoCodeByCode: db.findPromoCodeByCode,
  countPromoUses: db.countPromoUses,
  claimPromoCodeInDB: db.claimPromoCodeInDB,
  findProfilePromo: db.findProfilePromo,
  giveLifetimePlanInDB: db.giveLifetimePlanInDB,
}));

const { ensureStripeCustomer } = await import('../src/services/billing/customers.js');
const { usablePromoCode, recordSignUpPromoCode, giveLifetimePlan, promoTrialFor } = await import('../src/services/billing/promo.js');
const { paymentsEnabled, stripeClient, planPriceId, extraMapPriceId, priceKind } = await import('../src/services/billing/stripe.js');
const { FOR_LIFE_ENDS_AT, PROMO_TRIAL_DAYS } = await import('../src/utils/promoCodes.js');

beforeEach(() => {
  for (const fn of Object.values(db)) fn.mockReset();
});

const fakeStripe = (id = 'cus_new') => ({
  customers: { create: vi.fn(async () => ({ id })), del: vi.fn(async () => ({ deleted: true })) },
});

describe('ensureStripeCustomer', () => {
  const user = { id: 'user-1', email: 'ada@example.test' };

  it('keeps the customer the account already has, without calling Stripe', async () => {
    const stripe = fakeStripe();
    expect(await ensureStripeCustomer(stripe, user, 'cus_old')).toBe('cus_old');
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(db.claimStripeCustomer).not.toHaveBeenCalled();
  });

  it('makes one with the address and the account id, and claims it', async () => {
    const stripe = fakeStripe('cus_made');
    db.claimStripeCustomer.mockResolvedValue('cus_made');
    expect(await ensureStripeCustomer(stripe, user, null)).toBe('cus_made');
    expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'ada@example.test', metadata: { userId: 'user-1' } });
    expect(db.claimStripeCustomer).toHaveBeenCalledWith({ userId: 'user-1', stripeCustomerId: 'cus_made' });
    expect(stripe.customers.del).not.toHaveBeenCalled();
  });

  it('uses the customer another Checkout claimed first, and deletes the spare one', async () => {
    const stripe = fakeStripe('cus_spare');
    db.claimStripeCustomer.mockResolvedValue('cus_winner');
    expect(await ensureStripeCustomer(stripe, user, undefined)).toBe('cus_winner');
    expect(stripe.customers.del).toHaveBeenCalledWith('cus_spare');
  });

  it('still answers when the spare customer cannot be deleted', async () => {
    const stripe = fakeStripe('cus_spare');
    stripe.customers.del.mockRejectedValue(new Error('Stripe is down'));
    db.claimStripeCustomer.mockResolvedValue('cus_winner');
    expect(await ensureStripeCustomer(stripe, user, null)).toBe('cus_winner');
  });
});

describe('usablePromoCode', () => {
  const promo = { id: 'promo-1', code: 'SAMTRAVELS', active: true, endsAt: null, maxUses: 10 };

  it('finds a live code by what was typed, in any case and with dashes', async () => {
    db.findPromoCodeByCode.mockResolvedValue(promo);
    db.countPromoUses.mockResolvedValue(3);
    expect(await usablePromoCode(' sam-travels ')).toBe(promo);
    expect(db.findPromoCodeByCode).toHaveBeenCalledWith('SAMTRAVELS');
    expect(db.countPromoUses).toHaveBeenCalledWith('promo-1');
  });

  it('answers null for junk without asking the database', async () => {
    for (const value of [null, '', 'x', 42, 'way-too-long-for-any-promo-code-at-all']) {
      expect(await usablePromoCode(value)).toBeNull();
    }
    expect(db.findPromoCodeByCode).not.toHaveBeenCalled();
  });

  it('answers null for an unknown, used-up, ended or switched-off code', async () => {
    const now = new Date('2026-11-22T12:00:00Z');
    db.findPromoCodeByCode.mockResolvedValueOnce(null);
    expect(await usablePromoCode('NOSUCH', now)).toBeNull();

    db.countPromoUses.mockResolvedValue(10);
    db.findPromoCodeByCode.mockResolvedValueOnce(promo);
    expect(await usablePromoCode('SAMTRAVELS', now)).toBeNull();

    db.countPromoUses.mockResolvedValue(0);
    db.findPromoCodeByCode.mockResolvedValueOnce({ ...promo, endsAt: new Date('2026-11-01T00:00:00Z') });
    expect(await usablePromoCode('SAMTRAVELS', now)).toBeNull();
    db.findPromoCodeByCode.mockResolvedValueOnce({ ...promo, active: false });
    expect(await usablePromoCode('SAMTRAVELS', now)).toBeNull();
    // Still running at `now`
    db.findPromoCodeByCode.mockResolvedValueOnce({ ...promo, endsAt: new Date('2026-12-01T00:00:00Z') });
    expect(await usablePromoCode('SAMTRAVELS', now)).toMatchObject({ id: 'promo-1' });
  });
});

describe('recordSignUpPromoCode', () => {
  const promo = { id: 'promo-1', code: 'SAMTRAVELS', active: true, endsAt: null, maxUses: 2 };

  beforeEach(() => {
    db.findPromoCodeByCode.mockResolvedValue(promo);
    db.countPromoUses.mockResolvedValue(0);
  });

  it('claims the code for the account, rechecking the limit under the lock', async () => {
    db.claimPromoCodeInDB.mockResolvedValue({ id: 'promo-1', freePlan: null });
    await recordSignUpPromoCode({ id: 'user-1', emailVerified: true }, 'samtravels');
    const claim = db.claimPromoCodeInDB.mock.calls[0][0];
    expect(claim).toMatchObject({ userId: 'user-1', promoCodeId: 'promo-1' });
    // The lock's own count decides
    expect(claim.usable(promo, 1)).toBe(true);
    expect(claim.usable(promo, 2)).toBe(false);
    expect(db.giveLifetimePlanInDB).not.toHaveBeenCalled();
  });

  it('gives a code for life at once to an account made verified, and not to one that is not', async () => {
    db.claimPromoCodeInDB.mockResolvedValue({ id: 'promo-1', freePlan: 'PREMIUM' });
    db.findProfilePromo.mockResolvedValue({ promoCode: { id: 'promo-1', code: 'SAMTRAVELS', freePlan: 'PREMIUM', maxUses: 2, createdById: 'admin-1' } });
    db.giveLifetimePlanInDB.mockResolvedValue(true);

    await recordSignUpPromoCode({ id: 'user-1', emailVerified: false }, 'SAMTRAVELS');
    expect(db.giveLifetimePlanInDB).not.toHaveBeenCalled();

    await recordSignUpPromoCode({ id: 'user-2', emailVerified: true }, 'SAMTRAVELS');
    expect(db.giveLifetimePlanInDB).toHaveBeenCalledTimes(1);
    expect(db.giveLifetimePlanInDB.mock.calls[0][0].grant.userId).toBe('user-2');
  });

  it('does nothing for an unusable code, or with no account', async () => {
    db.findPromoCodeByCode.mockResolvedValue(null);
    await recordSignUpPromoCode({ id: 'user-1' }, 'NOSUCH');
    db.findPromoCodeByCode.mockResolvedValue(promo);
    await recordSignUpPromoCode(null, 'SAMTRAVELS');
    await recordSignUpPromoCode({}, 'SAMTRAVELS');
    expect(db.claimPromoCodeInDB).not.toHaveBeenCalled();
  });

  it('gives no plan when the claim lost the race for the last use', async () => {
    db.claimPromoCodeInDB.mockResolvedValue(null);
    await recordSignUpPromoCode({ id: 'user-1', emailVerified: true }, 'SAMTRAVELS');
    expect(db.giveLifetimePlanInDB).not.toHaveBeenCalled();
  });
});

describe('giveLifetimePlan', () => {
  it("gives the code's plan for life, named after it, from whoever made it", async () => {
    db.findProfilePromo.mockResolvedValue({ promoCode: { id: 'promo-1', code: 'TOMSOWN', freePlan: 'REGULAR', maxUses: 5, createdById: 'admin-1' } });
    db.giveLifetimePlanInDB.mockResolvedValue(true);
    expect(await giveLifetimePlan('user-1')).toBe(true);
    expect(db.giveLifetimePlanInDB).toHaveBeenCalledWith({
      promoCodeId: 'promo-1',
      maxUses: 5,
      grant: { userId: 'user-1', plan: 'REGULAR', endsAt: FOR_LIFE_ENDS_AT, reason: 'Promo code TOMSOWN, for life', grantedById: 'admin-1' },
    });
  });

  it('names nobody as the giver when the maker is gone', async () => {
    db.findProfilePromo.mockResolvedValue({ promoCode: { id: 'promo-1', code: 'TOMSOWN', freePlan: 'PREMIUM', maxUses: null } });
    db.giveLifetimePlanInDB.mockResolvedValue(false);
    expect(await giveLifetimePlan('user-1')).toBe(false);
    expect(db.giveLifetimePlanInDB.mock.calls[0][0].grant.grantedById).toBeNull();
  });

  it('gives nothing without a code, or for an ordinary code', async () => {
    for (const profile of [null, {}, { promoCode: null }, { promoCode: { id: 'p', code: 'SAMTRAVELS', freePlan: null } }]) {
      db.findProfilePromo.mockResolvedValue(profile);
      expect(await giveLifetimePlan('user-1')).toBe(false);
    }
    expect(db.giveLifetimePlanInDB).not.toHaveBeenCalled();
  });
});

describe('promoTrialFor', () => {
  const withCode = { promoCode: { code: 'SAMTRAVELS', freePlan: null }, promoTrialUsedAt: null };

  it("gives the free month on a paid plan to an account that signed up with a code", async () => {
    db.findProfilePromo.mockResolvedValue(withCode);
    expect(await promoTrialFor('user-1')).toEqual({ code: 'SAMTRAVELS', days: PROMO_TRIAL_DAYS });
    expect(await promoTrialFor('user-1', 'PREMIUM')).toEqual({ code: 'SAMTRAVELS', days: PROMO_TRIAL_DAYS });
  });

  it('gives none for extra maps alone, once used, for a code for life, or without a code', async () => {
    db.findProfilePromo.mockResolvedValue(withCode);
    expect(await promoTrialFor('user-1', 'FREE')).toBeNull();
    db.findProfilePromo.mockResolvedValue({ ...withCode, promoTrialUsedAt: new Date() });
    expect(await promoTrialFor('user-1')).toBeNull();
    db.findProfilePromo.mockResolvedValue({ ...withCode, promoCode: { code: 'TOMSOWN', freePlan: 'PREMIUM' } });
    expect(await promoTrialFor('user-1')).toBeNull();
    db.findProfilePromo.mockResolvedValue(null);
    expect(await promoTrialFor('user-1')).toBeNull();
  });
});

describe("Stripe's settings (stripe.js)", () => {
  const PRICES = {
    STRIPE_PRICE_REGULAR_MONTH: 'price_reg_m',
    STRIPE_PRICE_REGULAR_YEAR: 'price_reg_y',
    STRIPE_PRICE_PREMIUM_MONTH: 'price_pre_m',
    STRIPE_PRICE_PREMIUM_YEAR: 'price_pre_y',
    STRIPE_PRICE_EXTRA_MAP_MONTH: 'price_map_m',
    STRIPE_PRICE_EXTRA_MAP_YEAR: 'price_map_y',
    STRIPE_PRICE_PREMIUM_EXTRA_MAP_MONTH: 'price_pmap_m',
    STRIPE_PRICE_PREMIUM_EXTRA_MAP_YEAR: 'price_pmap_y',
  };

  beforeEach(() => {
    for (const [name, value] of Object.entries(PRICES)) vi.stubEnv(name, value);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('turns payments on only with a secret key, and has no client without one', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    expect(paymentsEnabled()).toBe(false);
    await expect(stripeClient()).rejects.toThrow('STRIPE_SECRET_KEY is not set');
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_unit');
    expect(paymentsEnabled()).toBe(true);
  });

  it("reads each plan's price ids, and none for Economy", () => {
    expect(planPriceId('REGULAR', 'MONTH')).toBe('price_reg_m');
    expect(planPriceId('REGULAR', 'YEAR')).toBe('price_reg_y');
    expect(planPriceId('PREMIUM', 'MONTH')).toBe('price_pre_m');
    expect(planPriceId('PREMIUM', 'YEAR')).toBe('price_pre_y');
    expect(planPriceId('FREE', 'MONTH')).toBeNull();
    expect(planPriceId('REGULAR', 'WEEK')).toBeNull();
    vi.stubEnv('STRIPE_PRICE_REGULAR_MONTH', '');
    expect(planPriceId('REGULAR', 'MONTH')).toBeNull();
  });

  it('gives First Class its own extra-map price; Economy and Business share one', () => {
    expect(extraMapPriceId('PREMIUM', 'MONTH')).toBe('price_pmap_m');
    expect(extraMapPriceId('PREMIUM', 'YEAR')).toBe('price_pmap_y');
    for (const plan of ['FREE', 'REGULAR']) {
      expect(extraMapPriceId(plan, 'MONTH')).toBe('price_map_m');
      expect(extraMapPriceId(plan, 'YEAR')).toBe('price_map_y');
    }
  });

  it('says what a price id is, or null for one this site does not sell', () => {
    expect(priceKind('price_pre_y')).toEqual({ kind: 'plan', plan: 'PREMIUM', interval: 'YEAR' });
    expect(priceKind('price_reg_m')).toEqual({ kind: 'plan', plan: 'REGULAR', interval: 'MONTH' });
    expect(priceKind('price_map_y')).toEqual({ kind: 'extraMap', interval: 'YEAR' });
    expect(priceKind('price_pmap_m')).toEqual({ kind: 'extraMap', interval: 'MONTH' });
    expect(priceKind('price_someone_elses')).toBeNull();
    expect(priceKind(null)).toBeNull();
    expect(priceKind('')).toBeNull();
  });
});
