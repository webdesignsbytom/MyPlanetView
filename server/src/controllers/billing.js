// Plans and billing (docs/API.md, "Plans and billing"): the account's plan, Stripe
// Checkout, plan and extra-map changes, the customer portal, and the webhook.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createBillingEvent } from '../event/travelUtils.js';
import { OtherErrorEvent } from '../event/errorUtils.js';
import { FRONTEND_ORIGINS } from '../utils/config.js';
import { FrontendUrl } from '../utils/constants/siteConstants.js';
import {
  INCLUDED_MAPS,
  MAX_EXTRA_MAPS,
  isBillingInterval,
  isPlanId,
  planOf,
  pricesView,
} from '../utils/constants/plans.js';
import { hasLiveSubscription } from '../utils/stripeState.js';
import { findSubscription, forgetStripeEvent, linkStripeCustomer, recordStripeEvent } from '../domain/billing.js';
import { loadUserPlan } from '../services/travel/plans.js';
import {
  extraMapPriceId,
  paymentsEnabled,
  planPriceId,
  priceKind,
  stripeClient,
  verifyWebhookEvent,
} from '../services/billing/stripe.js';
import { applyStripeSubscription, latestSubscription, linkCheckoutSession } from '../services/billing/subscriptions.js';
import { promoTrialFor } from '../services/billing/promo.js';
import { badRequest, conflict, handler, reply } from './helpers/travel.js';

const D = DOMAINS.billing;

// Checkout and the portal come back to the account page, on the first FRONTEND_ORIGIN
const siteOrigin = () => FRONTEND_ORIGINS[0] ?? FrontendUrl;
const accountUrl = (query = '') => `${siteOrigin()}/account${query}`;

const paymentsOff = (req, res) => reply(res, new OtherErrorEvent(req.user, D, 503, EVENT_MESSAGES.paymentsOff, 'payments-off'));

const isQuantity = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_EXTRA_MAPS;

/** What GET /billing answers (also the reply to a plan or extra-map change). */
async function billingView(userId) {
  const state = await loadUserPlan(userId);
  const sub = state.subscription;
  return {
    plan: state.plan,
    planName: planOf(state.plan).name,
    source: state.source,
    interval: sub?.interval ?? null,
    status: sub?.status ?? null,
    renewsAt: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    grant: state.grant ? { plan: state.grant.plan, endsAt: state.grant.endsAt } : null,
    // A promo code's free month not yet used, `{ code, days }`: the next paid Checkout gets it
    promoTrial: hasLiveSubscription(sub) ? null : await promoTrialFor(userId),
    includedMaps: INCLUDED_MAPS,
    extraMapsPaid: state.extraMapsPaid,
    ownedMaps: state.maps.length,
    lockedMapIds: state.slots.lockedIds,
    prices: pricesView(),
    paymentsEnabled: paymentsEnabled(),
  };
}

/**
 * A Checkout session for a new subscription: the plan line (none on FREE) and the
 * extra-map line. `trial` (`{ code, days }`, a promo code's free month) makes the first
 * days free: Stripe still takes a card, and charges when they end unless cancelled; the
 * code goes in the subscription's metadata, so the webhook records the month as used.
 * One Stripe customer per account (made at the first Checkout and kept on its row), and one
 * open Checkout at a time: any other still open is expired first, so two tabs or a double
 * click can't pay for two subscriptions (17 Nov 2026, the audit).
 * -> `{ url }`, or null when a price id isn't configured
 */
