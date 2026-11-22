// Gifts of a year of a paid plan (docs/API.md "Gifts"; 21 Nov 2026, the user's wish): what can
// be bought, what a gift's state is, and when a redeemed year runs. Pure, so tested on its
// own (tests/gifts.test.js).
import { planOf } from './constants/plans.js';
import { addMonths, grantIsActive, subscriptionCounts } from './plans.js';
import { isForLife } from './promoCodes.js';
import { sanitizeText } from './sanitize.js';

export const GIFT_PLANS = Object.freeze(['REGULAR', 'PREMIUM']);
// A year, at the plan's yearly price
export const GIFT_MONTHS = 12;
export const GIFT_TO_NAME_MAX = 60;
export const GIFT_MESSAGE_MAX = 300;
// An unpaid gift (Checkout left) is removed by the daily clean-up after this
export const GIFT_UNPAID_DAYS = 2;
export const GIFT_REASON = 'A gift';

/** What a gift costs, in pence: the plan's yearly price. */
export const giftPricePence = (plan) => planOf(plan).price.YEAR;

/** The gifts on offer, for the gift page: `[{ plan, name, months, pence }]`. */
export const giftOffers = () => GIFT_PLANS.map((plan) => ({ plan, name: planOf(plan).name, months: GIFT_MONTHS, pence: giftPricePence(plan) }));

/**
 * A gift order from a request: `{ plan, toName, message }` (names and messages cleaned, null
 * when empty), or `{ error }` (a responses.js message key).
 */
export function parseGiftOrder(body) {
  const input = body && typeof body === 'object' ? body : {};
  if (!GIFT_PLANS.includes(input.plan)) return { error: 'invalidGiftPlan' };
  for (const [field, max] of [
    ['toName', GIFT_TO_NAME_MAX],
    ['message', GIFT_MESSAGE_MAX],
  ]) {
    if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') return { error: 'invalidGiftText' };
    if (typeof input[field] === 'string' && input[field].trim().length > max) return { error: 'invalidGiftText' };
  }
  const clean = (value, max) => (typeof value === 'string' ? sanitizeText(value, { maxLength: max }) || null : null);
  return { plan: input.plan, toName: clean(input.toName, GIFT_TO_NAME_MAX), message: clean(input.message, GIFT_MESSAGE_MAX) };
}

/** Where a gift stands: UNPAID (Checkout not finished), READY, REDEEMED or REFUNDED. */
export const giftStatus = (gift) => (gift.refundedAt ? 'REFUNDED' : gift.redeemedAt ? 'REDEEMED' : gift.paidAt ? 'READY' : 'UNPAID');

/**
 * Whether the account can't use this gift because it already pays for that plan or a better
 * one (the year would run beside it, unused): a subscription that counts, of the same rank
 * or higher. A lower one is fine: the gift's plan wins while it runs.
 */
export const subscriptionCoversGift = (subscription, plan) =>
  subscriptionCounts(subscription) && planOf(subscription.plan).rank >= planOf(plan).rank;

/**
 * Whether a membership for life (a code for life, an admin's) already gives this plan or a
 * better one: a gift would add nothing.
 */
export const lifetimeCoversGift = (grants, plan, now = new Date()) =>
  (grants || []).some((grant) => grantIsActive(grant, now) && isForLife(grant.endsAt) && planOf(grant.plan).rank >= planOf(plan).rank);

/**
 * When a redeemed gift runs: from now, or from the end of the account's own gifted or
 * complimentary year of the same plan that's running or waiting (gifts stack, one year after
 * another), for `months`. -> `{ startsAt, endsAt }`
 */
export function giftWindow({ grants = [], plan, months = GIFT_MONTHS, now = new Date() }) {
  const own = grants
    .filter((grant) => grant.plan === plan && !isForLife(grant.endsAt))
    .map((grant) => ({ start: new Date(grant.startsAt), end: new Date(grant.endsAt) }));
  let startsAt = new Date(now);
  // Past each one covering the start, until none does: a gift after a gift after a gift
  for (let moved = true; moved; ) {
    moved = false;
    for (const grant of own) {
      if (grant.start <= startsAt && grant.end > startsAt) {
        startsAt = grant.end;
        moved = true;
      }
    }
  }
  return { startsAt, endsAt: addMonths(startsAt, months) };
}
