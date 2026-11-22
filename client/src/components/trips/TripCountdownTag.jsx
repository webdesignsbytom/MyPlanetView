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
          <span className='grid grid-flow-col justify-start items-center gap-3'>
            {trip.canOpen === false ? null : (
              <Link to={tripPath(trip.id)} className='text-xs font-semibold text-poster-red-deep underline underline-offset-2'>
                Open the trip
              </Link>
            )}
            {countries.length ? <TravelDesk inMapPanel countryCodes={countries} trip={place} /> : null}
          </span>
        </span>
        <CloseStamp small onClick={close} label='Close: your next trip' />
      </span>
    </LuggageTag>
  );
}

export default TripCountdownTag;
