import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// Api
import { getMyGifts } from '@/api/giftsApi';
// Constants
import { GIFTS_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import GiftBuyCard from '@/components/gifts/GiftBuyCard';
import GiftListCard from '@/components/gifts/GiftListCard';

// Gifts (docs/API.md "Gifts"; signed in): give a year of Business or First Class, and the
// gifts you've bought with their codes. Back from Checkout (`?bought=1`) it says so and reads
// the list again after 3 and 8 seconds, as Stripe's word can take a moment to arrive.
function GiftsPage() {
  const mustVerify = useMustVerifyEmail();
  const [params] = useSearchParams();
  const bought = params.get('bought') === '1';
  const cancelled = params.get('cancelled') === '1';
  const [state, setState] = useState({ loaded: false, offers: [], gifts: [], paymentsEnabled: false, error: '' });

  const load = useCallback(
    () =>
      getMyGifts()
        .then(({ offers = [], gifts = [], paymentsEnabled = false }) => setState({ loaded: true, offers, gifts, paymentsEnabled, error: '' }))
        .catch((err) => setState((was) => ({ ...was, loaded: true, error: err.friendlyMessage || 'Your gifts couldn’t be loaded.' }))),
    [],
  );

  useEffect(() => {
    load();
    if (!bought) return undefined;
    const timers = [3000, 8000].map((ms) => window.setTimeout(load, ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [load, bought]);

  return (
    <>
      <AppPageHead route={GIFTS_PAGE_URL} />
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'gifts-page-heading' }}>
        <PageTitleCard
          page='Gifts'
          title='Give a year of travel'
          headingId='gifts-page-heading'
          subtitle='For Christmas, a wedding or a birthday: a year of Business or First Class, its code sent to you to give.'
        />
        {bought ? (
          <p role='status' className='ticket-edge bg-paper-cream px-6 py-4 font-medium'>
            Thank you. Your gift is below once the payment’s through, and its code is on its way to your email.
          </p>
        ) : null}
        {cancelled ? (
          <p role='status' className='ticket-edge bg-paper-cream px-6 py-4'>
            No payment was taken.
          </p>
        ) : null}
        <InlineAlert>{state.error}</InlineAlert>
        {!state.loaded ? (
          <div className='grid place-items-center py-10' role='status'>
            <LoadingSpinner md />
            <span className='sr-only'>Loading your gifts…</span>
          </div>
        ) : (
          <>
            {state.offers.length ? <GiftBuyCard offers={state.offers} paymentsEnabled={state.paymentsEnabled} locked={mustVerify} /> : null}
            <GiftListCard gifts={state.gifts} />
          </>
        )}
      </AppPageShell>
    </>
  );
}

export default GiftsPage;
