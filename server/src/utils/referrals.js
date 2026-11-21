// Give a month, get a month (docs/API.md "Give a month, get a month"; 21 Nov 2026, the user's
// wish: invite a friend and both get a free month). A member's own code is a promo code with
// an owner: the friend who signs up with it gets every code's offer, the first month free
// (utils/promoCodes.js). Once the friend pays (their subscription first active, after that
// month), the member gets a month too. Pure, so tested on its own (tests/referrals.test.js).
import crypto from 'node:crypto';
import { PAID_PLAN_IDS, PLANS, COUNTING_SUBSCRIPTION_STATUSES, planOf } from './constants/plans.js';
import { isForLife } from './promoCodes.js';

// At most this many months a member earns in a year (rolling: the last 365 days)
export const REFERRAL_REWARDS_PER_YEAR = 12;
export const REFERRAL_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
// A month of the plan, when the member doesn't pay by card (a complimentary membership)
export const REFERRAL_GRANT_MONTHS = 1;
export const REFERRAL_GRANT_REASON = 'A friend joined';
// Never on the admins' list; shown to admins as this if it ever is
export const REFERRAL_LABEL = 'A member’s invite code';

// The share codes' alphabet (utils/shareCodes.js): no 0/O, 1/I/L or U
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * A member's code: up to 8 letters of their first name (A–Z only) and 4 random characters,
 * "SAM7KQ2X"; a name with no A–Z letters gives "FRIEND…". Valid as a promo code
 * (PROMO_CODE_PATTERN: 3 to 24 upper-case letters and digits).
 */
export function referralCodeFor(name, randomBytes = crypto.randomBytes(4)) {
  const first = String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 8);
  const tail = [...randomBytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
  return `${first.length >= 2 ? first : 'FRIEND'}${tail}`;
}

/** Does this subscription pay for a plan by card now? (A credit then takes a month off it.) */
export const paysByCard = (subscription) =>
  Boolean(subscription?.stripeCustomerId) &&
  COUNTING_SUBSCRIPTION_STATUSES.includes(subscription.status) &&
  PAID_PLAN_IDS.includes(subscription.plan);

/**
 * What a member gets for a friend's first payment:
 * - CAPPED past REFERRAL_REWARDS_PER_YEAR in the last year (`rewardsThisYear`, capped ones
 *   left out): nothing;
 * - CREDIT when they pay by card: a month of their plan's monthly price off their next invoice;
 * - else GRANT: a month of the best paid plan their complimentary memberships give, else
 *   Business; nothing to give (CAPPED) when that plan is theirs for life already.
 * -> `{ kind, amountPence?, plan? }`
 */
export function referralRewardFor({ subscription = null, grants = [], rewardsThisYear = 0, now = new Date() }) {
  if (rewardsThisYear >= REFERRAL_REWARDS_PER_YEAR) return { kind: 'CAPPED' };
  if (paysByCard(subscription)) return { kind: 'CREDIT', amountPence: PLANS[subscription.plan].price.MONTH };
  const running = grants.filter((g) => new Date(g.startsAt) <= now && new Date(g.endsAt) > now && PAID_PLAN_IDS.includes(g.plan));
  const best = running.reduce((top, g) => (!top || planOf(g.plan).rank > planOf(top.plan).rank ? g : top), null);
  if (best && isForLife(best.endsAt)) return { kind: 'CAPPED' };
  return { kind: 'GRANT', plan: best?.plan ?? 'REGULAR' };
}

/** The account page's numbers: `{ monthsEarned, monthsLeftThisYear }` from the member's rewards. */
export function referralTotals(rewards, now = new Date()) {
  const given = rewards.filter((r) => r.kind !== 'CAPPED');
  const thisYear = given.filter((r) => now - new Date(r.createdAt) < REFERRAL_YEAR_MS).length;
  return { monthsEarned: given.length, monthsLeftThisYear: Math.max(0, REFERRAL_REWARDS_PER_YEAR - thisYear) };
}

/** The first word of a name, for "From Sam: your first month free" (null when there's none). */
export const firstNameOf = (name) => String(name ?? '').trim().split(/\s+/)[0] || null;
