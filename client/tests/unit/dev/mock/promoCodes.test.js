import { beforeEach, describe, expect, it } from 'vitest';
import { PROMO_MESSAGES, parsePromoCodeInput, promoCodeView, promoTrialFor, usablePromoCode } from '@/dev/mock/promoCodes';
import * as server from '../../../../../server/src/utils/promoCodes.js';
import { db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const promo = (code) => db().promoCodes.find((p) => p.code === code);

describe('usablePromoCode', () => {
  it('finds a code however it’s typed', () => {
    expect(usablePromoCode(' samtravels ').id).toBe('promo-samtravels');
    expect(usablePromoCode('TRAVELTALK').id).toBe('promo-traveltalk');
    expect(usablePromoCode('NOPE')).toBeNull();
    expect(usablePromoCode('')).toBeNull();
  });

  it('refuses a code turned off, ended or used up', () => {
    promo('SAMTRAVELS').active = false;
    expect(usablePromoCode('SAMTRAVELS')).toBeNull();
    promo('TRAVELTALK').endsAt = new Date(Date.now() - 1000).toISOString();
    expect(usablePromoCode('TRAVELTALK')).toBeNull();
    promo('TRAVELTALK').endsAt = null;
    promo('TRAVELTALK').maxUses = 2;
    expect(usablePromoCode('TRAVELTALK')).toBeNull();
    promo('TRAVELTALK').maxUses = 3;
    expect(usablePromoCode('TRAVELTALK')).not.toBeNull();
  });

  it('counts an unverified sign-up as a use for a day only, as the server', () => {
    const code = promo('TRAVELTALK');
    code.maxUses = 3;
    db().users.push({ id: 'u-new', promoCodeId: code.id, emailVerified: false, createdAt: new Date().toISOString() });
    expect(usablePromoCode('TRAVELTALK')).toBeNull();
    db().users.at(-1).createdAt = new Date(Date.now() - 25 * 3600000).toISOString();
    expect(usablePromoCode('TRAVELTALK')).not.toBeNull();
    expect(server.promoCodeUsable({ ...code, endsAt: null }, { uses: 2 })).toBe(true);
    expect(server.promoCodeUsable({ ...code, endsAt: null }, { uses: 3 })).toBe(false);
  });
});

describe('promoTrialFor', () => {
  it('gives a code’s follower one free month on a paid plan', () => {
    const jo = db().users.find((u) => u.id === 'mock-jo');
    expect(promoTrialFor(jo)).toEqual({ code: 'TRAVELTALK', days: 30 });
    expect(promoTrialFor(jo, 'PREMIUM')).toEqual({ code: 'TRAVELTALK', days: server.PROMO_TRIAL_DAYS });
    expect(promoTrialFor(jo, 'FREE')).toBeNull();
    expect(promoTrialFor({ ...jo, promoTrialUsedAt: new Date().toISOString() })).toBeNull();
  });

  it('gives none without a code, or for a code that gives a plan for life', () => {
    expect(promoTrialFor(db().users[0])).toBeNull();
    expect(promoTrialFor(null)).toBeNull();
    promo('TRAVELTALK').freePlan = 'PREMIUM';
    expect(promoTrialFor(db().users.find((u) => u.id === 'mock-jo'))).toBeNull();
  });
});

describe('promoCodeView', () => {
  it('counts what a code brought, without who made it', () => {
    db().subscriptions.push({ userId: 'mock-jo', plan: 'REGULAR', status: 'trialing' });
    db().users.find((u) => u.id === 'mock-tom').promoTrialUsedAt = new Date().toISOString();
    const view = promoCodeView(promo('TRAVELTALK'));
    expect(view).toMatchObject({ code: 'TRAVELTALK', freePlan: null, trialDays: 30, signUps: 2, verified: 2, trials: 1, paying: 1 });
    expect('createdById' in view).toBe(false);
    expect(promoCodeView({ ...promo('SAMTRAVELS'), freePlan: 'REGULAR' }).trialDays).toBe(0);
  });
});

describe('parsePromoCodeInput', () => {
  it('reads an admin’s new code and its limits', () => {
    expect(parsePromoCodeInput({ code: 'spring27', label: ' Spring ', maxUses: 100, endsAt: '2027-06-01T00:00:00Z', active: true })).toEqual({
      ok: true,
      data: { code: 'SPRING27', label: 'Spring', maxUses: 100, endsAt: '2027-06-01T00:00:00.000Z', active: true },
    });
    expect(parsePromoCodeInput({ code: 'MINE', label: 'Mine', freePlan: 'PREMIUM' }).data.freePlan).toBe('PREMIUM');
  });

  it('refuses what the server refuses, with the same message', () => {
    const bodies = [
      null,
      { code: 'ab', label: 'x' },
      { code: 'a-b-c', label: 'x' },
      { code: 'GOOD', label: '' },
      { code: 'GOOD', label: 'x', maxUses: 0 },
      { code: 'GOOD', label: 'x', maxUses: 1.5 },
      { code: 'GOOD', label: 'x', active: 'yes' },
      { code: 'GOOD', label: 'x', endsAt: 'soon' },
      { code: 'GOOD', label: 'x', freePlan: 'FREE' },
      { code: 'GOOD', label: 'x', maxUses: null, endsAt: '' },
    ];
    for (const body of bodies) {
      const mock = parsePromoCodeInput(body);
      const real = server.parsePromoCodeInput(body);
      expect(mock.ok).toBe(real.ok);
      // The server's keys are its EVENT_MESSAGES' (promoCodeFormat), the mock's its own (format)
      if (!mock.ok) expect(real.message.toLowerCase().endsWith(mock.message.toLowerCase())).toBe(true);
    }
  });

  it('never changes a code itself or what it gives', () => {
    const existing = promo('SAMTRAVELS');
    expect(parsePromoCodeInput({ code: 'OTHER' }, { existing })).toEqual({ ok: false, message: 'detailsInvalid' });
    expect(parsePromoCodeInput({ freePlan: 'REGULAR' }, { existing }).ok).toBe(false);
    expect(parsePromoCodeInput({ active: false }, { existing })).toEqual({ ok: true, data: { active: false } });
    expect(PROMO_MESSAGES.format).toBe('A code is 3 to 24 letters and numbers.');
  });
});
