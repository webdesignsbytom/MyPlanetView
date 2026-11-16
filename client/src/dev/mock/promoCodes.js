// Mock mode only. Influencer codes (docs/API.md, "Promo codes"), as the server's
// utils/promoCodes.js (which codes can be used, an admin's input), services/billing/promo.js
// (the free month: a trial on the first paid Checkout, at most once) and domain/promoCodes.js
// (the admin list's counts). A mock user who signed up with a code has `promoCodeId`, and
// `promoTrialUsedAt` once its free month started.
import { COUNTING_SUBSCRIPTION_STATUSES, PAID_PLAN_IDS } from '@/utils/constants/plans';
import {
  PROMO_CODE_INVALID,
  PROMO_LABEL_MAX,
  PROMO_MAX_USES_MAX,
  PROMO_TRIAL_DAYS,
  normalisePromoCode,
} from '@/utils/plans/promoCodes';
import { getDb } from './store';
import { sanitizeText } from './moments';

// Server EVENT_MESSAGES
export const PROMO_MESSAGES = {
  invalid: PROMO_CODE_INVALID,
  format: 'A code is 3 to 24 letters and numbers.',
  taken: 'That code is already in use.',
  notFound: "That code doesn't exist.",
  detailsInvalid: "Check the code's details: a label, and limits that are whole numbers or empty.",
};

const codes = () => getDb().promoCodes || [];

/** Accounts that signed up with it. */
const usesOf = (promoId) => getDb().users.filter((u) => u.promoCodeId === promoId).length;

/** A code a new account may sign up with now (as typed), or null. */
export function usablePromoCode(value, now = Date.now()) {
  const code = normalisePromoCode(value);
  const promo = code ? codes().find((p) => p.code === code) : null;
  if (!promo || !promo.active) return null;
  if (promo.endsAt && new Date(promo.endsAt).getTime() <= now) return null;
  if (promo.maxUses != null && usesOf(promo.id) >= promo.maxUses) return null;
  return promo;
}

/**
 * The account's free month, if it still has one: `{ code, days }`, else null. As the
 * server: it signed up with a code (kept if the code is turned off later), hasn't started
 * its free month, and `plan` is a paid one (extra maps alone get none).
 */
export function promoTrialFor(user, plan = 'REGULAR') {
  const promo = user?.promoCodeId ? codes().find((p) => p.id === user.promoCodeId) : null;
  if (!promo || user.promoTrialUsedAt || !PAID_PLAN_IDS.includes(plan)) return null;
  return { code: promo.code, days: PROMO_TRIAL_DAYS };
}

/** An admin's view of a code, with what it brought (GET /users/admin/promo-codes). */
export function promoCodeView(promo) {
  const db = getDb();
  const users = db.users.filter((u) => u.promoCodeId === promo.id);
  const paying = users.filter((u) =>
    (db.subscriptions || []).some((s) => s.userId === u.id && COUNTING_SUBSCRIPTION_STATUSES.includes(s.status)),
  );
  const { createdById: _createdBy, ...fields } = promo;
  return {
    ...fields,
    trialDays: PROMO_TRIAL_DAYS,
    signUps: users.length,
    verified: users.filter((u) => u.emailVerified === true).length,
    trials: users.filter((u) => u.promoTrialUsedAt).length,
    paying: paying.length,
  };
}

// As the server's parseDateTime: undefined stays, null or '' clears, else a date string
function parseDateTime(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  if (typeof input !== 'string') return { ok: false };
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? { ok: false } : { ok: true, value: date.toISOString() };
}

/**
 * An admin's new code (`existing` absent) or change (the code itself never changes).
 * -> `{ ok: true, data }`, or `{ ok: false, message }` (a PROMO_MESSAGES key)
 */
export function parsePromoCodeInput(body, { existing = null } = {}) {
  if (!body || typeof body !== 'object') return { ok: false, message: 'detailsInvalid' };
  const data = {};
  if (!existing) {
    const code = normalisePromoCode(body.code);
    if (!code) return { ok: false, message: 'format' };
    data.code = code;
  } else if (body.code !== undefined) {
    return { ok: false, message: 'detailsInvalid' };
  }

  if (body.label !== undefined || !existing) {
    const label = sanitizeText(body.label, PROMO_LABEL_MAX);
    if (!label) return { ok: false, message: 'detailsInvalid' };
    data.label = label;
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return { ok: false, message: 'detailsInvalid' };
    data.active = body.active;
  }
  if (body.maxUses !== undefined) {
    const max = body.maxUses;
    if (max !== null && (!Number.isInteger(max) || max < 1 || max > PROMO_MAX_USES_MAX)) {
      return { ok: false, message: 'detailsInvalid' };
    }
    data.maxUses = max;
  }
  if (body.endsAt !== undefined) {
    const endsAt = parseDateTime(body.endsAt);
    if (!endsAt.ok) return { ok: false, message: 'detailsInvalid' };
    data.endsAt = endsAt.value;
  }
  return { ok: true, data };
}
