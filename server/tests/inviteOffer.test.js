// The invite offer's rules (utils/inviteOffer.js; docs/API.md "The invite offer")
import { describe, expect, it } from 'vitest';
import { inviteOfferCoupon, inviteOfferToRecord, usableInviteOffer, yearlyInviteSaving } from '../src/utils/inviteOffer.js';

const NOW = new Date('2026-11-19T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(NOW.getTime() - days * DAY);

describe('inviteOfferToRecord', () => {
  const base = { profile: null, userCreatedAt: ago(0), inviteCreatedAt: ago(2), mapPlan: 'PREMIUM', now: NOW };

  it("gives a new account the paid map's plan for 7 days from signing up", () => {
    expect(inviteOfferToRecord(base)).toEqual({ plan: 'PREMIUM', endsAt: new Date(NOW.getTime() + 7 * DAY) });
    expect(inviteOfferToRecord({ ...base, mapPlan: 'REGULAR' })?.plan).toBe('REGULAR');
  });

  it('gives nothing on an Economy map, to an older account, after 7 days, or on top of another offer', () => {
    expect(inviteOfferToRecord({ ...base, mapPlan: 'FREE' })).toBeNull();
    expect(inviteOfferToRecord({ ...base, userCreatedAt: ago(5), inviteCreatedAt: ago(1) })).toBeNull();
    expect(inviteOfferToRecord({ ...base, userCreatedAt: ago(8), inviteCreatedAt: ago(9) })).toBeNull();
    expect(inviteOfferToRecord({ ...base, profile: { promoCodeId: 'code' } })).toBeNull();
    expect(inviteOfferToRecord({ ...base, profile: { inviteOfferPlan: 'REGULAR' } })).toBeNull();
  });
});

describe('usableInviteOffer', () => {
  const profile = { inviteOfferPlan: 'PREMIUM', inviteOfferEndsAt: new Date(NOW.getTime() + DAY), inviteOfferUsedAt: null };

  it('covers its plan and lower paid ones, until it ends or is used', () => {
    expect(usableInviteOffer(profile, { now: NOW })).toMatchObject({ plan: 'PREMIUM' });
    expect(usableInviteOffer(profile, { now: NOW, plan: 'REGULAR' })).not.toBeNull();
    expect(usableInviteOffer(profile, { now: NOW, plan: 'FREE' })).toBeNull();
    expect(usableInviteOffer({ ...profile, inviteOfferPlan: 'REGULAR' }, { now: NOW, plan: 'PREMIUM' })).toBeNull();
    expect(usableInviteOffer({ ...profile, inviteOfferUsedAt: NOW }, { now: NOW })).toBeNull();
    expect(usableInviteOffer(profile, { now: new Date(NOW.getTime() + 2 * DAY) })).toBeNull();
    expect(usableInviteOffer(profile, { now: NOW, hasSubscription: true })).toBeNull();
    expect(usableInviteOffer(null, { now: NOW })).toBeNull();
  });
});

describe('the coupons', () => {
  it('halves 3 monthly bills, and takes the same saving off a yearly plan', () => {
    expect(inviteOfferCoupon('PREMIUM', 'MONTH')).toMatchObject({ create: { percent_off: 50, duration: 'repeating', duration_in_months: 3 } });
    expect(yearlyInviteSaving('PREMIUM')).toBe(1499);
    expect(yearlyInviteSaving('REGULAR')).toBe(749);
    expect(inviteOfferCoupon('PREMIUM', 'YEAR')).toEqual({
      id: 'invite-offer-year-premium',
      create: { amount_off: 1499, currency: 'gbp', duration: 'once', name: 'Invite offer: First Class, first year' },
    });
  });
});
