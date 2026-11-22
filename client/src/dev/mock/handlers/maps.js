// Mock mode only: maps, travellers, visits, stats, and the map's trips and photos.
import { deny, fail, ok, route } from '../mockAdapter';
import { countryListPages } from '../countryLists';
import { getDb, me, newId, newShareCode, session } from '../store';
import { declaredSizeProblem, mockUpload, presignMockUpload } from '../uploads';
import { countryAtPosition } from '../countryLookup';
import { firstPosition, setShotAt } from '../photoOrder';
import {
  LOCKED_MAP_MESSAGE,
  countryCapProblem,
  graceForNewOwner,
  isMapLocked,
  mapPlanId,
  mapSlots,
  mapSlotsMessage,
  photoSizesProblem,
  effectivePlan,
  VIDEO_MESSAGES,
} from '../plans';
import { isPole } from '@/utils/map/specialPlaces';
import { UK, isUkNation, placeOnMap } from '@/utils/map/ukNations';
import { MAP_STYLE_IDS } from '@/utils/map/mapStyles';
import { ukNationAt } from '../ukNationLookup';
import { setMapSplitUk } from '../ukNationSplit';
import { adsFor } from '../offers';
import { parseRecapYear, yearRecap } from '../recaps';
import {
  LANDMARK_ROWS,
  atLeast,
  countryExists,
  distanceM,
  mapRole,
  mapStats,
  mapSummary,
  mapTripsView,
  mapView,
  markParentsVisited,
  markVisited,
  photoDetail,
  photoPage,
  tripRole,
  tripView,
} from '../views';
import { sanitizeText } from '../moments';

const GROUP_TYPES = ['SOLO', 'COUPLE', 'FAMILY'];
const VISIT_STATUSES = ['VISITED', 'LIVED', 'WANT_TO_GO'];
const TRIP_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];
const WEB_IMAGE_TYPES = ['image/jpeg', 'image/webp', 'image/png'];
// Server mediaConstants.js PHOTO_CONTENT_TYPES: the print copy is JPEG only (print shops)
const PHOTO_TYPES = { THUMB: WEB_IMAGE_TYPES, DISPLAY: WEB_IMAGE_TYPES, ORIGINAL: WEB_IMAGE_TYPES, PRINT: ['image/jpeg'] };
const MB = 1024 * 1024;
// Server mediaConstants.js PHOTO_MAX_BYTES
const PHOTO_MAX_BYTES = { THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB, PRINT: 5 * MB };
// The map routes' own answers carry the plan fields (owner and editors)
const WITH_PLAN = { withPlan: true };
// Server PHOTO_EXTENSIONS: each file's key ends with its type's extension
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
// Server EVENT_MESSAGES for uploads
const UPLOAD_INVALID = 'The upload doesn’t match what was requested. Please try again.';
const TYPE_INVALID = "That file type isn't supported for this photo size.";

/**
 * The server's parseUploadKind: this upload takes photos only; videos go to Cloudflare
 * Stream (handlers/videos.js). -> `{ kind, durationS }`, or `{ error: [status, message] }`.
 */
function uploadKind(body) {
  const kind = body.kind ?? 'PHOTO';
  if (kind === 'VIDEO') return { error: [400, VIDEO_MESSAGES.useVideoUpload] };
  if (kind !== 'PHOTO') return { error: [400, UPLOAD_INVALID] };
  return { kind, durationS: null };
}
// Server EVENT_MESSAGES for transfers
const TRANSFER = {
  invalidUserId: 'Say who the new owner is (their user id).',
  toSelf: 'You already own this map.',
  notMember: 'Only someone already on this map can become its owner. Add them first.',
  notReady: 'The new owner needs an active account with a verified email address.',
};
// Server UNCONFIRMED_UPLOAD_LIMIT.photo: files presigned and never saved, per user, over a day
const UNCONFIRMED_PHOTO_FILES = 60;
const NOT_FOUND = 'This map could not be found.';
// A country's one note (the server's NOTES_MAX and EVENT_MESSAGES.notesInvalid)
const NOTES_MAX = 1000;
const NOTES_NOT_TEXT = "A country's notes must be text.";
// As the server's MAP_CREATE_DAILY_USER_LIMIT: 20 new maps per user a day, then 429
const MAP_CREATE_DAILY_LIMIT = 20;
const DAY_MS = 86400000;
const signedOut = () => fail(401, 'No valid session. Please sign in.');
// As the server's EVENT_MESSAGES.poleNotATravellerCountry: Antarctica can be a birth or
// favourite place, a pole can't
const POLE_NOT_A_HOME = 'Choose a country or Antarctica, not a pole.';
const TRAVELLER_COUNTRY_FIELDS = ['birthCountryCode', 'favouriteCountryCode'];
const hasPole = (traveller) => TRAVELLER_COUNTRY_FIELDS.some((field) => isPole(cleanCountry(traveller?.[field])));

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
const cleanText = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
const cleanCountry = (code) => (typeof code === 'string' && countryExists(code.toUpperCase()) ? code.toUpperCase() : null);
// As the server (EVENT_MESSAGES.countryNotFound, visitNotFound, tooManyTravellers; MAX_TRAVELLERS)
const COUNTRY_NOT_FOUND = "That country isn't on the map.";
const VISIT_NOT_FOUND = "That country isn't marked on this map.";
const MAX_TRAVELLERS = 20;
const TOO_MANY_TRAVELLERS = 'A map can have up to 20 travellers.';
// Each kind of map's travellers, as the server (GROUP_MAX_TRAVELLERS and its messages)
const GROUP_MAX_TRAVELLERS = { SOLO: 1, COUPLE: 2, FAMILY: MAX_TRAVELLERS };
const groupFull = (groupType) =>
  groupType === 'SOLO'
    ? `A map that's just for you has one traveller. Choose "A couple" or "A family" to add more.`
    : `A couple's map has two travellers. Choose "A family" to add more.`;
