// Promo codes (docs/API.md, "Promo codes"). The code is checked before better-auth makes
// the account (auth.js beforeHook) and recorded on the new account's profile once it
// exists. Its offer, the follower's first month free on the paid plan they choose, is a
// Stripe trial on the account's first paid Checkout (controllers/billing.js): a card is
// needed and the address must be verified (Checkout's own rules), so throwaway sign-ups
// get nothing. The webhook records when the free month started (subscriptions.js).
import { normalisePromoCode, promoCodeUsable, promoTrialDays, PROMO_TRIAL_DAYS } from '../../utils/promoCodes.js';
import { claimPromoCodeInDB, countPromoUses, findProfilePromo, findPromoCodeByCode, giveLifetimePlanInDB } from '../../domain/promoCodes.js';
import { FOR_LIFE_ENDS_AT } from '../../utils/promoCodes.js';

/** A code that a new account may sign up with now, or null. */
export async function usablePromoCode(value, now = new Date()) {
  const code = normalisePromoCode(value);
  if (!code) return null;
  const promo = await findPromoCodeByCode(code);
  if (!promo || !promoCodeUsable(promo, { uses: await countPromoUses(promo.id), now })) return null;
  return promo;
}

/**
 * After sign-up: the code goes on the account, claimed under a lock so its limit holds
 * (claimPromoCodeInDB). One of the user's own codes (`freePlan`) gives its plan for life once
 * the address is verified (giveLifetimePlan; 17 Nov 2026, the audit: it was given to
 * unverified accounts), so an account made already verified gets it now.
 */
export async function recordSignUpPromoCode(user, value, now = new Date()) {
  const promo = await usablePromoCode(value, now);
  if (!promo || !user?.id) return;
  const claimed = await claimPromoCodeInDB({
    userId: user.id,
    promoCodeId: promo.id,
    usable: (row, uses) => promoCodeUsable(row, { uses, now }),
  });
  if (claimed?.freePlan && user.emailVerified) await giveLifetimePlan(user.id);
}

/**
 * The plan for life an account's code gives (`freePlan`), once its address is verified (the
 * user update hook in auth.js, and recordSignUpPromoCode): a complimentary membership ending
 * in FOR_LIFE_ENDS_AT, from whoever made the code, named after it. Given once: an account
 * that has it already gets nothing more. -> true when it was given now
 */
export async function giveLifetimePlan(userId) {
  const profile = await findProfilePromo(userId);
  const promo = profile?.promoCode;
  if (!promo?.freePlan) return false;
  const reason = `Promo code ${promo.code}, for life`;
  return giveLifetimePlanInDB({
    promoCodeId: promo.id,
    maxUses: promo.maxUses,
    grant: { userId, plan: promo.freePlan, endsAt: FOR_LIFE_ENDS_AT, reason, grantedById: promo.createdById ?? null },
  });
}

/**
 * The account's free month, if it still has one: `{ code, days }`, else null. `plan`
 * (optional) is the plan about to be bought: extra maps alone (FREE) get no free month.
 */
export async function promoTrialFor(userId, plan = 'REGULAR') {
  const profile = await findProfilePromo(userId);
  return promoTrialDays(profile, plan) ? { code: profile.promoCode.code, days: PROMO_TRIAL_DAYS } : null;
}
