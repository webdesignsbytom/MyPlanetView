// The words for the richer travel stats (docs/API.md "Stats"; 21 Nov 2026): how much of the
// world, the distance in round numbers ("about"), and miles beside the kilometres, as a
// British site's readers think in miles; or kilometres beside the miles, for the maps shown in
// miles (distanceUnits.js; 24 Nov 2026). Pure.
import { MILES_PER_KM } from './distanceUnits';

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
export const aboutMiles = (km) => `${count(rounded((km || 0) * MILES_PER_KM))} miles`;

/**
 * A distance in the unit it's shown in, rounded, with the other for a note:
 * `{ value: '27,300', unit: 'km', other: '17,000 miles' }`, or in miles
 * `{ value: '17,000', unit: 'miles', other: '27,300 km' }`.
 */
export function aboutDistance(km, unit = 'km') {
  const inKm = aboutKm(km);
  const inMiles = count(rounded((km || 0) * MILES_PER_KM));
  return unit === 'miles' ? { value: inMiles, unit: 'miles', other: `${inKm} km` } : { value: inKm, unit: 'km', other: `${inMiles} miles` };
}

/** "27,300 km", or "17,000 miles". */
export const aboutDistanceWords = (km, unit = 'km') => {
  const distance = aboutDistance(km, unit);
  return `${distance.value} ${distance.unit}`;
};

/** A number of days: "1 day", "1,200 days" (23 Nov 2026, the time away). */
export const dayWords = (days) => `${count(days || 0)} ${days === 1 ? 'day' : 'days'}`;

/**
 * Each row's share of the biggest, as a whole percentage, for the time-away bars: at least 2
 * so a short stay still shows. -> the rows with `share` added
 */
export function withShares(rows) {
  const most = Math.max(0, ...rows.map((row) => row.days));
  return rows.map((row) => ({ ...row, share: most ? Math.max(2, Math.round((100 * row.days) / most)) : 0 }));
}

// Country names read "from the …" (the United Kingdom, the Netherlands): the server's
// "On this day" rule (server/src/utils/onThisDay.js inCountry)
const THE = /^(United |Republic of |Democratic Republic of |Czech Republic$|Dominican Republic$|Central African Republic$|Netherlands$|Philippines$|Bahamas$|Gambia$|Maldives$|Seychelles$|Comoros$|Vatican)|( Islands)$/;

/** "the United Kingdom", "France". */
export const withThe = (name) => (THE.test(name) ? `the ${name}` : name);
