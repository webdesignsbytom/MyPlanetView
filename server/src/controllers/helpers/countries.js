// Countries are seeded and only change with a deploy, so they're read once per instance.
import { isCountryCode } from '../../utils/travelValidation.js';
import { findAllCountries } from '../../domain/places.js';
import { positionFromMap } from '../../utils/projection.js';

// code -> continent, code -> name and code -> the real position of its pin (the travel
// stats' distances), for every place on the map, and how many countries the world has: the
// countries, or with the UK as its four nations, those four instead of the UK
let countriesPromise = null;

const loadCountryTables = () => {
  countriesPromise ??= findAllCountries()
    .then((rows) => {
      const countries = rows.filter((c) => c.kind === 'COUNTRY').length;
      const nations = rows.filter((c) => c.kind === 'NATION').length;
      return {
        continents: new Map(rows.map((c) => [c.code, c.continent])),
        names: new Map(rows.map((c) => [c.code, c.name])),
        positions: new Map(
          rows.flatMap((c) => {
            const position = c.pinX === null || c.pinY === null ? null : positionFromMap(c.pinX, c.pinY);
            return position ? [[c.code, position]] : [];
          }),
        ),
        worldTotals: { whole: countries, splitUk: nations ? countries - 1 + nations : countries },
      };
    })
    .catch((err) => {
      countriesPromise = null; // try again next time
      throw err;
    });
  return countriesPromise;
};

const loadCountries = async () => (await loadCountryTables()).continents;

/** A country's name ("France"), or its code if it isn't known. */
export const countryNameOf = async (code) => (await loadCountryTables()).names.get(code) ?? code;

/** Is this a country on the map? */
export async function isKnownCountry(code) {
  if (!isCountryCode(code)) return false;
  return (await loadCountries()).has(code);
}

/** Every country's continent, as a Map of code -> continent (for map stats). */
export const continentsByCode = () => loadCountries();

/** Every place's pin as a real position, a Map of code -> { latitude, longitude } (for map stats). */
export const placePositions = async () => (await loadCountryTables()).positions;

/** How many countries the world has, on a map that splits the UK or not: `{ whole, splitUk }`. */
export const worldCountryTotals = async () => (await loadCountryTables()).worldTotals;

/**
 * An optional country field: undefined (leave), null/"" (clear) or a known code.
 * -> { ok: true, value } or { ok: false }.
 */
export async function parseOptionalCountry(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  return (await isKnownCountry(input)) ? { ok: true, value: input } : { ok: false };
}
