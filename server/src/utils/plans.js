// The plan in force for an account (docs/API.md, "Plans and billing"). Pure: callers
// load the Subscription row and the grants, this decides. The plan of a map is always
// its owner's.
import { COUNTING_SUBSCRIPTION_STATUSES, planOf } from './constants/plans.js';

export const PLAN_SOURCES = Object.freeze({ STRIPE: 'STRIPE', COMPLIMENTARY: 'COMPLIMENTARY', FREE: 'FREE' });

const time = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

/** Does this Subscription row keep its plan and extra maps in force (active, trialing, past_due)? */
export const subscriptionCounts = (subscription) =>
  Boolean(subscription && COUNTING_SUBSCRIPTION_STATUSES.includes(subscription.status));

/** Extra maps paid for: the subscription's quantity while it counts, else 0. */
export const extraMapsPaid = (subscription) =>
  subscriptionCounts(subscription) ? Math.max(0, Number(subscription.extraMaps) || 0) : 0;

/**
 * `date` plus whole calendar months, in UTC. A day the target month doesn't have becomes
 * its last day (31 January + 1 month = 28 or 29 February).
 */
export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** Is a grant in force at `now` (startsAt <= now < endsAt)? */
export const grantIsActive = (grant, now = new Date()) =>
  Boolean(grant) && time(grant.startsAt) <= time(now) && time(now) < time(grant.endsAt);

/**
 * The plan in force: the highest-ranked of the subscription's plan (while its status
 * counts) and every grant in force at `now`; else FREE. On a tie the subscription wins
 * (it's what continues). `grant` is the best grant in force (longest-running on a tie),
 * reported whatever the winner, so the account page can show it.
 * -> `{ plan, source: 'STRIPE' | 'COMPLIMENTARY' | 'FREE', grant }`
 */
export function effectivePlan({ subscription = null, grants = [], now = new Date() } = {}) {
  const activeGrants = (grants || []).filter((g) => grantIsActive(g, now) && planOf(g.plan).id === g.plan);
  const grant =
    activeGrants.sort((a, b) => planOf(b.plan).rank - planOf(a.plan).rank || time(b.endsAt) - time(a.endsAt))[0] ?? null;

  const candidates = [];
  if (subscriptionCounts(subscription) && planOf(subscription.plan).id === subscription.plan && subscription.plan !== 'FREE') {
    candidates.push({ plan: subscription.plan, source: PLAN_SOURCES.STRIPE });
  }
  if (grant && grant.plan !== 'FREE') candidates.push({ plan: grant.plan, source: PLAN_SOURCES.COMPLIMENTARY });

  // Stable sort: the subscription (pushed first) stays ahead on a tie
  const best = candidates.sort((a, b) => planOf(b.plan).rank - planOf(a.plan).rank)[0];
  return best ? { ...best, grant } : { plan: 'FREE', source: PLAN_SOURCES.FREE, grant };
}
