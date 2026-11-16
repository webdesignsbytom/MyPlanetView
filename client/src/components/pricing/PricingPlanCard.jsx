import React from 'react';
// Icons
import { FiCheck } from 'react-icons/fi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Constants
import { ACCOUNT_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { formatPence, planOf } from '@/utils/constants/plans';
// Components
import AppLink from '@/components/common/AppLink';

// One plan as a boarding pass: the class on a parchment strip, its fare monthly and
// yearly, what it adds, and a way aboard (sign up; once signed in, the plan on the
// account page). The first render is signed out, as the pre-rendered page is.
function PricingPlanCard({ ticket }) {
  const { user } = useAuth();
  const plan = planOf(ticket.id);
  const free = plan.price.MONTH === 0;
  const headingId = `plan-${plan.id.toLowerCase()}-heading`;

  return (
    <article
      aria-labelledby={headingId}
      className='ticket-edge grid min-w-0 grid-rows-[auto_1fr] overflow-hidden rounded-lg bg-paper-cream text-colour4'
    >
      <header className='paper-aged grid gap-1 border-b-2 border-dashed border-poster-brown px-6 pb-4 pt-5 text-poster-ink'>
        <p className='font-travel text-xs uppercase tracking-xl text-poster-brown'>{ticket.tagline}</p>
        <h3 id={headingId} className='font-travel text-3xl uppercase leading-tight tracking-wide text-poster-red-deep'>
          {plan.name}
        </h3>
      </header>

      <div className='grid content-between gap-6 px-6 py-6'>
        <div className='grid content-start gap-5'>
          <p className='grid gap-1'>
            {free ? (
              <span className='font-travel text-4xl uppercase leading-none text-colour6'>Free</span>
            ) : (
              <span className='grid grid-row items-baseline gap-2'>
                <span className='font-travel text-4xl leading-none text-colour6'>{formatPence(plan.price.MONTH)}</span>
                <span className='text-sm'>a month</span>
              </span>
            )}
            <span className='text-sm opacity-80'>
              {free ? 'No card needed, for as long as you like' : `or ${formatPence(plan.price.YEAR)} a year: two months free`}
            </span>
          </p>

          <ul className='grid gap-2'>
            {ticket.features.map((feature) => (
              <li key={feature.text} className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm leading-relaxed'>
                <FiCheck aria-hidden='true' className='translate-y-1 text-status-good' />
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <AppLink
          to={user ? ACCOUNT_PAGE_URL : SIGN_UP_PAGE_URL}
          label={user ? (free ? 'Your plan' : `Choose ${plan.name}`) : free ? 'Start your map' : `Start with ${plan.name}`}
          className={`${free ? 'btn-paper' : 'btn-poster'} justify-self-stretch text-center`}
        />
      </div>
    </article>
  );
}

export default PricingPlanCard;
