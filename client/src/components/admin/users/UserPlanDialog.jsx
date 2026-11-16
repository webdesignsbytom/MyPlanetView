import React, { useCallback, useEffect, useState } from 'react';
// Api
import { createPlanGrant, endPlanGrant, getPlanGrants } from '@/api/plansApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { GRANT_MONTHS, PAID_PLAN_IDS, planOf } from '@/utils/constants/plans';
import { formatDay } from '@/utils/functions/dates';

const PLAN_OPTIONS = PAID_PLAN_IDS.map((id) => ({ value: id, label: planOf(id).name }));
const SOURCE_WORDS = { STRIPE: 'paid', COMPLIMENTARY: 'complimentary', FREE: 'free' };
const REASON_MAX = 200;

// Complimentary memberships for one account (docs/API.md, "Plans and billing"): the plan
// they have now, their memberships (newest first; a running one can be ended now), and a
// new one: a paid plan for whole months, with a reason (e.g. "Influencer, spring 2027").
function UserPlanDialog({ user, onClose }) {
  const [state, setState] = useState(null); // { grants, plan, source }
  const [plan, setPlan] = useState('PREMIUM');
  const [months, setMonths] = useState('12');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const name = user.name || user.email;

  const load = useCallback(async () => {
    try {
      setState(await getPlanGrants(user.id));
    } catch (err) {
      setError(err.friendlyMessage || 'Their memberships could not be loaded.');
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (request, doneText) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await request();
      await load();
      setNotice(doneText);
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t work.');
    } finally {
      setBusy(false);
    }
  };

  const give = (e) => {
    e.preventDefault();
    const count = Number(months);
    if (!Number.isInteger(count) || count < GRANT_MONTHS.min || count > GRANT_MONTHS.max) {
      setError(`Give a whole number of months from ${GRANT_MONTHS.min} to ${GRANT_MONTHS.max}.`);
      return;
    }
    run(
      () => createPlanGrant(user.id, { plan, months: count, reason: reason.trim() }),
      `${name} has complimentary ${planOf(plan).name} for ${count} month${count === 1 ? '' : 's'}.`,
    );
    setReason('');
  };

  return (
    <Modal title={`Membership: ${name}`} onClose={onClose}>
      <InlineAlert>{error}</InlineAlert>
      {notice ? <InlineAlert tone='good'>{notice}</InlineAlert> : null}

      {!state && !error ? (
        <div className='grid place-items-center py-4' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading their memberships…</span>
        </div>
      ) : null}

      {state ? (
        <>
          <p>
            Plan now: <strong>{planOf(state.plan).name}</strong> ({SOURCE_WORDS[state.source] || state.source})
          </p>
          <section className='grid gap-2' aria-labelledby='user-grants-heading'>
            <h3 id='user-grants-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              Complimentary memberships
            </h3>
            {state.grants.length ? (
              <ul className='grid gap-2'>
                {state.grants.map((grant) => (
                  <li key={grant.id} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-2 border-dashed border-poster-brown/60 px-3 py-2 text-sm'>
                    <span className='grid min-w-0'>
                      <span className='font-semibold'>
                        {planOf(grant.plan).name}, {formatDay(grant.startsAt)} – {formatDay(grant.endsAt)}
                        {grant.active ? ' (running)' : ''}
                      </span>
                      {grant.reason ? <span className='break-words opacity-80'>{grant.reason}</span> : null}
                    </span>
                    {grant.active ? (
                      <Button
                        small
                        danger
                        busy={busy}
                        ariaLabel={`End ${planOf(grant.plan).name} membership now`}
                        onClick={() => run(() => endPlanGrant(grant.id), 'Membership ended. Nothing of theirs is deleted.')}
                      >
                        End now
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm opacity-80'>None yet.</p>
            )}
          </section>

          <form className='grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-4' onSubmit={give} noValidate>
            <h3 className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Give a membership</h3>
            <div className='grid gap-3 sm:grid-cols-2'>
              <FormField id='grant-plan' label='Plan'>
                <PlainOptionSelect value={plan} onChange={(e) => setPlan(e.target.value)} options={PLAN_OPTIONS} />
              </FormField>
              <FormField id='grant-months' label={`Months (${GRANT_MONTHS.min} to ${GRANT_MONTHS.max})`}>
                <TextInput
                  type='number'
                  inputMode='numeric'
                  min={GRANT_MONTHS.min}
                  max={GRANT_MONTHS.max}
                  step={1}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
              </FormField>
            </div>
            <FormField id='grant-reason' label='Reason (only admins see it)' hint='For example: influencer, spring 2027.'>
              <TextInput value={reason} maxLength={REASON_MAX} onChange={(e) => setReason(e.target.value)} />
            </FormField>
            <div className='grid justify-end'>
              <Button type='submit' busy={busy}>
                Give membership
              </Button>
            </div>
          </form>
        </>
      ) : null}
    </Modal>
  );
}

export default UserPlanDialog;
