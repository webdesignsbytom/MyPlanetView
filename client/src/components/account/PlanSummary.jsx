import React from 'react';
// Utils
import { formatDay } from '@/utils/functions/dates';
import { planOf } from '@/utils/constants/plans';
import { isForLife } from '@/utils/plans/promoCodes';
import { INTERVAL_NAMES, hasSubscription, planPrice, priceText } from '@/utils/plans/billing';

const number = (n) => Number(n).toLocaleString('en-GB');
const gigabytes = (bytes) => `${Math.round(bytes / 1000 ** 3)} GB`;

// What the account's plan is, where it comes from (a subscription, a complimentary
// membership or nothing: Economy), when it renews or ends, and what it keeps
// "until 5 Dec 2027", or "for life" (a promo code of your own: utils/plans/promoCodes.js)
const grantEnd = (grant) => (isForLife(grant.endsAt) ? 'for life' : `until ${formatDay(grant.endsAt)}`);

function PlanSummary({ billing }) {
  const plan = planOf(billing.plan);
  const grantPlan = billing.grant ? planOf(billing.grant.plan) : null;
  const subscribed = hasSubscription(billing);

  const source =
    billing.source === 'COMPLIMENTARY' && billing.grant
      ? `Complimentary ${grantPlan.name} ${grantEnd(billing.grant)}`
      : billing.source === 'STRIPE'
        ? `Paid ${INTERVAL_NAMES[billing.interval] || ''}, ${priceText(planPrice(billing, billing.plan, billing.interval || 'MONTH'), billing.interval || 'MONTH')}`
        : 'Free';

  // A promo code's free month is a Stripe trial: the period ends when the first payment is due
  const trialing = billing.status === 'trialing';
  const renewal = !subscribed
    ? null
    : billing.cancelAtPeriodEnd
      ? trialing
        ? `Cancelled in your free month: it stops on ${formatDay(billing.renewsAt)}, nothing is charged and nothing is deleted.`
        : `Cancelled: it stops on ${formatDay(billing.renewsAt)}, and nothing is deleted.`
      : billing.renewsAt
        ? trialing
          ? `Free until ${formatDay(billing.renewsAt)}. Your first payment is then, unless you cancel before.`
          : `Renews on ${formatDay(billing.renewsAt)}.`
        : null;

  const limits = [
    `${number(plan.limits.photosPerCountry)} photos of each country on each map`,
    plan.limits.keepsOriginals ? 'your full-size originals' : 'a print-quality copy of each photo (good up to A4)',
    plan.limits.storageCapBytes ? `up to ${gigabytes(plan.limits.storageCapBytes)} of photos on each map` : null,
  ].filter(Boolean);
  const keeps = limits.length > 1 ? `${limits.slice(0, -1).join(', ')} and ${limits[limits.length - 1]}` : limits[0];

  return (
    <div className='grid gap-2'>
      <p className='font-travel text-3xl uppercase leading-none tracking-wide text-poster-red-deep'>{plan.name}</p>
      <p className='font-semibold'>{source}</p>
      {renewal ? <p className='text-sm'>{renewal}</p> : null}
      {billing.status === 'past_due' ? (
        <p className='text-sm text-status-critical'>
          Your last payment didn’t go through. Stripe will try again; check your card under Manage billing.
        </p>
      ) : null}
      {/* A membership running beside a subscription that wins, or the other way round */}
      {billing.source !== 'COMPLIMENTARY' && billing.grant ? (
        <p className='text-sm'>
          You also have complimentary {grantPlan.name} {grantEnd(billing.grant)}.
        </p>
      ) : null}
      {billing.source === 'COMPLIMENTARY' && subscribed ? (
        <p className='text-sm'>
          Your subscription carries on beside it{billing.renewsAt ? `, and renews on ${formatDay(billing.renewsAt)}` : ''}.
        </p>
      ) : null}
      <p className='text-sm opacity-80'>Your plan keeps {keeps}.</p>
    </div>
  );
}

export default PlanSummary;
