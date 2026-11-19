// The invite offer (19 Nov 2026, the user's wish; docs/API.md "The invite offer"): someone who
// signs up from an invite to a Business or First Class map can have that plan, or a lower
// paid one, at half price for their first 3 months, if they subscribe within 7 days of
// signing up. It goes by the map's plan (its owner's, whoever sent the invite). Never with a
// promo code: an account gets one introductory offer. Pure; services/billing/inviteOffer.js
// reads the rows. The client copies the numbers (utils/plans/inviteOffer.js).
import { PLANS, planOf } from './constants/plans.js';

export const INVITE_OFFER_DAYS = 7;
export const INVITE_OFFER_MONTHS = 3;
export const INVITE_OFFER_PERCENT_OFF = 50;

const DAY_MS = 24 * 60 * 60 * 1000;
const time = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());
const isPaidPlan = (plan) => plan === 'REGULAR' || plan === 'PREMIUM';

/**
 * Whether accepting an invite gives the account the offer, and which: `{ plan, endsAt }` or
 * null. Only for an account made after the invite was sent (one that already had an account
 * gets none), with no promo code and no offer yet, while its 7 days last, on a paid map.
 */
export function inviteOfferToRecord({ profile, userCreatedAt, inviteCreatedAt, mapPlan, now = new Date() }) {
  if (!isPaidPlan(mapPlan) || !userCreatedAt || !inviteCreatedAt) return null;
  if (profile?.promoCodeId || profile?.inviteOfferPlan || profile?.inviteOfferUsedAt) return null;
  if (time(userCreatedAt) < time(inviteCreatedAt)) return null;
  const endsAt = new Date(time(userCreatedAt) + INVITE_OFFER_DAYS * DAY_MS);
  return time(now) < endsAt.getTime() ? { plan: mapPlan, endsAt } : null;
}

/**
 * The offer an account can use now: `{ plan, endsAt }`, or null (none, used, ended, or a
 * subscription already). With `plan`, only when that's a paid plan the offer covers (the
 * offer's or a lower one).
 */
export function usableInviteOffer(profile, { now = new Date(), plan = null, hasSubscription = false } = {}) {
  if (hasSubscription || !profile?.inviteOfferPlan || profile.inviteOfferUsedAt || !profile.inviteOfferEndsAt) return null;
  if (time(now) >= time(profile.inviteOfferEndsAt)) return null;
  if (plan !== null && (!isPaidPlan(plan) || planOf(plan).rank > planOf(profile.inviteOfferPlan).rank)) return null;
  return { plan: profile.inviteOfferPlan, endsAt: new Date(profile.inviteOfferEndsAt) };
}

/**
 * A yearly plan's saving, in pence: the same as 3 half-price months of the monthly price (a
 * Stripe coupon "for 3 months" would halve the whole first year, its one bill in that time).
 */
export const yearlyInviteSaving = (plan) =>
  Math.round((PLANS[plan].price.MONTH * INVITE_OFFER_MONTHS * INVITE_OFFER_PERCENT_OFF) / 100);

/** The Stripe coupon for a Checkout: its id and how to make it if Stripe hasn't one yet. */
export function inviteOfferCoupon(plan, interval) {
  if (interval === 'YEAR') {
    return {
      id: `invite-offer-year-${plan.toLowerCase()}`,
      create: { amount_off: yearlyInviteSaving(plan), currency: 'gbp', duration: 'once', name: `Invite offer: ${planOf(plan).name}, first year` },
    };
  }
  return {
    id: 'invite-offer-half-3-months',
    create: { percent_off: INVITE_OFFER_PERCENT_OFF, duration: 'repeating', duration_in_months: INVITE_OFFER_MONTHS, name: 'Invite offer: half price for 3 months' },
  };
}
