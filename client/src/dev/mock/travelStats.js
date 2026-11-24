// The richer travel stats, as the server's src/utils/travelStats.js (a copy: change both
// together): how much of the world, the days away, the distance travelled and the place
// furthest from home. Places are where their pins are (positionFromMap on each place's pin).
import { COUNTRIES } from '@/utils/map/countries';
import { positionFromMap } from '@/utils/map/projection';
import { placeOnMap } from '@/utils/map/ukNations';
import { PARENT_PLACE } from '@/utils/map/specialPlaces';

// Each place's pin as a real position, and how many countries the world has (as the server's
// controllers/helpers/countries.js)
export const PLACE_POSITIONS = new Map(
  COUNTRIES.flatMap((c) => {
    const position = Number.isFinite(c.pinX) && Number.isFinite(c.pinY) ? positionFromMap(c.pinX, c.pinY) : null;
    return position ? [[c.code, position]] : [];
  }),
);
const WORLD_COUNTRIES = COUNTRIES.filter((c) => !c.kind || c.kind === 'COUNTRY').length;
const UK_NATIONS = COUNTRIES.filter((c) => c.kind === 'NATION').length;
export const countriesInWorld = (splitUk) => (splitUk ? WORLD_COUNTRIES - 1 + UK_NATIONS : WORLD_COUNTRIES);

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

// Day ranges joined where they overlap or touch, in order
function mergedDays(ranges) {
  const merged = [];
  for (const [first, last] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const prev = merged.at(-1);
    if (prev && first <= prev[1] + 1) prev[1] = Math.max(prev[1], last);
    else merged.push([first, last]);
  }
  return merged;
}

const yearOfDay = (day) => new Date(day * DAY_MS).getUTCFullYear();

/**
 * Days away in each calendar year (23 Nov 2026, the user's wish), newest first: a trip over
 * New Year counts in both, a day two trips share once. -> `[{ year, days }]`
 */
export function daysByYear(trips) {
  const totals = new Map();
  for (const [first, last] of mergedDays(trips.map(tripDays).filter(Boolean))) {
    for (let day = first; day <= last; ) {
      const year = yearOfDay(day);
      const end = Math.min(last, Date.UTC(year + 1, 0, 1) / DAY_MS - 1);
      totals.set(year, (totals.get(year) ?? 0) + end - day + 1);
      day = end + 1;
    }
  }
  return [...totals].map(([year, days]) => ({ year, days })).sort((a, b) => b.year - a.year);
}

/**
 * Each stop's days, `[first, last]`, in its trip's order: its own dates; a stop with only its
 * arrival stays until the next stop's arrival (the day of travel counts in both places), else
 * until the trip ends. Stops with no dates are left out.
 */
function stopRanges(trip) {
  const stops = [...(trip.stops ?? [])].sort((a, b) => a.position - b.position);
  const tripEnd = tripDays(trip)?.[1] ?? null;
  return stops.flatMap((stop, i) => {
    const arrive = dayOf(stop.arriveOn);
    const leave = dayOf(stop.leaveOn);
    const first = arrive ?? leave;
    if (first === null) return [];
    const nextArrive = stops.slice(i + 1).map((s) => dayOf(s.arriveOn)).find((d) => d !== null) ?? null;
    const last = leave ?? nextArrive ?? tripEnd ?? first;
    return [{ countryCode: stop.countryCode, range: [first, Math.max(first, last)] }];
  });
}

/**
 * The days spent in each place (23 Nov 2026, the user's wish): a trip to one place gives it
 * every day of the trip; a trip to several gives each place its stops' days (stopRanges). A
 * day in two places counts in each, a day two trips share once. Most days first, then by code.
 * -> `[{ countryCode, days }]`
 */
