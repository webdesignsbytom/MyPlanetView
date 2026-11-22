import { useEffect, useMemo, useState } from 'react';
// Api
import { getTrip } from '@/api/travelApi';
// Utils
import { tripPlace } from '@/utils/offers/offerContext';

// Whole trips fetched for their stops, once per session per version of the trip (its
// dates and number of stops): a map's list doesn't say where its own trips go
const details = new Map();
const detailKey = (trip) => [trip.id, trip.startDate, trip.endDate, trip.stopCount].join('|');

function loadDetail(key, tripId) {
  if (!details.has(key)) {
    details.set(
      key,
      getTrip(tripId)
        .then(({ trip }) => trip)
        .catch((err) => {
          details.delete(key);
          throw err;
        }),
    );
  }
  return details.get(key);
}

/**
 * Where a planned trip goes, for travel offers (utils/offers/offerContext.js tripPlace):
 * `{ tripId, from, to, stops: [{ countryCode, destination }] }`, or null. `trip` is a whole
 * trip (the trip page), or a map list's summary: a group trip's carries its countries, a
 * map's own trip is fetched for its stops when `enabled` and `canFetch` (not through a
 * share link, where it can't be opened); undefined while that's on its way, so nothing is
 * chosen without it and then changed. An own trip's summary carries its countries too (the
 * planned outline), but it's still fetched: its stops name their landmarks ("Mount Fuji").
 */
export default function usePlannedTripPlace(trip, { enabled = true, canFetch = true } = {}) {
  const direct = useMemo(
    () => (trip && (Array.isArray(trip.stops) || (trip.linked && Array.isArray(trip.countryCodes))) ? tripPlace(trip) : null),
    [trip],
  );
  const key = trip && !direct && enabled && canFetch && trip.canOpen !== false ? detailKey(trip) : null;
  const tripId = trip?.id ?? null;
  const [fetched, setFetched] = useState({ key: null, place: null });

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    loadDetail(key, tripId)
      .then((full) => {
        if (!cancelled) setFetched({ key, place: tripPlace(full) });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key, place: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key, tripId]);

  if (direct) return direct.stops.length ? direct : null;
  if (!key) return null;
  if (fetched.key !== key) return undefined;
  return fetched.place?.stops.length ? fetched.place : null;
}
