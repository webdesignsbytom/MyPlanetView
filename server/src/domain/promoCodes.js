import { prisma } from '../prisma.js';
import { COUNTING_SUBSCRIPTION_STATUSES } from '../utils/constants/plans.js';

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
  createdAt: true,
};

export const findPromoCodeByCode = (code) => prisma.promoCode.findUnique({ where: { code }, select: PROMO_SELECT });

export const findPromoCodeById = (id) => prisma.promoCode.findUnique({ where: { id }, select: PROMO_SELECT });

/** Accounts that signed up with it. */
export const countPromoUses = (promoCodeId) => prisma.profile.count({ where: { promoCodeId } });

export const createPromoCodeInDB = (data) => prisma.promoCode.create({ data, select: PROMO_SELECT });

export const updatePromoCodeInDB = (id, data) => prisma.promoCode.update({ where: { id }, data, select: PROMO_SELECT });

/**
 * Every code, newest first, with what it brought: accounts that signed up with it, how
 * many verified their address, how many started their free month, and how many pay now
 * (a subscription that counts, a free month's trial included). Four groupBy reads over the
 * profiles, merged in.
 */
export const listPromoCodesWithCounts = async () => {
  const codes = await prisma.promoCode.findMany({ select: PROMO_SELECT, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
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
    const uses = await tx.profile.count({ where: { promoCodeId } });
    if (!usable(promo, uses)) return null;
    await tx.profile.upsert({ where: { userId }, update: { promoCodeId }, create: { userId, promoCodeId } });
    return promo;
  });

/** The code an account signed up with, and when its free month started (null: not yet). */
export const findProfilePromo = (userId) =>
  prisma.profile.findUnique({
    where: { userId },
    select: { promoTrialUsedAt: true, promoCode: { select: { code: true, freePlan: true, createdById: true } } },
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
