import React from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { plural } from '@/utils/functions/plural';
import { INTERVAL_NAMES, extraMapPrice, extraMapSentence, hasSubscription, priceText } from '@/utils/plans/billing';

// The maps the account owns against its slots: the included one and the extra maps paid
// for (docs/API.md, "Map limits"). A map without a slot is locked (named, from the map
// list); one more extra map unlocks it. Extra maps paid for and not in use can be dropped.
// With a subscription an extra map goes on it (its interval); without, it's a Checkout
// on the `interval` chosen above.
function ExtraMapsSummary({ billing, lockedNames = [], interval, busy, onAdd, onRemoveUnused }) {
  const subscribed = hasSubscription(billing);
  const payInterval = subscribed ? billing.interval || 'MONTH' : interval;
  const extraInUse = Math.max(0, billing.ownedMaps - billing.includedMaps - billing.lockedMapIds.length);
  const unused = Math.max(0, billing.extraMapsPaid - extraInUse);
  const locked = billing.lockedMapIds.length;

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='extra-maps-heading'>
      <h3 id='extra-maps-heading' className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
        Your maps
      </h3>
      <p className='text-sm'>
        You own {plural(billing.ownedMaps, 'map')}. Your plan includes {plural(billing.includedMaps, 'map')}, and you pay
        for {plural(billing.extraMapsPaid, 'extra map')}
        {billing.extraMapsPaid ? ` (${extraInUse} in use)` : ''}.
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
        <Button busy={busy} disabled={!billing.paymentsEnabled} onClick={onAdd}>
          Add an extra map
        </Button>
        {unused && subscribed ? (
          <Button quiet busy={busy} disabled={!billing.paymentsEnabled} onClick={onRemoveUnused}>
            Drop an unused one
          </Button>
        ) : null}
      </div>
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
