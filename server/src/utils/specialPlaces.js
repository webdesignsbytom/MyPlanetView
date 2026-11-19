// Special places (docs/SITE-DESIGN.md, "Special places"): rows of the Country table with
// kind SPECIAL, kept as constants too so counts need no join. They aren't countries, so
// the country counts leave them out; they have their own stat. Pure, so it's unit-tested.
// The client's copy is client/src/utils/map/specialPlaces.js; keep the two in step.
import { REGION_PARENT } from './regionPlaces.js';

// Antarctica (its ISO code, a drawn shape) and the four poles (points, from ISO's
// user-assigned range: X = geographic, Q = magnetic)
export const SPECIAL_PLACE_CODES = Object.freeze(['AQ', 'XN', 'QN', 'XS', 'QS']);
export const POLE_CODES = Object.freeze(['XN', 'QN', 'XS', 'QS']);

export const isSpecialPlace = (code) => SPECIAL_PLACE_CODES.includes(code);
export const isPole = (code) => POLE_CODES.includes(code);

// A visit here means a visit to its parent too: the South Pole is in Antarctica (the
// magnetic south pole is offshore, so it has none), and a region is in its country (Bali in
// Indonesia: regionPlaces.js)
export const PARENT_PLACE = Object.freeze({ XS: 'AQ', ...REGION_PARENT });

/** The codes plus the parents they imply, each once. */
export const withParentPlaces = (codes) => [
  ...new Set(codes.flatMap((code) => (PARENT_PLACE[code] ? [code, PARENT_PLACE[code]] : [code]))),
];

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
