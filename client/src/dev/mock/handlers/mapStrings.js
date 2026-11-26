// Mock mode only: strings between places (docs/API.md "Strings"), as the server's
// controllers/mapStrings.js. They live in `db.mapStrings` ({ id, mapId, kind, from, to,
// createdAt }; a row with no kind is VISITED, as every string was before 25 Nov 2026); the map
// reply carries them (views.js mapView). Each kind is its own set of 500.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, newId } from '../store';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { mapRole } from '../views';
import { MAP_STRINGS_MAX, STRING_MESSAGES, autoStringPairs, kindOf, parseStringInput, parseStringKind, stringView } from '../mapStrings';

const NOT_FOUND = 'This map could not be found.';

function editableMap(params) {
  const map = getDb().maps.find((m) => m.id === params.mapId) || null;
  const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
  return denied ? { reply: denied } : { map };
}

const stringsOf = (mapId) => getDb().mapStrings.filter((s) => s.mapId === mapId);
const stringsOfKind = (mapId, kind) => stringsOf(mapId).filter((s) => kindOf(s) === kind);

/** A map's strings as the reply carries them, oldest first. */
export const mapStringsView = (mapId) => stringsOf(mapId).map(stringView);

export function registerMapStringRoutes() {
  route('POST', '/api/maps/:mapId/strings', ({ params, body }) => {
    const { map, reply } = editableMap(params);
    if (reply) return reply;
    const kind = parseStringKind(body?.kind);
    if (!kind) return fail(400, STRING_MESSAGES.stringKindInvalid);
    const parsed = parseStringInput(body, { splitUk: Boolean(map.splitUk) });
    if (!parsed.ok) return fail(400, parsed.message);
    const [from, to] = parsed.pair;
    if (!COUNTRY_BY_CODE[from] || !COUNTRY_BY_CODE[to]) return fail(400, STRING_MESSAGES.stringInvalid);
    const existing = stringsOfKind(map.id, kind).find((s) => s.from === from && s.to === to);
    if (existing) return ok({ string: stringView(existing) });
    if (stringsOfKind(map.id, kind).length >= MAP_STRINGS_MAX) return fail(409, STRING_MESSAGES.stringsFull);
    const string = { id: newId(), mapId: map.id, kind, from, to, createdAt: new Date().toISOString() };
    getDb().mapStrings.push(string);
    return ok({ string: stringView(string) }, 201);
  });

  route('POST', '/api/maps/:mapId/strings/auto', ({ params, body }) => {
    const { map, reply } = editableMap(params);
    if (reply) return reply;
    const kind = parseStringKind(body?.kind);
    if (!kind) return fail(400, STRING_MESSAGES.stringKindInvalid);
    const db = getDb();
    const trips = db.trips
      .filter((trip) => trip.mapId === map.id)
      .map((trip) => ({
        status: trip.status,
        startDate: trip.startDate,
        countryCodes: db.stops
          .filter((stop) => stop.tripId === trip.id)
          .sort((a, b) => a.position - b.position)
          .map((stop) => stop.countryCode)
          .filter(Boolean),
      }));
    const visits = db.visits.filter((visit) => visit.mapId === map.id);
    const pairs = autoStringPairs({ trips, visits, splitUk: Boolean(map.splitUk), kind });
    const tied = new Set(stringsOfKind(map.id, kind).map((s) => `${s.from}-${s.to}`));
    const fresh = pairs.filter((pair) => !tied.has(pair.join('-')));
    const room = Math.max(0, MAP_STRINGS_MAX - tied.size);
    const taken = fresh.slice(0, room);
    const now = Date.now();
    taken.forEach(([from, to], i) => db.mapStrings.push({ id: newId(), mapId: map.id, kind, from, to, createdAt: new Date(now + i).toISOString() }));
    return ok({ strings: mapStringsView(map.id), added: taken.length, full: fresh.length > room });
  });

  route('DELETE', '/api/maps/:mapId/strings/:stringId', ({ params }) => {
    const { map, reply } = editableMap(params);
    if (reply) return reply;
    const db = getDb();
    if (!stringsOf(map.id).some((s) => s.id === params.stringId)) return fail(404, STRING_MESSAGES.stringNotFound);
    db.mapStrings = db.mapStrings.filter((s) => s.id !== params.stringId);
    return ok({ removed: params.stringId });
  });

  // Every string of a kind (VISITED when none is given)
  route('DELETE', '/api/maps/:mapId/strings', ({ params, query }) => {
    const { map, reply } = editableMap(params);
    if (reply) return reply;
    const kind = parseStringKind(query?.kind);
    if (!kind) return fail(400, STRING_MESSAGES.stringKindInvalid);
    const db = getDb();
    const removed = stringsOfKind(map.id, kind).length;
    db.mapStrings = db.mapStrings.filter((s) => s.mapId !== map.id || kindOf(s) !== kind);
    return ok({ removed });
  });
}
