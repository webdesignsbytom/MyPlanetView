import React from 'react';
// Icons
import { FiCheck, FiClock } from 'react-icons/fi';

// One line of what a plan gives: a tick, or for a feature not built yet (`soon`, in
// utils/data/pricingData.js) a clock and "Coming soon", so the page never sells it as there
function PricingFeature({ feature, className = '' }) {
  return (
    <li className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 leading-relaxed ${className}`}>
      {feature.soon ? (
        <FiClock aria-hidden='true' className='translate-y-1 text-poster-brown' />
      ) : (
        <FiCheck aria-hidden='true' className='translate-y-1 text-status-good' />
      )}
      <span>
        {feature.text}
        {feature.soon && (
          <>
            {' '}
            <span className='whitespace-nowrap rounded-sm border border-poster-brown px-1.5 font-travel text-xs uppercase tracking-wide text-poster-brown'>
              Coming soon
            </span>
          </>
        )}
      </span>
    </li>
  );
}

export default PricingFeature;
