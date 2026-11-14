import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Components
import TicketStub from './TicketStub';

/**
 * The sign-in pages' card, styled as a My Planet View boarding pass: an aged parchment
 * header (kicker, the page's h1 in the travel face, a From → To route), the form on
 * cream paper (it follows light and dark mode), and a perforated stub with a stamp.
 * The edge is the shared `ticket-edge` (thin brown border, dashed printed line inside).
 * `widthClassName` caps its width (the sign-in pages' default); pass '' to fill.
 */
function TravelTicket({
  kicker,
  title,
  headingId,
  subtitle,
  subtitleId,
  route,
  stub,
  stamp,
  widthClassName = 'lg:max-w-2xl',
  children,
}) {
  return (
    <article className={`ticket-edge grid w-full overflow-hidden ${widthClassName} rounded-lg bg-paper-cream text-poster-ink sm:grid-cols-[minmax(0,1fr)_9rem]`}>
      <div className='grid min-w-0'>
        <header className='paper-aged grid gap-2 border-b-2 border-dashed border-poster-brown px-7 pb-5 pt-6'>
          <p className='grid font-travel text-sm uppercase tracking-xl text-poster-brown'>
            {CompanyName} · {kicker}
          </p>
          <h1 id={headingId} className='-rotate-1 font-travel text-4xl uppercase leading-none text-poster-red text-stroke-poster sm:text-5xl'>
            {title}
          </h1>
          {subtitle ? (
            <p id={subtitleId} className='text-sm leading-relaxed'>
              {subtitle}
            </p>
          ) : null}
          {route ? (
            <dl className='grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1 font-travel text-sm uppercase sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]'>
              <dt className='text-poster-brown'>From</dt>
              <dd>{route.from}</dd>
              <dt className='text-poster-brown'>To</dt>
              <dd>{route.to}</dd>
            </dl>
          ) : null}
        </header>
        <div className='grid bg-paper-cream px-7 pb-7 pt-6 text-colour4'>{children}</div>
      </div>
      <TicketStub lines={stub} {...(stamp ? { stamp } : {})} />
    </article>
  );
}

export default TravelTicket;
