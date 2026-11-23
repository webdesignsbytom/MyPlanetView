import React, { useId, useState } from 'react';
// Utils
import { countryName } from '@/utils/map/countries';
import { dayWords, withShares } from '@/utils/map/travelStatWords';

// The countries listed before "Show all"
const FIRST_PLACES = 6;

// One list of days with a bar each, the biggest the full width (the bars are drawn only: the
// words carry the numbers)
function DayBars({ rows, labelOf, keyOf }) {
  return (
    <ul className='grid gap-1.5 text-sm'>
      {withShares(rows).map((row) => (
        <li key={keyOf(row)} className='grid gap-0.5'>
          <span className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
            <span className='truncate'>{labelOf(row)}</span>
            <span className='font-semibold'>{dayWords(row.days)}</span>
          </span>
          <span aria-hidden='true' className='grid h-1.5 overflow-hidden rounded-full bg-poster-brown/15'>
            <span className='block h-full rounded-full bg-poster-red/80' style={{ width: `${row.share}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Time away in more detail (docs/API.md "Stats"; 23 Nov 2026, the user's wish): the days away
 * each year, and the days spent in each country (the first six, then "Show all"), counted by
 * the server from the completed trips (`daysByYear`, `daysByPlace`). Nothing when no trip has
 * dates.
 */
function StatsTimeAway({ daysByYear = [], daysByPlace = [] }) {
  const yearsId = useId();
  const placesId = useId();
  const [allPlaces, setAllPlaces] = useState(false);
  const places = allPlaces ? daysByPlace : daysByPlace.slice(0, FIRST_PLACES);
  const headingClass = 'font-travel text-lg uppercase leading-tight tracking-wide text-colour9';

  return (
    <>
      {daysByYear.length ? (
        <section className='grid gap-2' aria-labelledby={yearsId} data-days-by-year>
          <h3 id={yearsId} className={headingClass}>
            Days away each year
          </h3>
          <DayBars rows={daysByYear} labelOf={(row) => String(row.year)} keyOf={(row) => row.year} />
        </section>
      ) : null}
      {daysByPlace.length ? (
        <section className='grid gap-2' aria-labelledby={placesId} data-days-by-place>
          <h3 id={placesId} className={headingClass}>
            Days in each country
          </h3>
          <DayBars rows={places} labelOf={(row) => countryName(row.countryCode)} keyOf={(row) => row.countryCode} />
          {daysByPlace.length > FIRST_PLACES ? (
            <button
              type='button'
              aria-expanded={allPlaces}
              onClick={() => setAllPlaces((now) => !now)}
              className='justify-self-start text-sm font-semibold text-colour6 underline underline-offset-2'
            >
              {allPlaces ? 'Show fewer' : `Show all ${daysByPlace.length}`}
            </button>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

export default StatsTimeAway;
