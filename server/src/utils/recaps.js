// "Your year in travel" (docs/API.md "Year in travel"; 21 Nov 2026, the user's wish, from the
// business review: a recap each December, made to share, as Polarsteps' Unpacked is): what a
// map holds for one calendar year (UTC), counted from what the caller may see. Pure, so tested
// on its own (tests/recaps.test.js); domain/recaps.js loads the rows.
import { COUNTED_VISIT_STATUSES } from './travelValidation.js';
import { isSpecialPlace } from './specialPlaces.js';
import { isRegion } from './regionPlaces.js';
import { countedCountryCodes } from './ukNations.js';

export const RECAP_FIRST_YEAR = 1900;
// How many of each the reply lists (the counts are whole)
export const RECAP_TOP_COUNTRIES = 3;
export const RECAP_HIGHLIGHTS = 6;
export const RECAP_STAMPS_LISTED = 12;

/** A year from a request: a whole number from 1900 to next year, else null. */
export function parseRecapYear(value, now = new Date()) {
  const year = typeof value === 'number' ? value : /^\d{4}$/.test(String(value ?? '')) ? Number(value) : NaN;
  return Number.isInteger(year) && year >= RECAP_FIRST_YEAR && year <= now.getUTCFullYear() + 1 ? year : null;
}

/** The year as a time range, UTC: `{ from, to }` (to not included). */
export const yearRange = (year) => ({ from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) });

const inRange = (date, { from, to }) => Boolean(date) && new Date(date) >= from && new Date(date) < to;

/**
 * The trips the year counts: done or under way, and in the year by their dates (a start or
 * end in it, or running through it). -> each with `codes`, the countries of its stops in the
 * year (a stop with no date counts with its trip).
 */
export function tripsInYear(trips, year) {
  const range = yearRange(year);
  return trips
    .filter((trip) => trip.status === 'COMPLETED' || trip.status === 'ACTIVE')
    .filter((trip) => {
      const start = trip.startDate ? new Date(trip.startDate) : null;
      const end = trip.endDate ? new Date(trip.endDate) : start;
      if (!start && !end) return trip.stops.some((stop) => inRange(stop.arriveOn, range));
      return (start ?? end) < range.to && (end ?? start) >= range.from;
    })
    .map((trip) => ({
      ...trip,
      codes: trip.stops.filter((stop) => !stop.arriveOn || inRange(stop.arriveOn, range)).map((stop) => stop.countryCode),
    }));
}

/**
 * The year's places and counts:
 * - places: every place it touched (photos and videos shot that year, its trips' stops,
 *   moments dated that year, countries first visited that year), as the map keeps them;
 * - countries: those that count as countries (utils/ukNations.js), special places apart;
 * - newCountries: countries first visited that year (a visit's firstVisitedOn);
 * - continents: of the countries and special places (a region's country gives its own).
 * `photoGroups`: `[{ countryCode, kind, count }]`; `visits`: `[{ countryCode, status,
 * firstVisitedOn }]`; `trips`: tripsInYear's; `moments`: `[{ countryCode }]`.
 */
export function buildRecap({ year, splitUk = false, photoGroups = [], visits = [], trips = [], moments = [], continentByCode = new Map() }) {
  const range = yearRange(year);
  const firstVisits = visits
    .filter((visit) => COUNTED_VISIT_STATUSES.includes(visit.status) && inRange(visit.firstVisitedOn, range))
    .map((visit) => visit.countryCode);
  const places = new Set([
    ...photoGroups.filter((group) => group.countryCode && group.count > 0).map((group) => group.countryCode),
    ...trips.flatMap((trip) => trip.codes),
    ...moments.map((moment) => moment.countryCode).filter(Boolean),
    ...firstVisits,
  ]);
  const list = [...places].sort();
  const countries = countedCountryCodes(list.filter((code) => !isSpecialPlace(code)), splitUk);
  const newCountries = countedCountryCodes(firstVisits.filter((code) => !isSpecialPlace(code)), splitUk).sort();
  const continents = new Set(list.filter((code) => !isRegion(code)).map((code) => continentByCode.get(code)).filter(Boolean));

  const photosByCountry = new Map();
  let photos = 0;
  let videos = 0;
  for (const group of photoGroups) {
    if (group.kind === 'VIDEO') videos += group.count;
    else {
      photos += group.count;
      if (group.countryCode) photosByCountry.set(group.countryCode, (photosByCountry.get(group.countryCode) ?? 0) + group.count);
    }
  }
  const topCountries = [...photosByCountry]
    .map(([countryCode, count]) => ({ countryCode, photos: count }))
    .sort((a, b) => b.photos - a.photos || a.countryCode.localeCompare(b.countryCode));

  return {
    year,
    places: list,
    countries: countries.length,
    newCountries,
    specialPlaces: list.filter(isSpecialPlace).length,
    continents: continents.size,
    photos,
    videos,
    // Every country with photos, most first (the highlights take one photo from each)
    photoCountries: topCountries.map((row) => row.countryCode),
    topCountries: topCountries.slice(0, RECAP_TOP_COUNTRIES),
    moments: moments.length,
    trips: trips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      status: trip.status,
      startDate: trip.startDate ?? null,
      endDate: trip.endDate ?? null,
    })),
  };
}

/** The landmarks stamped from the year's photos: `{ count, landmarks }` (A to Z, the first RECAP_STAMPS_LISTED). */
export function stampsOf(rows) {
  const byId = new Map();
  for (const row of rows) if (!byId.has(row.landmarkId)) byId.set(row.landmarkId, { id: row.landmarkId, name: row.name, countryCode: row.countryCode });
  const landmarks = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { count: landmarks.length, landmarks: landmarks.slice(0, RECAP_STAMPS_LISTED) };
}

/** Whether a year has anything to show. */
export const recapHasAnything = (recap) => Boolean(recap.places.length || recap.photos || recap.videos || recap.trips.length || recap.moments);
