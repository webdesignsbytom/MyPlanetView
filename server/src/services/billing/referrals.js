// Give a month, get a month (docs/API.md "Give a month, get a month"; 21 Nov 2026, the user's
// wish): a member's own code, and their month when a friend who signed up with it first pays.
// Called by the Stripe webhook (subscriptions.js) when a subscription is active: after a
// promo free month that's the first payment. A credit goes to Stripe with the reward's own
// idempotency key, so a webhook retried after a failure gives it once.
import { referralCodeFor } from '../../utils/referrals.js';
import {
  claimReferralRewardInDB,
  createReferralCodeInDB,
  findReferralCode,
  findReferrerOf,
  findStripeCustomerOf,
  markReferralRewardAppliedInDB,
} from '../../domain/referrals.js';
import { findPromoCodeByCode } from '../../domain/promoCodes.js';
import { stripeClient } from './stripe.js';

/** The member's code, made the first time they ask (a fresh one if the random part is taken). */
export async function ensureReferralCode(user) {
  const existing = await findReferralCode(user.id);
  if (existing) return existing;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = referralCodeFor(user.name);
    if (await findPromoCodeByCode(code)) continue;
    try {
      return await createReferralCodeInDB(user.id, code);
    } catch (err) {
      if (err?.code !== 'P2002') throw err;
      // Made by another request just now, or the code taken meanwhile
      const made = await findReferralCode(user.id);
      if (made) return made;
    }
  }
  throw new Error('Could not make a referral code');
}

/**
 * A friend has paid (their subscription is active): the month for whoever invited them, once.
 * -> the reward, or null when nobody did
 */
export async function rewardReferrerFor(friendId, now = new Date()) {
  const referrerId = await findReferrerOf(friendId);
  if (!referrerId || referrerId === friendId) return null;
  const reward = await claimReferralRewardInDB({ referrerId, friendId, now });
  if (reward.kind === 'CREDIT' && !reward.appliedAt) {
    const customer = await findStripeCustomerOf(referrerId);
    if (customer) {
      const stripe = await stripeClient();
      // Negative: money off the customer's next invoices
      await stripe.customers.createBalanceTransaction(
        customer,
        { amount: -reward.amountPence, currency: 'gbp', description: 'A free month: a friend you invited joined' },
        { idempotencyKey: `referral-reward-${reward.id}` },
      );
      await markReferralRewardAppliedInDB(reward.id, now);
    }
  }
  return reward;
}
