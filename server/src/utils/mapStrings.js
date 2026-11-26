// Strings between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread
// tied pin to pin, like a map on a corkboard. Tied by hand (two places chosen, in string mode
// or from the list), or added from the map's own travels. Pure rules; the client draws them,
// and the mock copies these (client/src/dev/mock/mapStrings.js).
import { UK, isUkNation } from './ukNations.js';

/** At most this many strings of each kind on a map. */
export const MAP_STRINGS_MAX = 500;

/**
 * A string's kind (25 Nov 2026, the user's wish): VISITED, between places been to (every string
 * until then), or PLANNED, between places planned, each in its own colour.
 */
export const STRING_KINDS = Object.freeze(['VISITED', 'PLANNED']);

/** A kind from a request: VISITED when none is given, null for one that isn't a kind. */
export function parseStringKind(value) {
  if (value === undefined || value === null || value === '') return 'VISITED';
  const kind = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return STRING_KINDS.includes(kind) ? kind : null;
}

// The visits a string can join on its own, and the trips that have been travelled
const COUNTED_VISITS = new Set(['VISITED', 'LIVED']);
const TRAVELLED_TRIPS = new Set(['COMPLETED', 'ACTIVE']);
// For the planned strings: the places wanted, and the trips planned
const PLANNED_VISITS = new Set(['WANT_TO_GO']);
const PLANNED_TRIPS = new Set(['PLANNED']);

/** Two places as one string, `[fromCode, toCode]` in code order; null for a place and itself. */
export function stringPair(a, b) {
  if (!a || !b || a === b) return null;
  return a < b ? [a, b] : [b, a];
}

/**
 * A place as the map draws it: a UK nation is the UK on a map that doesn't split it. Everything
 * else keeps its own pin (a region, a pole, the UK itself on a split map).
 */
export const stringPlace = (code, splitUk) => (!splitUk && isUkNation(code) ? UK : code);

const CODE = /^[A-Z]{2}$/;

/**
 * A tie's body `{ from, to }` (two place codes, any case) -> `{ ok: true, pair }`, the pair as
 * the map keeps it, or `{ ok: false, message }` (an EVENT_MESSAGES key). Whether the codes
 * are real places is the caller's check.
 */
export function parseStringInput(body, { splitUk = false } = {}) {
  const read = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
  const from = read(body?.from);
  const to = read(body?.to);
  if (!CODE.test(from) || !CODE.test(to)) return { ok: false, message: 'stringInvalid' };
  const pair = stringPair(stringPlace(from, splitUk), stringPlace(to, splitUk));
  return pair ? { ok: true, pair } : { ok: false, message: 'stringSamePlace' };
}

const dayOf = (value) => (value ? new Date(value).getTime() : Number.POSITIVE_INFINITY);

/**
 * The strings a map's travels suggest, in order, as pairs (none twice):
 * 1. each trip travelled (completed or under way), soonest first: its stops' places in order,
 *    each joined to the next (a stop in the same place as the one before adds nothing);
 * 2. then the places visited or lived in that no trip reached, joined one to the next in the
 *    order first visited (undated ones last, in the order they were marked).
 * `trips`: `[{ status, startDate, countryCodes: [...] }]`; `visits`:
 * `[{ countryCode, status, firstVisitedOn, createdAt }]`.
 * The PLANNED kind's (25 Nov 2026, the user's wish) are the same from the plans: each planned
 * trip, soonest first (undated last), its stops in order; then the "want to go" places no
 * planned trip goes to, in the order they were marked.
 */
export function autoStringPairs({ trips = [], visits = [], splitUk = false, kind = 'VISITED' }) {
  const planned = kind === 'PLANNED';
  const tripStatuses = planned ? PLANNED_TRIPS : TRAVELLED_TRIPS;
  const visitStatuses = planned ? PLANNED_VISITS : COUNTED_VISITS;
  const pairs = [];
  const seen = new Set();
  const add = (a, b) => {
    const pair = stringPair(a, b);
    if (!pair) return;
    const key = pair.join('-');
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push(pair);
  };

  const reached = new Set();
  const travelled = trips.filter((trip) => tripStatuses.has(trip.status)).sort((a, b) => dayOf(a.startDate) - dayOf(b.startDate));
  for (const trip of travelled) {
    const places = (trip.countryCodes || []).map((code) => stringPlace(code, splitUk));
    places.forEach((place, i) => {
      reached.add(place);
      if (i > 0) add(places[i - 1], place);
    });
  }

  const rest = visits
    .filter((visit) => visitStatuses.has(visit.status))
    .map((visit) => ({ ...visit, place: stringPlace(visit.countryCode, splitUk) }))
    .filter((visit) => !reached.has(visit.place))
    // Places wanted have no first visit: the order they were marked
    .sort((a, b) => (planned ? 0 : dayOf(a.firstVisitedOn) - dayOf(b.firstVisitedOn)) || dayOf(a.createdAt) - dayOf(b.createdAt));
  const order = [...new Set(rest.map((visit) => visit.place))];
  order.forEach((place, i) => {
    if (i > 0) add(order[i - 1], place);
  });
  return pairs;
}

/** What the map reply carries for a string. */
export const stringView = (row) => ({ id: row.id, kind: row.kind ?? 'VISITED', from: row.fromCode, to: row.toCode });
