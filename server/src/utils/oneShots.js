// Life's One Shots (24 Nov 2026, the user's wish and name; docs/API.md "Life's One Shots"):
// the rules for a tick, the lines on the globe a flight crossed and what they suggest.
// Pure, so tested on its own (tests/oneShots.test.js); the catalogue is
// utils/constants/oneShots.js.
import { BIG_FIVE, ONE_SHOTS, ONE_SHOT_BY_KEY } from './constants/oneShots.js';
import { parseMomentDate } from './moments.js';
import { isCountryCode, isUuid, toDateOnly } from './travelValidation.js';
import { sanitizeText } from './sanitize.js';

export const ONE_SHOT_NOTES_MAX = 500;
export const ONE_SHOT_TRAVELLERS_MAX = 20;
// Photos of you with it, the first on its card (26 Nov 2026, the user's wish)
export const ONE_SHOT_PHOTOS_MAX = 5;
export const ONE_SHOT_SOURCES = Object.freeze(['MANUAL', 'FLIGHT']);

// The polar circles' latitude (2024; it drifts a little each year)
export const POLAR_CIRCLE_LATITUDE = 66.5634;

/**
 * A tick's fields from a request body, each optional (left out: kept as it is; null or "":
 * cleared): `seenOn` with `datePrecision` (as a moment's date: "2024", "2024-03" or
 * "2024-03-12", the precision what's written unless given), `countryCode`, `photoIds`
 * (distinct ids in order, the first on its card, at most ONE_SHOT_PHOTOS_MAX; the older
 * `photoId`, one id or null, is read as a list of one or none when `photoIds` isn't sent),
 * `notes` (cleaned, cut to ONE_SHOT_NOTES_MAX), `travellerIds` (distinct ids, at most
 * ONE_SHOT_TRAVELLERS_MAX) and `source` (FLIGHT only for an item a flight can tick).
 * Whether the country, photos and travellers are the map's is the caller's to check.
 * -> `{ ok: true, value }` or `{ ok: false, field }`
 */
export function parseOneShotInput(itemKey, body = {}) {
  const shot = ONE_SHOT_BY_KEY.get(itemKey);
  if (!shot) return { ok: false, field: 'itemKey' };
  const value = {};

  const date = parseMomentDate(body.seenOn, body.datePrecision);
  if (!date.ok) return { ok: false, field: 'seenOn' };
  if (date.value) {
    value.seenOn = date.value.happenedOn;
    value.datePrecision = date.value.datePrecision;
  }

  if (body.countryCode !== undefined) {
    if (body.countryCode === null || body.countryCode === '') value.countryCode = null;
    else if (isCountryCode(body.countryCode)) value.countryCode = body.countryCode;
    else return { ok: false, field: 'countryCode' };
  }

  if (body.photoIds !== undefined) {
    const ids = body.photoIds;
    if (!Array.isArray(ids) || ids.length > ONE_SHOT_PHOTOS_MAX || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
      return { ok: false, field: 'photoIds' };
    }
    value.photoIds = ids;
  } else if (body.photoId !== undefined) {
    if (body.photoId === null || body.photoId === '') value.photoIds = [];
    else if (isUuid(body.photoId)) value.photoIds = [body.photoId];
    else return { ok: false, field: 'photoIds' };
  }

  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') return { ok: false, field: 'notes' };
    value.notes = body.notes ? sanitizeText(body.notes, { maxLength: ONE_SHOT_NOTES_MAX }) || null : null;
  }

  if (body.travellerIds !== undefined) {
    const ids = body.travellerIds;
    if (!Array.isArray(ids) || ids.length > ONE_SHOT_TRAVELLERS_MAX || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
      return { ok: false, field: 'travellerIds' };
    }
    value.travellerIds = ids;
  }

  if (body.source !== undefined) {
    if (!ONE_SHOT_SOURCES.includes(body.source) || (body.source === 'FLIGHT' && !shot.auto)) return { ok: false, field: 'source' };
    value.source = body.source;
  }
  return { ok: true, value };
}

// A point as a unit vector, and back
const toVector = ({ latitude, longitude }) => {
  const lat = (latitude * Math.PI) / 180;
  const lng = (longitude * Math.PI) / 180;
  return [Math.cos(lat) * Math.cos(lng), Math.cos(lat) * Math.sin(lng), Math.sin(lat)];
};
const toPoint = ([x, y, z]) => ({
  latitude: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
  longitude: (Math.atan2(y, x) * 180) / Math.PI,
});

