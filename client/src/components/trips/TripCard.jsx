import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { tripPath } from '@/utils/constants/routes';
// Utils
import { TRIP_STATUS_LABELS } from '@/utils/trips/tripStatus';
import { formatDayRange } from '@/utils/functions/dates';
import { plural } from '@/utils/functions/plural';

// A trip in a list: cover, title, dates, status. Links to the trip unless `noLink`
// (a share-link visitor of a map can't open its trips).
function TripCard({ trip, noLink = false, subtitle }) {
  const body = (
    <>
      {trip.coverThumbUrl ? (
        <img src={trip.coverThumbUrl} alt='' loading='lazy' className='h-16 w-16 border-2 border-poster-cream object-cover shadow-paper' />
      ) : (
        <span aria-hidden='true' className='paper-aged grid h-16 w-16 place-items-center border-2 border-poster-brown text-2xl text-poster-red'>
          🧭
        </span>
      )}
      <span className='grid content-center gap-0.5'>
        <span className='font-travel text-lg uppercase leading-tight tracking-wide'>{trip.title}</span>
        {subtitle ? <span className='text-xs opacity-80'>{subtitle}</span> : null}
        <span className='text-xs opacity-80'>
          {[TRIP_STATUS_LABELS[trip.status], formatDayRange(trip.startDate, trip.endDate), plural(trip.stopCount ?? 0, 'stop'), plural(trip.photoCount ?? 0, 'photo')]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {noLink ? (
        <div className='grid grid-cols-reg gap-3 border-2 border-dashed border-poster-brown/60 p-2'>{body}</div>
      ) : (
        <Link
          to={tripPath(trip.id)}
          className='grid grid-cols-reg gap-3 border-2 border-dashed border-poster-brown/60 p-2 transition hover:border-solid hover:border-poster-brown hover:bg-poster-paper/30'
        >
          {body}
        </Link>
      )}
    </li>
  );
}

export default TripCard;
