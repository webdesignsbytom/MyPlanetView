// One Stripe customer per account (docs/API.md "Plans and billing"), made at its first
// Checkout (a subscription's or a gift's) and kept on its Subscription row.
import { claimStripeCustomer } from '../../domain/billing.js';

/** The account's Stripe customer id: `existingId`, else a new one claimed for the account. */
export async function ensureStripeCustomer(stripe, user, existingId) {
  if (existingId) return existingId;
  const made = (await stripe.customers.create({ email: user.email, metadata: { userId: user.id } })).id;
  const customer = await claimStripeCustomer({ userId: user.id, stripeCustomerId: made });
  // Another Checkout (a double click) gave the account its customer first: this one is
  // never used, so it goes, and both Checkouts share one customer
  if (customer !== made) {
    try {
      await stripe.customers.del(made);
    } catch {
      // An unused customer left in Stripe: harmless
    }
  }
  return customer;
}
