// Mock mode only: Life's One Shots (docs/API.md "Life's One Shots"), as the server's
// controllers/oneShots.js and the share link's route answer them. `db.oneShots`: { id, mapId,
// itemKey, seenOn, datePrecision, countryCode, photoIds (up to 5, the first on its card),
// notes, source, travellerIds, createdById, createdAt }. Ticking or changing one needs editor on the map and a verified
// email (mockAdapter.js NEEDS_VERIFIED_EMAIL); a country given is marked visited.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, normaliseShareCode } from '../store';
import { atLeast, countryExists, higherRole, mapRole, markVisited, photoUrls } from '../views';
import { placeOnMap } from '@/utils/map/ukNations';
import { isOneShotKey } from '@/utils/oneShots/oneShotItems';
import { oneShotSuggestions, parseOneShotInput } from '@/utils/oneShots/oneShotRules';
import { AIRPORT_DATA } from '@/utils/flights/airportData';
import { airportFrom } from '@/utils/flights/airports';

const NOT_FOUND = 'This map could not be found.';
const SHARE_NOT_FOUND = 'This link has expired or was never shared with you.';
// The server's EVENT_MESSAGES
export const ONE_SHOT_MESSAGES = {
  notFound: "That isn't one of Life's One Shots.",
  invalid: "Check the tick: a real date, a country on the map, a note of up to 500 characters and the map's own travellers.",
  photo: "Choose up to 5 of this map's own photos (not videos).",
  travellers: "Every traveller must be one of this map's travellers.",
  country: "That country isn't on the map.",
};

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
const day = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);

/** A tick's photos (an older store's one `photoId` as a list of one). */
export const tickPhotoIds = (tick) => tick.photoIds ?? (tick.photoId ? [tick.photoId] : []);

/** A tick as the server sends it: its photos in order, the first its card's (hidden ones to editors only). */
function view(tick, editor) {
  const db = getDb();
  const photos = tickPhotoIds(tick)
    .map((id) => db.photos.find((p) => p.id === id))
    .filter((photo) => photo && (editor || !photo.hidden))
    .map((photo) => {
      const urls = photoUrls(photo);
      return { id: photo.id, thumbUrl: urls.thumb, displayUrl: urls.display || urls.thumb };
    });
  return {
    id: tick.id,
    itemKey: tick.itemKey,
    seenOn: tick.seenOn,
    datePrecision: tick.datePrecision,
    countryCode: tick.countryCode,
    notes: tick.notes,
    source: tick.source,
    travellerIds: [...(tick.travellerIds || [])],
    photos,
    photo: photos[0] ?? null,
    createdAt: tick.createdAt,
  };
}

// The latest seen first, undated last (the server's order)
const byLatest = (a, b) => (a.seenOn && b.seenOn ? (a.seenOn < b.seenOn ? 1 : a.seenOn > b.seenOn ? -1 : 0) : a.seenOn ? -1 : b.seenOn ? 1 : 0) || (a.createdAt < b.createdAt ? 1 : -1);

function listFor(map, editor) {
  const db = getDb();
  const ticks = (db.oneShots || []).filter((t) => t.mapId === map.id).sort(byLatest);
  const suggestions = editor
    ? oneShotSuggestions({
        flights: db.flights.filter((f) => f.mapId === map.id).map((f) => ({ id: f.id, fromAirport: f.from, toAirport: f.to, flownOn: f.flownOn })),
        airportOf: (code) => airportFrom(AIRPORT_DATA, code),
        visited: new Set(db.visits.filter((v) => v.mapId === map.id && ['VISITED', 'LIVED'].includes(v.status)).map((v) => v.countryCode)),
        ticked: new Set(ticks.map((t) => t.itemKey)),
      })
    : [];
  return { oneShots: ticks.map((tick) => view(tick, editor)), suggestions };
}

function editable(params) {
  const map = findMap(params.mapId);
  const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
  if (denied) return { reply: denied };
  if (!isOneShotKey(params.itemKey)) return { reply: fail(404, ONE_SHOT_MESSAGES.notFound) };
  return { map };
}

export function registerOneShotRoutes() {
  route('GET', '/api/maps/:mapId/one-shots', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'VIEWER', NOT_FOUND);
    return denied || ok(listFor(map, atLeast(role, 'EDITOR')));
  });

  route('PUT', '/api/maps/:mapId/one-shots/:itemKey', ({ params, body }) => {
    const { map, reply } = editable(params);
    if (reply) return reply;
    const parsed = parseOneShotInput(params.itemKey, body || {});
    if (!parsed.ok) return fail(400, ONE_SHOT_MESSAGES.invalid);
    const { travellerIds, photoIds, ...fields } = parsed.value;
    const db = getDb();
    let place = null;
    if (fields.countryCode) {
      if (!countryExists(fields.countryCode)) return fail(400, ONE_SHOT_MESSAGES.country);
      place = placeOnMap(fields.countryCode, Boolean(map.splitUk));
      fields.countryCode = place;
    }
    if (photoIds && !photoIds.every((id) => db.photos.some((p) => p.id === id && p.mapId === map.id && p.kind !== 'VIDEO'))) return fail(400, ONE_SHOT_MESSAGES.photo);
    if (travellerIds && !travellerIds.every((id) => db.travellers.some((t) => t.id === id && t.mapId === map.id))) return fail(400, ONE_SHOT_MESSAGES.travellers);
    if (fields.seenOn !== undefined) fields.seenOn = day(fields.seenOn);

    db.oneShots ||= [];
    let tick = db.oneShots.find((t) => t.mapId === map.id && t.itemKey === params.itemKey);
    const created = !tick;
    if (!tick) {
      tick = { id: newId(), mapId: map.id, itemKey: params.itemKey, seenOn: null, datePrecision: null, countryCode: null, photoIds: [], notes: null, source: 'MANUAL', travellerIds: [], createdById: me()?.id ?? null, createdAt: new Date().toISOString() };
      db.oneShots.push(tick);
    }
    Object.assign(tick, fields);
    if (travellerIds) tick.travellerIds = travellerIds;
    if (photoIds) {
      tick.photoIds = photoIds;
      delete tick.photoId;
    }
    if (place) markVisited(map.id, place, 'MANUAL');
    return ok({ oneShot: view(tick, true), created, countryCode: place }, created ? 201 : 200);
  });

  route('DELETE', '/api/maps/:mapId/one-shots/:itemKey', ({ params }) => {
    const { map, reply } = editable(params);
    if (reply) return reply;
    const db = getDb();
    db.oneShots = (db.oneShots || []).filter((t) => !(t.mapId === map.id && t.itemKey === params.itemKey));
    return ok({ itemKey: params.itemKey, ticked: false });
  });

  // Through a map's share link (a trip's link has none: 404): the ticks, no suggestions
  route('GET', '/api/shared/:code/one-shots', ({ params }) => {
    const normal = normaliseShareCode(params.code);
    const map = normal ? getDb().maps.find((m) => m.shareCode === normal) : null;
    const role = map ? higherRole(mapRole(map), map.linkAccess === 'ANYONE_WITH_LINK' ? 'VIEWER' : null) : null;
    if (!role) return fail(404, SHARE_NOT_FOUND);
    return ok({ oneShots: listFor(map, false).oneShots, suggestions: [] });
  });
}
