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
        <img src={trip.coverThumbUrl} alt='' loading='lazy' className='h-16 w-16 rounded-md object-cover' />
      ) : (
        <span aria-hidden='true' className='grid h-16 w-16 place-items-center rounded-md bg-map-panel-alt text-2xl text-map-alt-ink'>
          🧭
        </span>
      )}
      <span className='grid content-center gap-0.5'>
        <span className='font-semibold'>{trip.title}</span>
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
        <div className='grid grid-cols-reg gap-3 rounded-lg border-2 border-map-edge/20 p-2'>{body}</div>
      ) : (
        <Link
          to={tripPath(trip.id)}
          className='grid grid-cols-reg gap-3 rounded-lg border-2 border-map-edge/20 p-2 hover:border-map-edge'
        >
          {body}
        </Link>
      )}
    </li>
  );
}

export default TripCard;
