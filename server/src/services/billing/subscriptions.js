// Stripe's view of an account, written to its Subscription row: from the webhook, and
// straight after the billing routes change a subscription (so the reply shows it).
import { prisma } from '../../prisma.js';
import {
  findSubscriptionByCustomer,
  linkStripeCustomer,
  saveSubscriptionState,
} from '../../domain/billing.js';
import { shouldApplySubscriptionEvent, stripeIdOf, subscriptionStateFrom } from '../../utils/stripeState.js';
import { markPromoTrialUsedInDB } from '../../domain/promoCodes.js';
import { priceKind } from './stripe.js';

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
  try {
    await linkStripeCustomer({ userId, stripeCustomerId, stripeSubscriptionId: stripeIdOf(session.subscription) });
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
 * -> `{ userId, subscription }`, or null when it's no account's or out of date
 */
export async function applyStripeSubscription(sub, { deleted = false } = {}) {
  const stripeCustomerId = stripeIdOf(sub?.customer);
  if (!sub?.id || !stripeCustomerId) return null;
  let row = await findSubscriptionByCustomer(stripeCustomerId);
  if (!row) {
    const userId = sub.metadata?.userId;
    if (!(await userExists(userId))) return null;
    row = await linkStripeCustomer({ userId, stripeCustomerId });
  }
  if (sub.trial_end && sub.metadata?.promoCode) await markPromoTrialUsedInDB(row.userId);
  if (!shouldApplySubscriptionEvent(row, sub, { deleted })) return null;
  const subscription = await saveSubscriptionState(row.userId, subscriptionStateFrom(sub, priceKind, { deleted }));
  return { userId: row.userId, subscription };
}
