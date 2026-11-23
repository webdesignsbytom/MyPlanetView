import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
// Components
import LuggageTag from '@/components/map/LuggageTag';
import CloseStamp from '@/components/common/CloseStamp';
import TravelDesk from '@/components/offers/TravelDesk';
// Hooks
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
import useCountryGuides from '@/hooks/useCountryGuides';
// Constants
import { tripPath } from '@/utils/constants/routes';
// Utils
import { nextPlannedTrip, placeCountries, todayString } from '@/utils/offers/offerContext';
import { COUNTDOWN_DAYS, countdownWords, daysUntil, whenWords } from '@/utils/trips/tripCountdown';

const CLOSED_KEY = 'mpv:tripCountdownClosed';
const readClosed = () => {
  try {
    return sessionStorage.getItem(CLOSED_KEY);
  } catch {
    return null;
  }
};

/**
 * The countdown to the map's next trip (22 Nov 2026, the user's wish): on a map someone is on
 * (not a share link), the soonest planned trip with a start date up to a year ahead, as a
 * luggage tag: "12 days until Japan in spring", whether that month suits its first country
 * with a guide, the trip itself and the Travel Desk for it. Closed, it stays away for the day
 * (sessionStorage keeps the trip and the day). `trips` is the map's list.
 */
function TripCountdownTag({ trips }) {
  // Today in the viewer's own calendar (the map page is never pre-rendered)
  const [today] = useState(() => todayString());
  const [closed, setClosed] = useState(readClosed);
  const trip = useMemo(() => nextPlannedTrip(trips, today), [trips, today]);
  const days = trip ? daysUntil(trip.startDate, today) : null;
  const shown = Boolean(trip) && days <= COUNTDOWN_DAYS && closed !== `${trip.id}:${today}`;
  const place = usePlannedTripPlace(trip, { enabled: shown });
  const countries = useMemo(() => placeCountries(place), [place]);
  const [guide] = useCountryGuides(countries, { enabled: shown && countries.length > 0 });

  if (!shown) return null;
  const when = whenWords(guide, trip.startDate);
  const canOpen = trip.canOpen !== false;
  const hasDesk = countries.length > 0;
  const close = () => {
    const key = `${trip.id}:${today}`;
    try {
      sessionStorage.setItem(CLOSED_KEY, key);
    } catch {
      // Storage blocked: it closes for now
    }
    setClosed(key);
  };
  return (
    <LuggageTag as='section' aria-label='Your next trip' className='max-w-[min(24rem,calc(100vw-1.5rem))] text-sm' data-trip-countdown>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <span className='grid gap-1.5'>
          <span className='font-semibold'>{countdownWords(trip.title, days)}</span>
          {when ? <span className='text-xs'>{when}</span> : null}
        </span>
        <CloseStamp small onClick={close} label='Close: your next trip' />
        {/* Two columns under the words, across the whole tag: the trip's link on the left, the
            Travel Desk in the bottom right corner (23 Nov 2026, the user's wish) */}
        {canOpen || hasDesk ? (
          <span className='col-span-2 grid grid-cols-2 items-center gap-3' data-trip-countdown-actions>
            {canOpen ? (
              <Link to={tripPath(trip.id)} className='justify-self-start text-xs font-semibold text-poster-red-deep underline underline-offset-2'>
                Open the trip
              </Link>
            ) : null}
            {hasDesk ? (
              <span className='col-start-2 justify-self-end' data-trip-countdown-desk>
                <TravelDesk inMapPanel countryCodes={countries} trip={place} />
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </LuggageTag>
  );
}

export default TripCountdownTag;
