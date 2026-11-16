// Mock mode only. A moment's pin on the map, as the server's utils/momentSpots.js: read
// from a request, checked against the moment's place (with the map's leeway at borders
// and coasts; the South Pole in Antarctica; a nation by the nations' real outlines), and
// shown to editors always, to anyone else only when shared.
import { isValidLatLng } from '@/utils/map/projection';
import { PARENT_PLACE } from '@/utils/map/specialPlaces';
import { UK, isUkNation } from '@/utils/map/ukNations';
import { COASTLINE_TOLERANCE, countryAtPosition, distanceToCountry } from './countryLookup';
import { ukNationAt } from './ukNationLookup';

const rounded = (n) => Math.round(n * 1e6) / 1e6;

/** `{ ok, value }`: undefined (leave), the pin, or all null and false (taken off). */
export function parseMomentSpot(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null) return { ok: true, value: { latitude: null, longitude: null, spotShared: false } };
  if (typeof input !== 'object' || Array.isArray(input)) return { ok: false };
  const { latitude, longitude, shared = false } = input;
  if (!isValidLatLng(latitude, longitude) || typeof shared !== 'boolean') return { ok: false };
  return { ok: true, value: { latitude: rounded(latitude), longitude: rounded(longitude), spotShared: shared } };
}

/** Is the spot in the moment's place? */
export async function spotFitsPlace({ latitude, longitude }, countryCode) {
  if (isUkNation(countryCode)) return (await spotFitsPlace({ latitude, longitude }, UK)) && ukNationAt(latitude, longitude) === countryCode;
  const found = await countryAtPosition(latitude, longitude);
  if (found === countryCode || PARENT_PLACE[found] === countryCode) return true;
  const distance = await distanceToCountry(countryCode, latitude, longitude);
  return distance !== null && distance <= COASTLINE_TOLERANCE;
}

/** The pin a caller gets: editors always (with `shared`), anyone else only a shared one. */
export function spotView(moment, { canEdit }) {
  if (moment.latitude === null || moment.latitude === undefined) return null;
  if (canEdit) return { latitude: moment.latitude, longitude: moment.longitude, shared: Boolean(moment.spotShared) };
  return moment.spotShared ? { latitude: moment.latitude, longitude: moment.longitude } : null;
}
