import React from 'react';
// Icons
import { FaStar } from 'react-icons/fa6';
// Utils
import { MONTH_NAMES, MONTH_SHORT, RATING_LABELS } from '@/utils/countries/countryContent';

// Best is filled, good is a light tint, avoid a red tint; every month also says its rating
// in words (and best has a star), so nothing rests on colour alone
const TONES = {
  best: 'solid-good border-transparent',
  good: 'tone-good',
  avoid: 'tone-danger',
};

/**
 * Twelve months, each best, good or avoid, as a list a screen reader reads in full
 * ("January: Good"). Six to a row on phones, all twelve in a row from sm up.
 * `compact`: a small strip for a region or the index, hidden from assistive tech, so the
 * caller must say the same in words beside it (MonthStripSummary).
 */
function MonthStrip({ months, label, compact = false }) {
  if (compact) {
    return (
      <ol aria-hidden='true' className='grid max-w-md grid-cols-12 gap-0.5'>
        {months.map((rating, index) => (
          <li
            key={MONTH_NAMES[index]}
            className={`grid h-6 place-items-center rounded-sm border text-2xs font-semibold ${TONES[rating]} ${
              rating === 'avoid' ? 'line-through' : ''
            }`}
          >
            {MONTH_SHORT[index].charAt(0)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol aria-label={label} className='grid grid-cols-6 gap-1.5 sm:grid-cols-12'>
      {months.map((rating, index) => (
        <li
          key={MONTH_NAMES[index]}
          className={`grid min-w-0 justify-items-center gap-1 rounded-md border px-1 py-2 text-center ${TONES[rating]}`}
        >
          <span aria-hidden='true' className='font-travel text-lg uppercase leading-none tracking-wide'>
            {MONTH_SHORT[index]}
          </span>
          <span className='sr-only'>{MONTH_NAMES[index]}: </span>
          <span className='grid grid-flow-col items-center gap-1 text-2xs font-semibold uppercase tracking-wide'>
            {rating === 'best' ? <FaStar aria-hidden='true' /> : null}
            {RATING_LABELS[rating]}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default MonthStrip;
