// "Welcome home" emails (docs/API.md "Emails"; 23 Nov 2026, the user's wish: "a day after the
// trip is over we can remind them to share their trip/map on social medias and share their map
// link to friends, so we get some free promo"). Pure, so tested on its own
// (tests/tripShare.test.js). The client's tag on the map has its own copy of the day sums
// (client/src/utils/trips/tripHome.js).
import { inCountry } from './onThisDay.js';

const DAY_MS = 24 * 60 * 60 * 1000;
// A trip that ended up to a week ago: the day after, as a rule, but a missed run or a trip
// logged on the way home still gets its email
export const TRIP_SHARE_WINDOW_DAYS = 7;
// One run's emails, and how long it may take: it runs before "On this day" in the same daily
// call, which Vercel stops at 60 s
export const TRIP_SHARE_MAX_EMAILS = 300;
export const TRIP_SHARE_BUDGET_MS = 12_000;

const startOfDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/**
 * The trips a run looks for, by their end date (a UTC day): `{ from, to }`, both included:
 * yesterday back to TRIP_SHARE_WINDOW_DAYS ago. A trip ending today isn't over yet.
 */
export function tripShareWindow(now = new Date()) {
  const today = startOfDay(now);
  return { from: new Date(today.getTime() - TRIP_SHARE_WINDOW_DAYS * DAY_MS), to: new Date(today.getTime() - DAY_MS) };
}

/** Whether a trip ending on `endDate` hasn't ended yet (today or later), so its email is still to come. */
export const tripNotOverYet = (endDate, now = new Date()) => Boolean(endDate) && new Date(endDate).getTime() >= startOfDay(now).getTime();

/** Days from the first to the last, both counted (a weekend away is 2), or null without both. */
export function tripDays(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const days = Math.round((new Date(endDate) - new Date(startDate)) / DAY_MS) + 1;
  return days >= 1 ? days : null;
}

/**
 * The trip an account's email is about, from its trips that ended in the window: the one that
 * ended last (then by title and id, so a re-run picks the same). -> one, or null
 */
export function pickTripToShare(candidates) {
  if (!candidates?.length) return null;
  return [...candidates].sort(
    (a, b) =>
      new Date(b.endDate) - new Date(a.endDate) || String(a.title).localeCompare(String(b.title)) || String(a.tripId).localeCompare(String(b.tripId))
  )[0];
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The email's words: `{ subject, headline, caption }`: "Welcome home from Japan in spring",
 * "Welcome home from Japan in spring!" and "3 countries in 12 days", "12 days in Japan" or
 * "12 days away" (nothing without its days).
 */
export function tripShareWords({ title, days = null, places = 0, countryName = null }) {
  let caption = '';
  if (days && places > 1) caption = `${plural(places, 'country', 'countries')} in ${plural(days, 'day', 'days')}`;
  else if (days && countryName) caption = `${plural(days, 'day', 'days')} ${inCountry(countryName)}`;
  else if (days) caption = `${plural(days, 'day', 'days')} away`;
  return { subject: `Welcome home from ${title}`, headline: `Welcome home from ${title}!`, caption };
}