/** Points along the great circle between two places, both ends included (`steps` + 1 of them). */
export function greatCirclePoints(from, to, steps = 96) {
  const a = toVector(from);
  const b = toVector(to);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const angle = Math.acos(dot);
  // The same place (a few metres apart at most): no path to follow
  if (angle < 1e-6) return [toPoint(a), toPoint(b)];
  const sin = Math.sin(angle);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const wa = Math.sin((1 - t) * angle) / sin;
    const wb = Math.sin(t * angle) / sin;
    return toPoint([wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2]]);
  });
}

/**
 * The lines on the globe a flight between two places crossed, as the catalogue's `auto`
 * names: EQUATOR (from one hemisphere to the other), DATE_LINE (over ±180°, the Date Line's
 * own line, near enough), ARCTIC_CIRCLE and ANTARCTIC_CIRCLE (reaching past one). -> a Set
 */
export function flightCrossings(from, to) {
  const crossed = new Set();
  const points = greatCirclePoints(from, to);
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (point.latitude >= POLAR_CIRCLE_LATITUDE) crossed.add('ARCTIC_CIRCLE');
    if (point.latitude <= -POLAR_CIRCLE_LATITUDE) crossed.add('ANTARCTIC_CIRCLE');
    if (!i) continue;
    const before = points[i - 1];
    if ((before.latitude < 0 && point.latitude > 0) || (before.latitude > 0 && point.latitude < 0)) crossed.add('EQUATOR');
    if (Math.abs(point.longitude - before.longitude) > 180) crossed.add('DATE_LINE');
  }
  return crossed;
}

// A special place on the map that means a polar circle was crossed to reach it
const PLACE_CROSSINGS = Object.freeze({ XN: 'arctic-circle', QN: 'arctic-circle', XS: 'antarctic-circle', QS: 'antarctic-circle' });

/**
 * What the map's travels say it has done but hasn't ticked: the lines on the globe its
 * flights crossed (the earliest flight for each) and the polar circles its poles mean.
 * `flights`: `[{ id, fromAirport, toAirport, flownOn }]`; `airportOf(code)`: its position
 * (utils/flights.js airportByCode); `visited`: the places marked visited or lived in;
 * `ticked`: the item keys already ticked.
 * -> `[{ itemKey, seenOn, from: 'FLIGHT', flight: { id, fromAirport, toAirport, flownOn } }
 *     | { itemKey, seenOn: null, from: 'PLACE', code }]`, in the catalogue's order
 */
export function oneShotSuggestions({ flights = [], airportOf, visited = new Set(), ticked = new Set() }) {
  const byItem = new Map();
  const autoItems = ONE_SHOTS.filter((shot) => shot.auto);
  const oldestFirst = [...flights].sort((a, b) => toDateOnly(a.flownOn).localeCompare(toDateOnly(b.flownOn)));
  for (const flight of oldestFirst) {
    const from = airportOf(flight.fromAirport);
    const to = airportOf(flight.toAirport);
    if (!from || !to) continue;
    const crossed = flightCrossings(from, to);
    for (const shot of autoItems) {
      if (!crossed.has(shot.auto) || byItem.has(shot.key) || ticked.has(shot.key)) continue;
      const flownOn = toDateOnly(flight.flownOn);
      byItem.set(shot.key, {
        itemKey: shot.key,
        seenOn: flownOn,
        from: 'FLIGHT',
        flight: { id: flight.id, fromAirport: flight.fromAirport, toAirport: flight.toAirport, flownOn },
      });
    }
  }
  for (const [code, key] of Object.entries(PLACE_CROSSINGS)) {
    if (visited.has(code) && !byItem.has(key) && !ticked.has(key)) byItem.set(key, { itemKey: key, seenOn: null, from: 'PLACE', code });
  }
  return autoItems.filter((shot) => byItem.has(shot.key)).map((shot) => byItem.get(shot.key));
}

/** How many of each list are ticked, and whether the Big Five are: `{ WILDLIFE, WONDERS, JOURNEYS, bigFive }`. */
export function oneShotCounts(keys = []) {
  const counts = { WILDLIFE: 0, WONDERS: 0, JOURNEYS: 0, bigFive: 0 };
  for (const key of new Set(keys)) {
    const shot = ONE_SHOT_BY_KEY.get(key);
    if (!shot) continue;
    counts[shot.list] += 1;
    if (BIG_FIVE.includes(key)) counts.bigFive += 1;
  }
  return counts;
}
