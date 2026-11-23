import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// Components
import LuggageTag from '@/components/map/LuggageTag';
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { todayString } from '@/utils/offers/offerContext';
import { HOME_CLOSED_KEY, justBackTrip, parseClosed, withClosed } from '@/utils/trips/tripHome';

const readClosed = () => {
  try {
    return parseClosed(localStorage.getItem(HOME_CLOSED_KEY));
  } catch {
    return [];
  }
};

const ACTION = 'text-xs font-semibold text-poster-red-deep underline underline-offset-2';

/**
 * "Welcome home" (23 Nov 2026, the user's wish: remind people to share a trip the day after it
 * ends, for word of mouth): on a map someone edits (not a share link), the trip that ended last,
 * from the day after it ended for two weeks (utils/trips/tripHome.js), as a luggage tag: a
 * picture of the trip to share (`onSharePicture(trip)`, the share card) and, for someone who can
 * open the sharing dialog, the map's link (`onShareLink`, else null). The "Welcome home" email's
 * button opens the map with `?home=<tripId>`, which shows that trip's tag even if it was closed.
 * Closed, a trip's tag stays away for good (localStorage). `trips` is the map's list.
 */
function TripHomeTag({ trips, onSharePicture, onShareLink = null }) {
  // Today in the viewer's own calendar (the map page is never pre-rendered)
  const [today] = useState(() => todayString());
  const [params] = useSearchParams();
  const [closed, setClosed] = useState(readClosed);
  // The email's link shows its trip until the tag is closed here
  const [linkClosed, setLinkClosed] = useState(false);
  const forcedId = linkClosed ? null : params.get('home');
  const trip = useMemo(() => justBackTrip(trips, today, { closed, forcedId }), [trips, today, closed, forcedId]);

  if (!trip) return null;
  const close = () => {
    const next = withClosed(closed, trip.id);
    try {
      localStorage.setItem(HOME_CLOSED_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: it closes for now
    }
    setClosed(next);
    setLinkClosed(true);
  };
  return (
    <LuggageTag as='section' aria-label='Welcome home' className='max-w-[min(24rem,calc(100vw-1.5rem))] text-sm' data-trip-home={trip.id}>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <span className='grid gap-1.5'>
          <span className='font-semibold'>Welcome home from {trip.title}!</span>
          <span className='text-xs'>
            {onShareLink
              ? 'Share it with your friends while it’s fresh: a picture for Instagram, WhatsApp or anywhere, or your map’s link.'
              : 'Share it with your friends while it’s fresh: a picture for Instagram, WhatsApp or anywhere.'}
          </span>
        </span>
        <CloseStamp small onClick={close} label='Close: welcome home' />
        <span className='col-span-2 grid grid-cols-2 items-center gap-3' data-trip-home-actions>
          <button type='button' onClick={() => onSharePicture(trip)} className={`${ACTION} justify-self-start`}>
            Share a picture
          </button>
          {onShareLink ? (
            <button type='button' onClick={onShareLink} className={`${ACTION} justify-self-end`}>
              Send my map’s link
            </button>
          ) : null}
        </span>
      </span>
    </LuggageTag>
  );
}

export default TripHomeTag;
