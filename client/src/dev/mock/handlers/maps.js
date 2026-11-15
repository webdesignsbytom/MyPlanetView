// Mock mode only: maps, travellers, visits, stats, and the map's trips and photos.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, newShareCode, session } from '../store';
import { declaredSizeProblem, presignMockUpload } from '../uploads';
import { countryAtPosition } from '../countryLookup';
import {
  LANDMARK_ROWS,
  atLeast,
  countryExists,
  distanceM,
  mapRole,
  mapStats,
  mapSummary,
  mapView,
  markVisited,
  photoDetail,
  photoPage,
  tripRole,
  tripSummary,
  tripView,
} from '../views';

const GROUP_TYPES = ['SOLO', 'COUPLE', 'FAMILY'];
const VISIT_STATUSES = ['VISITED', 'LIVED', 'WANT_TO_GO'];
const TRIP_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];
const PHOTO_TYPES = ['image/jpeg', 'image/webp', 'image/png'];
const ORIGINAL_TYPES = [...PHOTO_TYPES, 'image/heic', 'image/heif'];
const MB = 1024 * 1024;
// Server mediaConstants.js PHOTO_MAX_BYTES
const PHOTO_MAX_BYTES = { THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB };
// Server UNCONFIRMED_UPLOAD_LIMIT.photo: files presigned and never saved, per user, over a day
const UNCONFIRMED_PHOTO_FILES = 60;
const NOT_FOUND = 'This map could not be found.';
// As the server's MAP_CREATE_DAILY_USER_LIMIT: 20 new maps per user a day, then 429
const MAP_CREATE_DAILY_LIMIT = 20;
const DAY_MS = 86400000;
const signedOut = () => fail(401, 'No valid session. Please sign in.');

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
const cleanText = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
const cleanCountry = (code) => (typeof code === 'string' && countryExists(code.toUpperCase()) ? code.toUpperCase() : null);

function travellerFields(body) {
  const out = {};
  if (body.name !== undefined) out.name = cleanText(body.name, 60);
  if (body.birthCountryCode !== undefined) out.birthCountryCode = cleanCountry(body.birthCountryCode);
  if (body.favouriteCountryCode !== undefined) out.favouriteCountryCode = cleanCountry(body.favouriteCountryCode);
  if (body.position !== undefined && Number.isInteger(body.position)) out.position = body.position;
  return out;
}

