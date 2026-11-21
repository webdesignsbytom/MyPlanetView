// The richer travel stats (docs/API.md "Stats"; 21 Nov 2026, the user's wish): how much of
// the world, the days away, the distance travelled and the place furthest from home. Pure,
// so tested on its own (tests/travelStats.test.js); the mock has a copy
// (client/src/dev/mock/travelStats.js).
//
// Places are where their pins are (each place's pin turned back into a position:
// utils/projection.js positionFromMap), and a stop at a landmark is at the landmark, so the
// distances are "about": home, then each completed trip's stops in order, then home again.
import { placeOnMap } from './ukNations.js';

const EARTH_RADIUS_KM = 6371.0088;
const DAY_MS = 24 * 60 * 60 * 1000;
const rad = (deg) => (deg * Math.PI) / 180;

/** The great-circle distance between two positions (`{ latitude, longitude }`), in km. */
export function distanceKm(a, b) {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// A date (a Date or "YYYY-MM-DD…") as a day number, or null
function dayOf(value) {
  if (!value) return null;
  const text = value instanceof Date ? value.toISOString() : String(value);
  const time = Date.parse(text.slice(0, 10));
  return Number.isFinite(time) ? Math.floor(time / DAY_MS) : null;
}

/**
 * A trip's days, `[first, last]` as day numbers (both included): its own dates, else its
 * stops' first and last; null when nothing is dated.
 */
export function tripDays(trip) {
  const stopDays = (trip.stops ?? []).flatMap((s) => [dayOf(s.arriveOn), dayOf(s.leaveOn)]).filter((d) => d !== null);
  const first = dayOf(trip.startDate) ?? (stopDays.length ? Math.min(...stopDays) : null) ?? dayOf(trip.endDate);
  if (first === null) return null;
  const last = dayOf(trip.endDate) ?? (stopDays.length ? Math.max(...stopDays) : first);
  return [first, Math.max(first, last)];
}

/** Days away: every day of the completed trips, a day two trips share counted once. */
export function daysAway(trips) {
  const ranges = trips
    .map(tripDays)
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let end = -Infinity;
  for (const [first, last] of ranges) {
    if (last <= end) continue;
    total += last - Math.max(first, end + 1) + 1;
    end = last;
  }
  return total;
}

// Where a stop is: its landmark, else its place's pin
const stopPoint = (stop, positions) =>
  (Number.isFinite(stop.landmark?.latitude) && Number.isFinite(stop.landmark?.longitude) ? stop.landmark : positions.get(stop.countryCode)) ?? null;

/** A trip's distance in km: from home through its stops in order and home again (without a home, stop to stop). */
export function tripDistanceKm(trip, positions, home = null) {
  const points = [...(trip.stops ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((stop) => stopPoint(stop, positions))
    .filter(Boolean);
  if (!points.length) return 0;
  const path = home ? [home, ...points, home] : points;
  let km = 0;
  for (let i = 1; i < path.length; i++) km += distanceKm(path[i - 1], path[i]);
  return km;
}

/**
 * The map's home: its own setting (`homeCountryCode`), else the birth country of the owner's
 * own traveller, else of the first traveller with one. -> a code, or null
 */
export function homeOf({ homeCountryCode = null, ownerId = null, travellers = [] }) {
  if (homeCountryCode) return homeCountryCode;
  const own = travellers.find((t) => ownerId && t.userId === ownerId && t.birthCountryCode);
  return own?.birthCountryCode ?? travellers.find((t) => t.birthCountryCode)?.birthCountryCode ?? null;
}

/**
 * The visited place furthest from home (`codes`: the places counted visited), leaving out
 * home itself and what's part of it (the UK's nations, a country's regions).
 * -> `{ countryCode, km }`, or null
 */
export function furthestFromHome(codes, positions, homeCode) {
  const home = homeCode ? positions.get(homeCode) : null;
  if (!home) return null;
  let best = null;
  for (const code of new Set(codes)) {
    if (placeOnMap(code, false) === homeCode) continue;
    const point = positions.get(code);
    if (!point) continue;
    const km = distanceKm(home, point);
    if (!best || km > best.km) best = { countryCode: code, km };
  }
  return best && { countryCode: best.countryCode, km: Math.round(best.km) };
}

/**
 * The extra stats: `{ homeCountryCode, daysAway, distanceKm, furthest }`.
 * @param {object} input
 * @param {{ startDate, endDate, stops: { position, countryCode, arriveOn, leaveOn, landmark }[] }[]} input.completedTrips
 * @param {string[]} input.visitedCodes the places counted visited (visited or lived)
 * @param {Map<string, { latitude: number, longitude: number }>} input.positions each place's pin
 * @param {string|null} input.homeCountryCode the map's home (homeOf)
 */
export function travelExtras({ completedTrips = [], visitedCodes = [], positions = new Map(), homeCountryCode = null }) {
  const home = homeCountryCode ? (positions.get(homeCountryCode) ?? null) : null;
  const km = completedTrips.reduce((sum, trip) => sum + tripDistanceKm(trip, positions, home), 0);
  return {
    homeCountryCode,
    daysAway: daysAway(completedTrips),
    distanceKm: Math.round(km),
    furthest: furthestFromHome(visitedCodes, positions, homeCountryCode),
  };
}
