// Mock mode only: plans and billing, leaving, and the admin's memberships and map
// transfers (docs/API.md, "Plans and billing", "Leaving", "Transferring a map").
// There's no Stripe: Checkout applies the plan or the extra maps at once and sends you
// back to /account?billing=success; the billing portal is the account page itself.
import { fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { addMonths, billingView, effectivePlan, grantIsActive, grantsOf, isLive, subscriptionOf } from '../plans';
import { transferMapRecord } from './maps';
import { promoTrialFor } from '../promoCodes';
import { GRANT_MONTHS, MAX_EXTRA_MAPS, PAID_PLAN_IDS, isBillingInterval, isPlanId } from '@/utils/constants/plans';

// Server EVENT_MESSAGES
const M = {
  invalidPlan: 'Plan must be FREE, REGULAR or PREMIUM, and the interval MONTH or YEAR.',
  invalidExtraMaps: 'Extra maps must be a whole number from 0 to 1000.',
  nothingToBuy: 'Choose a plan, or at least one extra map.',
  subscriptionExists: 'You already have a subscription. Change its plan or extra maps instead.',
  noSubscription: 'You don’t have a subscription to change yet. Choose a plan to start one.',
  cancelInPortal: 'To stop paying altogether, cancel from the billing portal.',
  noBillingAccount: 'There’s no billing account yet. Choose a plan first.',
  leavingPlanInvalid: 'List each map you own once, with TRANSFER (to someone on that map) or DELETE, and say whether to leave your photos.',
  invalidGrant: 'Give a plan of REGULAR or PREMIUM and a number of months from 1 to 36.',
  grantNotFound: 'That membership doesn’t exist.',
  grantAlreadyEnded: 'That membership has already ended.',
  cannotGrantSelf: 'You can’t give yourself a membership.',
  mapNotFound: 'That map doesn’t exist, or it hasn’t been shared with you.',
  invalidEmail: 'Enter a valid email address.',
  transferTargetNoAccount: 'That address has no active account to move the map to.',
  transferToSelf: 'You already own this map.',
};

// Where Checkout and the portal send you in mock mode
const CHECKOUT_DONE_URL = '/account?billing=success';
const PORTAL_URL = '/account';
const LEAVING_PLAN_TTL_MS = 60 * 60 * 1000;
const DAY_MS = 86400000;

const signedOut = () => fail(401, 'No valid session. Please sign in.');
const isQuantity = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_EXTRA_MAPS;
const periodEnd = (interval) => new Date(Date.now() + (interval === 'YEAR' ? 365 : 30) * DAY_MS).toISOString();
const isAdmin = () => session.signedIn && ['ADMIN', 'DEVELOPER'].includes(me().role);
const notAdmin = () => (session.signedIn ? fail(403, 'Admins only.') : signedOut());

/**
 * A paid Checkout, applied at once: the account's subscription, with its two lines.
 * `trialDays` (a promo code's free month): in its trial, the period ending when it does.
 */
function subscribe(userId, { plan, interval, extraMaps, trialDays = 0 }) {
  const db = getDb();
  db.subscriptions = db.subscriptions.filter((s) => s.userId !== userId);
  db.subscriptions.push({
    userId,
    plan,
    interval,
    status: trialDays ? 'trialing' : 'active',
    currentPeriodEnd: trialDays ? new Date(Date.now() + trialDays * DAY_MS).toISOString() : periodEnd(interval),
    cancelAtPeriodEnd: false,
    extraMaps,
    stripeCustomerId: `cus_mock_${userId}`,
  });
}

// Owned maps, the default first, with everyone on them (longest-standing first)
function ownedMapsWithMembers(userId) {
  const db = getDb();
  return db.maps
    .filter((m) => m.ownerId === userId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((map) => ({
      id: map.id,
      name: map.name,
      members: db.mapMembers
        .filter((m) => m.mapId === map.id)
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
        .map((m) => ({ userId: m.userId, name: db.users.find((u) => u.id === m.userId)?.name ?? null, role: m.role })),
    }));
}

// As the server's parseLeavingPlan: every owned map once, TRANSFER to someone on it or DELETE
function parseLeavingPlan(body, owned) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { maps, leavePhotos = true } = body;
  if (!Array.isArray(maps) || typeof leavePhotos !== 'boolean') return null;
  const byId = new Map(owned.map((m) => [m.id, new Set(m.members.map((x) => x.userId))]));
  const seen = new Set();
  const out = [];
  for (const entry of maps) {
    const members = entry && typeof entry.mapId === 'string' ? byId.get(entry.mapId) : null;
    if (!members || seen.has(entry.mapId) || !['TRANSFER', 'DELETE'].includes(entry.action)) return null;
    seen.add(entry.mapId);
    if (entry.action === 'TRANSFER') {
      if (typeof entry.toUserId !== 'string' || !members.has(entry.toUserId)) return null;
      out.push({ mapId: entry.mapId, action: 'TRANSFER', toUserId: entry.toUserId });
    } else {
      if (entry.toUserId !== undefined && entry.toUserId !== null) return null;
      out.push({ mapId: entry.mapId, action: 'DELETE' });
    }
  }
  return seen.size === byId.size ? { maps: out, leavePhotos } : null;
}

const grantView = (grant) => ({
  id: grant.id,
  plan: grant.plan,
  startsAt: grant.startsAt,
  endsAt: grant.endsAt,
  reason: grant.reason,
  grantedById: grant.grantedById,
  createdAt: grant.createdAt,
  active: grantIsActive(grant),
});

export function registerBillingRoutes() {
  // ── Plans and billing ──
  route('GET', '/api/billing', () => (session.signedIn ? ok(billingView(me().id)) : signedOut()));

  route('POST', '/api/billing/checkout', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const extraMaps = body.extraMaps ?? 0;
    if (!isPlanId(body.plan) || !isBillingInterval(body.interval)) return fail(400, M.invalidPlan);
    if (!isQuantity(extraMaps)) return fail(400, M.invalidExtraMaps);
    if (body.plan === 'FREE' && extraMaps === 0) return fail(400, M.nothingToBuy);
    if (isLive(subscriptionOf(me().id))) return fail(409, M.subscriptionExists);
    // A promo code's free month, on a paid plan; as the webhook, it's then used
    const trial = promoTrialFor(me(), body.plan);
    subscribe(me().id, { plan: body.plan, interval: body.interval, extraMaps, trialDays: trial?.days });
    if (trial) me().promoTrialUsedAt = new Date().toISOString();
    return ok({ url: CHECKOUT_DONE_URL });
  });

  route('POST', '/api/billing/change-plan', ({ body }) => {
    if (!session.signedIn) return signedOut();
    if (!isPlanId(body.plan) || !isBillingInterval(body.interval)) return fail(400, M.invalidPlan);
    const sub = subscriptionOf(me().id);
    if (!isLive(sub)) return fail(409, M.noSubscription);
    if (body.plan === 'FREE' && !(sub.extraMaps > 0)) return fail(409, M.cancelInPortal);
    Object.assign(sub, { plan: body.plan, interval: body.interval });
    return ok({ billing: billingView(me().id) });
  });

  route('POST', '/api/billing/extra-maps', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const { quantity } = body;
    if (!isQuantity(quantity)) return fail(400, M.invalidExtraMaps);
    const sub = subscriptionOf(me().id);
    if (!isLive(sub)) {
      const interval = body.interval ?? 'MONTH';
      if (!isBillingInterval(interval)) return fail(400, M.invalidPlan);
      if (quantity === 0) return fail(400, M.nothingToBuy);
      subscribe(me().id, { plan: 'FREE', interval, extraMaps: quantity });
      return ok({ url: CHECKOUT_DONE_URL });
    }
    if (quantity === 0 && sub.plan === 'FREE' && sub.extraMaps > 0) return fail(409, M.cancelInPortal);
    sub.extraMaps = quantity;
    return ok({ billing: billingView(me().id) });
  });

  route('POST', '/api/billing/portal', () => {
    if (!session.signedIn) return signedOut();
    if (!subscriptionOf(me().id)?.stripeCustomerId) return fail(409, M.noBillingAccount);
    return ok({ url: PORTAL_URL });
  });

  // ── Leaving ──
  route('GET', '/api/users/leaving-options', () => {
    if (!session.signedIn) return signedOut();
    const db = getDb();
    const photosOnOtherMaps = db.photos.filter(
      (p) => p.uploaderId === me().id && db.maps.find((m) => m.id === p.mapId)?.ownerId !== me().id,
    ).length;
    return ok({ maps: ownedMapsWithMembers(me().id), photosOnOtherMaps });
  });

  route('PUT', '/api/users/leaving-plan', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const plan = parseLeavingPlan(body, ownedMapsWithMembers(me().id));
    if (!plan) return fail(400, M.leavingPlanInvalid);
    const savedAt = new Date();
    getDb().leavingPlan = { plan, savedAt: savedAt.toISOString() };
    // Deleting the account resets the demo, so this is how the choice can be seen
    console.info('[mock] leaving plan saved', JSON.stringify(plan));
    return ok({ leavingPlan: plan, savedAt: savedAt.toISOString(), expiresAt: new Date(savedAt.getTime() + LEAVING_PLAN_TTL_MS).toISOString() });
  });

  // ── Admin: complimentary memberships ──
  route('GET', '/api/users/admin/plan-grants/:userId', ({ params }) => {
    if (!isAdmin()) return notAdmin();
    const user = getDb().users.find((u) => u.id === params.userId);
    if (!user) return fail(404, 'Failed to find user(s).');
    const { plan, source } = effectivePlan(user.id);
    const grants = [...grantsOf(user.id)].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return ok({ grants: grants.map(grantView), plan, source });
  });

  route('POST', '/api/users/admin/plan-grants/:userId', ({ params, body }) => {
    if (!isAdmin()) return notAdmin();
    const user = getDb().users.find((u) => u.id === params.userId);
    if (!user) return fail(404, 'Failed to find user(s).');
    if (user.id === me().id) return fail(403, M.cannotGrantSelf);
    const { plan, months, reason } = body;
    if (!PAID_PLAN_IDS.includes(plan) || !Number.isInteger(months) || months < GRANT_MONTHS.min || months > GRANT_MONTHS.max) {
      return fail(400, M.invalidGrant);
    }
    const now = new Date();
    const grant = {
      id: newId(),
      userId: user.id,
      plan,
      startsAt: now.toISOString(),
      endsAt: addMonths(now, months).toISOString(),
      reason: typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 200) : null,
      grantedById: me().id,
      createdAt: now.toISOString(),
    };
    getDb().planGrants.push(grant);
    return ok({ grant: grantView(grant) }, 201);
  });

  route('PATCH', '/api/users/admin/end-plan-grant/:grantId', ({ params }) => {
    if (!isAdmin()) return notAdmin();
    const grant = getDb().planGrants.find((g) => g.id === params.grantId);
    if (!grant) return fail(404, M.grantNotFound);
    if (new Date(grant.endsAt).getTime() <= Date.now()) return fail(409, M.grantAlreadyEnded);
    grant.endsAt = new Date().toISOString();
    return ok({ grant: grantView(grant) });
  });

  // ── Admin: moving a map whose owner can't ──
  route('POST', '/api/users/admin/transfer-map', ({ body }) => {
    if (!isAdmin()) return notAdmin();
    const db = getDb();
    const keepOldOwnerAsEditor = body.keepOldOwnerAsEditor ?? false;
    if (typeof keepOldOwnerAsEditor !== 'boolean') return fail(400, 'Malformed data.');
    const map = db.maps.find((m) => m.id === body.mapId);
    if (!map) return fail(404, M.mapNotFound);
    const email = typeof body.toEmail === 'string' ? body.toEmail.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, M.invalidEmail);
    const target = db.users.find((u) => u.email.toLowerCase() === email);
    if (!target || target.isActive === false) return fail(400, M.transferTargetNoAccount);
    if (target.id === map.ownerId) return fail(400, M.transferToSelf);
    const result = transferMapRecord(map, target.id, { keepOldOwnerAsEditor });
    return ok({ map: { id: map.id, name: map.name, ownerId: target.id, previousOwnerId: result.fromUserId, graceUntil: result.graceUntil } });
  });
}
