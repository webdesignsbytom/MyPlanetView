import React from 'react';
// Utils
import { monthsRatedText } from '@/utils/countries/countryContent';

// A compact month strip in words, beside it: "Best: Apr–Jun, Sep–Oct · Avoid: Jul–Aug"
function MonthStripSummary({ months, className = '' }) {
  const best = monthsRatedText(months, 'best', { short: true });
  const avoid = monthsRatedText(months, 'avoid', { short: true });

  return (
    <p className={`text-sm ${className}`}>
      <span className='font-semibold'>Best:</span> {best || 'no month stands out'}
      {avoid ? (
        <>
          {' · '}
          <span className='font-semibold'>Avoid:</span> {avoid}
        </>
      ) : null}
    </p>
  );
}

export default MonthStripSummary;
