// Promo codes (docs/API.md, "Promo codes"): their format, whether one can still be used,
// what each gives (the influencers' codes: the first month free; the user's own: a paid
// plan for life), and what an admin may set. Pure.
import { sanitizeText } from './sanitize.js';
import { parseDateTime } from './travelValidation.js';
import { PAID_PLAN_IDS } from './constants/plans.js';

export const PROMO_CODE_PATTERN = /^[A-Z0-9]{3,24}$/;
export const PROMO_LABEL_MAX = 120;
export const PROMO_MAX_USES_MAX = 1_000_000;

// Every code's offer (the user's decision, 16 Nov 2026): the follower's first month free
// on the paid plan they choose, as a Stripe trial on their first paid Checkout, with a
// card (Stripe charges from then on unless they cancel first). The client copies it.
export const PROMO_TRIAL_DAYS = 30;

// The user's own codes (17 Nov 2026): a code made with `freePlan` (Business or First Class,
// chosen when it's made) gives the account that signs up with it that plan for life, as a
// complimentary membership ending in FOR_LIFE_ENDS_AT, so every rule that reads memberships
// works unchanged, and an admin can still end it. No free month on top. Sign-up only.
export const FREE_PLAN_IDS = PAID_PLAN_IDS;
export const FOR_LIFE_ENDS_AT = new Date('9999-12-31T00:00:00.000Z');

/** Does a membership ending at `endsAt` last for life? (The client shows "for life".) */
export const isForLife = (endsAt) => Boolean(endsAt) && new Date(endsAt).getTime() >= FOR_LIFE_ENDS_AT.getTime();

/** What someone typed ("sam-travels ", "SamTravels") as stored (SAMTRAVELS), or null. */
export function normalisePromoCode(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase().replace(/[\s-]+/g, '');
  return PROMO_CODE_PATTERN.test(code) ? code : null;
}

/** Can a new account still sign up with it? `uses`: accounts that already have. */
export const promoCodeUsable = (promo, { uses, now = new Date() }) =>
  Boolean(promo) &&
  promo.active &&
  (!promo.endsAt || new Date(promo.endsAt).getTime() > now.getTime()) &&
  (promo.maxUses == null || uses < promo.maxUses);

/**
 * The free days a Checkout for `plan` gets: PROMO_TRIAL_DAYS when the account signed up with
 * a code (`profile.promoCode`) and hasn't had its free month (`promoTrialUsedAt`), and the
 * plan is a paid one (extra maps alone get none); else 0. The account keeps its free month
 * if the code is turned off later. Checkout itself already needs no live subscription. A code
 * that gives a plan for life (`freePlan`) gives no free month: the account has the plan.
 */
export const promoTrialDays = (profile, plan) =>
  profile?.promoCode && !profile.promoCode.freePlan && !profile.promoTrialUsedAt && PAID_PLAN_IDS.includes(plan) ? PROMO_TRIAL_DAYS : 0;

/**
 * An admin's new code (`existing` absent) or change (`existing` is the stored row; the
 * code itself never changes, as it's printed in people's posts, and nor does what it gives,
 * `freePlan`, as people signed up for it).
 * -> `{ ok: true, data }`, or `{ ok: false, message }` (a key of EVENT_MESSAGES)
 */
export function parsePromoCodeInput(body, { existing = null } = {}) {
  if (!body || typeof body !== 'object') return { ok: false, message: 'promoCodeDetailsInvalid' };
  const data = {};
  if (!existing) {
    const code = normalisePromoCode(body.code);
    if (!code) return { ok: false, message: 'promoCodeFormat' };
    data.code = code;
    // What it gives, set once: a paid plan for life, or (null, left out) the first month free
    if (body.freePlan !== undefined && body.freePlan !== null) {
      if (!FREE_PLAN_IDS.includes(body.freePlan)) return { ok: false, message: 'promoCodeDetailsInvalid' };
      data.freePlan = body.freePlan;
    }
  } else if (body.code !== undefined || body.freePlan !== undefined) {
    return { ok: false, message: 'promoCodeDetailsInvalid' };
  }

  if (body.label !== undefined || !existing) {
    const label = sanitizeText(body.label, { maxLength: PROMO_LABEL_MAX });
    if (!label) return { ok: false, message: 'promoCodeDetailsInvalid' };
    data.label = label;
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return { ok: false, message: 'promoCodeDetailsInvalid' };
    data.active = body.active;
  }
  if (body.maxUses !== undefined) {
    const max = body.maxUses;
    if (max !== null && (!Number.isInteger(max) || max < 1 || max > PROMO_MAX_USES_MAX)) {
      return { ok: false, message: 'promoCodeDetailsInvalid' };
    }
    data.maxUses = max;
  }
  if (body.endsAt !== undefined) {
    const endsAt = parseDateTime(body.endsAt);
    if (!endsAt.ok) return { ok: false, message: 'promoCodeDetailsInvalid' };
    data.endsAt = endsAt.value;
  }
  return { ok: true, data };
}
