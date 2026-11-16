// Stripe: the SDK, the price ids, and webhook signatures (docs/API.md, "Plans and billing").
//
// The SDK loads on first use, like the AWS SDK in mediaService.js: most requests never
// bill, so a cold start skips it. Without STRIPE_SECRET_KEY payments are off: billing
// writes answer 503 and GET /billing says `paymentsEnabled: false`.
//
// Price ids come from the environment, read when used. The webhook endpoint's API
// version in the Stripe dashboard should be the SDK's own (stripe 23.1.0: 2026-10-28.endive),
// so events have the shape this code reads.

let sdkPromise = null;
let client = null;

const loadSdk = () =>
  (sdkPromise ??= import('stripe')
    .then((mod) => mod.default)
    .catch((err) => {
      sdkPromise = null; // try again next time
      throw err;
    }));

/** Are payments set up (a secret key)? */
export const paymentsEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** The Stripe client (one per instance). Only call it when paymentsEnabled(). */
export async function stripeClient() {
  if (!paymentsEnabled()) throw new Error('STRIPE_SECRET_KEY is not set');
  const Stripe = await loadSdk();
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, appInfo: { name: 'MyPlanetView' } });
  return client;
}

/** A webhook's event, if its signature is right for STRIPE_WEBHOOK_SECRET (throws otherwise). */
export async function verifyWebhookEvent(rawBody, signature) {
  const Stripe = await loadSdk();
  return Stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

// Price ids: the plan lines, and the extra-map line (Economy and Business share one
// price; First Class has its own)
const PLAN_PRICE_ENV = {
  REGULAR: { MONTH: 'STRIPE_PRICE_REGULAR_MONTH', YEAR: 'STRIPE_PRICE_REGULAR_YEAR' },
  PREMIUM: { MONTH: 'STRIPE_PRICE_PREMIUM_MONTH', YEAR: 'STRIPE_PRICE_PREMIUM_YEAR' },
};
const EXTRA_MAP_PRICE_ENV = {
  standard: { MONTH: 'STRIPE_PRICE_EXTRA_MAP_MONTH', YEAR: 'STRIPE_PRICE_EXTRA_MAP_YEAR' },
  premium: { MONTH: 'STRIPE_PRICE_PREMIUM_EXTRA_MAP_MONTH', YEAR: 'STRIPE_PRICE_PREMIUM_EXTRA_MAP_YEAR' },
};

const envValue = (name) => (name && process.env[name]) || null;

/** The price id of a plan's line (null for FREE, or when it isn't set). */
export const planPriceId = (plan, interval) => envValue(PLAN_PRICE_ENV[plan]?.[interval]);

/** The price id of the extra-map line on a plan (First Class has its own price). */
export const extraMapPriceId = (plan, interval) =>
  envValue(EXTRA_MAP_PRICE_ENV[plan === 'PREMIUM' ? 'premium' : 'standard'][interval]);

/**
 * What a price id is: `{ kind: 'plan', plan, interval }`, `{ kind: 'extraMap', interval }`,
 * or null for a price this site doesn't sell.
 */
export function priceKind(priceId) {
  if (!priceId) return null;
  for (const [plan, byInterval] of Object.entries(PLAN_PRICE_ENV)) {
    for (const [interval, name] of Object.entries(byInterval)) {
      if (envValue(name) === priceId) return { kind: 'plan', plan, interval };
    }
  }
  for (const byInterval of Object.values(EXTRA_MAP_PRICE_ENV)) {
    for (const [interval, name] of Object.entries(byInterval)) {
      if (envValue(name) === priceId) return { kind: 'extraMap', interval };
    }
  }
  return null;
}
