// A trip's moments day by day (23 Nov 2026, the user's wish: "a trip to Kenya, and inside it
// a safari day"): the trip page's Moments card puts each moment dated to a day under that
// day, "Day 3 · Friday 4 July 2025", with where the trip was that day from its stops. Pure.
import { countryName } from '@/utils/map/countries';

const DAY_MS = 86400000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "YYYY-MM-DD…" as a day number, or null
const dayNumber = (ymd) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(ymd ?? ''));
  return match ? Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS) : null;
};

/** "Friday 4 July 2025" (the day as written, whatever the viewer's time zone). */
export function dayWords(ymd) {
  const date = new Date(dayNumber(ymd) * DAY_MS);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// A stop's name: its landmark, else its place, else its country
const stopName = (stop) => stop.landmarkName || stop.placeName || countryName(stop.countryCode) || stop.countryCode;

/**
 * Each dated stop's days, as the travel stats count them (server/src/utils/travelStats.js
 * stopRanges): its own dates; with only its arrival, until the next stop's arrival, else the
 * trip's end. -> `[{ name, first, last }]` in the trip's order
 */
function stopDays(trip) {
  const stops = [...(trip.stops ?? [])].sort((a, b) => a.position - b.position);
  const tripEnd = dayNumber(trip.endDate);
  return stops.flatMap((stop, i) => {
    const first = dayNumber(stop.arriveOn) ?? dayNumber(stop.leaveOn);
    if (first === null) return [];
    const nextArrive = stops.slice(i + 1).map((s) => dayNumber(s.arriveOn)).find((d) => d !== null) ?? null;
    const last = dayNumber(stop.leaveOn) ?? nextArrive ?? tripEnd ?? first;
    return [{ name: stopName(stop), first, last: Math.max(first, last) }];
  });
}

/**
 * The trip's moments by day: `[{ key, title, where, moments }]`, the days in order, then the
 * moments not dated to a day ("Other moments": a month, a year or no date). A day inside the
 * trip is "Day N · <date>" (its start date is day 1); one outside it just its date. `where`
 * names the stops the trip was at that day ("Rome → Florence" on a day of travel), or null.
 * A trip with no start date isn't laid out by day: null.
 */
export function tripMomentDays(trip, moments) {
  const start = dayNumber(trip?.startDate);
  if (start === null) return null;
  const end = dayNumber(trip.endDate);
  const stops = stopDays(trip);
  const byDay = new Map();
  const other = [];
  for (const moment of moments) {
    const day = moment.datePrecision === 'DAY' ? dayNumber(moment.happenedOn) : null;
    if (day === null) other.push(moment);
    else byDay.set(day, [...(byDay.get(day) ?? []), moment]);
  }
  const days = [...byDay]
    .sort(([a], [b]) => a - b)
    .map(([day, list]) => {
      const ymd = new Date(day * DAY_MS).toISOString().slice(0, 10);
      const inTrip = day >= start && (end === null || day <= Math.max(start, end));
      const where = [...new Set(stops.filter((s) => s.first <= day && day <= s.last).map((s) => s.name))];
      return {
        key: ymd,
        title: inTrip ? `Day ${day - start + 1} · ${dayWords(ymd)}` : dayWords(ymd),
        where: where.length ? where.join(' → ') : null,
        moments: list,
      };
    });
  return other.length ? [...days, { key: 'other', title: 'Other moments', where: null, moments: other }] : days;
}
