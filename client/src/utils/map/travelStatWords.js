// The words for the richer travel stats (docs/API.md "Stats"; 21 Nov 2026): how much of the
// world, the distance in round numbers ("about"), and miles beside the kilometres, as a
// British site's readers think in miles. Pure.
const count = (n) => Math.round(n).toLocaleString('en-GB');

/** "4.4%" under 10%, "12%" above; null when the world's total isn't known. */
export function worldShare(countries, countriesInWorld) {
  if (!countriesInWorld) return null;
  const share = (100 * (countries || 0)) / countriesInWorld;
  if (share === 0) return '0%';
  return share < 10 ? `${share.toFixed(1)}%` : `${Math.round(share)}%`;
}

// To the nearest 10 below 1,000, else the nearest 100: the pins make them "about"
const rounded = (n) => (n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100);

/** A distance in km, rounded: "33,400". */
export const aboutKm = (km) => count(rounded(km || 0));

/** The same in miles: "20,800 miles". */
export const aboutMiles = (km) => `${count(rounded((km || 0) * 0.621371))} miles`;

// Country names read "from the …" (the United Kingdom, the Netherlands): the server's
// "On this day" rule (server/src/utils/onThisDay.js inCountry)
const THE = /^(United |Republic of |Democratic Republic of |Czech Republic$|Dominican Republic$|Central African Republic$|Netherlands$|Philippines$|Bahamas$|Gambia$|Maldives$|Seychelles$|Comoros$|Vatican)|( Islands)$/;

/** "the United Kingdom", "France". */
export const withThe = (name) => (THE.test(name) ? `the ${name}` : name);