async function createCheckout(user, { plan, interval, extraMaps, customerId, trial = null }) {
  const lineItems = [];
  if (plan !== 'FREE') lineItems.push({ price: planPriceId(plan, interval), quantity: 1 });
  if (extraMaps > 0) lineItems.push({ price: extraMapPriceId(plan, interval), quantity: extraMaps });
  if (lineItems.some((item) => !item.price)) return null;
  const stripe = await stripeClient();
  let customer = customerId;
  if (!customer) {
    customer = (await stripe.customers.create({ email: user.email, metadata: { userId: user.id } })).id;
    await linkStripeCustomer({ userId: user.id, stripeCustomerId: customer });
  }
  const open = await stripe.checkout.sessions.list({ customer, status: 'open', limit: 10 });
  for (const session of open?.data ?? []) await stripe.checkout.sessions.expire(session.id);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems,
    client_reference_id: user.id,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id, ...(trial ? { promoCode: trial.code } : {}) },
      ...(trial ? { trial_period_days: trial.days } : {}),
    },
    ...(trial ? { payment_method_collection: 'always' } : {}),
    customer,
    success_url: accountUrl('?billing=success'),
    cancel_url: accountUrl('?billing=cancelled'),
  });
  return { url: session.url };
}

/** The live subscription's two lines, as Stripe has them now. */
async function remoteLines(stripe, subscriptionId) {
  const remote = await stripe.subscriptions.retrieve(subscriptionId);
  const items = remote.items?.data ?? [];
  const lineOf = (kind) => items.find((item) => priceKind(item.price?.id)?.kind === kind) ?? null;
  return { planItem: lineOf('plan'), extraItem: lineOf('extraMap') };
}

/** Change the live subscription's lines (prorated), then record what Stripe answers. */
async function updateSubscription(stripe, sub, items, extra = {}) {
  const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    items,
    proration_behavior: 'create_prorations',
    ...extra,
  });
  await applyStripeSubscription(updated);
  return updated;
}

export const getBillingHandler = handler(D, 'Get billing', async (req, res) =>
  sendDataResponse(res, 200, await billingView(req.user.id))
);

// `{ plan, interval, extraMaps }`: FREE means extra maps only. 409 when the account
// already has a subscription (change-plan and extra-maps change it).
export const checkoutHandler = handler(D, 'Checkout', async (req, res) => {
  if (!paymentsEnabled()) return paymentsOff(req, res);
  const body = req.body || {};
  const extraMaps = body.extraMaps ?? 0;
  if (!isPlanId(body.plan) || !isBillingInterval(body.interval)) return badRequest(req, res, D, EVENT_MESSAGES.invalidPlan);
  if (!isQuantity(extraMaps)) return badRequest(req, res, D, EVENT_MESSAGES.invalidExtraMaps);
  if (body.plan === 'FREE' && extraMaps === 0) return badRequest(req, res, D, EVENT_MESSAGES.nothingToBuy);

  const sub = await findSubscription(req.user.id);
  if (hasLiveSubscription(sub)) return conflict(req, res, D, EVENT_MESSAGES.subscriptionExists);

  // A promo code's free month, on a paid plan (docs/API.md, "Promo codes"). Not with extra
  // maps in the same Checkout: a trial covers every line, so they'd be free too; the month
  // stays for a later Checkout of the plan alone.
  const trial = extraMaps > 0 ? null : await promoTrialFor(req.user.id, body.plan);
  const checkout = await createCheckout(req.user, {
    plan: body.plan,
    interval: body.interval,
    extraMaps,
    customerId: sub?.stripeCustomerId,
    trial,
  });
  if (!checkout) return paymentsOff(req, res);
  const trialDetail = trial ? ` trialDays=${trial.days}` : '';
  logEvent(createBillingEvent({ user: req.user, action: 'Checkout Started', detail: `plan=${body.plan} interval=${body.interval} extraMaps=${extraMaps}${trialDetail}` }));
  return sendDataResponse(res, 200, checkout);
});

