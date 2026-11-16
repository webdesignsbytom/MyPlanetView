// A moment's pin on the map (docs/API.md "Moments", "A pin on the map"): the exact spot,
// chosen from a photo's location, the device's, or a tap on the map. The owner and editors
// always see it; the people the map is shared with only when the pin says so (`shared`,
// off by default). Pure, so it's unit-tested.
import { isValidLatLng } from './projection.js';
import { COASTLINE_TOLERANCE, countryAtPosition, distanceToCountry } from './countryLookup.js';
import { PARENT_PLACE } from './specialPlaces.js';
import { UK, isUkNation, ukNationAt } from './ukNations.js';

// Stored to six decimals: about 10 cm, finer than any phone's fix
const DECIMALS = 1e6;
const rounded = (n) => Math.round(n * DECIMALS) / DECIMALS;

/**
 * A pin from a request body's `spot`: `{ latitude, longitude, shared = false }`, or null to
 * take the pin off. -> `{ ok: true, value: undefined }` when missing (leave as is),
 * `{ ok: true, value: { latitude, longitude, spotShared } }` (all null and false when
 * taken off), or `{ ok: false }`.
 */
export function parseMomentSpot(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null) return { ok: true, value: { latitude: null, longitude: null, spotShared: false } };
  if (typeof input !== 'object' || Array.isArray(input)) return { ok: false };
  const { latitude, longitude, shared = false } = input;
  if (!isValidLatLng(latitude, longitude) || typeof shared !== 'boolean') return { ok: false };
  return { ok: true, value: { latitude: rounded(latitude), longitude: rounded(longitude), spotShared: shared } };
}

/**
 * Is a spot in a moment's place (a country, a special place or, on a map that splits the
 * UK, a nation)? The map's outlines are accurate to about 20–35 km, so a spot also fits
 * when it's within the coastline tolerance of the place's own shapes (a border café the
 * lookup gives to the neighbour, a pier, a beach). The South Pole is in Antarctica. A
 * nation's spot must be in the UK, and in that nation by the nations' real outlines.
 */
export function spotFitsPlace({ latitude, longitude }, countryCode) {
  if (isUkNation(countryCode)) return spotFitsPlace({ latitude, longitude }, UK) && ukNationAt(latitude, longitude) === countryCode;
  const found = countryAtPosition(latitude, longitude);
  if (found === countryCode || PARENT_PLACE[found] === countryCode) return true;
  const distance = distanceToCountry(countryCode, latitude, longitude);
  return distance !== null && distance <= COASTLINE_TOLERANCE;
}

/**
 * The pin a viewer gets on a moment (`{ latitude, longitude, shared? }` or null): the owner
 * and editors (`canEdit`) always, with `shared`; anyone else only a shared pin.
 */
export function spotView(moment, { canEdit }) {
  if (moment.latitude === null || moment.latitude === undefined) return null;
  if (canEdit) return { latitude: moment.latitude, longitude: moment.longitude, shared: moment.spotShared };
  return moment.spotShared ? { latitude: moment.latitude, longitude: moment.longitude } : null;
}
