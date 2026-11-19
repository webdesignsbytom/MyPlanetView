// Mock mode only. The plan rules (docs/API.md, "Map limits", "Plans and billing",
// "Transferring a map"), as the server's pure functions: utils/plans.js (the plan in
// force), utils/mapSlots.js (which maps are active), utils/planLimits.js (the caps and
// their wording) and controllers/billing.js (GET /billing's shape).
import {
  COUNTING_SUBSCRIPTION_STATUSES,
  EDITORS_PER_MAP,
  INCLUDED_MAPS,
  FREE_ECONOMY_MAPS,
  PEOPLE_PER_TRIP,
  TRANSFER_GRACE_DAYS,
  VIDEO_MAX_SECONDS,
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

// As the server's utils/mapSlots.js (19 Nov 2026: 3 free maps, the main one on the plan and
// two on Economy; chosen upgrades take the paid slots first)
const byQueue = (a, b) =>
  Number(!a.upgradedAt) - Number(!b.upgradedAt) ||
  (a.upgradedAt && b.upgradedAt ? time(a.upgradedAt) - time(b.upgradedAt) : 0) ||
  Number(Boolean(a.graceUntil)) - Number(Boolean(b.graceUntil)) ||
  time(a.createdAt) - time(b.createdAt) ||
  String(a.id).localeCompare(String(b.id));

/** An owner's maps against their slots (optionally leaving one map out, for a transfer's grace). */
export function mapSlots(ownerId, { exceptMapId = null, now = Date.now() } = {}) {
  const maps = getDb().maps.filter((m) => m.ownerId === ownerId && m.id !== exceptMapId);
  const paid = extraMapsPaid(ownerId);
  const onPlan = new Set(maps.filter((m) => m.isDefault || inGrace(m, now)).map((m) => m.id));
  const includedLeft = Math.max(0, INCLUDED_MAPS - maps.filter((m) => m.isDefault).length);
  const queue = maps.filter((m) => !onPlan.has(m.id)).sort(byQueue);
  const planned = queue.slice(0, includedLeft + paid);
  planned.forEach((m) => onPlan.add(m.id));
  const rest = queue.slice(planned.length).sort((a, b) => byQueue({ ...a, upgradedAt: null }, { ...b, upgradedAt: null }));
  const onEconomy = new Set(rest.slice(0, FREE_ECONOMY_MAPS).map((m) => m.id));
  const tierOf = (id) => (onPlan.has(id) ? 'PLAN' : onEconomy.has(id) ? 'ECONOMY' : 'LOCKED');
  const slots = INCLUDED_MAPS + paid;
  return {
    economyIds: maps.filter((m) => onEconomy.has(m.id)).map((m) => m.id),
    lockedIds: maps.filter((m) => tierOf(m.id) === 'LOCKED').map((m) => m.id),
    tiers: Object.fromEntries(maps.map((m) => [m.id, tierOf(m.id)])),
    slots,
    used: onPlan.size,
    canCreate: onPlan.size + onEconomy.size < slots + FREE_ECONOMY_MAPS,
  };
}

export const mapTier = (map) => mapSlots(map.ownerId).tiers[map.id] || 'LOCKED';
export const isMapLocked = (map) => mapTier(map) === 'LOCKED';

/** A map going to `toUserId`: 60 days' grace when they have no free slot, else none. */
export const graceForNewOwner = (mapId, toUserId) =>
  mapSlots(toUserId, { exceptMapId: mapId }).canCreate ? null : new Date(Date.now() + TRANSFER_GRACE_DAYS * DAY_MS).toISOString();

// What the map and trip views carry (owner and editors, never share links)

// A map's own plan: the owner's when it's on it, else Economy's (a free map, or a locked one)
export const mapPlanId = (map) => (mapTier(map) === 'PLAN' ? effectivePlan(map.ownerId).plan : 'FREE');

// Photos per country, or with kind 'VIDEO' videos per country (each has its own cap),
// hidden ones included
const kindOf = (photo) => photo.kind || 'PHOTO';
export function photoCounts(mapId, kind = 'PHOTO') {
  const out = {};
  for (const p of getDb().photos) {
    if (p.mapId === mapId && p.countryCode && kindOf(p) === kind) out[p.countryCode] = (out[p.countryCode] || 0) + 1;
  }
  return out;
}
export const videoCounts = (mapId) => photoCounts(mapId, 'VIDEO');

// Server mediaConstants.js VIDEO_CONTENT_TYPES and VIDEO_MAX_BYTES (docs/API.md, "Videos")
export const VIDEO_CONTENT_TYPES = ['video/mp4', 'video/quicktime'];
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

// As the server's uploadRulesFrom: `videos` only on First Class, null on the others
export function uploadRules(map) {
  const { limits } = planOf(mapPlanId(map));
  return {
    keepsOriginals: limits.keepsOriginals,
    photosPerCountry: limits.photosPerCountry,
    videos: limits.videos
      ? { perCountry: limits.videosPerCountry, maxSeconds: VIDEO_MAX_SECONDS, maxBytes: VIDEO_MAX_BYTES, contentTypes: VIDEO_CONTENT_TYPES }
      : null,
    locked: isMapLocked(map),
  };
}

export const mapPlanFields = (map) => ({
  plan: planView(mapPlanId(map)),
  accountPlan: planView(effectivePlan(map.ownerId).plan),
  tier: mapTier(map),
  upgraded: Boolean(map.upgradedAt),
  locked: isMapLocked(map),
  graceUntil: map.graceUntil || null,
  photoCounts: photoCounts(map.id),
  videoCounts: videoCounts(map.id),
  uploadRules: uploadRules(map),
});

// The caps and their messages (server utils/planLimits.js and EVENT_MESSAGES)

export const LOCKED_MAP_MESSAGE =
  "This map isn't paid for, so it can't take new photos. Its owner can pay for it as an extra map, or make it their main map.";

export const mapSlotsMessage = (planId) =>
  `You have your 3 free maps, and every extra map you've paid for is in use. ${extraMapPriceText(planId)}`;

/** The third file a photo may send on this plan: null, or the 400 message. */
export function photoSizesProblem(sizes, planId) {
  if (planOf(planId).limits.keepsOriginals) return sizes.includes('PRINT') ? 'This map keeps the original, so it needs no print copy.' : null;
  if (sizes.includes('ORIGINAL')) return 'Economy keeps a print-quality copy, not the original.';
  if (!sizes.includes('PRINT')) return 'Economy keeps a print-quality copy of each photo: send a PRINT copy with the other two.';
  return null;
}

/** One more photo (or, with kind 'VIDEO', video) of `countryCode` on the map: null, or the 409 message. */
// "of France", or "with no country": the photos with no country are one gallery under the
// same cap (the server's countryFullMessage, 17 Nov 2026)
const ofPlace = (countryCode) => (countryCode ? `of ${countryName(countryCode)}` : 'with no country');
const countIn = (mapId, countryCode, kind) =>
  getDb().photos.filter((p) => p.mapId === mapId && (p.countryCode || null) === (countryCode || null) && kindOf(p) === kind).length;

export function countryCapProblem(map, countryCode, kind = 'PHOTO') {
  if (kind === 'VIDEO') return videoCapProblem(map, countryCode);
  const planId = mapPlanId(map);
  const cap = planOf(planId).limits.photosPerCountry;
  const count = countIn(map.id, countryCode, 'PHOTO');
  if (count + 1 <= cap) return null;
  return `${number(Math.min(count, cap))} of ${number(cap)} photos ${ofPlace(countryCode)} on this map.${isTopPlan(planId) ? '' : ' Upgrade to add more.'}`;
}

// Videos (server utils/planLimits.js VIDEO_MESSAGES, checkVideoAllowed, checkVideoCap)
export const VIDEO_MESSAGES = {
  notOnPlan: 'Videos are part of First Class. Upgrade this map’s owner to add them.',
  duration: 'A video can be up to 3 minutes long.',
  landmark: 'Landmark stamps come from photos, not videos.',
  useVideoUpload: 'Videos upload through POST /maps/:mapId/videos/upload.',
};

/** Can this map take videos (its owner on First Class)? null, or the 403 message. */
export const videoNotAllowed = (map) => (planOf(mapPlanId(map)).limits.videos ? null : VIDEO_MESSAGES.notOnPlan);

/** One more video of `countryCode`: null, or "20 of 20 videos of Italy on this map." */
function videoCapProblem(map, countryCode) {
  const cap = planOf(mapPlanId(map)).limits.videosPerCountry;
  const count = countIn(map.id, countryCode, 'VIDEO');
  if (count + 1 <= cap) return null;
  return `${number(Math.min(count, cap))} of ${number(cap)} videos ${ofPlace(countryCode)} on this map.`;
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

// The invite offer (19 Nov 2026, the server's utils/inviteOffer.js): kept on the user, as the
// server keeps it on the profile

const paidPlan = (plan) => plan === 'REGULAR' || plan === 'PREMIUM';

/** The offer `user` can use now (for `plan` when given): `{ plan, endsAt }` or null. */
export function usableInviteOffer(user, { plan = null } = {}) {
  if (!user?.inviteOfferPlan || user.inviteOfferUsedAt || !user.inviteOfferEndsAt || isLive(subscriptionOf(user.id))) return null;
  if (time(user.inviteOfferEndsAt) <= Date.now()) return null;
  if (plan !== null && (!paidPlan(plan) || planOf(plan).rank > planOf(user.inviteOfferPlan).rank)) return null;
  return { plan: user.inviteOfferPlan, endsAt: user.inviteOfferEndsAt };
}

/** A new account from an invite to a paid map (`mapPlan`): the offer, unless it has a promo code or one already. */
export function recordInviteOffer(user, mapPlan) {
  if (!paidPlan(mapPlan) || user.promoCodeId || user.inviteOfferPlan) return;
  user.inviteOfferPlan = mapPlan;
  user.inviteOfferEndsAt = new Date(Date.now() + 7 * DAY_MS).toISOString();
  user.inviteOfferUsedAt = null;
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
    inviteOffer: usableInviteOffer(getDb().users.find((u) => u.id === userId)),
    includedMaps: INCLUDED_MAPS,
    freeEconomyMaps: FREE_ECONOMY_MAPS,
    extraMapsPaid: extraMapsPaid(userId),
    ownedMaps: getDb().maps.filter((m) => m.ownerId === userId).length,
    economyMapIds: mapSlots(userId).economyIds,
    lockedMapIds: mapSlots(userId).lockedIds,
    prices: pricesView(),
    paymentsEnabled: true,
  };
}
