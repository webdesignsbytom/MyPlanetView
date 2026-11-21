// Promo codes (docs/API.md, "Promo codes"): the format, as the server's
// utils/promoCodes.js (mock mode uses these too), the words for the offer, and the code
// kept for the visit from a `?code=` link, so it's still there when the person goes on
// to sign up. Plan names come from the plan constants.
import { PAID_PLAN_IDS, planOf } from '@/utils/constants/plans';
import { FULL_BUSINESS_URL } from '@/utils/constants/constants';
import { SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/functions/safeStorage';

export const PROMO_CODE_PATTERN = /^[A-Z0-9]{3,24}$/;
export const PROMO_LABEL_MAX = 120;
export const PROMO_MAX_USES_MAX = 1_000_000;

// Every code's offer, as the server's PROMO_TRIAL_DAYS (16 Nov 2026): the follower's first
// month free on the paid plan they choose, as a Stripe trial with a card
export const PROMO_TRIAL_DAYS = 30;

// The user's own codes (17 Nov 2026), as the server's: one made with `freePlan` (Business or
// First Class) gives that plan for life once the address is verified, a complimentary membership ending in
// 9999 (isForLife), with no free month
export const FREE_PLAN_IDS = PAID_PLAN_IDS;
const FOR_LIFE_FROM = Date.UTC(9999, 0, 1);

/** Does a membership ending at `endsAt` last for life? */
export const isForLife = (endsAt) => Boolean(endsAt) && new Date(endsAt).getTime() >= FOR_LIFE_FROM;

/** What a code gives, for the admin's choice when making one ('' is the usual free month). */
export const PROMO_OFFER_CHOICES = [
  { value: '', label: 'The first month free (the usual offer)' },
  ...FREE_PLAN_IDS.map((id) => ({ value: id, label: `${planOf(id).name}, free for life` })),
];

// "Business or First Class"
const PAID_PLAN_NAMES = PAID_PLAN_IDS.map((id) => planOf(id).name).join(' or ');

// The server's EVENT_MESSAGES.promoCodeInvalid, word for word (its 404 and 400 say it)
export const PROMO_CODE_INVALID = "That code isn't valid. Check it, or sign up without one.";

/** What someone typed ("sam-travels ", "SamTravels") as stored (SAMTRAVELS), or null. */
export function normalisePromoCode(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase().replace(/[\s-]+/g, '');
  return PROMO_CODE_PATTERN.test(code) ? code : null;
}

/** The followers' offer in a few words, for the admin page. */
export const PROMO_OFFER_WORDS = `First month free on ${PAID_PLAN_NAMES} (${PROMO_TRIAL_DAYS} days, with a card)`;

/** What a code gives in a few words, for the admin page: its plan for life, or the free month. */
export const promoOfferWords = (promo) => (promo?.freePlan ? `${planOf(promo.freePlan).name}, free for life, once their email is verified` : PROMO_OFFER_WORDS);

/**
 * What a usable code gives, for the sign-up form. A member's invite code (docs/API.md "Give a
 * month, get a month") says who it's from: `fromFriend`, their first name.
 */
export const promoOfferText = ({ code, freePlan, fromFriend = null }) =>
  freePlan
    ? `${code}: ${planOf(freePlan).name} is yours, free for life. It starts once you’ve verified your email address.`
    : `${fromFriend ? `${fromFriend} invited you` : code}: your first month of ${PAID_PLAN_NAMES} is free. Choose one on your account page once your email is verified. Stripe asks for a card, and nothing is charged for ${PROMO_TRIAL_DAYS} days.`;

/** A member's invite link: the sign-up page on this site, with their code filled in. */
export const inviteLinkFor = (code, origin) => `${origin}${SIGN_UP_PAGE_URL}?code=${encodeURIComponent(code)}`;

/** The account page's offer: `promoTrial` is GET /billing's `{ code, days }`. */
export const promoTrialText = (promoTrial) =>
  `Your code ${promoTrial.code} makes your first month free on ${PAID_PLAN_NAMES}. Checkout asks for a card; nothing is charged for ${promoTrial.days} days, and if you cancel before then you pay nothing.`;

/** The link a creator shares: the sign-up page with their code filled in. */
export const promoSignUpLink = (code) => `${FULL_BUSINESS_URL}${SIGN_UP_PAGE_URL}?code=${encodeURIComponent(code)}`;

// The code from a `?code=` link, for this visit (the tab) only
const PROMO_CODE_KEY = 'mpv:promoCode';

/** `?code=` in an address's query string, as typed (null when absent or empty). */
export function promoCodeInSearch(search) {
  const value = new URLSearchParams(search || '').get('code');
  return value && value.trim() ? value.trim().slice(0, 64) : null;
}

export const rememberPromoCode = (code) => setStoredItem(PROMO_CODE_KEY, code, 'sessionStorage');
export const rememberedPromoCode = () => getStoredItem(PROMO_CODE_KEY, 'sessionStorage');
export const forgetPromoCode = () => removeStoredItem(PROMO_CODE_KEY, 'sessionStorage');