export function daysByPlace(trips) {
  const ranges = new Map();
  const add = (code, range) => ranges.set(code, [...(ranges.get(code) ?? []), range]);
  for (const trip of trips) {
    const places = new Set((trip.stops ?? []).map((s) => s.countryCode));
    if (places.size === 1) {
      const days = tripDays(trip);
      if (days) add([...places][0], days);
      continue;
    }
    for (const { countryCode, range } of stopRanges(trip)) add(countryCode, range);
  }
  return [...ranges]
    .map(([countryCode, list]) => ({ countryCode, days: mergedDays(list).reduce((sum, [first, last]) => sum + last - first + 1, 0) }))
    .sort((a, b) => b.days - a.days || a.countryCode.localeCompare(b.countryCode));
}

/**
 * The share of a life spent away (23 Nov 2026, the user's wish): `days` away over the days
 * from `birthDate` to `today`, both included, as a percentage with one decimal (at most 100).
 * Null without a date of birth, or one after today.
 */
export function lifeAwayShare(days, birthDate, today = new Date()) {
  const born = dayOf(birthDate);
  const now = dayOf(today);
  if (born === null || now === null || now < born) return null;
  return Math.min(100, Math.round((1000 * (days || 0)) / (now - born + 1)) / 10);
}

/** The longest trip with dates: `{ tripId, title, days }` (the first of equals), or null. */
export function longestTrip(trips) {
  let best = null;
  for (const trip of trips) {
    const range = tripDays(trip);
    if (!range) continue;
    const days = range[1] - range[0] + 1;
    if (!best || days > best.days) best = { tripId: trip.id ?? null, title: trip.title ?? '', days };
  }
  return best;
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

// The country a place is a journey to: a region its country's, the South Pole Antarctica's, a
// UK nation the UK's
const journeyOf = (code) => placeOnMap(PARENT_PLACE[code] ?? code, false);

/**
 * The places no completed trip reached, as journeys from home and back, in km (24 Nov 2026): one
 * journey per country, to the furthest of its places visited, never to home's own country.
 */
export function untrippedKm({ completedTrips = [], visitedCodes = [], positions = new Map(), homeCountryCode = null }) {
  const home = homeCountryCode ? positions.get(homeCountryCode) : null;
  if (!home) return 0;
  const homeJourney = journeyOf(homeCountryCode);
  const reached = new Set(completedTrips.flatMap((trip) => [...(trip.countryCodes ?? []), ...(trip.stops ?? []).map((s) => s.countryCode)].map(journeyOf)));
  const furthest = new Map();
  for (const code of new Set(visitedCodes)) {
    const journey = journeyOf(code);
    if (journey === homeJourney || reached.has(journey)) continue;
    const point = positions.get(code);
    if (!point) continue;
    const km = distanceKm(home, point);
    if (km > (furthest.get(journey) ?? 0)) furthest.set(journey, km);
  }
  let total = 0;
  for (const km of furthest.values()) total += 2 * km;
  return total;
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
 * The extra stats: `{ homeCountryCode, daysAway, daysByYear, daysByPlace, longestTrip,
 * distanceKm, furthest }`.
 * @param {object} input
 * @param {{ id, title, startDate, endDate, stops: { position, countryCode, arriveOn, leaveOn, landmark }[] }[]} input.completedTrips
 * @param {string[]} input.visitedCodes the places counted visited (visited or lived)
 * @param {Map<string, { latitude: number, longitude: number }>} input.positions each place's pin
 * @param {string|null} input.homeCountryCode the map's home (homeOf)
 */
export function travelExtras({ completedTrips = [], visitedCodes = [], positions = new Map(), homeCountryCode = null }) {
  const home = homeCountryCode ? (positions.get(homeCountryCode) ?? null) : null;
  // Each completed trip's route, and home and back to every other country visited (24 Nov 2026)
  const km =
    completedTrips.reduce((sum, trip) => sum + tripDistanceKm(trip, positions, home), 0) +
    untrippedKm({ completedTrips, visitedCodes, positions, homeCountryCode });
  return {
    homeCountryCode,
    daysAway: daysAway(completedTrips),
    // Time away in more detail (23 Nov 2026, the user's wish)
    daysByYear: daysByYear(completedTrips),
    daysByPlace: daysByPlace(completedTrips),
    longestTrip: longestTrip(completedTrips),
    distanceKm: Math.round(km),
    furthest: furthestFromHome(visitedCodes, positions, homeCountryCode),
  };
}