// `{ plan, interval }`: the plan line changes (prorated); the extra-map line keeps its
// quantity, on the new interval and the new plan's extra-map price. FREE drops the plan
// line, which needs extra maps to keep the subscription (else cancel in the portal).
export const changePlanHandler = handler(D, 'Change plan', async (req, res) => {
  if (!paymentsEnabled()) return paymentsOff(req, res);
  const { plan, interval } = req.body || {};
  if (!isPlanId(plan) || !isBillingInterval(interval)) return badRequest(req, res, D, EVENT_MESSAGES.invalidPlan);
  const sub = await findSubscription(req.user.id);
  if (!hasLiveSubscription(sub)) return conflict(req, res, D, EVENT_MESSAGES.noSubscription);

  const stripe = await stripeClient();
  const { planItem, extraItem } = await remoteLines(stripe, sub.stripeSubscriptionId);
  if (plan === 'FREE' && !(extraItem?.quantity > 0)) return conflict(req, res, D, EVENT_MESSAGES.cancelInPortal);

  const items = [];
  if (plan === 'FREE') {
    if (planItem) items.push({ id: planItem.id, deleted: true });
  } else {
    const price = planPriceId(plan, interval);
    if (!price) return paymentsOff(req, res);
    items.push(planItem ? { id: planItem.id, price, quantity: 1 } : { price, quantity: 1 });
  }
  if (extraItem) {
    const price = extraMapPriceId(plan, interval);
    if (!price) return paymentsOff(req, res);
    items.push({ id: extraItem.id, price, quantity: extraItem.quantity });
  }

  // A new plan ends a promo code's free month: paid from now (17 Nov 2026, the audit: the
  // rest of a Business free month could be had on First Class)
  const endsTrial = sub.status === 'trialing' && plan !== sub.plan;
  await updateSubscription(stripe, sub, items, endsTrial ? { trial_end: 'now' } : {});
  logEvent(createBillingEvent({ user: req.user, action: 'Plan Change Success', detail: `plan=${plan} interval=${interval}` }));
  return sendDataResponse(res, 200, { billing: await billingView(req.user.id) });
});

// `{ quantity, interval? }`: how many extra maps the live subscription pays for
// (prorated). With no subscription, a Checkout for them (`interval`, MONTH by default).
export const extraMapsHandler = handler(D, 'Extra maps', async (req, res) => {
  if (!paymentsEnabled()) return paymentsOff(req, res);
  const body = req.body || {};
  const { quantity } = body;
  if (!isQuantity(quantity)) return badRequest(req, res, D, EVENT_MESSAGES.invalidExtraMaps);
  const sub = await findSubscription(req.user.id);

  if (!hasLiveSubscription(sub)) {
    const interval = body.interval ?? 'MONTH';
    if (!isBillingInterval(interval)) return badRequest(req, res, D, EVENT_MESSAGES.invalidPlan);
    if (quantity === 0) return badRequest(req, res, D, EVENT_MESSAGES.nothingToBuy);
    const checkout = await createCheckout(req.user, { plan: 'FREE', interval, extraMaps: quantity, customerId: sub?.stripeCustomerId });
    if (!checkout) return paymentsOff(req, res);
    logEvent(createBillingEvent({ user: req.user, action: 'Checkout Started', detail: `plan=FREE interval=${interval} extraMaps=${quantity}` }));
    return sendDataResponse(res, 200, checkout);
  }

  // A free month covers every line: extra maps wait until it ends (17 Nov 2026, the audit)
  if (sub.status === 'trialing' && quantity > (sub.extraMaps ?? 0)) return conflict(req, res, D, EVENT_MESSAGES.extraMapsAfterFreeMonth);

  const stripe = await stripeClient();
  const { planItem, extraItem } = await remoteLines(stripe, sub.stripeSubscriptionId);
  let items = null;
  if (quantity === 0) {
    if (extraItem && !planItem) return conflict(req, res, D, EVENT_MESSAGES.cancelInPortal);
    if (extraItem) items = [{ id: extraItem.id, deleted: true }];
  } else if (extraItem) {
    items = [{ id: extraItem.id, quantity }];
  } else {
    const price = extraMapPriceId(sub.plan, sub.interval ?? 'MONTH');
    if (!price) return paymentsOff(req, res);
    items = [{ price, quantity }];
  }

  if (items) {
    await updateSubscription(stripe, sub, items);
    logEvent(createBillingEvent({ user: req.user, action: 'Extra Maps Success', detail: `extraMaps=${quantity}` }));
  }
  return sendDataResponse(res, 200, { billing: await billingView(req.user.id) });
});

