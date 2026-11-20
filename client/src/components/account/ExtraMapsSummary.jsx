import React from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { plural } from '@/utils/functions/plural';
import { INTERVAL_NAMES, extraMapPrice, extraMapSentence, hasSubscription, priceText } from '@/utils/plans/billing';

// The maps the account owns against its slots (docs/API.md, "Map limits"; 19 Nov 2026): 3 free
// maps, the main one on the plan and two more on Economy, and the extra maps paid for, each one
// more on the plan. A map beyond them is locked (named, from the map list); one more extra map
// unlocks it. Extra maps paid for and not in use can be dropped.
// With a subscription an extra map goes on it (its interval); without, it's a Checkout
// on the `interval` chosen above.
function ExtraMapsSummary({ billing, lockedNames = [], interval, busy, onAdd, onRemoveUnused }) {
  const subscribed = hasSubscription(billing);
  const payInterval = subscribed ? billing.interval || 'MONTH' : interval;
  const economy = billing.economyMapIds?.length ?? 0;
  const extraInUse = Math.max(0, billing.ownedMaps - billing.includedMaps - economy - billing.lockedMapIds.length);
  const unused = Math.max(0, billing.extraMapsPaid - extraInUse);
  const locked = billing.lockedMapIds.length;
  // A promo code's free month covers every line, so extra maps wait until it ends (the
  // server says no meanwhile; 19 Nov 2026, the audit)
  const inFreeMonth = subscribed && billing.status === 'trialing';

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='extra-maps-heading'>
      <h3 id='extra-maps-heading' className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
        Your maps
      </h3>
      <p className='text-sm'>
        You own {plural(billing.ownedMaps, 'map')}. You have 3 free maps: your main one on your plan, and{' '}
        {billing.freeEconomyMaps ?? 2} more on Economy ({economy} in use). You pay for {plural(billing.extraMapsPaid, 'extra map')}
        {billing.extraMapsPaid ? ` (${extraInUse} in use)` : ''}, each one more map on your plan.
      </p>
      {locked ? (
        <p className='text-sm text-status-critical'>
          {locked === 1 ? 'One of your maps isn’t' : `${locked} of your maps aren’t`} paid for, so{' '}
          {locked === 1 ? 'it can’t' : 'they can’t'} take new photos
          {lockedNames.length ? `: ${lockedNames.map((name) => `“${name}”`).join(', ')}` : ''}. Nothing on{' '}
          {locked === 1 ? 'it' : 'them'} is deleted.
        </p>
      ) : null}
      <p className='text-sm'>
        {extraMapSentence(billing)} Maps other people share with you are always free.
      </p>
      <div className='grid justify-items-start gap-2 sm:grid-row'>
        <Button busy={busy} disabled={!billing.paymentsEnabled || inFreeMonth} onClick={onAdd}>
          Add an extra map
        </Button>
        {unused && subscribed ? (
          <Button quiet busy={busy} disabled={!billing.paymentsEnabled} onClick={onRemoveUnused}>
            Drop an unused one
          </Button>
        ) : null}
      </div>
      {inFreeMonth ? <p className='text-sm'>Extra maps can be added once your free month ends.</p> : null}
      <p className='text-xs opacity-80'>
        {subscribed
          ? `${priceText(extraMapPrice(billing, payInterval), payInterval)}, on your ${INTERVAL_NAMES[payInterval]} payment and adjusted for the time left.`
          : `${priceText(extraMapPrice(billing, payInterval), payInterval)}, paid ${INTERVAL_NAMES[payInterval]} (chosen above) on Stripe’s secure checkout.`}
        {unused && subscribed ? ` You pay for ${plural(unused, 'extra map')} you aren’t using.` : ''}
      </p>
    </section>
  );
}

export default ExtraMapsSummary;
