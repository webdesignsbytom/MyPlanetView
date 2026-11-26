import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Api
import { getAdminOverview } from '@/api/adminApi';
// Constants
import { ADMIN_FEEDBACK_PAGE_URL, ADMIN_GIFTS_PAGE_URL } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { jobState, storageWords, whenWords } from '@/utils/admin/adminWords';

const count = (n) => (Number(n) || 0).toLocaleString('en-GB');

const TONES = { good: 'tone-good', warning: 'tone-warn', critical: 'tone-danger' };

/** One figure with its label, and a line under it */
function Tile({ label, value, children }) {
  return (
    <div className='paper-aged grid content-start gap-1 border-2 border-poster-brown p-4 text-poster-ink' data-overview-tile={label}>
      <dt className='font-travel text-sm uppercase tracking-wide text-poster-brown'>{label}</dt>
      <dd className='font-travel text-3xl leading-none text-poster-red-deep'>{value}</dd>
      {children ? <dd className='text-sm'>{children}</dd> : null}
    </div>
  );
}

/** A daily job's last run: when, how it went, and what went wrong */
function JobRow({ job }) {
  const state = jobState(job);
  return (
    <li className='grid gap-2 border-2 border-poster-brown bg-paper-cream p-4' data-overview-job={job.job}>
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
        <p className='font-semibold'>
          {job.name} <span className='font-normal'>({job.time} each day)</span>
        </p>
        <p className={`justify-self-start rounded-sm border px-2 py-0.5 text-sm font-semibold ${TONES[state.tone]}`} data-job-state={state.tone}>
          {state.label}
        </p>
      </div>
      <p className='text-sm'>{job.lastRunAt ? `Last run: ${whenWords(job.lastRunAt)}` : 'No run recorded yet.'}</p>
      {[...(job.problems || []), ...(job.warnings || [])].length ? (
        <ul className='grid list-disc gap-1 pl-5 text-sm'>
          {[...(job.problems || []), ...(job.warnings || [])].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * The admin dashboard's overview (docs/API.md "Admin"; the audit, 26 Nov 2026): accounts, maps,
 * photos and storage, members, gifts and referral rewards, new feedback, and each daily job's
 * last run, flagged when it had a problem or is late (the admins are emailed when one fails).
 */
function AdminOverviewSection() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setOverview(null);
    try {
      setOverview((await getAdminOverview()).overview || null);
    } catch (err) {
      setError(err.friendlyMessage || 'The overview couldn’t be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const o = overview;
  return (
    <PaperCard
      title='Overview'
      titleId='admin-overview-heading'
      action={
        <Button small quiet onClick={load} ariaLabel='Reload the overview'>
          Reload
        </Button>
      }
    >
      {error ? (
        <p className='text-center text-status-critical' role='alert'>
          {error}
        </p>
      ) : !o ? (
        <div className='grid place-items-center py-4' aria-busy='true'>
          <LoadingSpinner lg />
        </div>
      ) : (
        <div className='grid gap-6'>
          {/* The yearly chores due (the magnetic poles' pins: the server's utils/reminders.js;
              26 Nov 2026, the user's wish), first, until they're done */}
          {o.reminders?.length ? (
            <section aria-labelledby='admin-reminders-heading' className='grid gap-3'>
              <h3 id='admin-reminders-heading' className='font-travel text-xl uppercase tracking-wide text-poster-red-deep'>
                To do
              </h3>
              <ul className='grid gap-3'>
                {o.reminders.map((reminder) => (
                  <li key={reminder.key} className='grid gap-1 border-2 border-status-warning p-4 tone-warn' data-overview-reminder={reminder.key}>
                    <p className='font-semibold text-colour4'>{reminder.title}</p>
                    <p className='text-sm text-colour4'>{reminder.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <dl className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Tile label='Accounts' value={count(o.accounts.total)}>
              {count(o.accounts.verified)} verified · {count(o.accounts.deactivated)} deactivated
              <br />
              New: {count(o.accounts.new.day)} today, {count(o.accounts.new.week)} this week, {count(o.accounts.new.month)} in 30 days
            </Tile>
            <Tile label='Maps' value={count(o.maps)}>
              {count(o.trips)} trips
            </Tile>
            <Tile label='Photos' value={count(o.photos.photos)}>
              {count(o.photos.videos)} videos · {storageWords(o.storageBytes)} stored
            </Tile>
            <Tile label='Paying members' value={count(o.members.paying.REGULAR + o.members.paying.PREMIUM)}>
              Business {count(o.members.paying.REGULAR)} · First Class {count(o.members.paying.PREMIUM)}
              <br />
              {count(o.members.trialing)} on a free month · {count(o.members.pastDue)} behind with a payment
            </Tile>
            <Tile label='Given a plan' value={count(o.members.complimentary.REGULAR + o.members.complimentary.PREMIUM)}>
              Business {count(o.members.complimentary.REGULAR)} · First Class {count(o.members.complimentary.PREMIUM)} · {count(o.members.forLife)} for life
            </Tile>
            <Tile label='Gifts' value={count(o.gifts.paid)}>
              {count(o.gifts.redeemed)} redeemed · {count(o.gifts.waiting)} waiting · {count(o.gifts.refunded)} refunded
              <br />
              <Link to={ADMIN_GIFTS_PAGE_URL} className='underline'>
                Look up a gift code
              </Link>
            </Tile>
            <Tile label='Referral rewards' value={count(o.referrals.CREDIT + o.referrals.GRANT + o.referrals.CAPPED)}>
              {count(o.referrals.CREDIT)} credit · {count(o.referrals.GRANT)} free months · {count(o.referrals.CAPPED)} over the cap
            </Tile>
            <Tile label='New feedback' value={count(o.feedbackNew)}>
              <Link to={ADMIN_FEEDBACK_PAGE_URL} className='underline'>
                Read the feedback
              </Link>
            </Tile>
          </dl>

          <section aria-labelledby='admin-jobs-heading' className='grid gap-3'>
            <h3 id='admin-jobs-heading' className='font-travel text-xl uppercase tracking-wide text-poster-red-deep'>
              Daily jobs
            </h3>
            <ul className='grid gap-3 lg:grid-cols-2'>
              {o.jobs.map((job) => (
                <JobRow key={job.job} job={job} />
              ))}
            </ul>
          </section>
        </div>
      )}
    </PaperCard>
  );
}

export default AdminOverviewSection;
