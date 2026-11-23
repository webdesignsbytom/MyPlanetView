// "Welcome home" (23 Nov 2026, the user's wish: "a day after the trip is over we can remind them
// to share their trip/map on social medias and share their map link to friends, so we get some
// free promo"): the map's tag for a trip just ended, and the closed ones it remembers. The
// email of the same name is the server's (docs/API.md "Emails"). Pure.
import { daysUntil } from './tripCountdown';

// Shown from the day after the trip ends, for two weeks
export const HOME_TAG_DAYS = 14;
// The trips whose tag was closed, kept in localStorage for good (it's a one-off nudge), the
// newest few only
export const HOME_CLOSED_KEY = 'mpv:tripHomeClosed';
export const HOME_CLOSED_MAX = 50;

/** Whole days since a trip's last day ("YYYY-MM-DD"): 1 the day after. */
export const daysSinceEnd = (endDate, today) => daysUntil(today, endDate);

const ended = (trip, today) => Boolean(trip?.endDate) && trip.canOpen !== false && daysSinceEnd(trip.endDate, today) >= 1;

/**
 * The trip the tag is for, in a map's trips list: the one that ended last, from the day after
 * it ended to HOME_TAG_DAYS after, never one whose tag was closed (`closed`, ids) or one the
 * viewer can't open (a group trip they weren't on). `forcedId` (the email's ?home= link) shows
 * that trip whenever it has ended, closed or not. -> a trip, or null
 */
export function justBackTrip(trips, today, { closed = [], forcedId = null } = {}) {
  const list = trips || [];
  const forced = forcedId ? list.find((trip) => trip.id === forcedId) : null;
  if (forced && ended(forced, today)) return forced;
  const shut = new Set(closed);
  return (
    list
      .filter((trip) => ended(trip, today) && daysSinceEnd(trip.endDate, today) <= HOME_TAG_DAYS && !shut.has(trip.id))
      .sort((a, b) => (a.endDate > b.endDate ? -1 : a.endDate < b.endDate ? 1 : String(a.title).localeCompare(String(b.title))))[0] || null
  );
}

/** The closed list as stored (a JSON list of ids), or [] for anything else. */
export function parseClosed(text) {
  try {
    const list = JSON.parse(text);
    return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** The closed list with `tripId` added, newest last, at most HOME_CLOSED_MAX. */
export const withClosed = (closed, tripId) => [...closed.filter((id) => id !== tripId), tripId].slice(-HOME_CLOSED_MAX);
