// Mock mode only: maps, travellers, visits, stats, and the map's trips and photos.
import { deny, fail, ok, route } from '../mockAdapter';
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
  VIDEO_CONTENT_TYPES,
  VIDEO_MAX_BYTES,
  VIDEO_MESSAGES,
  videoNotAllowed,
  videoSizesProblem,
} from '../plans';
import { VIDEO_MAX_SECONDS } from '@/utils/constants/plans';
import { isPole } from '@/utils/map/specialPlaces';
import { adsFor } from '../offers';
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
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png', 'video/mp4': 'mp4', 'video/quicktime': 'mov' };
// Server EVENT_MESSAGES for uploads
const UPLOAD_INVALID = 'The upload doesn’t match what was requested. Please try again.';
const TYPE_INVALID = "That file type isn't supported for this photo size.";

// A photo or a video (docs/API.md, "Videos"), as the server's controllers/photos.js: a
// video's ORIGINAL is its file (MP4 or MOV, up to 500 MB); its THUMB and DISPLAY are poster
// frames, under the photo rules
const typesFor = (kind, size) => (kind === 'VIDEO' && size === 'ORIGINAL' ? VIDEO_CONTENT_TYPES : PHOTO_TYPES[size]);
const maxBytesFor = (kind, size) => (kind === 'VIDEO' && size === 'ORIGINAL' ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES[size]);
const isDuration = (value) => Number.isInteger(value) && value >= 1 && value <= VIDEO_MAX_SECONDS;

