// Mock mode only. The plan rules (docs/API.md, "Map limits", "Plans and billing",
// "Transferring a map"), as the server's pure functions: utils/plans.js (the plan in
// force), utils/mapSlots.js (which maps are active), utils/planLimits.js (the caps and
// their wording) and controllers/billing.js (GET /billing's shape).
import {
  COUNTING_SUBSCRIPTION_STATUSES,
  EDITORS_PER_MAP,
  INCLUDED_MAPS,
  PEOPLE_PER_TRIP,
  TRANSFER_GRACE_DAYS,
  extraMapPriceText,
  isTopPlan,
  planOf,
  planView,
  pricesView,
} from '@/utils/constants/plans';
import { countryName } from '@/utils/map/countries';
import { getDb } from './store';
import { promoTrialFor } from './promoCodes';

const DAY_MS = 86400000;
const time = (value) => new Date(value).getTime();
const number = (n) => Number(n).toLocaleString('en-GB');

// Subscriptions and complimentary memberships

export const subscriptionOf = (userId) => (getDb().subscriptions || []).find((s) => s.userId === userId) || null;
const counts = (sub) => Boolean(sub && COUNTING_SUBSCRIPTION_STATUSES.includes(sub.status));
// A subscription that hasn't ended (server utils/stripeState.js hasLiveSubscription)
export const isLive = (sub) => Boolean(sub && sub.status && !['canceled', 'incomplete_expired'].includes(sub.status));
export const extraMapsPaid = (userId) => {
  const sub = subscriptionOf(userId);
  return counts(sub) ? Math.max(0, Number(sub.extraMaps) || 0) : 0;
};
export const grantIsActive = (grant, now = Date.now()) => time(grant.startsAt) <= now && now < time(grant.endsAt);
export const grantsOf = (userId) => (getDb().planGrants || []).filter((g) => g.userId === userId);

/** The plan in force: the best of the subscription's (while it counts) and the running grants, else FREE. */
export function effectivePlan(userId, now = Date.now()) {
  const sub = subscriptionOf(userId);
  const grant =
    grantsOf(userId)
      .filter((g) => grantIsActive(g, now))
      .sort((a, b) => planOf(b.plan).rank - planOf(a.plan).rank || time(b.endsAt) - time(a.endsAt))[0] || null;
  const candidates = [];
  if (counts(sub) && sub.plan !== 'FREE') candidates.push({ plan: sub.plan, source: 'STRIPE' });
  if (grant && grant.plan !== 'FREE') candidates.push({ plan: grant.plan, source: 'COMPLIMENTARY' });
  const best = candidates.sort((a, b) => planOf(b.plan).rank - planOf(a.plan).rank)[0];
  return best ? { ...best, grant } : { plan: 'FREE', source: 'FREE', grant };
}

/** `date` plus whole calendar months, in UTC (server utils/plans.js addMonths). */
export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

// Map slots

const inGrace = (map, now) => Boolean(map.graceUntil) && time(map.graceUntil) > now;

/** An owner's maps against their slots (optionally leaving one map out, for a transfer's grace). */
export function mapSlots(ownerId, { exceptMapId = null, now = Date.now() } = {}) {
  const maps = getDb().maps.filter((m) => m.ownerId === ownerId && m.id !== exceptMapId);
  const paid = extraMapsPaid(ownerId);
  const active = new Set(maps.filter((m) => m.isDefault || inGrace(m, now)).map((m) => m.id));
  const includedLeft = Math.max(0, INCLUDED_MAPS - maps.filter((m) => m.isDefault).length);
  maps
    .filter((m) => !active.has(m.id))
    .sort(
      (a, b) =>
        Number(Boolean(a.graceUntil)) - Number(Boolean(b.graceUntil)) ||
        time(a.createdAt) - time(b.createdAt) ||
        String(a.id).localeCompare(String(b.id)),
    )
    .slice(0, includedLeft + paid)
    .forEach((m) => active.add(m.id));
  const slots = INCLUDED_MAPS + paid;
  return {
    lockedIds: maps.filter((m) => !active.has(m.id)).map((m) => m.id),
    slots,
    used: active.size,
    canCreate: active.size < slots,
  };
}

export const isMapLocked = (map) => mapSlots(map.ownerId).lockedIds.includes(map.id);

/** A map going to `toUserId`: 60 days' grace when they have no free slot, else none. */
export const graceForNewOwner = (mapId, toUserId) =>
  mapSlots(toUserId, { exceptMapId: mapId }).canCreate ? null : new Date(Date.now() + TRANSFER_GRACE_DAYS * DAY_MS).toISOString();

// What the map and trip views carry (owner and editors, never share links)

export const mapPlanId = (map) => effectivePlan(map.ownerId).plan;

export function photoCounts(mapId) {
  const out = {};
  for (const p of getDb().photos) if (p.mapId === mapId && p.countryCode) out[p.countryCode] = (out[p.countryCode] || 0) + 1;
  return out;
}

