import { describe, it, expect } from 'vitest';
import { PROMO_TRIAL_DAYS, normalisePromoCode, parsePromoCodeInput, promoCodeUsable, promoTrialDays } from '../src/utils/promoCodes.js';

describe('promo codes', () => {
  it('are stored upper case, without spaces or dashes', () => {
    expect(normalisePromoCode(' sam-travels ')).toBe('SAMTRAVELS');
    expect(normalisePromoCode('Sam Travels 2027')).toBe('SAMTRAVELS2027');
    for (const bad of ['', 'ab', 'x'.repeat(25), 'SAM_TRAVELS', 'Café', null, 42]) expect(normalisePromoCode(bad)).toBeNull();
  });

  it('can be used while active, before they end, and under their limit', () => {
    const now = new Date('2027-01-01T00:00:00Z');
    const promo = { active: true, endsAt: null, maxUses: 2 };
    expect(promoCodeUsable(promo, { uses: 1, now })).toBe(true);
    expect(promoCodeUsable(promo, { uses: 2, now })).toBe(false);
    expect(promoCodeUsable({ ...promo, active: false }, { uses: 0, now })).toBe(false);
    expect(promoCodeUsable({ ...promo, endsAt: new Date('2026-12-31') }, { uses: 0, now })).toBe(false);
    expect(promoCodeUsable(null, { uses: 0, now })).toBe(false);
  });

  it('give a free month on the first paid Checkout, once', () => {
    const fresh = { promoCode: { code: 'SAMTRAVELS' }, promoTrialUsedAt: null };
    expect(PROMO_TRIAL_DAYS).toBe(30);
    expect(promoTrialDays(fresh, 'REGULAR')).toBe(30);
    expect(promoTrialDays(fresh, 'PREMIUM')).toBe(30);
    // Extra maps alone, a used month, or no code: nothing
    expect(promoTrialDays(fresh, 'FREE')).toBe(0);
    expect(promoTrialDays({ ...fresh, promoTrialUsedAt: new Date() }, 'REGULAR')).toBe(0);
    expect(promoTrialDays({ promoCode: null, promoTrialUsedAt: null }, 'REGULAR')).toBe(0);
    expect(promoTrialDays(null, 'REGULAR')).toBe(0);
  });

  it('check what an admin sets', () => {
    expect(parsePromoCodeInput({ code: 'samtravels', label: 'Sam (YouTube)', maxUses: 500 })).toEqual({
      ok: true,
      data: { code: 'SAMTRAVELS', label: 'Sam (YouTube)', maxUses: 500 },
    });
    expect(parsePromoCodeInput({ code: 'x', label: 'Sam' })).toEqual({ ok: false, message: 'promoCodeFormat' });
    expect(parsePromoCodeInput({ code: 'SAMTRAVELS' }).ok).toBe(false);
    expect(parsePromoCodeInput({ code: 'SAMTRAVELS', label: 'Sam', maxUses: 0 }).ok).toBe(false);
    // The offer is the same for every code: a code's own plan and days are ignored
    expect(parsePromoCodeInput({ code: 'SAMTRAVELS', label: 'Sam', offerPlan: 'PREMIUM', offerDays: 300 })).toEqual({
      ok: true,
      data: { code: 'SAMTRAVELS', label: 'Sam' },
    });
    // A change never renames the code
    expect(parsePromoCodeInput({ code: 'OTHER' }, { existing: { code: 'SAMTRAVELS' } }).ok).toBe(false);
    expect(parsePromoCodeInput({ active: false, maxUses: null }, { existing: { code: 'SAMTRAVELS' } })).toEqual({
      ok: true,
      data: { active: false, maxUses: null },
    });
  });
});