export function createMapRecord({ name, groupType, isDefault = false, travellers = [] }) {
  const db = getDb();
  const map = { id: newId(), name, groupType, isDefault, ownerId: me().id, linkAccess: 'RESTRICTED', shareCode: newShareCode(), createdAt: new Date().toISOString() };
  db.maps.push(map);
  const list = travellers.length ? travellers : [{ name: me().name.split(' ')[0] || 'Me' }];
  list.forEach((t, i) => {
    db.travellers.push({ id: newId(), mapId: map.id, name: cleanText(t.name, 60) || `Traveller ${i + 1}`, position: i, userId: i === 0 ? me().id : null, birthCountryCode: cleanCountry(t.birthCountryCode), favouriteCountryCode: cleanCountry(t.favouriteCountryCode) });
  });
  return map;
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
    const map = createMapRecord({ name, groupType: body.groupType, travellers: Array.isArray(body.travellers) ? body.travellers : [] });
    return ok({ map: mapView(map, 'OWNER') }, 201);
  });

  route('GET', '/api/maps/:mapId', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', NOT_FOUND) || ok({ map: mapView(map, role) });
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
    return ok({ map: mapView(map, role) });
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
    db.invites = db.invites.filter((i) => i.mapId !== map.id && !tripIds.has(i.tripId));
    db.photos = db.photos.filter((p) => !photoIds.has(p.id));
    db.photoLandmarks = db.photoLandmarks.filter((pl) => !photoIds.has(pl.photoId));
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
    const fields = travellerFields(body);
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
    const fields = travellerFields(body);
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
    let visit = db.visits.find((v) => v.mapId === map.id && v.countryCode === code);
    if (!visit) {
      visit = { mapId: map.id, countryCode: code, status: body.status, source: 'MANUAL', firstVisitedOn: null, notes: null };
      db.visits.push(visit);
    }
    Object.assign(visit, { status: body.status, source: 'MANUAL' });
    if (body.firstVisitedOn !== undefined) visit.firstVisitedOn = body.firstVisitedOn || null;
    if (body.notes !== undefined) visit.notes = cleanText(body.notes, 500);
    const { countryCode, status, source, firstVisitedOn, notes } = visit;
    return ok({ visit: { countryCode, status, source, firstVisitedOn, notes } });
  });

  route('DELETE', '/api/maps/:mapId/visits/:countryCode', ({ params }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    db.visits = db.visits.filter((v) => !(v.mapId === map.id && v.countryCode === String(params.countryCode).toUpperCase()));
    return ok({ message: 'Country cleared.' });
  });

  // The map's trips
  route('GET', '/api/maps/:mapId/trips', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    const denied = deny(role, 'VIEWER', NOT_FOUND);
    if (denied) return denied;
    const trips = getDb()
      .trips.filter((t) => t.mapId === map.id)
      .sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
    return ok({ trips: trips.map((t) => tripSummary(t, role)) });
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
    const files = Array.isArray(body.files) ? body.files : [];
    const sizes = files.map((f) => f.size);
    if (!sizes.includes('THUMB') || !sizes.includes('DISPLAY')) return fail(400, 'A photo needs its thumbnail and display copies.');
    for (const f of files) {
      const allowed = f.size === 'ORIGINAL' ? ORIGINAL_TYPES : PHOTO_TYPES;
      if (!allowed.includes(f.contentType)) return fail(400, `That file type can't be uploaded as ${f.size.toLowerCase()}.`);
      // As the server: the size is required, capped, and signed into the URL (../uploads.js)
      const sizeProblem = declaredSizeProblem(f.bytes, PHOTO_MAX_BYTES[f.size]);
      if (sizeProblem) return fail(...sizeProblem);
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
      const ext = f.contentType.split('/')[1].replace('jpeg', 'jpg');
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
    if (!session.blobs.has(pending.keys.THUMB) || !session.blobs.has(pending.keys.DISPLAY)) return fail(400, 'The upload did not finish. Please try again.');
    const hasGps = Number.isFinite(body.latitude) && Number.isFinite(body.longitude);
    // The chosen country stands in when there's no GPS, or the GPS finds no country (at sea)
    // (point-in-polygon on the map's shapes, as the server: ../countryLookup.js)
    const countryCode = (hasGps ? await countryAtPosition(body.latitude, body.longitude) : null) ?? cleanCountry(body.countryCode);
    const photo = {
      id: body.photoId,
      mapId: map.id,
      uploaderId: me().id,
      tripId: trip?.id || null,
      countryCode,
      caption: cleanText(body.caption, 300),
      takenAt: body.takenAt || null,
      latitude: hasGps ? body.latitude : null,
      longitude: hasGps ? body.longitude : null,
      width: Number(body.width) || 0,
      height: Number(body.height) || 0,
      hidden: false,
      image: { kind: 'blob', thumbKey: pending.keys.THUMB, displayKey: pending.keys.DISPLAY, originalKey: pending.keys.ORIGINAL || null },
      createdAt: new Date().toISOString(),
    };
    db.photos.push(photo);
    session.presigned.delete(body.photoId);
    markVisited(map.id, countryCode, 'PHOTO');
    if (hasGps) {
      LANDMARK_ROWS.forEach((lm) => {
        const d = distanceM(body.latitude, body.longitude, lm.latitude, lm.longitude);
        if (d <= lm.matchRadiusM) db.photoLandmarks.push({ photoId: photo.id, landmarkId: lm.id, source: 'GPS', distanceM: Math.round(d), confirmed: false });
      });
    }
    return ok({ photo: photoDetail(photo, atLeast(role, 'EDITOR') ? role : 'EDITOR') }, 201);
  });
}
