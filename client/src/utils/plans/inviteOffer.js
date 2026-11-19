// The invite offer (19 Nov 2026; docs/API.md "The invite offer"): a copy of the server's
// numbers (server/src/utils/inviteOffer.js; change both together). A new account made from an
// invite to a Business or First Class map can have that plan, or a lower paid one, at half
// price for its first 3 months, if it subscribes within 7 days of signing up; a yearly plan
// gets the same saving off its first year. Never with a promo code.
import { PLANS, formatPence, planOf } from '@/utils/constants/plans';
import { formatDay } from '@/utils/functions/dates';

export const INVITE_OFFER_DAYS = 7;
export const INVITE_OFFER_MONTHS = 3;
export const INVITE_OFFER_PERCENT_OFF = 50;

/** A yearly plan's saving, in pence: 3 half-price months of the monthly price. */
export const yearlyInviteSaving = (planId) =>
  Math.round((PLANS[planId].price.MONTH * INVITE_OFFER_MONTHS * INVITE_OFFER_PERCENT_OFF) / 100);

/** A plan's monthly price with the offer, in pence (Stripe takes half off each of the 3 bills). */
export const offerMonthlyPrice = (planId) => PLANS[planId].price.MONTH - Math.round((PLANS[planId].price.MONTH * INVITE_OFFER_PERCENT_OFF) / 100);

/** Does the offer (`{ plan }`) cover this plan? Its own or a lower paid one. */
export const offerCovers = (offer, planId) => Boolean(offer) && planId !== 'FREE' && planOf(planId).rank <= planOf(offer.plan).rank;

/** "Half price First Class for your first 3 months …", for the account page. */
export const inviteOfferText = (offer) =>
  `A welcome offer from your invite: ${planOf(offer.plan).name}${offer.plan === 'PREMIUM' ? ' or Business' : ''} at half price for your first ${INVITE_OFFER_MONTHS} months, or ${formatPence(yearlyInviteSaving(offer.plan))} off a year of ${planOf(offer.plan).name}. Choose it by ${formatDay(offer.endsAt)}.`;

/** The invite page's line, before signing up (`offer`: `{ plan, planName }`). */
export const invitePageOfferText = (offer) =>
  `Join within ${INVITE_OFFER_DAYS} days and get ${offer.planName} at half price for your first ${INVITE_OFFER_MONTHS} months (or ${formatPence(yearlyInviteSaving(offer.plan))} off your first year).`;
