import { prisma } from '../prisma.js';
import { COUNTING_SUBSCRIPTION_STATUSES } from '../utils/constants/plans.js';
import { PROMO_UNVERIFIED_HOLD_MS } from '../utils/promoCodes.js';

// Influencer codes (docs/API.md, "Promo codes")

const PROMO_SELECT = {
  id: true,
  code: true,
  label: true,
  active: true,
  maxUses: true,
  endsAt: true,
  freePlan: true,
  createdById: true,
  // A member's own invite code (docs/API.md "Give a month, get a month"); null for an admin's
  ownerId: true,
  createdAt: true,
};

export const findPromoCodeByCode = (code) => prisma.promoCode.findUnique({ where: { code }, select: PROMO_SELECT });

export const findPromoCodeById = (id) => prisma.promoCode.findUnique({ where: { id }, select: PROMO_SELECT });

/** The accounts using it: signed up with it and verified, or made in the last day (PROMO_UNVERIFIED_HOLD_MS). */
export const countPromoUses = (promoCodeId, now = new Date(), db = prisma) =>
  db.profile.count({
    where: {
      promoCodeId,
      user: { OR: [{ emailVerified: true }, { createdAt: { gt: new Date(now.getTime() - PROMO_UNVERIFIED_HOLD_MS) } }] },
    },
  });

export const createPromoCodeInDB = (data) => prisma.promoCode.create({ data, select: PROMO_SELECT });

export const updatePromoCodeInDB = (id, data) => prisma.promoCode.update({ where: { id }, data, select: PROMO_SELECT });

/**
 * Every code, newest first, with what it brought: accounts that signed up with it, how
 * many verified their address, how many started their free month, and how many pay now
 * (a subscription that counts, a free month's trial included). Four groupBy reads over the
 * profiles, merged in.
 */
export const listPromoCodesWithCounts = async () => {
  // The admins' codes only: members' invite codes are their own (docs/API.md "Give a month, get a month")
  const codes = await prisma.promoCode.findMany({ where: { ownerId: null }, select: PROMO_SELECT, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  if (!codes.length) return [];
  const withCode = { promoCodeId: { in: codes.map((c) => c.id) } };
  const count = (where) =>
    prisma.profile.groupBy({ by: ['promoCodeId'], where: { ...withCode, ...where }, _count: { _all: true } });
  const [signUps, verified, trials, paying] = await Promise.all([
    count({}),
    count({ user: { emailVerified: true } }),
    count({ promoTrialUsedAt: { not: null } }),
    count({ user: { subscription: { status: { in: [...COUNTING_SUBSCRIPTION_STATUSES] } } } }),
  ]);
  const byCode = (rows) => new Map(rows.map((row) => [row.promoCodeId, row._count._all]));
  const [s, v, t, p] = [byCode(signUps), byCode(verified), byCode(trials), byCode(paying)];
  return codes.map((c) => ({
    ...c,
    signUps: s.get(c.id) ?? 0,
    verified: v.get(c.id) ?? 0,
    trials: t.get(c.id) ?? 0,
    paying: p.get(c.id) ?? 0,
  }));
};

/**
 * Claim a code for a new account, in one transaction with the code's row locked, so
 * sign-ups at the same moment can't take it past its limit (17 Nov 2026, the audit): it's
 * checked again inside (`usable`, utils/promoCodes.js promoCodeUsable) with the uses counted
 * under the lock, then recorded on the profile. -> the code, or null when it can't be used now
 */
export const claimPromoCodeInDB = ({ userId, promoCodeId, usable }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "promo_code" WHERE "id" = ${promoCodeId} FOR UPDATE`;
    const promo = await tx.promoCode.findUnique({ where: { id: promoCodeId }, select: PROMO_SELECT });
    const uses = await countPromoUses(promoCodeId, new Date(), tx);
    if (!usable(promo, uses)) return null;
    await tx.profile.upsert({ where: { userId }, update: { promoCodeId }, create: { userId, promoCodeId } });
    return promo;
  });

/** A member's first name, for their invite code's check ("From Sam"), or null. */
export const findOwnerName = async (userId) => (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name ?? null;

/** The code an account signed up with, and when its free month started (null: not yet). */
export const findProfilePromo = (userId) =>
  prisma.profile.findUnique({
    where: { userId },
    select: { promoTrialUsedAt: true, promoCode: { select: { id: true, code: true, freePlan: true, maxUses: true, createdById: true } } },
  });

/**
 * A code's plan for life, given once per account and never to more accounts than the code's
 * `maxUses`: counted with the code's row locked, as its claims are (more accounts can hold
 * the code than verify in time, but no more get the plan; 19 Nov 2026, the audit).
 * `grant` is the PlanGrant's data, `reason` naming the code. -> true when given now
 */
export const giveLifetimePlanInDB = ({ promoCodeId, maxUses, grant }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "promo_code" WHERE "id" = ${promoCodeId} FOR UPDATE`;
    if (await tx.planGrant.findFirst({ where: { userId: grant.userId, reason: grant.reason }, select: { id: true } })) return false;
    if (maxUses !== null && maxUses !== undefined && (await tx.planGrant.count({ where: { reason: grant.reason } })) >= maxUses) return false;
    await tx.planGrant.create({ data: grant });
    return true;
  });

/**
 * The account's free month has started (its trial subscription reached the webhook):
 * recorded once, as only a row without it is changed. -> true when this call recorded it
 */
export const markPromoTrialUsedInDB = async (userId, now = new Date()) => {
  const marked = await prisma.profile.updateMany({
    where: { userId, promoCodeId: { not: null }, promoTrialUsedAt: null },
    data: { promoTrialUsedAt: now },
  });
  return marked.count > 0;
};
