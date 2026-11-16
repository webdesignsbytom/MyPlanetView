// Promo codes (docs/API.md, "Promo codes"). The code is checked before better-auth makes
// the account (auth.js beforeHook) and recorded on the new account's profile once it
// exists. Its offer, the follower's first month free on the paid plan they choose, is a
// Stripe trial on the account's first paid Checkout (controllers/billing.js): a card is
// needed and the address must be verified (Checkout's own rules), so throwaway sign-ups
// get nothing. The webhook records when the free month started (subscriptions.js).
import { normalisePromoCode, promoCodeUsable, promoTrialDays, PROMO_TRIAL_DAYS } from '../../utils/promoCodes.js';
import { countPromoUses, findProfilePromo, findPromoCodeByCode, setProfilePromoCode } from '../../domain/promoCodes.js';

/** A code that a new account may sign up with now, or null. */
export async function usablePromoCode(value, now = new Date()) {
  const code = normalisePromoCode(value);
  if (!code) return null;
  const promo = await findPromoCodeByCode(code);
  if (!promo || !promoCodeUsable(promo, { uses: await countPromoUses(promo.id), now })) return null;
  return promo;
}

/** After sign-up: the code goes on the new account. */
export async function recordSignUpPromoCode(user, value) {
  const promo = await usablePromoCode(value);
  if (!promo || !user?.id) return;
  await setProfilePromoCode(user.id, promo.id);
}

/**
 * The account's free month, if it still has one: `{ code, days }`, else null. `plan`
 * (optional) is the plan about to be bought: extra maps alone (FREE) get no free month.
 */
export async function promoTrialFor(userId, plan = 'REGULAR') {
  const profile = await findProfilePromo(userId);
  return promoTrialDays(profile, plan) ? { code: profile.promoCode.code, days: PROMO_TRIAL_DAYS } : null;
}
