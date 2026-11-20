// Taking your travels with you (docs/API.md "Travel copies"): the pure rules. Tested in
// tests/travelCopies.test.js.
import { planOf } from './constants/plans.js';
import { UK, isUkNation, placeOnMap, ukNationAt } from './ukNations.js';
import { isUuid } from './travelValidation.js';

// One request's choice, at most (input bounds, not a limit on what can be taken: a bigger
// family album goes in several requests)
export const COPY_MAX_PHOTOS = 20000;
export const COPY_MAX_TRIPS = 1000;
export const COPY_MAX_MOMENTS = 1000;
export const COPY_MAX_COUNTRIES = 300;
// One run copies for this long, then the browser asks it to carry on (POST …/continue), and the
// daily cron finishes any left; a run holds the request for COPY_LOCK_MS so two never overlap
export const COPY_RUN_BUDGET_MS = 8000;
export const COPY_LOCK_MS = 60000;

/**
 * Where a row from the family map goes on the new map, as that map keeps places
 * (utils/ukNations.js): on a map that doesn't split the UK, a nation is the UK remembering it;
 * on one that does, the UK is the nation it remembers, or the one its position (`latitude`,
 * `longitude`: the row's own, or its landmark's) is in, else stays the UK. A region is its
 * country's. -> `{ countryCode, ukNation }` (countryCode null for a photo with none)
 */
export function placeCopy({ countryCode, ukNation = null, latitude = null, longitude = null }, splitUk) {
  if (!countryCode) return { countryCode: null, ukNation: null };
  if (isUkNation(countryCode)) return splitUk ? { countryCode, ukNation: null } : { countryCode: UK, ukNation: countryCode };
  if (countryCode === UK) {
    if (!splitUk) return { countryCode: UK, ukNation: isUkNation(ukNation) ? ukNation : null };
    const nation = isUkNation(ukNation)
      ? ukNation
      : latitude !== null && longitude !== null
        ? ukNationAt(latitude, longitude)
        : null;
    return { countryCode: nation ?? UK, ukNation: null };
  }
  return { countryCode: placeOnMap(countryCode, splitUk), ukNation: null };
}

/**
 * How much of a choice fits on the new map: per place (null: photos with no country, one more
 * gallery under the same cap), the photos chosen, the room left under the plan's photos per
 * country (`counts`: the map's photos there now, hidden ones too), and how many fit.
 * `places` is each chosen photo's place on the new map.
 * -> `{ countries: [{ countryCode, photos, room, fits }], photos, fits }`, the biggest first
 */
export function copyRoom({ places, counts, planId }) {
  const cap = planOf(planId).limits.photosPerCountry;
  const chosen = new Map();
  for (const code of places) chosen.set(code, (chosen.get(code) ?? 0) + 1);
  const countries = [...chosen].map(([countryCode, photos]) => {
    const room = Math.max(0, cap - (counts[countryCode ?? ''] ?? 0));
    return { countryCode, photos, room, fits: Math.min(photos, room) };
  });
  countries.sort((a, b) => b.photos - a.photos || String(a.countryCode).localeCompare(String(b.countryCode)));
  return {
    countries,
    photos: places.length,
    fits: countries.reduce((sum, c) => sum + c.fits, 0),
  };
}

// A list of distinct ids from the body, at most `max` -> the list, or null when it isn't one
function idList(value, max) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > max || !value.every(isUuid)) return null;
  return [...new Set(value)];
}

const COUNTRY_CODE = /^[A-Z]{2}$/;

/**
 * A choice from a request body: `{ toMapId, travellerId, tripIds, momentIds, countryCodes,
 * photoIds }`, the lists optional. -> `{ value }` or `{ error }` (the message key)
 */
export function parseCopyChoice(body) {
  if (!body || typeof body !== 'object') return { error: 'invalidCopyChoice' };
  if (!isUuid(body.toMapId)) return { error: 'invalidCopyTarget' };
  if (!isUuid(body.travellerId)) return { error: 'invalidCopyTraveller' };
  const tripIds = idList(body.tripIds, COPY_MAX_TRIPS);
  const momentIds = idList(body.momentIds, COPY_MAX_MOMENTS);
  const photoIds = idList(body.photoIds, COPY_MAX_PHOTOS);
  const countryCodes =
    body.countryCodes === undefined || body.countryCodes === null
      ? []
      : Array.isArray(body.countryCodes) &&
          body.countryCodes.length <= COPY_MAX_COUNTRIES &&
          body.countryCodes.every((c) => typeof c === 'string' && COUNTRY_CODE.test(c))
        ? [...new Set(body.countryCodes)]
        : null;
  if (!tripIds || !momentIds || !photoIds || !countryCodes) return { error: 'invalidCopyChoice' };
  if (!tripIds.length && !momentIds.length && !photoIds.length && !countryCodes.length) return { error: 'emptyCopyChoice' };
  return { value: { toMapId: body.toMapId, travellerId: body.travellerId, tripIds, momentIds, photoIds, countryCodes } };
}

/** "140 photos, 2 trips and 3 moments", for the emails. */
export function copySummary({ photos, trips, moments }) {
  const parts = [
    photos ? `${photos} ${photos === 1 ? 'photo' : 'photos'}` : null,
    trips ? `${trips} ${trips === 1 ? 'trip' : 'trips'}` : null,
    moments ? `${moments} ${moments === 1 ? 'moment' : 'moments'}` : null,
  ].filter(Boolean);
  if (parts.length < 2) return parts[0] ?? 'nothing';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

/** The earliest date per place: `[{ countryCode, date }]` -> Map countryCode -> date */
export function earliestDates(rows) {
  const earliest = new Map();
  for (const { countryCode, date } of rows) {
    if (!countryCode || !date) continue;
    const current = earliest.get(countryCode);
    if (!current || date < current) earliest.set(countryCode, date);
  }
  return earliest;
}
