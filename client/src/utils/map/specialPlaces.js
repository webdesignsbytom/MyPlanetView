// Special places: Antarctica and the four poles. They're in the country list (utils/map/
// countries.js, `kind: 'SPECIAL'`) but aren't countries: the country counts leave them
// out, they have their own stat, and a visit shows a gold expedition stamp instead of
// the star sticker. A copy of server/src/utils/specialPlaces.js; keep the two in step.

// Antarctica (its ISO code, a drawn shape) and the four poles (points, from ISO's
// user-assigned range: X = geographic, Q = magnetic)
export const SPECIAL_PLACE_CODES = Object.freeze(['AQ', 'XN', 'QN', 'XS', 'QS']);
export const POLE_CODES = Object.freeze(['XN', 'QN', 'XS', 'QS']);
const MAGNETIC_POLE_CODES = Object.freeze(['QN', 'QS']);

export const SPECIAL_PLACE_TOTAL = SPECIAL_PLACE_CODES.length;
// Antarctica (or the South Pole) gives the seventh
export const CONTINENT_TOTAL = 7;

export const isSpecialPlace = (code) => SPECIAL_PLACE_CODES.includes(code);
export const isPole = (code) => POLE_CODES.includes(code);
export const isMagneticPole = (code) => MAGNETIC_POLE_CODES.includes(code);

// Drawn only while the map's Antarctica setting is on (mapSettings.js `showAntarctica`):
// Antarctica, and the two poles beside it. Only the view changes; visits and stats don't.
const ANTARCTIC_CODES = Object.freeze(['AQ', 'XS', 'QS']);
export const isAntarctic = (code) => ANTARCTIC_CODES.includes(code);

// A visit here means a visit to its parent too: the South Pole is in Antarctica. (The
// magnetic south pole is offshore, so it has none.)
export const PARENT_PLACE = Object.freeze({ XS: 'AQ' });

/** The codes plus the parents they imply, each once. */
export const withParentPlaces = (codes) => [
  ...new Set(codes.flatMap((code) => (PARENT_PLACE[code] ? [code, PARENT_PLACE[code]] : [code]))),
];

/**
 * The visits a status set by hand brings with it, as the server's `implied`
 * (PUT /maps/:mapId/visits/:countryCode): the South Pole marked visited or lived adds
 * Antarctica as VISITED when it's missing, or turns a "want to go" one visited. Used to
 * show them at once, before the server's answer.
 */
export function impliedVisits(visits, countryCode, status) {
  const parent = PARENT_PLACE[countryCode];
  if (!parent || (status !== 'VISITED' && status !== 'LIVED')) return [];
  const current = visits.find((v) => v.countryCode === parent);
  if (!current) return [{ countryCode: parent, status: 'VISITED', source: 'MANUAL', firstVisitedOn: null, notes: null }];
  if (current.status === 'WANT_TO_GO') return [{ ...current, status: 'VISITED', source: 'MANUAL' }];
  return [];
}

// A photo within about 11 km of a geographic pole (sea ice drifts, so by latitude alone)
// is placed there. The magnetic poles move tens of kilometres a year, so a photo is never
// placed at one from its GPS; people mark them by hand.
export const POLE_LATITUDE = 89.9;

/** 'XN' or 'XS' for a position at a geographic pole, else null. */
export function poleAt(latitude) {
  if (!Number.isFinite(latitude)) return null;
  if (latitude >= POLE_LATITUDE) return 'XN';
  if (latitude <= -POLE_LATITUDE) return 'XS';
  return null;
}