/** The server's parseUploadKind: -> `{ kind, durationS }`, or `{ error: [status, message] }`. */
function uploadKind(body, map) {
  const kind = body.kind ?? 'PHOTO';
  if (kind !== 'PHOTO' && kind !== 'VIDEO') return { error: [400, UPLOAD_INVALID] };
  if (kind === 'PHOTO') return { kind, durationS: null };
  // A video needs the map's owner on First Class (403), then a length of 1–180 s (400)
  const notAllowed = videoNotAllowed(map);
  if (notAllowed) return { error: [403, notAllowed] };
  if (!isDuration(body.durationS)) return { error: [400, VIDEO_MESSAGES.duration] };
  return { kind, durationS: body.durationS };
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

// -> { fields } or { error } (a pole as a birth or favourite place: 400)
function travellerFields(body) {
  const out = {};
  if (body.name !== undefined) out.name = cleanText(body.name, 60);
  if (hasPole(body)) return { error: POLE_NOT_A_HOME };
  if (body.birthCountryCode !== undefined) out.birthCountryCode = cleanCountry(body.birthCountryCode);
  if (body.favouriteCountryCode !== undefined) out.favouriteCountryCode = cleanCountry(body.favouriteCountryCode);
  if (body.position !== undefined && Number.isInteger(body.position)) out.position = body.position;
  return { fields: out };
}

// `owner`: the signed-in user, or (a default map remade after a transfer) someone else
export function createMapRecord({ name, groupType, isDefault = false, travellers = [], owner = me() }) {
  const db = getDb();
  const map = { id: newId(), name, groupType, isDefault, ownerId: owner.id, linkAccess: 'RESTRICTED', shareCode: newShareCode(), graceUntil: null, createdAt: new Date().toISOString() };
  db.maps.push(map);
  const list = travellers.length ? travellers : [{ name: owner.name.split(' ')[0] || 'Me' }];
  list.forEach((t, i) => {
    db.travellers.push({ id: newId(), mapId: map.id, name: cleanText(t.name, 60) || `Traveller ${i + 1}`, position: i, userId: i === 0 ? owner.id : null, birthCountryCode: cleanCountry(t.birthCountryCode), favouriteCountryCode: cleanCountry(t.favouriteCountryCode) });
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
  db.mapMembers = db.mapMembers.filter((m) => !(m.mapId === map.id && m.userId === toUserId));
  Object.assign(map, { ownerId: toUserId, isDefault: false, graceUntil });
  if (keepOldOwnerAsEditor && fromUserId !== toUserId) {
    const existing = db.mapMembers.find((m) => m.mapId === map.id && m.userId === fromUserId);
    if (existing) existing.role = 'EDITOR';
    else db.mapMembers.push({ mapId: map.id, userId: fromUserId, role: 'EDITOR', createdAt: new Date().toISOString() });
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
    if (travellers.some(hasPole)) return fail(400, POLE_NOT_A_HOME);
    // The body first, then a free map slot (402 with the extra map's price on the plan)
    if (!mapSlots(me().id).canCreate) return fail(402, mapSlotsMessage(effectivePlan(me().id).plan));
    const map = createMapRecord({ name, groupType: body.groupType, travellers });
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
    return ok({ map: stayAsEditor ? mapView(map, 'EDITOR', WITH_PLAN) : { id: map.id, name: map.name, role: null } });
  });

  route('PATCH', '/api/maps/:mapId', ({ params, body }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'OWNER', NOT_FOUND);
    if (denied) return denied;
    if (body.name !== undefined) {
      const name = cleanText(body.name, 80);
      if (!name) return fail(400, 'Give the map a name.');
      map.name = name;
    }
    if (body.groupType !== undefined) {
      if (!GROUP_TYPES.includes(body.groupType)) return fail(400, 'Choose solo, couple or family.');
      map.groupType = body.groupType;
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
    return ok({ message: 'Map deleted.' });
  });

  route('GET', '/api/maps/:mapId/stats', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', NOT_FOUND) || ok({ stats: mapStats(map, role) });
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
    const position = fields.position ?? db.travellers.filter((t) => t.mapId === map.id).length;
    const traveller = { id: newId(), mapId: map.id, userId: null, birthCountryCode: null, favouriteCountryCode: null, ...fields, position };
    db.travellers.push(traveller);
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
    Object.assign(traveller, fields);
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
  route('PUT', '/api/maps/:mapId/visits/:countryCode', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const code = cleanCountry(params.countryCode);
    if (!code) return fail(400, 'Unknown country.');
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
    db.visits = db.visits.filter((v) => !(v.mapId === map.id && v.countryCode === String(params.countryCode).toUpperCase()));
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
    return page.error ? fail(400, page.error) : ok(page);
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
    const upload = uploadKind(body, map);
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
      // ...and a video's file is MP4 or MOV
      if (!typesFor(kind, f.size).includes(f.contentType)) return fail(400, `That file type can't be uploaded as ${f.size.toLowerCase()}.`);
      // As the server: the size is required, capped, and signed into the URL (../uploads.js)
      const sizeProblem = declaredSizeProblem(f.bytes, maxBytesFor(kind, f.size));
      if (sizeProblem) return fail(...sizeProblem);
    }
    // The best copy follows the plan: ORIGINAL (Business, First Class) or PRINT (Economy);
    // a video sends exactly its two poster frames and its file
    const sizesProblem = kind === 'VIDEO' ? videoSizesProblem(sizes) : photoSizesProblem(sizes, mapPlanId(map));
    if (sizesProblem) return fail(400, sizesProblem);
    // The country the uploader expects: full on this map -> 409 before anything uploads
    if (body.countryCode !== undefined && body.countryCode !== null && body.countryCode !== '') {
      const hint = cleanCountry(body.countryCode);
      if (!hint) return fail(400, 'Unknown country.');
      const full = countryCapProblem(map, hint, kind);
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
    // A video again: First Class (403) and its length (400); the files go either way
    const upload = uploadKind(body, map);
    if (upload.error) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(...upload.error);
    }
    const { kind, durationS } = upload;
    const variants = Array.isArray(body.variants) ? body.variants : [];
    const variantSizes = variants.map((v) => v?.size);
    const sizesProblem = kind === 'VIDEO' ? videoSizesProblem(variantSizes) : photoSizesProblem(variantSizes, mapPlanId(map));
    if (sizesProblem) return fail(400, sizesProblem);
    if (!session.blobs.has(pending.keys.THUMB) || !session.blobs.has(pending.keys.DISPLAY)) return fail(400, 'The upload did not finish. Please try again.');
    if (kind === 'VIDEO' && !session.blobs.has(pending.keys.ORIGINAL)) return fail(400, 'The upload did not finish. Please try again.');
    // As the server's HEAD of each file: what arrived must suit this kind (a video's file is MP4 or MOV)
    if (Object.entries(pending.keys).some(([size, key]) => !typesFor(kind, size)?.includes(mockUpload(key)?.contentType))) {
      dropUpload();
      session.presigned.delete(body.photoId);
      return fail(400, TYPE_INVALID);
    }
    // A video keeps no position (the server stores null): the uploader chose its country
    const hasGps = kind === 'PHOTO' && Number.isFinite(body.latitude) && Number.isFinite(body.longitude);
    // The chosen country stands in when there's no GPS, or the GPS finds no country (at sea)
    // (point-in-polygon on the map's shapes, as the server: ../countryLookup.js)
    const countryCode = (hasGps ? await countryAtPosition(body.latitude, body.longitude) : null) ?? cleanCountry(body.countryCode);
    // The country cap with the final country (a video's own cap): full -> 409, and the files go
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
      caption: cleanText(body.caption, 300),
      takenAt: body.takenAt || null,
      latitude: hasGps ? body.latitude : null,
      longitude: hasGps ? body.longitude : null,
      width: Number(body.width) || 0,
      height: Number(body.height) || 0,
      hidden: false,
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
