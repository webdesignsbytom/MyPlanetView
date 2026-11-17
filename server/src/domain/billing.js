import { prisma } from '../prisma.js';

// Plans and payments: the Stripe subscription, complimentary grants, webhook events,
// and what the plan rules need (utils/plans.js, utils/mapSlots.js).

const SUBSCRIPTION_SELECT = {
  userId: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  plan: true,
  interval: true,
  status: true,
  extraMaps: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
};

const GRANT_SELECT = { id: true, plan: true, startsAt: true, endsAt: true, reason: true, grantedById: true, createdAt: true };

// What decides which maps are active
const SLOT_MAP_SELECT = { id: true, isDefault: true, createdAt: true, graceUntil: true };

const grantsInForce = (now) => ({ startsAt: { lte: now }, endsAt: { gt: now } });

/**
 * A user's plan inputs: their subscription, grants in force and owned maps, read side by
 * side. -> `{ subscription, grants, maps }`
 */
/** A map's grace date from an earlier transfer (null when it never had one). */
export const findMapGraceUntil = async (mapId) =>
  (await prisma.travelMap.findUnique({ where: { id: mapId }, select: { graceUntil: true } }))?.graceUntil ?? null;

export const findPlanInputsForUser = async (userId, now = new Date()) => {
  const [subscription, grants, maps] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, select: SUBSCRIPTION_SELECT }),
    prisma.planGrant.findMany({ where: { userId, ...grantsInForce(now) }, select: GRANT_SELECT }),
    prisma.travelMap.findMany({ where: { ownerId: userId }, select: SLOT_MAP_SELECT, orderBy: { createdAt: 'asc' } }),
  ]);
  return { subscription, grants, maps };
};

/**
 * The same for a map's owner, found through the map (flat relation filters side by side,
 * so it's one round trip and needs no owner id). -> `{ ownerId, subscription, grants, maps }`,
 * or null when the map doesn't exist
 */
export const findPlanInputsForMap = async (mapId, now = new Date()) => {
  const ownerOf = { ownedMaps: { some: { id: mapId } } };
  const [map, subscription, grants, maps] = await Promise.all([
    prisma.travelMap.findUnique({ where: { id: mapId }, select: { ownerId: true } }),
    prisma.subscription.findFirst({ where: { user: ownerOf }, select: SUBSCRIPTION_SELECT }),
    prisma.planGrant.findMany({ where: { user: ownerOf, ...grantsInForce(now) }, select: GRANT_SELECT }),
    prisma.travelMap.findMany({ where: { owner: ownerOf }, select: SLOT_MAP_SELECT, orderBy: { createdAt: 'asc' } }),
  ]);
  return map && { ownerId: map.ownerId, subscription, grants, maps };
};

// Subscription

export const findSubscription = (userId) =>
  prisma.subscription.findUnique({ where: { userId }, select: SUBSCRIPTION_SELECT });

export const findSubscriptionByCustomer = (stripeCustomerId) =>
  prisma.subscription.findUnique({ where: { stripeCustomerId }, select: SUBSCRIPTION_SELECT });

/**
 * Link a Stripe customer (and subscription, when known) to a user: from checkout, or
 * the first subscription event. A user has one row; a newer customer replaces the old id.
 */
export const linkStripeCustomer = ({ userId, stripeCustomerId, stripeSubscriptionId }) =>
  prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId, stripeSubscriptionId: stripeSubscriptionId ?? null },
    update: { stripeCustomerId, ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}) },
    select: SUBSCRIPTION_SELECT,
  });

/** Write what Stripe says a subscription is now (its customer must already be this user's). */
export const saveSubscriptionState = (userId, state) =>
  prisma.subscription.update({ where: { userId }, data: state, select: SUBSCRIPTION_SELECT });

// Grants (complimentary memberships)

export const findGrantsForUser = (userId) =>
  prisma.planGrant.findMany({ where: { userId }, select: GRANT_SELECT, orderBy: { createdAt: 'desc' } });

export const createGrantInDB = (data) => prisma.planGrant.create({ data, select: GRANT_SELECT });

/** A grant of the account's with this reason (a promo code's plan for life), or null. */
export const findGrantByReason = (userId, reason) => prisma.planGrant.findFirst({ where: { userId, reason }, select: { id: true } });

export const findGrant = (grantId) => prisma.planGrant.findUnique({ where: { id: grantId }, select: { ...GRANT_SELECT, userId: true } });

/** End a grant now (if it hasn't ended already); a grant that hasn't started ends before it starts. */
export const endGrantInDB = (grantId, now = new Date()) =>
  prisma.$transaction(async (tx) => {
    const grant = await tx.planGrant.findUnique({ where: { id: grantId }, select: { startsAt: true, endsAt: true } });
    if (!grant || grant.endsAt <= now) return null;
    // endsAt never before startsAt: a future grant ends at its start, i.e. never runs
    const endsAt = grant.startsAt > now ? grant.startsAt : now;
    return tx.planGrant.update({ where: { id: grantId }, data: { endsAt }, select: GRANT_SELECT });
  });

// Webhook events

/** Record a Stripe event id before handling it. -> false when it was already recorded (a retry). */
export const recordStripeEvent = async ({ id, type }) => {
  try {
    await prisma.stripeEvent.create({ data: { id, type } });
    return true;
  } catch (err) {
    if (err?.code === 'P2002') return false;
    throw err;
  }
};

/** Forget an event whose handling failed, so Stripe's retry runs it again. */
export const forgetStripeEvent = (id) => prisma.stripeEvent.deleteMany({ where: { id } });

const DAY_MS = 24 * 60 * 60 * 1000;

/** Retention, for the daily cron: events handled over `olderThanDays` ago. -> `{ count }` */
export const deleteOldStripeEvents = ({ olderThanDays = 90 } = {}) => {
  if (!Number.isFinite(olderThanDays) || olderThanDays < 1) {
    throw new RangeError(`deleteOldStripeEvents: olderThanDays must be 1 or more, got ${olderThanDays}`);
  }
  return prisma.stripeEvent.deleteMany({ where: { processedAt: { lt: new Date(Date.now() - olderThanDays * DAY_MS) } } });
};
