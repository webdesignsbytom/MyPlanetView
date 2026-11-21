// Give a month, get a month (docs/API.md "Give a month, get a month"): thin queries.
import { prisma } from '../prisma.js';
import { giftWindow } from '../utils/gifts.js';
import { REFERRAL_GRANT_MONTHS, REFERRAL_GRANT_REASON, REFERRAL_LABEL, REFERRAL_YEAR_MS, referralRewardFor } from '../utils/referrals.js';

const CODE_SELECT = { id: true, code: true, active: true };
const REWARD_SELECT = { id: true, referrerId: true, kind: true, amountPence: true, planGrantId: true, appliedAt: true, createdAt: true };

/** The member's own code, or null. */
export const findReferralCode = (userId) => prisma.promoCode.findUnique({ where: { ownerId: userId }, select: CODE_SELECT });

/** A new code for the member (P2002 when the code is taken, or they have one: the caller retries or reads it). */
export const createReferralCodeInDB = (userId, code) =>
  prisma.promoCode.create({ data: { code, label: REFERRAL_LABEL, ownerId: userId }, select: CODE_SELECT });

/** Friends who signed up with the code and verified their address. */
export const countReferralSignUps = (promoCodeId) => prisma.profile.count({ where: { promoCodeId, user: { emailVerified: true } } });

/** The member's rewards, newest first. */
export const findReferralRewards = (userId) =>
  prisma.referralReward.findMany({ where: { referrerId: userId }, select: REWARD_SELECT, orderBy: { createdAt: 'desc' } });

/** Who invited this account: the owner of the code it signed up with, or null. */
export const findReferrerOf = async (friendId) =>
  (await prisma.profile.findUnique({ where: { userId: friendId }, select: { promoCode: { select: { ownerId: true } } } }))?.promoCode?.ownerId ??
  null;

/** The Stripe customer a credit goes to (the member's subscription row), or null. */
export const findStripeCustomerOf = async (userId) =>
  (await prisma.subscription.findUnique({ where: { userId }, select: { stripeCustomerId: true } }))?.stripeCustomerId ?? null;

/**
 * The month a friend's first payment gives the member who invited them, claimed once: with the
 * member's code row locked, so two friends paying at once count against the cap one after the
 * other, and the friend's row unique, so a webhook seen twice gives once. A GRANT is given here,
 * in the same transaction; a CREDIT is recorded for the caller to give through Stripe (then
 * markReferralRewardAppliedInDB). -> the reward (an earlier one for this friend, if there is)
 */
export const claimReferralRewardInDB = ({ referrerId, friendId, now = new Date() }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "promo_code" WHERE "ownerId" = ${referrerId} FOR UPDATE`;
    const existing = await tx.referralReward.findUnique({ where: { friendId }, select: REWARD_SELECT });
    if (existing) return existing;
    const [subscription, grants, rewardsThisYear] = await Promise.all([
      tx.subscription.findUnique({ where: { userId: referrerId }, select: { stripeCustomerId: true, plan: true, status: true } }),
      tx.planGrant.findMany({ where: { userId: referrerId, endsAt: { gt: now } }, select: { plan: true, startsAt: true, endsAt: true } }),
      tx.referralReward.count({
        where: { referrerId, kind: { not: 'CAPPED' }, createdAt: { gt: new Date(now.getTime() - REFERRAL_YEAR_MS) } },
      }),
    ]);
    const reward = referralRewardFor({ subscription, grants, rewardsThisYear, now });
    if (reward.kind === 'GRANT') {
      // After any month of the same plan already running or waiting, as gifts stack
      const { startsAt, endsAt } = giftWindow({ grants, plan: reward.plan, months: REFERRAL_GRANT_MONTHS, now });
      const grant = await tx.planGrant.create({
        data: { userId: referrerId, plan: reward.plan, startsAt, endsAt, reason: REFERRAL_GRANT_REASON },
        select: { id: true },
      });
      return tx.referralReward.create({
        data: { referrerId, friendId, kind: 'GRANT', planGrantId: grant.id, appliedAt: now },
        select: REWARD_SELECT,
      });
    }
    return tx.referralReward.create({
      data: { referrerId, friendId, kind: reward.kind, amountPence: reward.amountPence ?? null, appliedAt: reward.kind === 'CAPPED' ? now : null },
      select: REWARD_SELECT,
    });
  });

export const markReferralRewardAppliedInDB = (id, now = new Date()) =>
  prisma.referralReward.updateMany({ where: { id, appliedAt: null }, data: { appliedAt: now } });
