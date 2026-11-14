import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Components
import RubberStamp from './RubberStamp';

/**
 * A page's title in the boarding pass's style: on aged parchment, the kicker
 * "My Planet View · <page>" in brown travel caps, the page's one h1 in the travel face
 * (poster red with a black outline, tilted a degree), an optional subtitle, and an
 * optional rubber stamp beside it.
 * On its own it's a whole card (ticket-edge); with `embedded` it's the header strip of
 * a PaperCard, above a dashed perforation. `headingRef` / `headingProps` reach the h1.
 */
function PageTitleCard({
  page,
  title,
  headingId,
  headingRef,
  headingProps = {},
  subtitle,
  subtitleId,
  stamp,
  embedded = false,
  children,
}) {
  return (
    <header
      className={`paper-aged grid items-center gap-x-6 gap-y-3 px-6 py-6 text-poster-ink sm:px-8 ${
        embedded ? 'border-b-2 border-dashed border-poster-brown' : 'ticket-edge rounded-lg'
      } ${stamp ? 'sm:grid-cols-[minmax(0,1fr)_auto]' : ''}`}
    >
      <div className='grid min-w-0 gap-2'>
        <p className='font-travel text-sm uppercase tracking-xl text-poster-brown'>
          {CompanyName} · {page}
        </p>
        <h1
          id={headingId}
          ref={headingRef}
          className='-rotate-1 font-travel text-4xl uppercase leading-none text-poster-red text-stroke-poster focus:outline-none sm:text-5xl'
          {...headingProps}
        >
          {title}
        </h1>
        {subtitle ? (
          <p id={subtitleId} className='max-w-3xl text-sm leading-relaxed sm:text-base'>
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
      {stamp ? <RubberStamp lines={stamp} className='hidden sm:grid' /> : null}
    </header>
  );
}

export default PageTitleCard;
