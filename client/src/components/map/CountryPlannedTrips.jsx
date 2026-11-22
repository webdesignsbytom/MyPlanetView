import React from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaSuitcaseRolling } from 'react-icons/fa';
// Utils
import { tripPath } from '@/utils/constants/routes';
import { formatDayRange } from '@/utils/functions/dates';

// The trips planned to a place, on its ticket (22 Nov 2026, the user's wish; the map outlines
// the place: utils/trips/plannedTrips.js), soonest first: each opens its trip, its dates
// beside it. A group trip the viewer isn't on (`canOpen` false) is its title alone. Never
// through a share link (the map page passes none there).
function CountryPlannedTrips({ code, trips }) {
  if (!trips.length) return null;
  const headingId = `planned-${code}`;
  return (
    <section className='grid gap-1' aria-labelledby={headingId} data-planned-trips=''>
      <h3 id={headingId} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        {trips.length === 1 ? 'Planned trip' : 'Planned trips'}
      </h3>
      <ul className='grid gap-1 text-sm'>
        {trips.map((trip) => {
          const dates = formatDayRange(trip.startDate, trip.endDate);
          return (
            <li key={trip.id} className='grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-2'>
              <FaSuitcaseRolling aria-hidden='true' className='translate-y-0.5 text-colour9' />
              <span>
                {trip.canOpen === false ? (
                  <span className='font-medium'>{trip.title}</span>
                ) : (
                  <Link to={tripPath(trip.id)} className='font-medium underline underline-offset-2'>
                    {trip.title}
                  </Link>
                )}
                {dates ? `, ${dates}` : ''}
                {trip.status === 'ACTIVE' ? ' (under way)' : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CountryPlannedTrips;
