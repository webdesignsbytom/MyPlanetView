// What the plan screens need to say about an account's billing (GET /api/billing,
// docs/API.md "Plans and billing"), and the new map waiting for an extra-map payment.
import { formatPence, planOf } from '@/utils/constants/plans';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/functions/safeStorage';

// A subscription that hasn't ended is changed (change-plan, extra-maps), never bought again
const ENDED_STATUSES = ['canceled', 'incomplete_expired'];
export const hasSubscription = (billing) => Boolean(billing?.status) && !ENDED_STATUSES.includes(billing.status);

export const INTERVAL_WORDS = { MONTH: 'a month', YEAR: 'a year' };
export const INTERVAL_NAMES = { MONTH: 'monthly', YEAR: 'yearly' };

/** "£4.99 a month" */
export const priceText = (pence, interval) => `${formatPence(pence)} ${INTERVAL_WORDS[interval] || ''}`.trim();

/** A plan's price, from the server's prices when it sent them, else the constants. */
export const planPrice = (billing, planId, interval) => billing?.prices?.plans?.[planId]?.[interval] ?? planOf(planId).price[interval];

/** What one extra map costs on the account's plan. */
export const extraMapPrice = (billing, interval) =>
  billing?.prices?.extraMap?.[billing?.plan]?.[interval] ?? planOf(billing?.plan).extraMap[interval];

/** "An extra map is £3.99 a month or £39 a year." for the account's plan. */
export const extraMapSentence = (billing) =>
  `An extra map is ${priceText(extraMapPrice(billing, 'MONTH'), 'MONTH')} or ${priceText(extraMapPrice(billing, 'YEAR'), 'YEAR')}.`;

/** A change-plan or extra-maps answer: the new billing state, else null (a URL to go to instead). */
export const billingFrom = (answer) => answer?.billing ?? null;

/** Off to Stripe (Checkout or the portal), or, in mock mode, straight back to the account page. */
export function goToUrl(url) {
  window.location.assign(url);
}

// A new map someone was making when the 402 came, kept while they pay on Stripe's
// checkout, so the account page can make it once they're back (an hour at most)
const PENDING_MAP_KEY = 'mpv:pendingNewMap';
const PENDING_MAP_MAX_AGE_MS = 60 * 60 * 1000;

export function savePendingMap(userId, body) {
  setStoredItem(PENDING_MAP_KEY, JSON.stringify({ userId, body, savedAt: Date.now() }), 'sessionStorage');
}

/** The pending new map's body for this user, or null. */
export function readPendingMap(userId) {
  try {
    const saved = JSON.parse(getStoredItem(PENDING_MAP_KEY, 'sessionStorage') || 'null');
    if (!saved || saved.userId !== userId || Date.now() - saved.savedAt > PENDING_MAP_MAX_AGE_MS) return null;
    return saved.body && typeof saved.body.name === 'string' ? saved.body : null;
  } catch {
    return null;
  }
}

export const forgetPendingMap = () => removeStoredItem(PENDING_MAP_KEY, 'sessionStorage');