export function uploadRules(map) {
  const { limits } = planOf(mapPlanId(map));
  return { keepsOriginals: limits.keepsOriginals, photosPerCountry: limits.photosPerCountry, locked: isMapLocked(map) };
}

export const mapPlanFields = (map) => ({
  plan: planView(mapPlanId(map)),
  locked: isMapLocked(map),
  graceUntil: map.graceUntil || null,
  photoCounts: photoCounts(map.id),
  uploadRules: uploadRules(map),
});

// The caps and their messages (server utils/planLimits.js and EVENT_MESSAGES)

export const LOCKED_MAP_MESSAGE =
  "This map isn't paid for, so it can't take new photos. Its owner can pay for it as an extra map, or make it their main map.";

export const mapSlotsMessage = (planId) =>
  `Your plan includes 1 map, and every extra map you've paid for is in use. ${extraMapPriceText(planId)}`;

/** The third file a photo may send on this plan: null, or the 400 message. */
export function photoSizesProblem(sizes, planId) {
  if (planOf(planId).limits.keepsOriginals) return sizes.includes('PRINT') ? 'This map keeps the original, so it needs no print copy.' : null;
  if (sizes.includes('ORIGINAL')) return 'Economy keeps a print-quality copy, not the original.';
  if (!sizes.includes('PRINT')) return 'Economy keeps a print-quality copy of each photo: send a PRINT copy with the other two.';
  return null;
}

/** One more photo of `countryCode` on the map: null, or the 409 message. */
export function countryCapProblem(map, countryCode) {
  if (!countryCode) return null;
  const planId = mapPlanId(map);
  const cap = planOf(planId).limits.photosPerCountry;
  const count = photoCounts(map.id)[countryCode] || 0;
  if (count + 1 <= cap) return null;
  return `${number(Math.min(count, cap))} of ${number(cap)} photos of ${countryName(countryCode)} on this map.${isTopPlan(planId) ? '' : ' Upgrade to add more.'}`;
}

export const PEOPLE_CAP_MESSAGES = {
  editors: `A map can have up to ${EDITORS_PER_MAP} editors.`,
  tripPeople: `A trip can have up to ${PEOPLE_PER_TRIP} people.`,
};
export { EDITORS_PER_MAP, PEOPLE_PER_TRIP };

// The mock badge's Plan and Extra maps controls, for the signed-in test user

export const MOCK_PLAN_CHOICES = [
  { value: 'FREE', label: 'Economy' },
  { value: 'REGULAR', label: 'Business' },
  { value: 'PREMIUM', label: 'First Class' },
  { value: 'COMP_PREMIUM', label: 'First Class, free' },
];

export function mockPlanChoice(userId) {
  const { plan, source } = effectivePlan(userId);
  return source === 'COMPLIMENTARY' ? `COMP_${plan}` : plan;
}

/** Economy (extra maps only, or nothing), a paid plan monthly, or a 12-month complimentary First Class. */
export function setMockPlan(userId, choice, extraMaps) {
  const db = getDb();
  const sub = subscriptionOf(userId);
  db.subscriptions = db.subscriptions.filter((s) => s.userId !== userId);
  db.planGrants = db.planGrants.filter((g) => g.userId !== userId);
  const paidPlan = choice === 'REGULAR' || choice === 'PREMIUM' ? choice : null;
  if (paidPlan || extraMaps > 0) {
    db.subscriptions.push({
      userId,
      plan: paidPlan || 'FREE',
      interval: sub?.interval || 'MONTH',
      status: 'active',
      currentPeriodEnd: sub?.currentPeriodEnd || new Date(Date.now() + 30 * DAY_MS).toISOString(),
      cancelAtPeriodEnd: false,
      extraMaps,
      stripeCustomerId: `cus_mock_${userId}`,
    });
  }
  if (choice === 'COMP_PREMIUM') {
    const now = new Date();
    db.planGrants.push({
      id: `grant-${Date.now().toString(36)}`,
      userId,
      plan: 'PREMIUM',
      startsAt: now.toISOString(),
      endsAt: addMonths(now, 12).toISOString(),
      reason: 'Mock badge',
      grantedById: userId,
      createdAt: now.toISOString(),
    });
  }
}

// GET /billing

export function billingView(userId) {
  const sub = subscriptionOf(userId);
  const { plan, source, grant } = effectivePlan(userId);
  return {
    plan,
    planName: planOf(plan).name,
    source,
    interval: sub?.interval ?? null,
    status: sub?.status ?? null,
    renewsAt: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    grant: grant ? { plan: grant.plan, endsAt: grant.endsAt } : null,
    promoTrial: isLive(sub) ? null : promoTrialFor(getDb().users.find((u) => u.id === userId)),
    includedMaps: INCLUDED_MAPS,
    extraMapsPaid: extraMapsPaid(userId),
    ownedMaps: getDb().maps.filter((m) => m.ownerId === userId).length,
    lockedMapIds: mapSlots(userId).lockedIds,
    prices: pricesView(),
    paymentsEnabled: true,
  };
}
