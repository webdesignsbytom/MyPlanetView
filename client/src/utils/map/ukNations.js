// The UK's four nations (docs/API.md "The UK's nations"): England (XE), Scotland (XC),
// Wales (XW) and Northern Ireland (XI), used in place of the UK (GB) on a map that splits
// it (the map's `splitUk`, owner's choice). A copy of server/src/utils/ukNations.js's
// rules (keep the two in step), plus the client's own: colours, and what follows the UK
// for a nation (offers, guides).

export const UK = 'GB';
export const UK_NATION_CODES = Object.freeze(['XE', 'XC', 'XW', 'XI']);

export const isUkNation = (code) => UK_NATION_CODES.includes(code);

/** The place a map keeps for a code: on a map that doesn't split the UK, a nation is the UK. */
export const placeOnMap = (code, splitUk) => (!splitUk && isUkNation(code) ? UK : code);

/**
 * The visited codes that count as countries: on a map that splits the UK, the nations
 * count one each, and the UK itself only while none of them is visited.
 */
export function countedCountryCodes(codes, splitUk) {
  const list = [...new Set(codes)];
  if (!splitUk) return list.filter((code) => !isUkNation(code));
  return list.some(isUkNation) ? list.filter((code) => code !== UK) : list;
}

/**
 * The place a landmark is in on a map: on a map that splits the UK, a UK landmark's
 * nation (the server's landmark list gives it: `nation`).
 */
export const landmarkPlace = (landmark, splitUk) =>
  splitUk && landmark.countryCode === UK && landmark.nation ? landmark.nation : landmark.countryCode;

/** For what's kept per country, not per nation (travel offers, country guides): the UK. */
export const countryOf = (code) => (isUkNation(code) ? UK : code);

// The nations' pastels (--map-visit-1 … 7), like countryStyle.js's: England keeps the UK's,
// and no two that touch share one (Ireland is 3)
export const UK_NATION_COLOUR = Object.freeze({ XE: 7, XC: 5, XW: 2, XI: 4 });
