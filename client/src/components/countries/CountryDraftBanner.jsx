import React from 'react';
// Icons
import { FiAlertTriangle } from 'react-icons/fi';

// Development only, at the top of a draft country page: a production build never has
// drafts, so this banner can't reach the live site
function CountryDraftBanner({ code }) {
  return (
    // The tint goes on paper, not straight on the red frame
    <div role='note' className='ticket-edge grid rounded-lg bg-paper-cream'>
      <div className='tone-warn grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border-2 px-5 py-4'>
        <FiAlertTriangle aria-hidden='true' className='translate-y-1 text-xl' />
        <div className='grid gap-1'>
          <p className='font-travel text-xl uppercase tracking-wide'>Draft, not published</p>
          <p className='text-sm leading-relaxed text-colour4'>
            Only the development server shows this page. It goes live, in the sitemap and the footer, once{' '}
            <code className='font-semibold'>src/content/countries/{code.toLowerCase()}.json</code> says{' '}
            <code className='font-semibold'>&quot;status&quot;: &quot;checked&quot;</code> with the date in{' '}
            <code className='font-semibold'>lastChecked</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CountryDraftBanner;