const tooManyForGroup = (groupType) =>
  groupType === 'SOLO' ? '"Just me" is for one traveller: remove the others first.' : '"A couple" is for two travellers: remove the others first.';
// A traveller's places are countries, as on the server: a UK nation (a birth moment in
// Scotland) is the UK. Empty or null clears it; anything not a place is the server's 400.
const travellerCountry = (value) =>
  value === null || value === '' ? { value: null } : cleanCountry(value) ? { value: placeOnMap(cleanCountry(value), false) } : { error: COUNTRY_NOT_FOUND };

// -> { fields } or { error } (a pole as a birth or favourite place, or no such place: 400)
function travellerFields(body) {
  const out = {};
  if (body.name !== undefined) out.name = cleanText(body.name, 60);
  for (const field of TRAVELLER_COUNTRY_FIELDS) {
    if (body[field] === undefined) continue;
    const place = travellerCountry(body[field]);
    if (place.error) return { error: place.error };
    out[field] = place.value;
  }
  if (hasPole(body)) return { error: POLE_NOT_A_HOME };
  if (body.position !== undefined && Number.isInteger(body.position)) out.position = body.position;
  return { fields: out };
}

// `owner`: the signed-in user, or (a default map remade after a transfer) someone else
export function createMapRecord({ name, groupType, isDefault = false, travellers = [], owner = me() }) {
  const db = getDb();
  // A new map shows the UK as its four nations, as the server's default (18 Nov 2026)
  const map = { id: newId(), name, groupType, isDefault, ownerId: owner.id, linkAccess: 'RESTRICTED', shareCode: newShareCode(), graceUntil: null, splitUk: true, createdAt: new Date().toISOString() };
  db.maps.push(map);
  const list = travellers.length ? travellers : [{ name: owner.name.split(' ')[0] || 'Me' }];
  list.forEach((t, i) => {
    db.travellers.push({ id: newId(), mapId: map.id, name: cleanText(t.name, 60) || `Traveller ${i + 1}`, position: i, userId: i === 0 ? owner.id : null, birthCountryCode: travellerCountry(t.birthCountryCode ?? null).value ?? null, favouriteCountryCode: travellerCountry(t.favouriteCountryCode ?? null).value ?? null });
  });
  return map;
}

/**
 * As the server's transferMap (docs/API.md, "Transferring a map"): the new owner's member
 * row goes, the map is nobody's default, it gets 60 days' grace when the new owner has no
 * free slot, the old owner stays as an editor if asked, and a default map handed over is
 * replaced with a new "My map" for the old owner.
 */
