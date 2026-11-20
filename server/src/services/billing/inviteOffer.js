// The invite offer (19 Nov 2026; docs/API.md "The invite offer"): recorded when an invite is
// accepted, offered on the account page and the invite page, and applied to a Checkout as a
// Stripe coupon. The rules are pure (utils/inviteOffer.js); this reads and writes the rows.
import { prisma } from '../../prisma.js';
import { loadMapPlan } from '../travel/plans.js';
import { inviteOfferCoupon, inviteOfferToRecord, usableInviteOffer } from '../../utils/inviteOffer.js';

const mapIdOf = async (invite) =>
  invite.mapId ?? (invite.tripId ? (await prisma.trip.findUnique({ where: { id: invite.tripId }, select: { mapId: true } }))?.mapId : null);

/** The plan an invite's map runs on (Economy, Business or First Class), for its offer; null when the map is gone. */
export async function invitePlanOf(invite, now = new Date()) {
  const mapId = await mapIdOf(invite);
  return mapId ? (await loadMapPlan(mapId, now))?.plan ?? null : null;
}

/**
 * After `userId` accepted `invite` (`{ mapId, tripId, createdAt }`): the offer, if they get
 * one (utils/inviteOffer.js inviteOfferToRecord), kept on their profile. Only while they have
 * none and no promo code, so two invites accepted at once give one. -> the offer, or null
 */
export async function recordInviteOffer(userId, invite, now = new Date()) {
  const [user, profile, mapPlan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.profile.findUnique({ where: { userId }, select: { promoCodeId: true, inviteOfferPlan: true, inviteOfferUsedAt: true } }),
    invitePlanOf(invite, now),
  ]);
  const offer = inviteOfferToRecord({ profile, userCreatedAt: user?.createdAt, inviteCreatedAt: invite.createdAt, mapPlan, now });
  if (!offer) return null;
  if (!profile) {
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, inviteOfferPlan: offer.plan, inviteOfferEndsAt: offer.endsAt },
      update: {},
    });
  }
  const { count } = await prisma.profile.updateMany({
    where: { userId, promoCodeId: null, inviteOfferPlan: null, inviteOfferUsedAt: null },
    data: { inviteOfferPlan: offer.plan, inviteOfferEndsAt: offer.endsAt },
  });
  return count || !profile ? offer : null;
}

/** A promo code recorded at sign-up wins: no invite offer as well (one introductory offer). */
export const dropInviteOffer = (userId) =>
  prisma.profile.updateMany({ where: { userId, inviteOfferUsedAt: null }, data: { inviteOfferPlan: null, inviteOfferEndsAt: null } });

/** The offer the account can use now (for `plan` when given): `{ plan, endsAt }` or null. */
export async function inviteOfferFor(userId, { plan = null, hasSubscription = false, now = new Date() } = {}) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { inviteOfferPlan: true, inviteOfferEndsAt: true, inviteOfferUsedAt: true },
  });
  return usableInviteOffer(profile, { now, plan, hasSubscription });
}

/** The webhook saw a subscription that a Checkout with the offer started: it's used (once). */
export const markInviteOfferUsedInDB = (userId, now = new Date()) =>
  prisma.profile.updateMany({ where: { userId, inviteOfferPlan: { not: null }, inviteOfferUsedAt: null }, data: { inviteOfferUsedAt: now } });

/**
 * The Stripe coupon for the offer on `plan` and `interval`, made the first time it's needed
 * (fixed ids, so every Checkout shares it). -> its id
 */
export async function inviteOfferCouponId(stripe, plan, interval) {
  const { id, create } = inviteOfferCoupon(plan, interval);
  try {
    await stripe.coupons.retrieve(id);
  } catch (err) {
    if (err?.code !== 'resource_missing' && err?.statusCode !== 404) throw err;
    await stripe.coupons.create({ id, ...create });
  }
  return id;
}
