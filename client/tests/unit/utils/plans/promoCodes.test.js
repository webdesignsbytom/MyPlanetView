import { describe, expect, it } from 'vitest';
import {
  FREE_PLAN_IDS,
  PROMO_CODE_INVALID,
  PROMO_CODE_PATTERN,
  PROMO_LABEL_MAX,
  PROMO_MAX_USES_MAX,
  PROMO_OFFER_CHOICES,
  PROMO_OFFER_WORDS,
  PROMO_TRIAL_DAYS,
  forgetPromoCode,
  inviteLinkFor,
  FOR_LIFE_ENDS_AT,
  isForLife,
  normalisePromoCode,
  promoCodeInSearch,
  promoOfferText,
  promoOfferWords,
  promoSignUpLink,
  promoTrialText,
  rememberPromoCode,
  rememberedPromoCode,
} from '@/utils/plans/promoCodes';
import { emptyPromoForm, promoBodyFrom, promoFormFrom, promoState } from '@/utils/plans/promoCodeForm';
import * as server from '../../../../../server/src/utils/promoCodes.js';

describe('the format', () => {
  it('is the server’s', () => {
    expect(PROMO_CODE_PATTERN.source).toBe(server.PROMO_CODE_PATTERN.source);
    expect(PROMO_LABEL_MAX).toBe(server.PROMO_LABEL_MAX);
    expect(PROMO_MAX_USES_MAX).toBe(server.PROMO_MAX_USES_MAX);
    expect(PROMO_TRIAL_DAYS).toBe(server.PROMO_TRIAL_DAYS);
    expect(FREE_PLAN_IDS).toEqual(server.FREE_PLAN_IDS);
  });

  it('normalises what someone typed as the server does', () => {
    const typed = ['sam-travels ', 'SamTravels', ' sam travels', 'AB', 'a'.repeat(25), 'TRAVEL-TALK-2026', 'café', '', null, 42, '--', 'X Y Z'];
    for (const value of typed) expect(normalisePromoCode(value)).toBe(server.normalisePromoCode(value));
    expect(normalisePromoCode('sam-travels ')).toBe('SAMTRAVELS');
    expect(normalisePromoCode('AB')).toBeNull();
  });

  it('knows a membership for life as the server does', () => {
    const ends = [server.FOR_LIFE_ENDS_AT.toISOString(), '9999-12-31', '9999-01-01T00:00:00.000Z', '9998-12-31T23:59:59.000Z', '2027-01-01', null];
    for (const endsAt of ends) expect(isForLife(endsAt)).toBe(server.isForLife(endsAt));
    expect(FOR_LIFE_ENDS_AT.toISOString()).toBe(server.FOR_LIFE_ENDS_AT.toISOString());
    // Only the server's own end date is for life, not any day in 9999
    expect(isForLife('9999-01-01T00:00:00.000Z')).toBe(false);
    expect(isForLife('2027-01-01')).toBe(false);
  });
});

describe('the offer’s words', () => {
  it('offers the free month or a paid plan for life when a code is made', () => {
    expect(PROMO_OFFER_CHOICES).toEqual([
      { value: '', label: 'The first month free (the usual offer)' },
      { value: 'REGULAR', label: 'Business, free for life' },
      { value: 'PREMIUM', label: 'First Class, free for life' },
    ]);
    expect(PROMO_CODE_INVALID).toBe("That code isn't valid. Check it, or sign up without one.");
  });

  it('says what a code gives on the admin page', () => {
    expect(PROMO_OFFER_WORDS).toBe('First month free on Business or First Class (30 days, with a card)');
    expect(promoOfferWords({ freePlan: 'PREMIUM' })).toBe('First Class, free for life, once their email is verified');
    expect(promoOfferWords({ freePlan: null })).toBe(PROMO_OFFER_WORDS);
    expect(promoOfferWords(null)).toBe(PROMO_OFFER_WORDS);
  });

  it('says what a code gives on the sign-up form', () => {
    expect(promoOfferText({ code: 'SAMTRAVELS' })).toBe(
      'SAMTRAVELS: your first month of Business or First Class is free. Choose one on your account page once your email is verified. Stripe asks for a card, and nothing is charged for 30 days.',
    );
    expect(promoOfferText({ code: 'FRIEND1', fromFriend: 'Alex' })).toMatch(/^Alex invited you: your first month/);
    expect(promoOfferText({ code: 'MINE', freePlan: 'REGULAR' })).toBe(
      'MINE: Business is yours, free for life. It starts once you’ve verified your email address.',
    );
  });

  it('words the account page’s free month', () => {
    expect(promoTrialText({ code: 'SAMTRAVELS', days: 30 })).toBe(
      'Your code SAMTRAVELS makes your first month free on Business or First Class. Checkout asks for a card; nothing is charged for 30 days, and if you cancel before then you pay nothing.',
    );
  });

  it('makes the links people share', () => {
    expect(inviteLinkFor('ALEX 1', 'https://site.example')).toBe('https://site.example/sign-up?code=ALEX%201');
    expect(promoSignUpLink('SAMTRAVELS')).toBe('https://myplanetview.com/sign-up?code=SAMTRAVELS');
  });
});

