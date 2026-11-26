// Special places: Antarctica and the four poles. They're in the country list (utils/map/
// countries.js, `kind: 'SPECIAL'`) but aren't countries: the country counts leave them
// out, they have their own stat, and a visit shows a gold expedition stamp instead of
// the star sticker. A copy of server/src/utils/specialPlaces.js; keep the two in step.
import { REGION_PARENT } from './regionPlaces.js';

// Antarctica (its ISO code, a drawn shape) and the four poles (points, from ISO's
// user-assigned range: X = geographic, Q = magnetic)
export const SPECIAL_PLACE_CODES = Object.freeze(['AQ', 'XN', 'QN', 'XS', 'QS']);
export const POLE_CODES = Object.freeze(['XN', 'QN', 'XS', 'QS']);

// The year the magnetic poles' pins are for: NOAA's World Magnetic Model positions (WMM2025),
// in both country lists (server/prisma/seed/data/countries.js, client/src/utils/map/countries.js).
// The poles drift 40 to 50 km a year; from the January after this year the admin overview says
// to move them, and the nightly job emails the admins once a year (utils/reminders.js). Change
// it with the pins.
export const MAGNETIC_POLES_YEAR = 2025;
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

// A visit here means a visit to its parent too: the South Pole is in Antarctica (the
// magnetic south pole is offshore, so it has none), and a region is in its country (Bali in
// Indonesia: regionPlaces.js)
export const PARENT_PLACE = Object.freeze({ XS: 'AQ', ...REGION_PARENT });

/** The codes plus the parents they imply, each once. */
export const withParentPlaces = (codes) => [
  ...new Set(codes.flatMap((code) => (PARENT_PLACE[code] ? [code, PARENT_PLACE[code]] : [code]))),
];

/**
 * The visits a status set by hand brings with it, as the server's `implied`
 * (PUT /maps/:mapId/visits/:countryCode): the South Pole (or a region) marked visited or
 * lived adds Antarctica (or its country) as VISITED when it's missing, or turns a "want to
 * go" one visited. Used to show them at once, before the server's answer.
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
