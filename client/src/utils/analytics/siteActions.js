// The things people do that analytics counts (the audit, 26 Nov 2026; the SEO playbook's X8:
// "account, main tool, save, checkout and paid-order events"), so the drop-offs between signing
// up, filling the map, sharing it and paying show. GA4's own names where one fits. Sent only
// after consent and never on a secret page (initGA.js trackEvent); never anything that says who
// someone is or where: no ids, names, countries, codes or addresses. The privacy policy lists them.
// Named so, never `events.js` (27 Nov 2026): an ad blocker blocked `/analytics/events.js`, and on
// the dev server, where every file is fetched at its own path, the whole site stayed blank.
import { trackEvent } from './initGA';
import { planOf } from '@/utils/constants/plans';

export const ANALYTICS_EVENTS = Object.freeze({
  signUp: 'sign_up',
  markCountry: 'mark_country',
  uploadPhotos: 'upload_photos',
  share: 'share',
  beginCheckout: 'begin_checkout',
  purchase: 'purchase',
});

/** An account made (the sign-up form). */
export const trackSignUp = () => trackEvent(ANALYTICS_EVENTS.signUp, { method: 'email' });

/** Countries marked on a map: one from its ticket or the list (`status` VISITED, LIVED or WANT_TO_GO), or several at once ("Where have you been?"). */
export const trackCountriesMarked = ({ status, count = 1, method = 'one' }) =>
  trackEvent(ANALYTICS_EVENTS.markCountry, { status: String(status || '').toLowerCase(), count, method });

/** A batch of uploads finished: how many were saved. */
export const trackPhotosUploaded = (count) => trackEvent(ANALYTICS_EVENTS.uploadPhotos, { count });

/** Something shared: `method` invite, link or picture; `contentType` map, trip, card. */
export const trackShare = ({ method, contentType }) => trackEvent(ANALYTICS_EVENTS.share, { method, content_type: contentType });

// The checkout on its way, for the purchase on the way back (Stripe's Checkout is another site)
const CHECKOUT_KEY = 'mpv:checkoutStarted';

const checkoutParams = ({ item, plan, interval, pence }) => ({
  currency: 'GBP',
  value: Math.round(Number(pence) || 0) / 100,
  item,
  plan: planOf(plan).name,
  interval: interval || null,
});

/** Off to Stripe's Checkout: `item` 'plan' or 'gift', the plan, its interval (MONTH or YEAR) and price in pence. */
export function trackCheckoutStarted(checkout) {
  trackEvent(ANALYTICS_EVENTS.beginCheckout, checkoutParams(checkout));
  try {
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(checkout));
  } catch {
    // Storage blocked: no purchase event on the way back
  }
}

/** Back from a paid Checkout for `item`: the purchase, once (what was started, then forgotten). */
export function trackCheckoutPaid(item) {
  let checkout = null;
  try {
    checkout = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) || 'null');
    sessionStorage.removeItem(CHECKOUT_KEY);
  } catch {
    return;
  }
  if (!checkout || checkout.item !== item) return;
  trackEvent(ANALYTICS_EVENTS.purchase, checkoutParams(checkout));
}