export function transferMapRecord(map, toUserId, { keepOldOwnerAsEditor = false } = {}) {
  const db = getDb();
  const fromUserId = map.ownerId;
  const wasDefault = map.isDefault;
  const graceUntil = graceForNewOwner(map.id, toUserId);
  const before = db.mapMembers.find((m) => m.mapId === map.id && m.userId === toUserId);
  db.mapMembers = db.mapMembers.filter((m) => !(m.mapId === map.id && m.userId === toUserId));
  Object.assign(map, { ownerId: toUserId, isDefault: false, graceUntil });
  if (keepOldOwnerAsEditor && fromUserId !== toUserId) {
    // Handed to a co-owner, the two swap places when the old owner is a traveller (as the server)
    const isTraveller = db.travellers.some((t) => t.mapId === map.id && t.userId === fromUserId);
    const role = before?.role === 'CO_OWNER' && isTraveller ? 'CO_OWNER' : 'EDITOR';
    const existing = db.mapMembers.find((m) => m.mapId === map.id && m.userId === fromUserId);
    if (existing) existing.role = role;
    else db.mapMembers.push({ mapId: map.id, userId: fromUserId, role, createdAt: new Date().toISOString() });
  } else if (fromUserId !== toUserId) {
    db.travellers.forEach((t) => {
      if (t.mapId === map.id && t.userId === fromUserId) t.userId = null;
    });
  }
  const oldOwner = db.users.find((u) => u.id === fromUserId);
  if (wasDefault && oldOwner && !db.maps.some((m) => m.ownerId === fromUserId && m.isDefault)) {
    createMapRecord({ name: 'My map', groupType: 'SOLO', isDefault: true, owner: oldOwner });
  }
  return { fromUserId, wasDefault, graceUntil };
}