describe('the code kept for the visit', () => {
  it('reads ?code= from an address', () => {
    expect(promoCodeInSearch('?code=%20SamTravels%20&x=1')).toBe('SamTravels');
    expect(promoCodeInSearch('?code=')).toBeNull();
    expect(promoCodeInSearch('?code=%20%20')).toBeNull();
    expect(promoCodeInSearch('')).toBeNull();
    expect(promoCodeInSearch(undefined)).toBeNull();
    expect(promoCodeInSearch(`?code=${'A'.repeat(100)}`)).toHaveLength(64);
  });

  it('keeps it in this tab’s session storage until forgotten', () => {
    expect(rememberedPromoCode()).toBeNull();
    rememberPromoCode('SAMTRAVELS');
    expect(sessionStorage.getItem('mpv:promoCode')).toBe('SAMTRAVELS');
    expect(rememberedPromoCode()).toBe('SAMTRAVELS');
    forgetPromoCode();
    expect(rememberedPromoCode()).toBeNull();
  });
});

describe('the admin’s promo code form', () => {
  it('starts empty and fills from a stored code', () => {
    expect(emptyPromoForm()).toEqual({ code: '', freePlan: '', label: '', maxUses: '', lastDay: '' });
    expect(promoFormFrom({ code: 'SAM', label: null, maxUses: 500, endsAt: '2027-01-31T23:59:59.999Z' })).toEqual({
      code: 'SAM',
      label: '',
      maxUses: '500',
      lastDay: '2027-01-31',
    });
    expect(promoFormFrom({ code: 'SAM', label: 'Sam', maxUses: null, endsAt: null })).toMatchObject({ maxUses: '', lastDay: '' });
  });

  it('makes a new code’s body, as the server takes it', () => {
    const result = promoBodyFrom({ code: ' sam-travels ', freePlan: 'PREMIUM', label: ' Sam <b>2026</b> ', maxUses: ' 500 ', lastDay: '2027-01-31' });
    expect(result).toEqual({
      ok: true,
      body: { code: 'SAMTRAVELS', freePlan: 'PREMIUM', label: 'Sam 2026', maxUses: 500, endsAt: '2027-01-31T23:59:59.999Z' },
    });
    expect(server.parsePromoCodeInput(result.body)).toMatchObject({ ok: true, data: { code: 'SAMTRAVELS', label: 'Sam 2026', maxUses: 500 } });
  });

  it('leaves out a free plan that isn’t one, and sends no limit or end as null', () => {
    expect(promoBodyFrom({ ...emptyPromoForm(), code: 'ABC', freePlan: 'FREE', label: 'x' })).toEqual({
      ok: true,
      body: { code: 'ABC', label: 'x', maxUses: null, endsAt: null },
    });
  });

  it('says what’s wrong with each field', () => {
    expect(promoBodyFrom({ code: 'a', freePlan: '', label: '  ', maxUses: '0', lastDay: 'soon' })).toEqual({
      ok: false,
      errors: {
        code: 'A code is 3 to 24 letters and numbers.',
        label: 'Give it a label: who it’s for, and when.',
        maxUses: 'A whole number of sign-ups, or leave it empty for no limit.',
        lastDay: 'Pick a day, or leave it empty for no end date.',
      },
    });
    expect(promoBodyFrom({ ...emptyPromoForm(), code: 'ABC', label: 'x', maxUses: '1.5' }).errors).toEqual({
      maxUses: 'A whole number of sign-ups, or leave it empty for no limit.',
    });
    expect(promoBodyFrom({ ...emptyPromoForm(), code: 'ABC', label: 'x', maxUses: String(PROMO_MAX_USES_MAX + 1) }).ok).toBe(false);
  });

  it('never sends the code or its offer on a change, and the day only when it changed', () => {
    const existing = { code: 'SAM', endsAt: '2027-01-31T23:59:59.999Z' };
    expect(promoBodyFrom({ code: 'OTHER', freePlan: 'PREMIUM', label: 'Sam', maxUses: '', lastDay: '2027-01-31' }, { existing })).toEqual({
      ok: true,
      body: { label: 'Sam', maxUses: null },
    });
    expect(promoBodyFrom({ code: '', freePlan: '', label: 'Sam', maxUses: '', lastDay: '' }, { existing }).body.endsAt).toBeNull();
  });

  it('says where a code stands', () => {
    const now = Date.parse('2027-01-01T00:00:00Z');
    expect(promoState({ active: false }, now)).toEqual({ key: 'off', label: 'Off' });
    expect(promoState({ active: true, endsAt: '2027-01-01T00:00:00Z' }, now)).toEqual({ key: 'ended', label: 'Ended' });
    expect(promoState({ active: true, maxUses: 2, signUps: 2 }, now)).toEqual({ key: 'used', label: 'Used up' });
    expect(promoState({ active: true, maxUses: 2 }, now)).toEqual({ key: 'on', label: 'On' });
    expect(promoState({ active: true, maxUses: null, signUps: 900 }, now)).toEqual({ key: 'on', label: 'On' });
  });
});
