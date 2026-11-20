// Stripe's view of an account, written to its Subscription row: from the webhook, and
// straight after the billing routes change a subscription (so the reply shows it).
import { prisma } from '../../prisma.js';
import {
  findSubscription,
  findSubscriptionByCustomer,
  linkStripeCustomer,
  saveSubscriptionState,
} from '../../domain/billing.js';
import { hasLiveSubscription, isDuplicateSubscription, shouldApplySubscriptionEvent, stripeIdOf, subscriptionStateFrom } from '../../utils/stripeState.js';
import { markPromoTrialUsedInDB } from '../../domain/promoCodes.js';
import { markInviteOfferUsedInDB } from './inviteOffer.js';
import { paymentsEnabled, priceKind, stripeClient } from './stripe.js';

/**
 * Deleting an account ends its subscription at once, before anything is deleted (auth.js
 * deleteUserMedia, for the person and for an admin alike). The Subscription row goes with
 * the user, so without this Stripe would go on charging a card for an account that no
 * longer exists. It throws when Stripe can't be told, so the account stays (and can be
 * deleted again) rather than leaving a subscription running. A subscription Stripe doesn't
 * have (already ended, or a seeded stand-in id) counts as ended. Stripe's notice that it
 * ended then finds no account and is ignored. -> true when one was cancelled
 */
export async function endSubscriptionOfDeletedAccount(userId) {
  const sub = await findSubscription(userId);
  if (!hasLiveSubscription(sub)) return false;
  if (!paymentsEnabled()) {
    // Only where payments were never set up (development, tests): nothing to tell
    console.warn('[billing] payments are off: subscription not cancelled for a deleted account', sub.stripeSubscriptionId);
    return false;
  }
  const stripe = await stripeClient();
  try {
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
  } catch (err) {
    if (err?.code === 'resource_missing') return false;
    throw err;
  }
  return true;
}

/**
 * The subscription as Stripe has it now, for a webhook event about it (17 Nov 2026, the
 * audit): events can arrive out of order, or late after a retry, so the event's own copy
 * could undo a newer change. Stripe keeps ended subscriptions, so a deleted one is found too;
 * when it has none to give, the event's copy is used.
 */
export async function latestSubscription(sub) {
  if (!sub?.id) return sub;
  const stripe = await stripeClient();
  const fresh = await stripe.subscriptions.retrieve(sub.id);
  return fresh?.id ? fresh : sub;
}

/**
 * A second live subscription for an account that already has one (two Checkouts completed
 * at once, from two tabs or a double click, before the first one's events arrived). The
 * newer one is cancelled at once, so only one ever charges; its first payment needs
 * refunding by hand (the event says which). -> true when it was cancelled
 */
async function cancelDuplicate(sub) {
  const stripe = await stripeClient();
  try {
    await stripe.subscriptions.cancel(sub.id);
  } catch (err) {
    if (err?.code !== 'resource_missing') throw err;
  }
  return true;
}

const userExists = async (userId) =>
  typeof userId === 'string' && Boolean(await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }));

/**
 * checkout.session.completed: link the Stripe customer (and its new subscription) to the
 * user who started the checkout (`client_reference_id`, also in `metadata.userId`).
 * The plan itself comes with the subscription events. -> the user id, or null if ignored
 */
export async function linkCheckoutSession(session) {
  const userId = session?.client_reference_id || session?.metadata?.userId;
  const stripeCustomerId = stripeIdOf(session?.customer);
  if (session?.mode !== 'subscription' || !stripeCustomerId || !(await userExists(userId))) return null;
  // A second Checkout's subscription never replaces a live one the row tracks: its own
  // events then find it a duplicate and cancel it (applyStripeSubscription)
  const tracked = await findSubscription(userId);
  const newId = stripeIdOf(session.subscription);
  const keepTracked = hasLiveSubscription(tracked) && tracked.stripeSubscriptionId && tracked.stripeSubscriptionId !== newId;
  // Nor is the row moved to another customer while it tracks a live subscription: "Manage
  // billing" would then open a customer without it (19 Nov 2026, the audit)
  if (keepTracked) return userId;
  // A new subscription on the row takes it from the old one's status: a "canceled" left
  // there made every event about the new one look like a late one about the old (a returning
  // subscriber paid and stayed on Economy; 19 Nov 2026, the audit)
  const replacing = Boolean(newId) && tracked?.stripeSubscriptionId !== newId;
  try {
    await linkStripeCustomer({ userId, stripeCustomerId, stripeSubscriptionId: newId, clearStatus: replacing });
  } catch (err) {
    // The customer or subscription is already another account's: nothing to change here
    if (err?.code === 'P2002') return null;
    throw err;
  }
  return userId;
}

/**
 * customer.subscription.created / updated / deleted (and the billing routes' own
 * updates): write the subscription's plan line, extra-map quantity, status, period end
 * and cancel flag. The account is found by customer id, else by the subscription's
 * `metadata.userId` (set at checkout, for an event that comes before the checkout's).
 * A subscription with a trial that a promo code asked for (`metadata.promoCode`) records
 * the account's free month as used, whatever the event (once; promoTrialUsedAt).
 * A second live one for an account that has a live subscription already is cancelled
 * instead (`{ userId, duplicate: id }`).
 * -> `{ userId, subscription }`, or null when it's no account's or out of date
 */
export async function applyStripeSubscription(sub, { deleted = false } = {}) {
  const stripeCustomerId = stripeIdOf(sub?.customer);
  if (!sub?.id || !stripeCustomerId) return null;
  let row = await findSubscriptionByCustomer(stripeCustomerId);
  if (!row) {
    const userId = sub.metadata?.userId;
    if (!(await userExists(userId))) return null;
    // A row tracking a live subscription keeps its customer: this one (another customer's,
    // from two Checkouts at once) is judged against it, and cancelled as a duplicate
    const tracked = await findSubscription(userId);
    row = hasLiveSubscription(tracked) ? tracked : await linkStripeCustomer({ userId, stripeCustomerId });
  }
  if (isDuplicateSubscription(row, sub, { deleted })) {
    await cancelDuplicate(sub);
    return { userId: row.userId, duplicate: sub.id };
  }
  if (sub.trial_end && sub.metadata?.promoCode) await markPromoTrialUsedInDB(row.userId);
  // A Checkout with the invite offer (its coupon): used, once
  if (sub.metadata?.inviteOffer) await markInviteOfferUsedInDB(row.userId);
  if (!shouldApplySubscriptionEvent(row, sub, { deleted })) return null;
  const subscription = await saveSubscriptionState(row.userId, subscriptionStateFrom(sub, priceKind, { deleted }));
  return { userId: row.userId, subscription };
}