export function registerMapRoutes() {
  route('GET', '/api/maps', () => {
    if (!session.signedIn) return signedOut();
    const db = getDb();
    if (!db.maps.some((m) => m.ownerId === me().id && m.isDefault)) createMapRecord({ name: 'My map', groupType: 'SOLO', isDefault: true });
    const owned = db.maps.filter((m) => m.ownerId === me().id);
    const shared = db.maps.filter((m) => m.ownerId !== me().id && mapRole(m));
    return ok({ maps: [...owned, ...shared].map((m) => mapSummary(m, mapRole(m))) });
  });

  route('POST', '/api/maps', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const db = getDb();
    const since = Date.now() - DAY_MS;
    db.mapCreations = (db.mapCreations || []).filter((c) => c.at > since);
    if (db.mapCreations.filter((c) => c.userId === me().id).length >= MAP_CREATE_DAILY_LIMIT) {
      return fail(429, 'Too many requests — please try again later.');
    }
    db.mapCreations.push({ userId: me().id, at: Date.now() });
    const name = cleanText(body.name, 80);
    if (!name) return fail(400, 'Give the map a name.');
    if (!GROUP_TYPES.includes(body.groupType)) return fail(400, 'Choose solo, couple or family.');
    const travellers = Array.isArray(body.travellers) ? body.travellers : [];
    if (travellers.length > MAX_TRAVELLERS) return fail(400, TOO_MANY_TRAVELLERS);
    if (travellers.length > GROUP_MAX_TRAVELLERS[body.groupType]) return fail(400, tooManyForGroup(body.groupType));
    for (const t of travellers) {
      for (const field of TRAVELLER_COUNTRY_FIELDS) if (t?.[field] != null && travellerCountry(t[field]).error) return fail(400, COUNTRY_NOT_FOUND);
    }
    if (travellers.some(hasPole)) return fail(400, POLE_NOT_A_HOME);
    // The body first, then a free map slot (402 with the extra map's price on the plan)
    if (!mapSlots(me().id).canCreate) return fail(402, mapSlotsMessage(effectivePlan(me().id).plan));
    const map = createMapRecord({ name, groupType: body.groupType, travellers });
    // Born there is been there, as the server's markBirthplaces: the place as each traveller
    // was saved ("de" is DE, a UK nation the UK), never the code as sent
    for (const t of db.travellers.filter((row) => row.mapId === map.id)) markVisited(map.id, t.birthCountryCode, 'MANUAL');
    return ok({ map: mapView(map, 'OWNER', WITH_PLAN) }, 201);
  });

  route('GET', '/api/maps/:mapId', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    // How often its galleries show an offer card to the caller (docs/API.md, "Travel offers")
    return deny(role, 'VIEWER', NOT_FOUND) || ok({ map: { ...mapView(map, role, WITH_PLAN), ads: adsFor(map) } });
  });

  // The owner's main (included) map; the old default becomes an extra map
  route('POST', '/api/maps/:mapId/main', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'OWNER', NOT_FOUND);
    if (denied) return denied;
    getDb().maps.forEach((m) => {
      if (m.ownerId === map.ownerId) m.isDefault = m.id === map.id;
    });
    return ok({ map: mapView(map, role, WITH_PLAN) });
  });

  // The owner puts a map on their plan (a paid extra map's slot), or takes it back (19 Nov 2026, as the server)
  route('POST', '/api/maps/:mapId/upgrade', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'OWNER', NOT_FOUND);
    if (denied) return denied;
    if (!map.isDefault && !map.upgradedAt) map.upgradedAt = new Date().toISOString();
    return ok({ map: mapView(map, role, WITH_PLAN) });
  });
  route('DELETE', '/api/maps/:mapId/upgrade', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'OWNER', NOT_FOUND);
    if (denied) return denied;
    map.upgradedAt = null;
    return ok({ map: mapView(map, role, WITH_PLAN) });
  });

  // Hand the map to someone already on it (an active account, verified address)
  route('POST', '/api/maps/:mapId/transfer', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'OWNER', NOT_FOUND);
    if (denied) return denied;
    const { userId } = body;
    const stayAsEditor = body.stayAsEditor ?? true;
    if (typeof userId !== 'string' || !userId || userId.length > 255) return fail(400, TRANSFER.invalidUserId);
    if (typeof stayAsEditor !== 'boolean') return fail(400, 'Malformed data.');
    if (userId === me().id) return fail(400, TRANSFER.toSelf);
    const member = db.mapMembers.find((m) => m.mapId === map.id && m.userId === userId);
    const target = db.users.find((u) => u.id === userId);
    if (!member || !target) return fail(400, TRANSFER.notMember);
    if (target.isActive === false || target.emailVerified !== true) return fail(400, TRANSFER.notReady);
    transferMapRecord(map, userId, { keepOldOwnerAsEditor: stayAsEditor });
    const stayedAs = stayAsEditor ? mapRole(map) || 'EDITOR' : null;
    return ok({ map: stayedAs ? mapView(map, stayedAs, WITH_PLAN) : { id: map.id, name: map.name, role: null } });
  });

  // The map's settings: the owner or a co-owner (19 Nov 2026)
  route('PATCH', '/api/maps/:mapId', ({ params, body }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'CO_OWNER', NOT_FOUND);
    if (denied) return denied;
    // Everything is checked before anything changes, as on the server
    const name = body.name !== undefined ? cleanText(body.name, 80) : null;
    if (body.name !== undefined && !name) return fail(400, 'Give the map a name.');
    if (body.groupType !== undefined) {
      if (!GROUP_TYPES.includes(body.groupType)) return fail(400, 'Choose solo, couple or family.');
      const count = getDb().travellers.filter((t) => t.mapId === map.id).length;
      if (body.groupType !== map.groupType && count > GROUP_MAX_TRAVELLERS[body.groupType]) return fail(409, tooManyForGroup(body.groupType));
    }
    // Where the map's people live (docs/API.md "Stats"): a country or Antarctica, as a
    // traveller's places are (a UK nation is the UK, a region its country)
    let home;
    if (body.homeCountryCode !== undefined) {
      home = body.homeCountryCode ? cleanCountry(body.homeCountryCode) : null;
      if (body.homeCountryCode && !home) return fail(400, COUNTRY_NOT_FOUND);
      if (isPole(home)) return fail(400, POLE_NOT_A_HOME);
    }
    // The style everyone who opens the map sees it in (docs/API.md "Map styles")
    if (body.style !== undefined && !MAP_STYLE_IDS.includes(body.style)) return fail(400, 'Choose one of the map styles.');
    if (name) map.name = name;
    if (home !== undefined) map.homeCountryCode = home ? placeOnMap(home, false) : null;
    if (body.style !== undefined) map.style = body.style;
    if (body.groupType !== undefined) map.groupType = body.groupType;
    // The UK as its four nations: changing it moves the map's UK data (as the server)
    if (body.splitUk !== undefined) {
      if (typeof body.splitUk !== 'boolean') return fail(400, 'splitUk must be true or false.');
      setMapSplitUk(map, body.splitUk);
    }
    return ok({ map: mapView(map, role, WITH_PLAN) });
  });

  route('DELETE', '/api/maps/:mapId', ({ params }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'OWNER', NOT_FOUND);
    if (denied) return denied;
    if (map.isDefault) return fail(409, 'Your default map cannot be deleted.');
    const tripIds = new Set(db.trips.filter((t) => t.mapId === map.id).map((t) => t.id));
    const photoIds = new Set(db.photos.filter((p) => p.mapId === map.id).map((p) => p.id));
    db.maps = db.maps.filter((m) => m.id !== map.id);
    db.travellers = db.travellers.filter((t) => t.mapId !== map.id);
    db.mapMembers = db.mapMembers.filter((m) => m.mapId !== map.id);
    db.visits = db.visits.filter((v) => v.mapId !== map.id);
    db.trips = db.trips.filter((t) => t.mapId !== map.id);
    db.stops = db.stops.filter((s) => !tripIds.has(s.tripId));
    db.tripMembers = db.tripMembers.filter((m) => !tripIds.has(m.tripId));
    // Group trips: the ones added to this map, and this map's trips added elsewhere
    db.tripMaps = db.tripMaps.filter((l) => l.mapId !== map.id && !tripIds.has(l.tripId));
    db.moments = db.moments.filter((m) => m.mapId !== map.id);
    // Its badges and goals go with it
    db.badgeAwards = db.badgeAwards.filter((a) => a.mapId !== map.id);
    db.goals = db.goals.filter((g) => g.mapId !== map.id);
    db.invites = db.invites.filter((i) => i.mapId !== map.id && !tripIds.has(i.tripId));
    db.photos = db.photos.filter((p) => !photoIds.has(p.id));
    db.photoLandmarks = db.photoLandmarks.filter((pl) => !photoIds.has(pl.photoId));
    db.landmarkCovers = db.landmarkCovers.filter((c) => c.mapId !== map.id);
    db.themeEntries = (db.themeEntries || []).filter((e) => e.mapId !== map.id);
    // A challenge it counted in counts no map for that person until they pick another
    (db.challengeEntries || []).forEach((e) => {
      if (e.mapId === map.id) e.mapId = null;
    });
    return ok({ message: 'Map deleted.' });
  });

  route('GET', '/api/maps/:mapId/stats', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', NOT_FOUND) || ok({ stats: mapStats(map, role) });
  });

  // Its year in travel (docs/API.md "Year in travel"): anyone on the map
  route('GET', '/api/maps/:mapId/recap/:year', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'VIEWER', NOT_FOUND);
    if (denied) return denied;
    const year = parseRecapYear(params.year);
    if (!year) return fail(400, 'Choose a year from 1900 to next year.');
    return ok({ recap: yearRecap(map, role, year) });
  });

  // Travellers
  route('POST', '/api/maps/:mapId/travellers', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const { fields, error } = travellerFields(body);
    if (error) return fail(400, error);
    if (!fields.name) return fail(400, 'Add the traveller’s name.');
    if (db.travellers.filter((t) => t.mapId === map.id).length >= MAX_TRAVELLERS) return fail(400, TOO_MANY_TRAVELLERS);
    if (db.travellers.filter((t) => t.mapId === map.id).length >= GROUP_MAX_TRAVELLERS[map.groupType]) return fail(409, groupFull(map.groupType));
    const position = fields.position ?? db.travellers.filter((t) => t.mapId === map.id).length;
    const traveller = { id: newId(), mapId: map.id, userId: null, birthCountryCode: null, favouriteCountryCode: null, ...fields, position };
    db.travellers.push(traveller);
    // Born there is been there, as the server's markBirthplaces
    markVisited(map.id, traveller.birthCountryCode, 'MANUAL');
    return ok({ traveller }, 201);
  });

  route('PATCH', '/api/maps/:mapId/travellers/:travellerId', ({ params, body }) => {
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const traveller = getDb().travellers.find((t) => t.id === params.travellerId && t.mapId === map.id);
    if (!traveller) return fail(404, 'That traveller could not be found.');
    const { fields, error } = travellerFields(body);
    if (error) return fail(400, error);
    if ('name' in fields && !fields.name) return fail(400, 'Add the traveller’s name.');
    const bornBefore = traveller.birthCountryCode;
    Object.assign(traveller, fields);
    if (traveller.birthCountryCode !== bornBefore) markVisited(map.id, traveller.birthCountryCode, 'MANUAL');
    return ok({ traveller });
  });

  route('DELETE', '/api/maps/:mapId/travellers/:travellerId', ({ params }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const travellers = db.travellers.filter((t) => t.mapId === map.id);
    if (!travellers.some((t) => t.id === params.travellerId)) return fail(404, 'That traveller could not be found.');
    if (travellers.length <= 1) return fail(409, 'A map needs at least one traveller.');
    // A co-owner is their traveller, and the owner keeps one (as the server)
    const traveller = travellers.find((t) => t.id === params.travellerId);
    const coOwnerHere = (userId) => db.mapMembers.some((m) => m.mapId === map.id && m.userId === userId && m.role === 'CO_OWNER');
    const pending = (i) => !i.acceptedAt && i.expiresAt > new Date().toISOString();
    if ((traveller.userId && coOwnerHere(traveller.userId)) || db.invites.some((i) => i.travellerId === traveller.id && pending(i))) {
      return fail(409, 'This traveller is a co-owner, or invited as one. Take that away in Share first.');
    }
    const coOwners =
      db.mapMembers.filter((m) => m.mapId === map.id && m.role === 'CO_OWNER').length +
      db.invites.filter((i) => i.mapId === map.id && i.role === 'CO_OWNER' && pending(i)).length;
    if (travellers.length - 1 < coOwners + 1) return fail(409, "Every co-owner is one of the map's travellers, and the owner needs one too.");
    db.travellers = db.travellers.filter((t) => t.id !== params.travellerId);
    db.trips.forEach((t) => {
      t.travellerIds = t.travellerIds.filter((id) => id !== params.travellerId);
    });
    db.moments.forEach((m) => {
      m.travellerIds = m.travellerIds.filter((id) => id !== params.travellerId);
    });
    return ok({ message: 'Traveller removed.' });
  });

  // Visits
  // Ticking several countries at once (the map's "Where have you been?"), as the server's
  // quickFillVisitsHandler: the owner or a co-owner, no verified email needed, 1 to 300 known
  // places, each marked visited where it isn't already
  route('POST', '/api/maps/:mapId/visits/quick-fill', ({ params, body }) => {
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'CO_OWNER', NOT_FOUND);
    if (denied) return denied;
    const codes = body?.countryCodes;
    const invalid = 'Choose between 1 and 300 countries, each one on the map.';
    if (!Array.isArray(codes) || !codes.length || codes.length > 300 || !codes.every((code) => typeof code === 'string' && countryExists(code))) {
      return fail(400, invalid);
    }
    let added = 0;
    for (const code of new Set(codes)) added += markVisited(map.id, code, 'MANUAL').length;
    return ok({ added });
  });

  route('PUT', '/api/maps/:mapId/visits/:countryCode', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const code = cleanCountry(params.countryCode);
    if (!code) return fail(404, COUNTRY_NOT_FOUND);
    // A UK nation is a place only on a map that splits the UK (the server's 404)
    if (isUkNation(code) && !map.splitUk) return fail(404, "That country isn't on the map.");
    if (!VISIT_STATUSES.includes(body.status)) return fail(400, 'Choose visited, lived there or want to go.');
    // The note: text or null (left out, it stays); cleaned as other text, cut to 1,000
    if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') return fail(400, NOTES_NOT_TEXT);
    let visit = db.visits.find((v) => v.mapId === map.id && v.countryCode === code);
    if (!visit) {
      visit = { mapId: map.id, countryCode: code, status: body.status, source: 'MANUAL', firstVisitedOn: null, notes: null };
      db.visits.push(visit);
    }
    // As the server: a changed status is the person's own (MANUAL); a note or date alone
    // keeps where the visit came from
    if (visit.status !== body.status) Object.assign(visit, { status: body.status, source: 'MANUAL' });
    if (body.firstVisitedOn !== undefined) visit.firstVisitedOn = body.firstVisitedOn || null;
    if (body.notes !== undefined) visit.notes = sanitizeText(body.notes, NOTES_MAX);
    // The South Pole visited or lived brings Antarctica with it (as the server: `implied`)
    const implied = markParentsVisited(map.id, code, body.status);
    const view = ({ countryCode, status, source, firstVisitedOn, notes }) => ({ countryCode, status, source, firstVisitedOn, notes });
    return ok({ visit: view(visit), implied: implied.map(view) });
  });

  route('DELETE', '/api/maps/:mapId/visits/:countryCode', ({ params }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const code = String(params.countryCode).toUpperCase();
    if (!db.visits.some((v) => v.mapId === map.id && v.countryCode === code)) return fail(404, VISIT_NOT_FOUND);
    db.visits = db.visits.filter((v) => !(v.mapId === map.id && v.countryCode === code));
    return ok({ message: 'Country cleared.' });
  });

  // The map's trips: its own, and the group trips added to it from other maps
  route('GET', '/api/maps/:mapId/trips', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'VIEWER', NOT_FOUND);
    if (denied) return denied;
    return ok({ trips: mapTripsView(map, role) });
  });

  route('POST', '/api/maps/:mapId/trips', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const title = cleanText(body.title, 120);
    if (!title) return fail(400, 'Give the trip a title.');
    const status = body.status || 'PLANNED';
    if (!TRIP_STATUSES.includes(status)) return fail(400, 'Unknown trip status.');
    const mapTravellers = new Set(db.travellers.filter((t) => t.mapId === map.id).map((t) => t.id));
    const trip = {
      id: newId(),
      mapId: map.id,
      createdById: me().id,
      title,
      description: cleanText(body.description, 2000),
      status,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      coverPhotoId: null,
      linkAccess: 'RESTRICTED',
      shareCode: newShareCode(),
      travellerIds: (Array.isArray(body.travellerIds) ? body.travellerIds : []).filter((id) => mapTravellers.has(id)),
      createdAt: new Date().toISOString(),
    };
    db.trips.push(trip);
    return ok({ trip: tripView(trip, tripRole(trip)) }, 201);
  });

  // The map's photos
  route('GET', '/api/maps/:mapId/photos', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'VIEWER', NOT_FOUND);
    if (denied) return denied;
    const page = photoPage(getDb().photos.filter((p) => p.mapId === map.id), role, query);
    return page.error ? fail(page.status ?? 400, page.error) : ok(page);
  });

  // Every country ticket's first pages in one reply (dev/mock/countryLists.js)
  route('GET', '/api/maps/:mapId/country-lists', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'VIEWER', NOT_FOUND);
    if (denied) return denied;
    const photos = getDb().photos.filter((p) => p.mapId === map.id);
    const lists = countryListPages({ query, photos, role, mapId: map.id, photoAccess: { mapRole: role, trip: null } });
    return lists.error ? fail(lists.status ?? 400, lists.error) : ok(lists);
  });

  route('POST', '/api/maps/:mapId/photos/presign', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    let role = mapRole(map);
    if (body.tripId) {
      const trip = db.trips.find((t) => t.id === body.tripId && t.mapId === map?.id);
      role = trip ? tripRole(trip) : null;
    }
    const denied = deny(role, 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    // The owner's plan (docs/API.md, "Map limits"): a locked map takes nothing, first
    if (isMapLocked(map)) return fail(403, LOCKED_MAP_MESSAGE);
    const upload = uploadKind(body);
    if (upload.error) return fail(...upload.error);
    const { kind } = upload;
    const files = Array.isArray(body.files) ? body.files : [];
    const sizes = files.map((f) => f.size);
    if (!files.length || new Set(sizes).size !== sizes.length || sizes.some((s) => !PHOTO_TYPES[s])) {
      return fail(400, UPLOAD_INVALID);
    }
    if (!sizes.includes('THUMB') || !sizes.includes('DISPLAY')) return fail(400, 'A photo needs its thumbnail and display copies.');
    for (const f of files) {
      // Web types for every size, JPEG for the print copy (the server's PHOTO_CONTENT_TYPES; no HEIC)
      if (!PHOTO_TYPES[f.size].includes(f.contentType)) return fail(400, `That file type can't be uploaded as ${f.size.toLowerCase()}.`);
      // As the server: the size is required, capped, and signed into the URL (../uploads.js)
      const sizeProblem = declaredSizeProblem(f.bytes, PHOTO_MAX_BYTES[f.size]);
      if (sizeProblem) return fail(...sizeProblem);
    }
    // The best copy follows the plan: ORIGINAL (Business, First Class) or PRINT (Economy)
    const sizesProblem = photoSizesProblem(sizes, mapPlanId(map));
    if (sizesProblem) return fail(400, sizesProblem);
    // The country the uploader expects: full on this map -> 409 before anything uploads
    if (body.countryCode !== undefined && body.countryCode !== null && body.countryCode !== '') {
      const hint = cleanCountry(body.countryCode);
      if (!hint) return fail(400, 'Unknown country.');
      const full = countryCapProblem(map, placeOnMap(hint, map.splitUk), kind);
      if (full) return fail(409, full);
    }
    // As the server (429): too many files presigned in the last day and never saved
    const since = Date.now() - 86400000;
    const pendingFiles = [...session.presigned.values()]
      .filter((p) => p.ownerId === me().id && p.at > since)
      .reduce((sum, p) => sum + Object.keys(p.keys).length, 0);
    if (pendingFiles + files.length > UNCONFIRMED_PHOTO_FILES) return fail(429, 'Too many unfinished uploads. Please try again later.');
    const photoId = newId();
    const keys = {};
    const uploads = files.map((f) => {
      const ext = EXTENSIONS[f.contentType];
      const key = `myplanetview/photos/${map.id}/${photoId}/${f.size.toLowerCase()}-${newId().slice(0, 8)}.${ext}`;
      keys[f.size] = key;
      const url = presignMockUpload(key, { resource: 'photo', contentType: f.contentType, bytes: f.bytes, ownerId: me().id });
      return { size: f.size, key, url, method: 'PUT', headers: { 'Content-Type': f.contentType }, bytes: f.bytes, expiresIn: 600 };
    });
    session.presigned.set(photoId, { mapId: map.id, tripId: body.tripId || null, keys, ownerId: me().id, at: Date.now() });
    return ok({ photoId, uploads });
  });

  route('POST', '/api/maps/:mapId/photos', async ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const pending = session.presigned.get(body.photoId);
    if (!map || !pending || pending.mapId !== map.id) return fail(400, 'That upload could not be found. Please try again.');
    if (db.photos.some((p) => p.id === body.photoId)) return fail(409, 'That photo was already saved.');
    const tripId = body.tripId || pending.tripId || null;
    const trip = tripId ? db.trips.find((t) => t.id === tripId && t.mapId === map.id) : null;
    const role = trip ? tripRole(trip) : mapRole(map);
    const denied = deny(role, 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    // The plan again (it may have changed since the presign): a locked map drops the
    // upload's files (403); the sizes must suit the owner's plan now (400)
    const dropUpload = () => Object.values(pending.keys).forEach((key) => session.blobs.delete(key));
    if (isMapLocked(map)) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(403, LOCKED_MAP_MESSAGE);
    }
    const upload = uploadKind(body);
    if (upload.error) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(...upload.error);
    }
    const { kind, durationS } = upload;
    const variants = Array.isArray(body.variants) ? body.variants : [];
    const variantSizes = variants.map((v) => v?.size);
    const sizesProblem = photoSizesProblem(variantSizes, mapPlanId(map));
    if (sizesProblem) return fail(400, sizesProblem);
    if (!session.blobs.has(pending.keys.THUMB) || !session.blobs.has(pending.keys.DISPLAY)) return fail(400, 'The upload did not finish. Please try again.');
    // As the server's HEAD of each file: what arrived must suit its size
    if (Object.entries(pending.keys).some(([size, key]) => !PHOTO_TYPES[size]?.includes(mockUpload(key)?.contentType))) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(400, TYPE_INVALID);
    }
    const hasGps = Number.isFinite(body.latitude) && Number.isFinite(body.longitude);
    // The chosen country stands in when there's no GPS, or the GPS finds no country (at sea)
    // (point-in-polygon on the map's shapes, as the server: ../countryLookup.js)
    // On a map that splits the UK, a position in the UK is in its nation; a chosen country is
    // kept as the map keeps places (as the server)
    const gpsCountry = hasGps ? await countryAtPosition(body.latitude, body.longitude) : null;
    const gpsPlace = gpsCountry === UK && map.splitUk ? (ukNationAt(body.latitude, body.longitude) ?? UK) : gpsCountry;
    const chosen = cleanCountry(body.countryCode);
    const countryCode = gpsPlace ?? (chosen ? placeOnMap(chosen, map.splitUk) : null);
    // An import's key (docs/API.md "Importing from Polarsteps"): one photo per key on a map
    if (body.importedFrom !== undefined && !/^polarsteps:photo:[A-Za-z0-9._/-]{1,200}$/.test(String(body.importedFrom))) {
      return fail(400, 'That import key isn’t valid.');
    }
    if (body.importedFrom && db.photos.some((p) => p.mapId === map.id && p.importedFrom === body.importedFrom)) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(409, 'That photo has been imported already.');
    }
    // The country cap with the final country: full -> 409, and the files go
    const full = countryCapProblem(map, countryCode, kind);
    if (full) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(409, full);
    }
    const photo = {
      id: body.photoId,
      mapId: map.id,
      uploaderId: me().id,
      tripId: trip?.id || null,
      kind,
      durationS,
      countryCode,
      caption: cleanText(body.caption, 500),
      takenAt: body.takenAt || null,
      latitude: hasGps ? body.latitude : null,
      longitude: hasGps ? body.longitude : null,
      width: Number(body.width) || 0,
      height: Number(body.height) || 0,
      hidden: false,
      ...(body.importedFrom ? { importedFrom: body.importedFrom } : {}),
      image: {
        kind: 'blob',
        thumbKey: pending.keys.THUMB,
        displayKey: pending.keys.DISPLAY,
        originalKey: pending.keys.ORIGINAL || null,
        printKey: pending.keys.PRINT || null,
      },
      createdAt: new Date().toISOString(),
    };
    // When it was taken, else now (the slideshows' order)
    setShotAt(photo);
    // First in its country's gallery and its trip's, as the server puts a new photo
    photo.countryPosition = firstPosition(db.photos, 'country', photo);
    photo.tripPosition = photo.tripId ? firstPosition(db.photos, 'trip', photo) : 0;
    db.photos.push(photo);
    session.presigned.delete(body.photoId);
    markVisited(map.id, countryCode, 'PHOTO');
    if (hasGps) {
      LANDMARK_ROWS.forEach((lm) => {
        const d = distanceM(body.latitude, body.longitude, lm.latitude, lm.longitude);
        if (d <= lm.matchRadiusM) {
          db.photoLandmarks.push({ photoId: photo.id, mapId: map.id, landmarkId: lm.id, source: 'GPS', distanceM: Math.round(d), confirmed: false, confirmedAt: null });
        }
      });
    }
    return ok({ photo: photoDetail(photo, atLeast(role, 'EDITOR') ? role : 'EDITOR') }, 201);
  });
}
