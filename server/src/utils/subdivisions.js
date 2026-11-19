// A country map's states and provinces (docs/API.md "Country maps"): Natural Earth's, listed
// in src/data/subdivisions.json by images/src/tools/country-maps.mjs (the client draws them
// from utils/map/countryMaps/). Each code says which country map it's on (`m`), the region
// it's in or is (`r`: New Caledonia's provinces are in NC; Hawaii is XH, `same`), and for
// the UK its nation (`n`). Pure, so it's unit-tested.
import SUBDIVISIONS from '../data/subdivisions.json' with { type: 'json' };
import { UK, isUkNation } from './ukNations.js';

/** A state's entry (`{ m, r?, same?, n? }`), or null for a code that isn't one. */
export const subdivisionOf = (code) => (typeof code === 'string' && Object.hasOwn(SUBDIVISIONS, code) ? SUBDIVISIONS[code] : null);

/**
 * The country a state's visit is kept under: its map's, the UK for every UK state (a
 * nation's map picks its own from them).
 */
export const subdivisionCountry = (code) => subdivisionOf(code)?.m ?? null;

/**
 * Is this state on a country map asked for by `country` (a country's code, or on a map that
 * splits the UK, a nation's)?
 */
export function isOnCountryMap(code, country) {
  const state = subdivisionOf(code);
  if (!state) return false;
  return isUkNation(country) ? state.m === UK && state.n === country : state.m === country;
}

/** The region whose own visit a state is (Hawaii: XH), or null. */
export const sameAsRegion = (code) => {
  const state = subdivisionOf(code);
  return state?.same ? state.r : null;
};

/**
 * The places a state marked visited or lived brings with it: the region it's in (New
 * Caledonia's provinces: NC), and its country, as the map keeps places (on a map that
 * splits the UK, a UK state's nation).
 */
export function placesOfSubdivision(code, splitUk) {
  const state = subdivisionOf(code);
  if (!state) return [];
  const country = state.m === UK && splitUk && state.n ? state.n : state.m;
  return [...(state.r ? [state.r] : []), country];
}

/** The states that are regions' own visits on one country's map: `[[code, region]]`. */
export const regionStatesOn = (country) =>
  Object.entries(SUBDIVISIONS)
    .filter(([code, state]) => state.same && isOnCountryMap(code, country))
    .map(([code, state]) => [code, state.r]);
