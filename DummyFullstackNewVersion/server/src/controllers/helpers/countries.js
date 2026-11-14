// Country codes are seeded and only change with a deploy, so they're read once per instance.
import { isCountryCode } from '../../utils/travelValidation.js';
import { findAllCountries } from '../../domain/places.js';

let codesPromise = null;

const loadCodes = () => {
  codesPromise ??= findAllCountries()
    .then((rows) => new Set(rows.map((c) => c.code)))
    .catch((err) => {
      codesPromise = null; // try again next time
      throw err;
    });
  return codesPromise;
};

/** Is this a country on the map? */
export async function isKnownCountry(code) {
  if (!isCountryCode(code)) return false;
  return (await loadCodes()).has(code);
}

/**
 * An optional country field: undefined (leave), null/"" (clear) or a known code.
 * -> { ok: true, value } or { ok: false }.
 */
export async function parseOptionalCountry(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  return (await isKnownCountry(input)) ? { ok: true, value: input } : { ok: false };
}
