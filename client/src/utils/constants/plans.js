// The three plans: names, prices and limits (docs/FEATURE-PLAN.md, "Tiers"; docs/API.md,
// "Map limits"). A copy of server/src/utils/constants/plans.js: change both together.
// The database stores only the ids (FREE, REGULAR, PREMIUM), so renaming a plan or
// changing a price never touches it.

export const PLAN_IDS = Object.freeze(['FREE', 'REGULAR', 'PREMIUM']);
export const PAID_PLAN_IDS = Object.freeze(['REGULAR', 'PREMIUM']);
export const BILLING_INTERVALS = Object.freeze(['MONTH', 'YEAR']);
export const CURRENCY = 'GBP';

// Decimal gigabytes, as storage is billed
const GB = 1000 ** 3;

// Prices in pence. `extraMap` is what each map beyond the included one costs on that plan.
export const PLANS = Object.freeze({
  FREE: Object.freeze({
    id: 'FREE',
    name: 'Economy',
    rank: 0,
    price: Object.freeze({ MONTH: 0, YEAR: 0 }),
    extraMap: Object.freeze({ MONTH: 399, YEAR: 3900 }),
    limits: Object.freeze({ photosPerCountry: 30, keepsOriginals: false, videos: false, storageCapBytes: null }),
  }),
  REGULAR: Object.freeze({
    id: 'REGULAR',
    name: 'Business',
    rank: 1,
    price: Object.freeze({ MONTH: 499, YEAR: 4900 }),
    extraMap: Object.freeze({ MONTH: 399, YEAR: 3900 }),
    limits: Object.freeze({ photosPerCountry: 200, keepsOriginals: true, videos: false, storageCapBytes: 50 * GB }),
  }),
  PREMIUM: Object.freeze({
    id: 'PREMIUM',
    name: 'First Class',
    rank: 2,
    price: Object.freeze({ MONTH: 899, YEAR: 8900 }),
    extraMap: Object.freeze({ MONTH: 599, YEAR: 5900 }),
    limits: Object.freeze({ photosPerCountry: 1000, keepsOriginals: true, videos: true, storageCapBytes: 200 * GB }),
  }),
});

// Maps every account owns without paying; more are extra maps
export const INCLUDED_MAPS = 1;
// On every plan: editors on a map (EDITOR members plus pending EDITOR invites), and
// people on a trip (members of any role plus pending invites), counted apart
export const EDITORS_PER_MAP = 10;
export const PEOPLE_PER_TRIP = 20;
// A map handed to someone with no free slot stays fully usable this long
export const TRANSFER_GRACE_DAYS = 60;
// A stored leaving plan is used only if the account is deleted within this time of saving it
export const LEAVING_PLAN_TTL_MINUTES = 60;
// Extra maps one account can hold (a sanity cap, not a business rule)
export const MAX_EXTRA_MAPS = 1000;
// Complimentary memberships: whole months
export const GRANT_MONTHS = Object.freeze({ min: 1, max: 36 });

// Stripe subscription statuses that keep a plan and its extra maps in force. A failed
// renewal (past_due) keeps them while Stripe retries; unpaid, canceled, incomplete and
// paused don't.
export const COUNTING_SUBSCRIPTION_STATUSES = Object.freeze(['active', 'trialing', 'past_due']);

export const isPlanId = (value) => typeof value === 'string' && PLAN_IDS.includes(value);
export const isBillingInterval = (value) => typeof value === 'string' && BILLING_INTERVALS.includes(value);

/** A plan's settings; anything unknown is FREE. */
export const planOf = (planId) => PLANS[planId] ?? PLANS.FREE;

/** What a map view and GET /billing say about a plan. */
export const planView = (planId) => {
  const plan = planOf(planId);
  return { id: plan.id, name: plan.name, ...plan.limits };
};

/** The highest plan: nothing to upgrade to. */
export const isTopPlan = (planId) => planOf(planId).rank === Math.max(...Object.values(PLANS).map((p) => p.rank));

/** Pence -> "£3.99", or "£39" for whole pounds. */
export function formatPence(pence) {
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}

/** "An extra map costs £3.99 a month or £39 a year." on this plan. */
export const extraMapPriceText = (planId) => {
  const { MONTH, YEAR } = planOf(planId).extraMap;
  return `An extra map costs ${formatPence(MONTH)} a month or ${formatPence(YEAR)} a year.`;
};

/** Every price, for GET /billing: `{ currency, plans: { id: { MONTH, YEAR } }, extraMap: { id: { MONTH, YEAR } } }`. */
export const pricesView = () => ({
  currency: CURRENCY,
  plans: Object.fromEntries(PLAN_IDS.map((id) => [id, { ...PLANS[id].price }])),
  extraMap: Object.fromEntries(PLAN_IDS.map((id) => [id, { ...PLANS[id].extraMap }])),
});
