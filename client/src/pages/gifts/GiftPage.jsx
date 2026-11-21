import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
// Api
import { getGift, redeemGift } from '@/api/giftsApi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Constants
import { ACCOUNT_PAGE_URL, GIFT_PAGE_URL, LOGIN_PAGE_URL, MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TravelTicket from '@/components/auth/TravelTicket';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { giftTitle } from '@/utils/gifts/giftWords';
import { formatDay } from '@/utils/functions/dates';

// A gift's own page (docs/API.md "Gifts"; anyone with its code): what it is, who it's from and
// for, and their message, as a ticket. Signed in (and verified), it's redeemed here for a year
// of the plan; signed out, sign in or up and come back. A used or refunded gift says so.
function GiftPage() {
  const { code } = useParams();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const mustVerify = useMustVerifyEmail();
  const [state, setState] = useState({ gift: null, error: '' });
  const [busy, setBusy] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [grant, setGrant] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGift(code)
      .then(({ gift }) => !cancelled && setState({ gift, error: '' }))
      .catch((err) => !cancelled && setState({ gift: null, error: err.friendlyMessage || 'We couldn’t find that gift.' }));
    return () => {
      cancelled = true;
    };
  }, [code]);

  const redeem = async () => {
    setBusy(true);
    setRedeemError('');
    try {
      const answer = await redeemGift(code);
      setGrant(answer.grant);
    } catch (err) {
      setRedeemError(err.friendlyMessage || 'The gift couldn’t be redeemed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const { gift, error } = state;
  const back = { from: location.pathname };
  return (
    <>
      <AppPageHead route={GIFT_PAGE_URL} />
      <AppPageShell width='max-w-2xl' mainProps={{ 'aria-labelledby': 'gift-heading' }}>
        <TravelTicket
          kicker='A gift for you'
          title={gift ? giftTitle(gift) : 'A gift'}
          headingId='gift-heading'
          stub={['Gift ticket', gift ? gift.planName : 'Travel', `Code: ${gift?.code ?? '…'}`]}
          widthClassName=''
        >
          <div className='grid gap-4' data-gift-status={gift?.status}>
            {!gift && !error ? (
              <div className='grid place-items-center py-10' role='status'>
                <LoadingSpinner md />
                <span className='sr-only'>Opening the gift…</span>
              </div>
            ) : null}
            <InlineAlert>{error}</InlineAlert>
            {gift ? (
              <>
                <dl className='grid gap-1'>
                  {gift.toName ? (
                    <div className='grid grid-cols-reg gap-2'>
                      <dt className='font-medium'>For</dt>
                      <dd>{gift.toName}</dd>
                    </div>
                  ) : null}
                  {gift.fromName ? (
                    <div className='grid grid-cols-reg gap-2'>
                      <dt className='font-medium'>From</dt>
                      <dd>{gift.fromName}</dd>
                    </div>
                  ) : null}
                  <div className='grid grid-cols-reg gap-2'>
                    <dt className='font-medium'>Code</dt>
                    <dd className='font-mono tracking-widest'>{gift.code}</dd>
                  </div>
                </dl>
                {gift.message ? <blockquote className='paper-aged border-l-4 border-poster-red px-4 py-3 italic'>“{gift.message}”</blockquote> : null}
                <p className='text-sm'>
                  {gift.planName} on My Planet View: every country you’ve been on one map, a passport stamped with the landmarks
                  in your photos, and room for {gift.plan === 'PREMIUM' ? 'every photo and video' : 'all your photos'}. The year
                  starts the day it’s redeemed.
                </p>

                {grant ? (
                  <div role='status' className='grid gap-3'>
                    <p className='font-semibold'>
                      It’s yours: {grant.planName} until {formatDay(grant.endsAt)}.
                    </p>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <Link to={MAP_PAGE_URL} className='btn-poster text-center'>
                        Open your map
                      </Link>
                      <Link to={ACCOUNT_PAGE_URL} className='btn-paper text-center'>
                        See your plan
                      </Link>
                    </div>
                  </div>
                ) : gift.status === 'REDEEMED' ? (
                  <p className='font-medium'>This gift has been redeemed.</p>
                ) : gift.status === 'REFUNDED' ? (
                  <p className='font-medium'>This gift was refunded, so it can’t be redeemed.</p>
                ) : authLoading ? null : !isAuthenticated ? (
                  <div className='grid gap-3'>
                    <p className='text-sm'>Sign in or create an account to redeem it, and you’ll come straight back here.</p>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <Link to={SIGN_UP_PAGE_URL} state={back} className='btn-poster text-center'>
                        Create an account
                      </Link>
                      <Link to={LOGIN_PAGE_URL} state={back} className='btn-paper text-center'>
                        Sign in
                      </Link>
                    </div>
                  </div>
                ) : mustVerify ? (
                  <p className='text-sm'>Verify your email address to redeem it. Use the link we emailed you, then open this page again.</p>
                ) : (
                  <div className='grid gap-3'>
                    <InlineAlert>{redeemError}</InlineAlert>
                    <Button busy={busy} onClick={redeem}>
                      Redeem the gift
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </TravelTicket>
      </AppPageShell>
    </>
  );
}

export default GiftPage;