// Stripe's customer portal: payment method, invoices, cancelling
export const portalHandler = handler(D, 'Billing portal', async (req, res) => {
  if (!paymentsEnabled()) return paymentsOff(req, res);
  const sub = await findSubscription(req.user.id);
  if (!sub?.stripeCustomerId) return conflict(req, res, D, EVENT_MESSAGES.noBillingAccount);
  const stripe = await stripeClient();
  const session = await stripe.billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: accountUrl() });
  return sendDataResponse(res, 200, { url: session.url });
});

// ── Webhook ──────────────────────────────────────────────────────────────────

const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

async function handleStripeEvent(event) {
  const object = event.data?.object;
  if (event.type === 'checkout.session.completed') {
    const userId = await linkCheckoutSession(object);
    if (userId) logEvent(createBillingEvent({ user: { id: userId }, action: 'Checkout Completed', detail: `event=${event.id}` }));
    return;
  }
  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    // Stripe's subscription as it is now, not as this (perhaps late) event saw it
    const current = await latestSubscription(object);
    const applied = await applyStripeSubscription(current, { deleted: event.type === 'customer.subscription.deleted' });
    if (applied?.duplicate) {
      logEvent(createBillingEvent({
        user: { id: applied.userId },
        action: 'Duplicate Subscription Cancelled',
        detail: `${event.type} subscription=${applied.duplicate} (refund its first payment)`,
      }));
      return;
    }
    if (applied) {
      const s = applied.subscription;
      logEvent(createBillingEvent({
        user: { id: applied.userId },
        action: 'Subscription Updated',
        detail: `${event.type} plan=${s.plan} extraMaps=${s.extraMaps} status=${s.status}`,
      }));
    }
  }
  // Anything else is recorded (so a retry is skipped) and ignored
}

/**
 * POST /api/billing/webhook, mounted with a raw body before express.json (server.js):
 * the signature is checked against the exact bytes Stripe sent. The event id is recorded
 * first, so a retried event changes nothing; if handling fails the record is removed
 * and the answer is 500, so Stripe's retry runs it again.
 */
export async function stripeWebhookHandler(req, res) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return sendMessageResponse(res, 503, EVENT_MESSAGES.paymentsOff);
  let event;
  try {
    if (!Buffer.isBuffer(req.body)) throw new Error('no raw body');
    event = await verifyWebhookEvent(req.body, req.get('stripe-signature'));
  } catch {
    return sendMessageResponse(res, 400, 'Invalid webhook signature.');
  }
  // Every Stripe event has an id (evt_...): it's what makes a retry harmless
  if (typeof event?.id !== 'string' || !event.id || event.id.length > 255) {
    return sendMessageResponse(res, 400, 'Invalid webhook event.');
  }

  try {
    if (!(await recordStripeEvent({ id: event.id, type: String(event.type).slice(0, 100) }))) {
      return sendDataResponse(res, 200, { received: true, duplicate: true });
    }
  } catch (err) {
    console.error('[billing] webhook record failed:', err?.message);
    return sendMessageResponse(res, 500, 'Webhook failed.');
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    await forgetStripeEvent(event.id).catch(() => {});
    console.error('[billing] webhook handling failed:', event.type, err?.message);
    logEvent(createBillingEvent({ user: null, action: 'Webhook Failed', detail: `${event.type} event=${event.id}`, statusCode: 500 }));
    return sendMessageResponse(res, 500, 'Webhook failed.');
  }
  return sendDataResponse(res, 200, { received: true });
}
