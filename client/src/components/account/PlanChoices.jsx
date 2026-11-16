import React from 'react';
// Constants
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
// Components
import Button from '@/components/common/Button';
import AppLink from '@/components/common/AppLink';
// Utils
import { PAID_PLAN_IDS, planOf } from '@/utils/constants/plans';
import { INTERVAL_NAMES, hasSubscription, planPrice, priceText } from '@/utils/plans/billing';
import { promoTrialText } from '@/utils/plans/promoCodes';

// The plans the account can move to, on the `interval` chosen above. With a subscription
// the plan line changes in place (change-plan, prorated by Stripe; the same plan on the
// other interval too); without one, each plan is a Stripe Checkout, whose first month is
// free when the account signed up with a promo code (`billing.promoTrial`). Stopping is in
// Stripe's billing page. `onChoose(planId)` runs the change.
function PlanChoices({ billing, interval, busy, onChoose }) {
  const current = planOf(billing.plan);
  // A subscription's own plan is only known when it's the one in force
  const paying = hasSubscription(billing) && billing.source === 'STRIPE';

  const choices = PAID_PLAN_IDS.map(planOf).filter((plan) =>
    paying ? plan.id !== current.id || interval !== billing.interval : plan.rank > current.rank,
  );

  if (!choices.length) {
    return <p className='text-sm'>You’re on our top plan, so there’s nothing to upgrade to.</p>;
  }

  // A promo code's free month: only for a Checkout (no subscription yet)
  const trial = !paying && !hasSubscription(billing) ? billing.promoTrial : null;

  return (
    <div className='grid gap-3'>
      {trial ? (
        <p className='border-2 border-dashed border-status-good bg-paper-cream p-3 text-sm' data-testid='promo-trial'>
          {promoTrialText(trial)}
        </p>
      ) : null}
      <ul className='grid gap-2 sm:grid-cols-2'>
        {choices.map((plan) => {
          const label =
            plan.id === current.id
              ? `Pay ${INTERVAL_NAMES[interval]} instead`
              : trial
                ? `Start a free month of ${plan.name}`
                : plan.rank > current.rank
                  ? `Upgrade to ${plan.name}`
                  : `Change to ${plan.name}`;
          return (
            <li key={plan.id} className='grid content-between gap-2 border-2 border-dashed border-poster-brown/60 p-3'>
              <span className='grid gap-1'>
                <span className='font-travel text-lg uppercase leading-tight tracking-wide'>{plan.name}</span>
                <span className='text-sm'>
                  {trial ? `Free for ${trial.days} days, then ` : ''}
                  {priceText(planPrice(billing, plan.id, interval), interval)}.{' '}
                  {plan.limits.photosPerCountry.toLocaleString('en-GB')} photos of each country, originals kept
                  {plan.limits.videos ? ', videos' : ''}.
                </span>
              </span>
              <Button busy={busy} disabled={!billing.paymentsEnabled} onClick={() => onChoose(plan.id)}>
                {label}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className='text-xs opacity-80'>
        {paying
          ? 'Stripe adjusts your next payment for the time left on this one.'
          : 'You pay on Stripe’s secure checkout, then come back here.'}{' '}
        <AppLink to={PRICING_PAGE_URL} label='Compare the plans' className='font-semibold underline' />
      </p>
    </div>
  );
}

export default PlanChoices;
