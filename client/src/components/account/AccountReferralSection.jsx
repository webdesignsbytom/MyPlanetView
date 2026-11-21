import React, { useEffect, useMemo, useState } from 'react';
// Api
import { createReferral, getReferral } from '@/api/referralsApi';
// Components
import Button from '@/components/common/Button';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Utils
import { inviteLinkFor } from '@/utils/plans/promoCodes';

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/**
 * Give a month, get a month (docs/API.md "Give a month, get a month"; 21 Nov 2026, the user's
 * wish): the member's own invite link (their code on the sign-up page, made the first time
 * they ask: a verified address), to copy or share. A friend who signs up with it gets their
 * first month free; once the friend pays, the member gets a month too (off their next bill if
 * they pay by card, else a month of Business), up to `perYear` a year. Then what it has
 * brought so far.
 */
function AccountReferralSection() {
  const mustVerify = useMustVerifyEmail();
  const [referral, setReferral] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    getReferral()
      .then(({ referral: loaded }) => alive && setReferral(loaded))
      .catch(() => alive && setError('Your invite couldn’t be loaded.'));
    return () => {
      alive = false;
    };
  }, []);

  const link = useMemo(() => (referral?.code ? inviteLinkFor(referral.code, window.location.origin) : null), [referral?.code]);

  const make = async () => {
    setBusy(true);
    setError(null);
    try {
      const { referral: made } = await createReferral();
      setReferral(made);
    } catch (err) {
      setError(err.friendlyMessage || 'Your link couldn’t be made. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const share = () =>
    navigator
      .share({ title: 'A free month of My Planet View', text: 'Your first month free on a map of everywhere you’ve been.', url: link })
      .catch(() => {});

  const perYear = referral?.perYear ?? 12;
  return (
    <div className='grid gap-3'>
      <p className='text-sm'>
        Invite a friend and you both get a free month. They get their first month of Business or First Class free; when they go on to
        pay, you get a month too: off your next bill if you pay by card, or a month of Business if you don’t. Up to {perYear} months a year.
      </p>

      {referral && !referral.code ? (
        mustVerify ? (
          <VerifyFirstNote action='get your invite link' />
        ) : (
          <div className='justify-self-start'>
            <Button quiet busy={busy} onClick={make}>
              Get my invite link
            </Button>
          </div>
        )
      ) : null}

      {link ? (
        <>
          <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]'>
            <input
              readOnly
              value={link}
              aria-label='Your invite link'
              onFocus={(e) => e.target.select()}
              className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
              data-invite-link
            />
            <Button quiet onClick={copy}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            {canShare ? (
              <Button quiet onClick={share}>
                Share
              </Button>
            ) : null}
          </div>
          <p className='text-sm' data-referral-counts>
            {plural(referral.friendsJoined, 'friend')} joined, {referral.friendsPaid} went on to pay. You’ve earned{' '}
            {plural(referral.monthsEarned, 'free month')}, with {plural(referral.monthsLeftThisYear, 'more month')} to earn this year.
          </p>
        </>
      ) : null}

      {error ? (
        <p role='alert' className='text-sm font-medium text-status-critical'>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AccountReferralSection;
