// Importing from other apps (docs/API.md "Importing from Polarsteps"; 21 Nov 2026, the user's
// wish, from the business review: "Already on Polarsteps? Bring your trips."). The browser
// reads the person's own Polarsteps download and sends only what's imported: the trips (here)
// and each photo and step story through the usual upload and moment routes, every one with
// an `importedFrom` key that's unique per map, so running it again adds nothing twice. Pure,
// so tested on its own (tests/imports.test.js).
import { sanitizeText } from './sanitize.js';
import { TITLE_MAX, TRIP_STATUSES, parseDateOnly } from './travelValidation.js';

// "polarsteps:trip:12345", "polarsteps:photo:98177523/abc.jpg", "polarsteps:moment:98177523"
const KEY = /^polarsteps:(trip|photo|moment):[A-Za-z0-9._/-]{1,200}$/;
// One request's trips, and one trip's stops (a long trip of daily steps is a few hundred)
export const IMPORT_MAX_TRIPS = 100;
export const IMPORT_MAX_STOPS = 1000;

/**
 * An import key from a request, for `kind` ('trip', 'photo' or 'moment'):
 * `{ ok: true, value }` (undefined when not given) or `{ ok: false }`.
 */
export function parseImportKey(value, kind) {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== 'string' || !KEY.test(value) || !value.startsWith(`polarsteps:${kind}:`)) return { ok: false };
  return { ok: true, value };
}

const coordinate = (value, max) => (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= max ? value : null);

/** Two dates in order (a later "from" than "to" keeps the first and drops the second). */
const ordered = (from, to) => (from && to && to < from ? [from, null] : [from, to]);

/**
 * The trips of a `POST /maps/:mapId/imports/polarsteps`: `{ trips: [...] }`, each `{ key,
 * title, status, startDate, endDate, stops: [{ countryCode, placeName, arriveOn, leaveOn,
 * latitude, longitude }] }`. -> `{ trips }` (cleaned, dates as Dates, country codes upper
 * case for the caller to check) or `{ error }` (a responses.js message key).
 */
export function parseImportedTrips(body) {
  const list = body && typeof body === 'object' && Array.isArray(body.trips) ? body.trips : null;
  if (!list || !list.length || list.length > IMPORT_MAX_TRIPS) return { error: 'invalidImport' };
  const trips = [];
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') return { error: 'invalidImport' };
    const key = parseImportKey(raw.key, 'trip');
    if (!key.ok || !key.value) return { error: 'invalidImport' };
    const title = sanitizeText(raw.title, { maxLength: TITLE_MAX }) || 'A trip';
    if (!TRIP_STATUSES.includes(raw.status)) return { error: 'invalidImport' };
    const start = parseDateOnly(raw.startDate ?? null);
    const end = parseDateOnly(raw.endDate ?? null);
    if (!start.ok || !end.ok) return { error: 'invalidImport' };
    const [startDate, endDate] = ordered(start.value, end.value);
    const rawStops = Array.isArray(raw.stops) ? raw.stops : [];
    if (rawStops.length > IMPORT_MAX_STOPS) return { error: 'invalidImport' };
    const stops = [];
    for (const stop of rawStops) {
      if (!stop || typeof stop !== 'object' || typeof stop.countryCode !== 'string' || !/^[A-Za-z]{2}$/.test(stop.countryCode)) {
        return { error: 'invalidImport' };
      }
      const arrive = parseDateOnly(stop.arriveOn ?? null);
      const leave = parseDateOnly(stop.leaveOn ?? null);
      if (!arrive.ok || !leave.ok) return { error: 'invalidImport' };
      const [arriveOn, leaveOn] = ordered(arrive.value, leave.value);
      stops.push({
        countryCode: stop.countryCode.toUpperCase(),
        placeName: sanitizeText(stop.placeName, { maxLength: TITLE_MAX }) || null,
        arriveOn,
        leaveOn,
        latitude: coordinate(stop.latitude, 90),
        longitude: coordinate(stop.longitude, 180),
      });
    }
    trips.push({ key: key.value, title, status: raw.status, startDate, endDate, stops });
  }
  return { trips };
}

/**
 * Each country's earliest date among a trip's stops (the trip's start for a stop with none),
 * for its first visit. -> Map code -> Date
 */
export function firstDatesOf(trip) {
  const dates = new Map();
  for (const stop of trip.stops) {
    const date = stop.arriveOn ?? trip.startDate;
    if (!date) continue;
    const known = dates.get(stop.countryCode);
    if (!known || date < known) dates.set(stop.countryCode, date);
  }
  return dates;
}
