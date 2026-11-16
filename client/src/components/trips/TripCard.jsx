import React from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaUsers } from 'react-icons/fa';
// Constants
import { tripPath } from '@/utils/constants/routes';
// Utils
import { TRIP_STATUS_LABELS } from '@/utils/trips/tripStatus';
import { formatDayRange } from '@/utils/functions/dates';
import { plural } from '@/utils/functions/plural';
import { countryName } from '@/utils/map/countries';

const CARD = 'grid grid-cols-reg gap-3 border-2 border-dashed border-poster-brown/60 p-2';

// A small stamp saying the trip is a group trip, added from someone else's map
function GroupTripStamp() {
  return (
    <span className='grid -rotate-2 grid-cols-reg items-center justify-self-start gap-1.5 border-2 border-double border-colour7 px-1.5 font-travel text-2xs uppercase tracking-wide text-colour7'>
      <FaUsers aria-hidden='true' />
      Group trip
    </span>
  );
}

/**
 * A trip in a list: cover, title, dates, status. Links to the trip unless `noLink` (a
 * share-link visitor of a map can't open its trips). A group trip added from another map
 * (`trip.linked`) says so, and whose map it's from; one the viewer isn't on
 * (`canOpen: false`) shows only its title, dates, status and countries, and isn't a link.
 * `onRemove` adds "Take it off this map" (the map's owner, for a group trip).
 */
function TripCard({ trip, noLink = false, subtitle, onRemove, removing = false }) {
  const limited = trip.linked && trip.canOpen === false;
  const opens = !noLink && trip.canOpen !== false;
  const details = limited
    ? [TRIP_STATUS_LABELS[trip.status], formatDayRange(trip.startDate, trip.endDate), (trip.countryCodes || []).map(countryName).join(', ')]
    : [TRIP_STATUS_LABELS[trip.status], formatDayRange(trip.startDate, trip.endDate), plural(trip.stopCount ?? 0, 'stop'), plural(trip.photoCount ?? 0, 'photo')];

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
        {trip.linked ? <GroupTripStamp /> : null}
        {trip.linked ? (
          <span className='text-xs opacity-80'>From {trip.organiserMapName}</span>
        ) : subtitle ? (
          <span className='text-xs opacity-80'>{subtitle}</span>
        ) : null}
        <span className='text-xs opacity-80'>{details.filter(Boolean).join(' · ')}</span>
      </span>
    </>
  );

  return (
    <li className='grid gap-1.5'>
      {opens ? (
        <Link
          to={tripPath(trip.id)}
          className={`${CARD} transition hover:border-solid hover:border-poster-brown hover:bg-poster-paper/30`}
        >
          {body}
        </Link>
      ) : (
        <div className={CARD}>{body}</div>
      )}
      {onRemove ? (
        <button
          type='button'
          onClick={onRemove}
          disabled={removing}
          aria-busy={removing ? 'true' : undefined}
          aria-label={`Take ${trip.title} off this map`}
          className='justify-self-end text-xs font-medium underline underline-offset-2 disabled:opacity-50'
        >
          Take it off this map
        </button>
      ) : null}
    </li>
  );
}

export default TripCard;
