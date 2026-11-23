// Life's One Shots: the server's rules (server/src/utils/oneShots.js), copied for mock mode and
// the page's own counting. Change both together: tests/unit/utils/oneShots/oneShotRules.test.js
// runs the same cases through each.
import { BIG_FIVE, ONE_SHOTS, ONE_SHOT_BY_KEY } from './oneShotItems';
import { parseMomentDate } from '@/utils/moments/momentDates';
import { serverText } from '@/utils/regex/regex';

export const ONE_SHOT_NOTES_MAX = 500;
export const ONE_SHOT_TRAVELLERS_MAX = 20;
export const ONE_SHOT_SOURCES = Object.freeze(['MANUAL', 'FLIGHT']);
export const POLAR_CIRCLE_LATITUDE = 66.5634;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (value) => typeof value === 'string' && (UUID.test(value) || /^[a-z][a-z0-9-]{1,60}$/.test(value));
const isCountryCode = (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value);

/**
 * A tick's fields from a request body (the server's parseOneShotInput): each optional, null
 * or "" clears. Mock ids aren't uuids, so an id here is a uuid or a mock's "photo-…".
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
  if (body.photoId !== undefined) {
    if (body.photoId === null || body.photoId === '') value.photoId = null;
    else if (isId(body.photoId)) value.photoId = body.photoId;
    else return { ok: false, field: 'photoId' };
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') return { ok: false, field: 'notes' };
    value.notes = body.notes ? serverText(body.notes).slice(0, ONE_SHOT_NOTES_MAX) || null : null;
  }
  if (body.travellerIds !== undefined) {
    const ids = body.travellerIds;
    if (!Array.isArray(ids) || ids.length > ONE_SHOT_TRAVELLERS_MAX || !ids.every(isId) || new Set(ids).size !== ids.length) {
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

const toVector = ({ latitude, longitude }) => {
  const lat = (latitude * Math.PI) / 180;
  const lng = (longitude * Math.PI) / 180;
  return [Math.cos(lat) * Math.cos(lng), Math.cos(lat) * Math.sin(lng), Math.sin(lat)];
};
const toPoint = ([x, y, z]) => ({
  latitude: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
  longitude: (Math.atan2(y, x) * 180) / Math.PI,
});

/** Points along the great circle between two places, both ends included. */
export function greatCirclePoints(from, to, steps = 96) {
  const a = toVector(from);
  const b = toVector(to);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const angle = Math.acos(dot);
  if (angle < 1e-6) return [toPoint(a), toPoint(b)];
  const sin = Math.sin(angle);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const wa = Math.sin((1 - t) * angle) / sin;
    const wb = Math.sin(t * angle) / sin;
    return toPoint([wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2]]);
  });
}

/** The lines on the globe a flight crossed (EQUATOR, DATE_LINE, ARCTIC_CIRCLE, ANTARCTIC_CIRCLE). -> a Set */
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

const PLACE_CROSSINGS = Object.freeze({ XN: 'arctic-circle', QN: 'arctic-circle', XS: 'antarctic-circle', QS: 'antarctic-circle' });

/** What the map's flights and poles suggest ticking (the server's oneShotSuggestions). */
export function oneShotSuggestions({ flights = [], airportOf, visited = new Set(), ticked = new Set() }) {
  const byItem = new Map();
  const autoItems = ONE_SHOTS.filter((shot) => shot.auto);
  const day = (value) => String(value).slice(0, 10);
  const oldestFirst = [...flights].sort((a, b) => day(a.flownOn).localeCompare(day(b.flownOn)));
  for (const flight of oldestFirst) {
    const from = airportOf(flight.fromAirport);
    const to = airportOf(flight.toAirport);
    if (!from || !to) continue;
    const crossed = flightCrossings(from, to);
    for (const shot of autoItems) {
      if (!crossed.has(shot.auto) || byItem.has(shot.key) || ticked.has(shot.key)) continue;
      const flownOn = day(flight.flownOn);
      byItem.set(shot.key, { itemKey: shot.key, seenOn: flownOn, from: 'FLIGHT', flight: { id: flight.id, fromAirport: flight.fromAirport, toAirport: flight.toAirport, flownOn } });
    }
  }
  for (const [code, key] of Object.entries(PLACE_CROSSINGS)) {
    if (visited.has(code) && !byItem.has(key) && !ticked.has(key)) byItem.set(key, { itemKey: key, seenOn: null, from: 'PLACE', code });
  }
  return autoItems.filter((shot) => byItem.has(shot.key)).map((shot) => byItem.get(shot.key));
}

/** How many of each list are ticked, and of the Big Five: `{ WILDLIFE, WONDERS, JOURNEYS, bigFive }`. */
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
