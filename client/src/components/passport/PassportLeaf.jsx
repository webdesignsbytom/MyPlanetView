import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';

/**
 * One inside page of the passport: cream paper (it follows light and dark mode) with a
 * faint printed pattern and the page block's edges round it, the running head along the
 * top, the page's content (scrolling inside the book on wide screens, where the book has a
 * fixed height) and its number at the foot. On wide screens it's an open spread: the fold
 * shades the middle, the running head is split between the two pages and the number sits
 * in the outer corner; the pages' content keeps clear of the fold (two columns, a 4rem gap).
 * `labelledBy` is the id of the page's own h2.
 */
function PassportLeaf({ pageNumber, labelledBy, children }) {
  return (
    <section
      aria-labelledby={labelledBy}
      className='passport-pages relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-paper-cream bg-[repeating-radial-gradient(circle_at_50%_45%,transparent_0_14px,color-mix(in_oklab,var(--colour9)_7%,transparent)_14px_15px)] text-colour4 md:bg-[length:50%_100%]'
    >
      <p
        aria-hidden='true'
        className='grid border-b border-dashed border-colour9/50 px-5 py-2 text-center font-travel text-xs uppercase tracking-2xl text-colour9 md:grid-cols-2'
      >
        <span>
          {CompanyName}
          <span className='md:hidden'> · Passport</span>
        </span>
        <span className='hidden md:block'>Passport</span>
      </p>
      {/* A scrollbar's room kept on both sides, so the two pages stay either side of the fold */}
      <div className='grid min-h-0 content-start overflow-y-auto px-5 py-5 sm:px-8 md:[scrollbar-gutter:stable_both-edges]'>{children}</div>
      <p className='px-5 py-2 text-center font-travel text-sm text-colour9 md:px-8 md:text-right'>
        <span className='sr-only'>Page </span>
        {pageNumber}
      </p>
      <span aria-hidden='true' className='passport-fold pointer-events-none absolute inset-y-0 left-1/2 hidden w-12 -translate-x-1/2 md:block' />
    </section>
  );
}

export default PassportLeaf;
