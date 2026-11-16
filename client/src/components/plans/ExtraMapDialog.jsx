import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { getBilling, setExtraMaps } from '@/api/plansApi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import IntervalPicker from './IntervalPicker';
// Utils
import { planOf } from '@/utils/constants/plans';
import {
  INTERVAL_NAMES,
  billingFrom,
  extraMapPrice,
  extraMapSentence,
  goToUrl,
  hasSubscription,
  priceText,
  savePendingMap,
} from '@/utils/plans/billing';
import { plural } from '@/utils/functions/plural';

/**
 * Paying for one more extra map (POST /billing/extra-maps), on a small paper dialog:
 * - `reason: 'new'`: a new map was refused (402); `pendingMap` is its body, kept while
 *   they pay on Stripe so the account page can make it when they come back;
 * - `reason: 'locked'`: the map on screen isn't paid for.
 * With a subscription the extra map is added to it at once (`onPaid(billing)`); without
 * one, it's a Stripe Checkout, monthly or yearly, and the page goes there.
 */
function ExtraMapDialog({ reason = 'new', pendingMap = null, onPaid, onClose }) {
  const { user } = useAuth();
  const [billing, setBilling] = useState(null);
  const [interval, setChosenInterval] = useState('MONTH');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getBilling()
      .then((loaded) => {
        if (!cancelled) setBilling(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'Your plan could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribed = hasSubscription(billing);
  const payInterval = subscribed ? billing.interval || 'MONTH' : interval;
  const price = billing ? priceText(extraMapPrice(billing, payInterval), payInterval) : '';

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const answer = await setExtraMaps({ quantity: billing.extraMapsPaid + 1, interval: subscribed ? undefined : interval });
      if (answer.url) {
        if (pendingMap) savePendingMap(user?.id, pendingMap);
        goToUrl(answer.url);
        return;
      }
      setBusy(false);
      onPaid?.(billingFrom(answer));
    } catch (err) {
      setError(err.friendlyMessage || 'That payment couldn’t be started.');
      setBusy(false);
    }
  };

  // On the page itself, above the map's panels (it opens from the map switcher's panel)
  return createPortal(
    <Modal title={reason === 'locked' ? 'Pay for this map' : 'Pay for another map'} onClose={onClose}>
      <InlineAlert>{error}</InlineAlert>
      {!billing && !error ? (
        <div className='grid place-items-center py-6' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading your plan…</span>
        </div>
      ) : null}

      {billing ? (
        <div className='grid gap-4'>
          <p>
            {reason === 'locked'
              ? 'This map isn’t paid for, so it can’t take new photos. Pay for one more extra map and it takes photos again.'
              : `Your plan includes ${plural(billing.includedMaps, 'map')}${
                  billing.extraMapsPaid ? `, and the ${plural(billing.extraMapsPaid, 'extra map')} you pay for ${billing.extraMapsPaid === 1 ? 'is' : 'are'} in use` : ', and you’re using it'
                }.`}
          </p>
          <p className='font-semibold'>{extraMapSentence(billing)}</p>
          <p className='text-sm opacity-80'>
            It gets your {planOf(billing.plan).name} limits: {planOf(billing.plan).limits.photosPerCountry.toLocaleString('en-GB')} photos of
            each country, and up to 10 editors. Maps other people share with you are always free.
          </p>

          {!billing.paymentsEnabled ? (
            <InlineAlert tone='info'>Payments aren’t set up yet.</InlineAlert>
          ) : subscribed ? (
            <p className='text-sm'>
              It’s added to your {INTERVAL_NAMES[payInterval]} payment, and Stripe charges only for the part of the period that’s left.
            </p>
          ) : (
            <>
              <IntervalPicker
                name='extra-map-interval'
                legend='Pay for it'
                value={interval}
                onChange={setChosenInterval}
                prices={{ MONTH: extraMapPrice(billing, 'MONTH'), YEAR: extraMapPrice(billing, 'YEAR') }}
              />
              <p className='text-sm opacity-80'>You pay on Stripe’s secure checkout, then come back here.</p>
            </>
          )}
        </div>
      ) : null}

      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onClose}>
          {billing?.paymentsEnabled === false ? 'Close' : 'Not now'}
        </Button>
        {billing?.paymentsEnabled ? (
          <Button busy={busy} onClick={pay}>
            {subscribed ? `Pay ${price}` : 'Go to checkout'}
          </Button>
        ) : null}
      </div>
    </Modal>,
    document.body,
  );
}

export default ExtraMapDialog;
