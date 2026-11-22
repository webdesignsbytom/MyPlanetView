// Gifts of a year of a paid plan (docs/API.md "Gifts"): thin queries.
import { prisma } from '../prisma.js';
import { generateShareCode } from '../utils/shareCodes.js';
import { GIFT_REASON, giftWindow, lifetimeCoversGift, subscriptionCoversGift } from '../utils/gifts.js';

const GIFT_SELECT = {
  id: true,
  code: true,
  plan: true,
  months: true,
  amountPence: true,
  currency: true,
  toName: true,
  message: true,
  paidAt: true,
  refundedAt: true,
  redeemedAt: true,
  createdAt: true,
};

/** A new, unpaid gift with a fresh code (a clash, vanishingly rare, tries another). */
export async function createGiftInDB({ plan, months, amountPence, buyerId, toName, message }) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.giftCode.create({
        data: { code: generateShareCode(), plan, months, amountPence, buyerId, toName, message },
        select: GIFT_SELECT,
      });
    } catch (err) {
      if (err?.code !== 'P2002' || attempt >= 4) throw err;
    }
  }
}

/** The Checkout session that pays for it. */
export const setGiftSessionInDB = (giftId, stripeSessionId) =>
  prisma.giftCode.update({ where: { id: giftId }, data: { stripeSessionId } });

/** Forget an unpaid gift whose Checkout couldn't be made. */
export const deleteUnpaidGiftInDB = (giftId) => prisma.giftCode.deleteMany({ where: { id: giftId, paidAt: null } });

/**
 * Stripe says it's paid (its Checkout session, once): set `paidAt` and the payment. -> the
 * gift with its buyer's address and name, for the email, or null (already paid, or not this
 * session's).
 */
export async function markGiftPaidInDB({ giftId, stripeSessionId, stripePaymentIntentId, now = new Date() }) {
  const { count } = await prisma.giftCode.updateMany({
    where: { id: giftId, stripeSessionId, paidAt: null },
    data: { paidAt: now, stripePaymentIntentId: stripePaymentIntentId || null },
  });
  if (!count) return null;
  return prisma.giftCode.findUnique({
    where: { id: giftId },
    select: { ...GIFT_SELECT, buyer: { select: { email: true, name: true, isActive: true } } },
  });
}

/**
 * Stripe says its payment was refunded: a gift not yet redeemed can't be any more.
 * -> `{ gift, redeemed }` (redeemed: it was used already, so its year runs on), or null.
 */
export async function markGiftRefundedInDB(stripePaymentIntentId, now = new Date()) {
  const gift = await prisma.giftCode.findUnique({
    where: { stripePaymentIntentId },
    select: { id: true, redeemedAt: true, refundedAt: true, grantId: true },
  });
  if (!gift || gift.refundedAt) return null;
  if (gift.redeemedAt) return { gift, redeemed: true };
  await prisma.giftCode.updateMany({ where: { id: gift.id, redeemedAt: null, refundedAt: null }, data: { refundedAt: now } });
  return { gift, redeemed: false };
}

/** The gifts someone bought and paid for, newest first. */
export const findGiftsBoughtBy = (buyerId) =>
  prisma.giftCode.findMany({ where: { buyerId, paidAt: { not: null } }, select: GIFT_SELECT, orderBy: { createdAt: 'desc' } });

/** A paid gift by its code, with the buyer's name (its page). */
export const findGiftByCode = (code) =>
  prisma.giftCode.findFirst({
    where: { code, paidAt: { not: null } },
    select: { ...GIFT_SELECT, buyer: { select: { name: true } } },
  });

/**
 * Redeem a gift for `userId`, with its row locked so it's redeemed once: a membership of its
 * plan for its months (after any of the same plan the account has running: gifts stack).
 * -> `{ grant }`, or `{ error }`: 'notFound' (no such paid gift), 'used' (redeemed or
 * refunded), 'covered' (the account already pays for that plan or better, or has it for life).
 */
export const redeemGiftInDB = ({ code, userId, now = new Date() }) =>
  prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw`SELECT "id" FROM "gift_code" WHERE "code" = ${code} AND "paidAt" IS NOT NULL FOR UPDATE`;
    if (!locked) return { error: 'notFound' };
    const gift = await tx.giftCode.findUnique({ where: { id: locked.id }, select: { id: true, plan: true, months: true, redeemedAt: true, refundedAt: true } });
    if (gift.redeemedAt || gift.refundedAt) return { error: 'used' };

    const [subscription, grants] = await Promise.all([
      tx.subscription.findUnique({ where: { userId }, select: { plan: true, status: true } }),
      tx.planGrant.findMany({ where: { userId, endsAt: { gt: now } }, select: { plan: true, startsAt: true, endsAt: true } }),
    ]);
    if (subscriptionCoversGift(subscription, gift.plan) || lifetimeCoversGift(grants, gift.plan, now)) return { error: 'covered' };

    const { startsAt, endsAt } = giftWindow({ grants, plan: gift.plan, months: gift.months, now });
    const grant = await tx.planGrant.create({
      data: { userId, plan: gift.plan, startsAt, endsAt, reason: GIFT_REASON },
      select: { id: true, plan: true, startsAt: true, endsAt: true },
    });
    await tx.giftCode.update({ where: { id: gift.id }, data: { redeemedById: userId, redeemedAt: now, grantId: grant.id } });
    return { grant };
  });

/** The daily clean-up: gifts whose Checkout was never finished. -> `{ count }` */
export const deleteUnpaidGiftsInDB = (olderThan) =>
  prisma.giftCode.deleteMany({ where: { paidAt: null, createdAt: { lt: olderThan } } });
