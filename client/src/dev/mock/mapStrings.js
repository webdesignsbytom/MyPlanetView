// Mock mode only: strings between places (docs/API.md "Strings"), the server's rules
// (server/src/utils/mapStrings.js) copied: a pair in code order, a UK nation as the UK on a map
// that doesn't split it, and the strings a map's travels suggest.

export const MAP_STRINGS_MAX = 500;

const UK_NATIONS = new Set(['XE', 'XC', 'XW', 'XI']);
const COUNTED_VISITS = new Set(['VISITED', 'LIVED']);
const TRAVELLED_TRIPS = new Set(['COMPLETED', 'ACTIVE']);
const CODE = /^[A-Z]{2}$/;

export function stringPair(a, b) {
  if (!a || !b || a === b) return null;
  return a < b ? [a, b] : [b, a];
}

export const stringPlace = (code, splitUk) => (!splitUk && UK_NATIONS.has(code) ? 'GB' : code);

/** `{ from, to }` -> `{ ok: true, pair }` or `{ ok: false, message }` (the server's words). */
export function parseStringInput(body, { splitUk = false } = {}) {
  const read = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
  const from = read(body?.from);
  const to = read(body?.to);
  if (!CODE.test(from) || !CODE.test(to)) return { ok: false, message: STRING_MESSAGES.stringInvalid };
  const pair = stringPair(stringPlace(from, splitUk), stringPlace(to, splitUk));
  return pair ? { ok: true, pair } : { ok: false, message: STRING_MESSAGES.stringSamePlace };
}

// The server's EVENT_MESSAGES for strings
export const STRING_MESSAGES = Object.freeze({
  stringInvalid: 'Choose two places on the map to tie a string between.',
  stringSamePlace: 'A string needs two different places.',
  stringNotFound: 'That string isn’t on this map.',
  stringsFull: 'This map has as many strings as it can hold (500). Take some off first.',
});

const dayOf = (value) => (value ? new Date(value).getTime() : Number.POSITIVE_INFINITY);

/** The strings a map's travels suggest: each travelled trip's route, then the rest by first visit. */
export function autoStringPairs({ trips = [], visits = [], splitUk = false }) {
  const pairs = [];
  const seen = new Set();
  const add = (a, b) => {
    const pair = stringPair(a, b);
    if (!pair || seen.has(pair.join('-'))) return;
    seen.add(pair.join('-'));
    pairs.push(pair);
  };
  const reached = new Set();
  const travelled = trips.filter((trip) => TRAVELLED_TRIPS.has(trip.status)).sort((a, b) => dayOf(a.startDate) - dayOf(b.startDate));
  for (const trip of travelled) {
    const places = (trip.countryCodes || []).map((code) => stringPlace(code, splitUk));
    places.forEach((place, i) => {
      reached.add(place);
      if (i > 0) add(places[i - 1], place);
    });
  }
  const rest = visits
    .filter((visit) => COUNTED_VISITS.has(visit.status))
    .map((visit) => ({ ...visit, place: stringPlace(visit.countryCode, splitUk) }))
    .filter((visit) => !reached.has(visit.place))
    .sort((a, b) => dayOf(a.firstVisitedOn) - dayOf(b.firstVisitedOn) || dayOf(a.createdAt) - dayOf(b.createdAt));
  const order = [...new Set(rest.map((visit) => visit.place))];
  order.forEach((place, i) => {
    if (i > 0) add(order[i - 1], place);
  });
  return pairs;
}

export const stringView = (row) => ({ id: row.id, from: row.from, to: row.to });
