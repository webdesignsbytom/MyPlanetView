// Countries are seeded and only change with a deploy, so they're read once per instance.
import { isCountryCode } from '../../utils/travelValidation.js';
import { findAllCountries } from '../../domain/places.js';

// code -> continent, for every country on the map
let countriesPromise = null;

const loadCountries = () => {
  countriesPromise ??= findAllCountries()
    .then((rows) => new Map(rows.map((c) => [c.code, c.continent])))
    .catch((err) => {
      countriesPromise = null; // try again next time
      throw err;
    });
  return countriesPromise;
};

/** Is this a country on the map? */
export async function isKnownCountry(code) {
  if (!isCountryCode(code)) return false;
  return (await loadCountries()).has(code);
}

/** Every country's continent, as a Map of code -> continent (for map stats). */
export const continentsByCode = () => loadCountries();

/**
 * An optional country field: undefined (leave), null/"" (clear) or a known code.
 * -> { ok: true, value } or { ok: false }.
 */
export async function parseOptionalCountry(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  return (await isKnownCountry(input)) ? { ok: true, value: input } : { ok: false };
}
