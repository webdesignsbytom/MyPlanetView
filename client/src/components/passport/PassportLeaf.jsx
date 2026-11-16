import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';

/**
 * One inside page of the passport: cream paper (it follows light and dark mode) with a
 * faint printed pattern, the running head along the top, the page's content (scrolling
 * inside the book on wide screens, where the book has a fixed height) and its number at
 * the foot. `labelledBy` is the id of the page's own h2.
 */
function PassportLeaf({ pageNumber, labelledBy, children }) {
  return (
    <section
      aria-labelledby={labelledBy}
      className='grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-paper-cream bg-[repeating-radial-gradient(circle_at_50%_45%,transparent_0_14px,color-mix(in_oklab,var(--colour9)_7%,transparent)_14px_15px)] text-colour4'
    >
      <p aria-hidden='true' className='border-b border-dashed border-colour9/50 px-5 py-2 text-center font-travel text-xs uppercase tracking-2xl text-colour9'>
        {CompanyName} · Passport
      </p>
      <div className='grid min-h-0 content-start overflow-y-auto px-5 py-5 sm:px-8'>{children}</div>
      <p className='px-5 py-2 text-center font-travel text-sm text-colour9'>
        <span className='sr-only'>Page </span>
        {pageNumber}
      </p>
    </section>
  );
}

export default PassportLeaf;
