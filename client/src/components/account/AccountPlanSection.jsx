import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// Api
import { changePlan, getBilling, openBillingPortal, setExtraMaps, startCheckout } from '@/api/plansApi';
import { createMap } from '@/api/travelApi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Constants
import { mapPath } from '@/utils/constants/routes';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import AppLink from '@/components/common/AppLink';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import IntervalPicker from '@/components/plans/IntervalPicker';
import PlanSummary from './PlanSummary';
import PlanChoices from './PlanChoices';
import ExtraMapsSummary from './ExtraMapsSummary';
// Utils
import { planOf } from '@/utils/constants/plans';
import { forgetMapLists, myMaps } from '@/utils/map/mapListCache';
import { plural } from '@/utils/functions/plural';
import { INTERVAL_NAMES, billingFrom, forgetPendingMap, goToUrl, hasSubscription, readPendingMap } from '@/utils/plans/billing';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// After Stripe's checkout the plan arrives with its webhook: read it again a little later
const REREAD_AFTER_MS = [3000, 8000];
// A new map waiting for its extra map: tried this many times, this far apart, while 402
const PENDING_MAP_TRIES = 4;
const PENDING_MAP_GAP_MS = 2500;

// "Your plan" on the account page (GET /api/billing): the plan and where it comes from,
// renewal, upgrades (Checkout, or a change to the subscription), monthly or yearly, the
// maps owned against the slots with a way to add an extra map, and Stripe's billing page.
// Back from Checkout (`?billing=success|cancelled`) it says how it went, and makes the
// new map that was waiting for its extra map (the map switcher's 402 dialog).
function AccountPlanSection() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [searchParams] = useSearchParams();
  const billingReturn = searchParams.get('billing');
  const [billing, setBilling] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [interval, setChosenInterval] = useState('MONTH');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [lockedNames, setLockedNames] = useState([]);
  // The waiting new map: { body, status: 'making' | 'made' | 'waiting' | 'failed' | 'cancelled', map?, error? }
  const [pending, setPending] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reread = useCallback(() => getBilling().then((next) => alive.current && setBilling(next)), []);

  useEffect(() => {
    getBilling()
      .then((loaded) => {
        if (!alive.current) return;
        setBilling(loaded);
        if (loaded.interval) setChosenInterval(loaded.interval);
      })
      .catch((err) => alive.current && setLoadError(err.friendlyMessage || 'Your plan could not be loaded.'));
  }, []);

  // Back from a paid Checkout: Stripe's webhook may land a moment after the person does
  useEffect(() => {
    if (billingReturn !== 'success') return undefined;
    const timers = REREAD_AFTER_MS.map((ms) => setTimeout(() => reread().catch(() => {}), ms));
    return () => timers.forEach(clearTimeout);
  }, [billingReturn, reread]);

  const makePendingMap = useCallback(
    async (body) => {
      setPending({ body, status: 'making' });
      for (let attempt = 0; attempt < PENDING_MAP_TRIES; attempt += 1) {
        try {
          const { map } = await createMap(body);
          forgetPendingMap();
          forgetMapLists();
          if (alive.current) setPending({ body, status: 'made', map });
          reread().catch(() => {});
          return;
        } catch (err) {
          if (err.response?.status !== 402) {
            if (alive.current) setPending({ body, status: 'failed', error: err.friendlyMessage || 'The map could not be made.' });
            return;
          }
          if (attempt < PENDING_MAP_TRIES - 1) await wait(PENDING_MAP_GAP_MS);
        }
      }
      if (alive.current) setPending({ body, status: 'waiting' });
    },
    [reread],
  );

  // The new map that was waiting for this payment
  useEffect(() => {
    if (!userId || !billingReturn) return;
    const body = readPendingMap(userId);
    if (!body) return;
    if (billingReturn === 'success') makePendingMap(body);
    else {
      forgetPendingMap();
      setPending({ body, status: 'cancelled' });
    }
  }, [billingReturn, userId, makePendingMap]);

  // Name the maps that aren't paid for
  const lockedKey = billing?.lockedMapIds?.join(',') || '';
  useEffect(() => {
    if (!lockedKey || !userId) {
      setLockedNames([]);
      return;
    }
    const ids = lockedKey.split(',');
    myMaps
      .load(userId)
      .then((list) => alive.current && setLockedNames(list.filter((m) => ids.includes(m.id)).map((m) => m.name)))
      .catch(() => {});
  }, [lockedKey, userId]);

  // A billing write: off to Stripe when it answers with a URL, else the new state
  const act = async (request, doneText) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    let leaving = false;
    try {
      const answer = await request();
      if (answer?.url) {
        leaving = true;
        goToUrl(answer.url);
        return;
      }
      const next = billingFrom(answer);
      if (next) setBilling(next);
      else await reread();
      forgetMapLists();
      if (doneText) setNotice(typeof doneText === 'function' ? doneText(next) : doneText);
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t work. Please try again.');
    } finally {
      if (!leaving) setBusy(false);
    }
  };

  const subscribed = hasSubscription(billing);

  const choosePlan = (planId) =>
    act(
      () => (subscribed ? changePlan({ plan: planId, interval }) : startCheckout({ plan: planId, interval })),
      `Done: you’re on ${planOf(planId).name}, paid ${INTERVAL_NAMES[interval]}.`,
    );

  const addExtraMap = () =>
    act(
      () => setExtraMaps({ quantity: billing.extraMapsPaid + 1, interval: subscribed ? undefined : interval }),
      (next) => `Done: you pay for ${plural(next?.extraMapsPaid ?? billing.extraMapsPaid + 1, 'extra map')}.`,
    );

  const removeUnusedExtraMap = () =>
    act(
      () => setExtraMaps({ quantity: billing.extraMapsPaid - 1 }),
      (next) => `Done: you pay for ${plural(next?.extraMapsPaid ?? billing.extraMapsPaid - 1, 'extra map')}.`,
    );

  const manageBilling = () => act(() => openBillingPortal());

  return (
    <div className='grid gap-4'>
      {billingReturn === 'success' ? (
        <InlineAlert tone='good'>
          Thank you: your payment went through. Your plan shows here as soon as Stripe confirms it, usually within a few
          seconds.
        </InlineAlert>
      ) : null}
      {billingReturn === 'cancelled' ? <InlineAlert tone='info'>Checkout was cancelled, so nothing was charged.</InlineAlert> : null}

      {pending?.status === 'making' ? (
        <p role='status' className='text-sm'>
          Making your new map “{pending.body.name}”…
        </p>
      ) : null}
      {pending?.status === 'made' ? (
        <InlineAlert tone='good'>
          Your new map “{pending.map.name}” is ready.{' '}
          <AppLink to={mapPath(pending.map.id)} label='Open it' className='font-semibold underline' />
        </InlineAlert>
      ) : null}
      {pending?.status === 'waiting' ? (
        <div className='grid gap-2 justify-items-start'>
          <InlineAlert tone='info'>
            Stripe hasn’t confirmed the extra map yet, so “{pending.body.name}” isn’t made. Try again in a minute.
          </InlineAlert>
          <Button quiet onClick={() => makePendingMap(pending.body)}>
            Make “{pending.body.name}” now
          </Button>
        </div>
      ) : null}
      {pending?.status === 'failed' ? <InlineAlert>{pending.error}</InlineAlert> : null}
      {pending?.status === 'cancelled' ? (
        <InlineAlert tone='info'>Your new map “{pending.body.name}” wasn’t made, as nothing was paid.</InlineAlert>
      ) : null}

      <InlineAlert>{loadError || error}</InlineAlert>
      {notice ? <InlineAlert tone='good'>{notice}</InlineAlert> : null}

      {!billing && !loadError ? (
        <div className='grid place-items-center py-4' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading your plan…</span>
        </div>
      ) : null}

      {billing ? (
        <>
          <PlanSummary billing={billing} />

          <section className='grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='change-plan-heading'>
            <h3 id='change-plan-heading' className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
              Change plan
            </h3>
            {billing.paymentsEnabled ? (
              <IntervalPicker name='plan-interval' legend='Pay monthly or yearly' value={interval} onChange={setChosenInterval} disabled={busy} />
            ) : (
              <InlineAlert tone='info'>Payments aren’t set up yet.</InlineAlert>
            )}
            <PlanChoices billing={billing} interval={interval} busy={busy} onChoose={choosePlan} />
          </section>

          <ExtraMapsSummary
            billing={billing}
            lockedNames={lockedNames}
            interval={interval}
            busy={busy}
            onAdd={addExtraMap}
            onRemoveUnused={removeUnusedExtraMap}
          />

          {billing.status ? (
            <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='manage-billing-heading'>
              <h3 id='manage-billing-heading' className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
                Billing
              </h3>
              <p className='text-sm'>Your card, invoices and cancelling are on Stripe’s billing page.</p>
              <div className='grid justify-items-start'>
                <Button quiet busy={busy} disabled={!billing.paymentsEnabled} onClick={manageBilling}>
                  Manage billing
                </Button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default AccountPlanSection;
