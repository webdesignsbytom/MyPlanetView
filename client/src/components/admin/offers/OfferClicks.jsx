import React from 'react';
// Components
import OfferClickBars from './OfferClickBars';
// Utils
import { clicksByPlacement, clicksWord, shortDay } from '@/utils/offers/offerAdmin';

const count = (n) => Number(n || 0).toLocaleString('en-GB');

// An offer's clicks over the last 30 days (`since` is the first day counted, UTC): the
// total, each place it shows, a bar per day, and the days with clicks as a list.
function OfferClicks({ offer, since }) {
  const clicks = offer.clicks || { total: 0, byPlacement: {}, byDay: [] };
  const days = (clicks.byDay || []).filter((d) => d.count > 0);

  return (
    <div className='grid gap-2 border-t-2 border-dashed border-poster-brown/40 pt-3'>
      <div className='grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4'>
        <p className='grid gap-0.5'>
          <span className='text-xs uppercase tracking-wide text-colour9'>Clicks, 30 days</span>
          <span className='font-travel text-3xl leading-none'>{count(clicks.total)}</span>
        </p>
        {clicks.total && since ? (
          <OfferClickBars byDay={clicks.byDay} since={since} />
        ) : (
          <p className='text-xs opacity-80'>No clicks in the last 30 days.</p>
        )}
      </div>

      <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4'>
        {clicksByPlacement(offer).map(({ placement, label, count: n }) => (
          <div key={placement} className='grid content-start'>
            <dt className='text-colour9'>{label}</dt>
            <dd className='font-semibold'>{count(n)}</dd>
          </div>
        ))}
      </dl>

      {days.length ? (
        <details className='text-xs'>
          <summary className='cursor-pointer font-semibold text-colour9'>Clicks by day</summary>
          <ul className='grid gap-0.5 pt-1 sm:grid-cols-2'>
            {days.map(({ day, count: n }) => (
              <li key={day}>
                {shortDay(day)}: {clicksWord(n)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export default OfferClicks;
