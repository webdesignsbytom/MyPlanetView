// Mock mode only: taking your travels with you (docs/API.md "Travel copies"), over the mock's
// store. A copy of the server's rules (utils/travelCopies.js: placeCopy, copyRoom,
// parseCopyChoice), its queries (domain/travelCopies.js: what a traveller can take) and its
// copying (services/travel/travelCopies.js); keep them in step. One difference: approving
// copies everything at once (the server copies 8 s a run and the browser asks for more with
// …/continue), and a copied photo shows the original's picture (the server copies each file
// in R2 under the new map's keys). No emails are sent.
import { planOf } from '@/utils/constants/plans';
import { UK, isUkNation, placeOnMap } from '@/utils/map/ukNations';
import { ukNationAt } from './ukNationLookup';
import { getDb, me, newId, newShareCode } from './store';
import { byTripOrder, landmarkById, markVisited } from './views';
import { countryCapProblem, isMapLocked } from './plans';
import { byShotAt, firstPosition, setShotAt } from './photoOrder';

// The server's EVENT_MESSAGES for travel copies (and its mapNotFound)
export const COPY_MESSAGES = {
  mapNotFound: `That map doesn't exist, or it hasn't been shared with you.`,
  invalidCopyChoice: `That choice of travels can't be copied.`,
  emptyCopyChoice: `Choose at least one trip, moment, country or photo to copy.`,
  invalidCopyTarget: `Choose the map to copy your travels to.`,
  invalidCopyTraveller: `Choose which traveller you are.`,
  copyTargetNotFound: `That map doesn't exist.`,
  copyToSameMap: `Choose another map to copy your travels to.`,
  copyTravellerNotFound: `That traveller isn't on this map.`,
  copyTravellerTaken: `That traveller is someone else's account.`,
  copyAlreadyWaiting: `You've already asked for a copy onto that map. Wait for an answer, or withdraw it first.`,
  copyRequestNotFound: `That request doesn't exist.`,
  copyAlreadyDecided: `That request has already been answered.`,
  copyNotWaiting: `Only a request still waiting can be withdrawn.`,
  copyRequestWithdrawn: `Request withdrawn.`,
};

// One request's choice, at most (the server's input bounds)
const COPY_MAX_PHOTOS = 20000;
const COPY_MAX_TRIPS = 1000;
const COPY_MAX_MOMENTS = 1000;
const COPY_MAX_COUNTRIES = 300;
// Requests shown on a map: every one waiting or copying, and the last 20 finished
const LIST_LIMIT = 20;

// The server takes UUIDs; the mock's seeded ids are words ('trip-italy'), so any short id does
export const isId = (value) => typeof value === 'string' && /^[A-Za-z0-9-]{1,100}$/.test(value);

// Rules (server utils/travelCopies.js)

/**
 * Where a row from the family map goes on the new map, as that map keeps places: on a map
 * that doesn't split the UK, a nation is the UK remembering it; on one that does, the UK is
 * the nation it remembers, or the one its position is in, else stays the UK. A region is its
 * country's. -> `{ countryCode, ukNation }`
 */
export function placeCopy({ countryCode, ukNation = null, latitude = null, longitude = null }, splitUk) {
  if (!countryCode) return { countryCode: null, ukNation: null };
  if (isUkNation(countryCode)) return splitUk ? { countryCode, ukNation: null } : { countryCode: UK, ukNation: countryCode };
  if (countryCode === UK) {
    if (!splitUk) return { countryCode: UK, ukNation: isUkNation(ukNation) ? ukNation : null };
    const nation = isUkNation(ukNation) ? ukNation : latitude !== null && longitude !== null ? ukNationAt(latitude, longitude) : null;
    return { countryCode: nation ?? UK, ukNation: null };
  }
  return { countryCode: placeOnMap(countryCode, splitUk), ukNation: null };
}

/**
 * How much of a choice fits on the new map, per place (null: the photos with no country):
 * the photos chosen, the room left under the plan's photos per country, and how many fit.
 * -> `{ countries: [{ countryCode, photos, room, fits }], photos, fits }`, the biggest first
 */
export function copyRoom({ places, counts, planId }) {
  const cap = planOf(planId).limits.photosPerCountry;
  const chosen = new Map();
  for (const code of places) chosen.set(code, (chosen.get(code) ?? 0) + 1);
  const countries = [...chosen].map(([countryCode, photos]) => {
    const room = Math.max(0, cap - (counts[countryCode ?? ''] ?? 0));
    return { countryCode, photos, room, fits: Math.min(photos, room) };
  });
  countries.sort((a, b) => b.photos - a.photos || String(a.countryCode).localeCompare(String(b.countryCode)));
  return { countries, photos: places.length, fits: countries.reduce((sum, c) => sum + c.fits, 0) };
}

const idList = (value, max) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > max || !value.every(isId)) return null;
  return [...new Set(value)];
};
const COUNTRY_CODE = /^[A-Z]{2}$/;

/** A choice from a request body. -> `{ value }` or `{ error }` (the message) */
export function parseCopyChoice(body) {
  if (!body || typeof body !== 'object') return { error: COPY_MESSAGES.invalidCopyChoice };
  if (!isId(body.toMapId)) return { error: COPY_MESSAGES.invalidCopyTarget };
  if (!isId(body.travellerId)) return { error: COPY_MESSAGES.invalidCopyTraveller };
  const tripIds = idList(body.tripIds, COPY_MAX_TRIPS);
  const momentIds = idList(body.momentIds, COPY_MAX_MOMENTS);
  const photoIds = idList(body.photoIds, COPY_MAX_PHOTOS);
  const countryCodes =
    body.countryCodes === undefined || body.countryCodes === null
      ? []
      : Array.isArray(body.countryCodes) &&
          body.countryCodes.length <= COPY_MAX_COUNTRIES &&
          body.countryCodes.every((c) => typeof c === 'string' && COUNTRY_CODE.test(c))
        ? [...new Set(body.countryCodes)]
        : null;
  if (!tripIds || !momentIds || !photoIds || !countryCodes) return { error: COPY_MESSAGES.invalidCopyChoice };
  if (!tripIds.length && !momentIds.length && !photoIds.length && !countryCodes.length) return { error: COPY_MESSAGES.emptyCopyChoice };
  return { value: { toMapId: body.toMapId, travellerId: body.travellerId, tripIds, momentIds, photoIds, countryCodes } };
}

// Choosing (server domain/travelCopies.js)

// Never a hidden photo, never a video (its file is in Cloudflare Stream)
export const isCopyable = (photo) => (photo.kind || 'PHOTO') === 'PHOTO' && !photo.hidden;
const day = (value) => (value ? String(value).slice(0, 10) : null);
// Oldest first, undated last (as Postgres sorts ascending), then the oldest made
const byDateAsc = (field) => (a, b) => {
  if (!a[field] !== !b[field]) return a[field] ? -1 : 1;
  if (a[field] && b[field] && a[field] !== b[field]) return a[field] < b[field] ? -1 : 1;
  return String(a.createdAt).localeCompare(String(b.createdAt));
};

/** A map's travellers, in order. */
export const travellersOf = (db, mapId) => db.travellers.filter((t) => t.mapId === mapId).sort((a, b) => a.position - b.position);

/**
 * What `travellerId` can take from map `mapId`: the map's own trips they went on (with how
 * many copyable photos each has), the shown moments about them (their copyable photos' ids)
 * and the countries with copyable photos.
 */
export function copyChoices(db, mapId, travellerId) {
  const copyable = db.photos.filter((p) => p.mapId === mapId && isCopyable(p));
  const trips = db.trips
    .filter((t) => t.mapId === mapId && t.travellerIds.includes(travellerId))
    .sort(byTripOrder)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      startDate: day(t.startDate),
      endDate: day(t.endDate),
      countries: [...new Set(db.stops.filter((s) => s.tripId === t.id).sort((a, b) => a.position - b.position).map((s) => s.countryCode))],
      photos: copyable.filter((p) => p.tripId === t.id).length,
    }));
  const copyableIds = new Set(copyable.map((p) => p.id));
  const moments = db.moments
    .filter((m) => m.mapId === mapId && !m.hidden && m.travellerIds.includes(travellerId))
    .sort(byDateAsc('happenedOn'))
    .map((m) => ({
      id: m.id,
      kind: m.kind,
      title: m.title,
      happenedOn: day(m.happenedOn),
      datePrecision: m.datePrecision ?? null,
      countryCode: m.countryCode,
      photoIds: m.photoIds.filter((id) => copyableIds.has(id)),
    }));
  const perCountry = new Map();
  for (const p of copyable) if (p.countryCode) perCountry.set(p.countryCode, (perCountry.get(p.countryCode) ?? 0) + 1);
  const countries = [...perCountry].sort(([a], [b]) => a.localeCompare(b)).map(([countryCode, photos]) => ({ countryCode, photos }));
  return { trips, moments, countries };
}

/** How many of `tripIds` are trips on `mapId` that `travellerId` went on. */
export const countTravellerTrips = (db, mapId, travellerId, tripIds) =>
  db.trips.filter((t) => tripIds.includes(t.id) && t.mapId === mapId && t.travellerIds.includes(travellerId)).length;

/** How many of `momentIds` are shown moments on `mapId` about `travellerId`. */
export const countTravellerMoments = (db, mapId, travellerId, momentIds) =>
  db.moments.filter((m) => momentIds.includes(m.id) && m.mapId === mapId && !m.hidden && m.travellerIds.includes(travellerId)).length;

/**
 * Every photo a choice takes from `mapId`: the chosen trips', countries' and moments'
 * photos and those picked one by one, copyable ones only, oldest taken first.
 */
export function findPhotosToCopy(db, mapId, { tripIds = [], countryCodes = [], photoIds = [], momentIds = [] }) {
  if (!tripIds.length && !countryCodes.length && !photoIds.length && !momentIds.length) return [];
  const inMoments = new Set(db.moments.filter((m) => momentIds.includes(m.id)).flatMap((m) => m.photoIds));
  return db.photos
    .filter((p) => p.mapId === mapId && isCopyable(p))
    .filter((p) => tripIds.includes(p.tripId) || countryCodes.includes(p.countryCode) || photoIds.includes(p.id) || inMoments.has(p.id))
    .sort(byShotAt);
}

/** The copies already on `mapId` of the originals `ids`, among `rows` (photos, trips or moments). -> Map original -> copy */
export const copiesOn = (rows, mapId, ids) =>
  new Map(rows.filter((r) => r.mapId === mapId && r.copiedFromId && ids.includes(r.copiedFromId)).map((r) => [r.copiedFromId, r.id]));

// Requests

/** Requests whose maps, traveller or asker have gone go with them (the server's cascades). */
export function pruneCopyRequests(db) {
  const maps = new Set(db.maps.map((m) => m.id));
  const travellers = new Set(db.travellers.map((t) => t.id));
  const users = new Set(db.users.map((u) => u.id));
  db.travelCopyRequests = (db.travelCopyRequests || []).filter(
    (r) => maps.has(r.fromMapId) && maps.has(r.toMapId) && travellers.has(r.travellerId) && users.has(r.requestedById),
  );
}

/** A request's answer (docs/API.md "Travel copies"), for the signed-in user. */
export function copyView(r, { canDecide = false } = {}) {
  const db = getDb();
  const mapOf = (id) => {
    const map = db.maps.find((m) => m.id === id);
    return { id, name: map?.name ?? '' };
  };
  const traveller = db.travellers.find((t) => t.id === r.travellerId);
  const asker = db.users.find((u) => u.id === r.requestedById);
  const mine = r.requestedById === me().id;
  return {
    id: r.id,
    status: r.status,
    fromMap: mapOf(r.fromMapId),
    toMap: mapOf(r.toMapId),
    traveller: { id: r.travellerId, name: traveller?.name ?? '' },
    requestedBy: { id: r.requestedById, name: asker?.name ?? '' },
    trips: r.tripIds.length,
    moments: r.momentIds.length,
    photos: r.photoIds.length,
    progress: { done: r.photoCursor, copied: r.copiedPhotos, skipped: r.skippedPhotos },
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    finishedAt: r.finishedAt,
    mine,
    canDecide: canDecide && r.status === 'PENDING',
    canCancel: mine && r.status === 'PENDING',
  };
}

/** Requests shown on a map: every one waiting or copying (newest first), then the last 20 finished. */
export function listedRequests(requests) {
  const newest = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt));
  const open = requests.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED').sort(newest);
  const finished = requests.filter((r) => r.status === 'DONE' || r.status === 'DECLINED').sort(newest).slice(0, LIST_LIMIT);
  return [...open, ...finished];
}

/** What a request holds, for deciding: its trips' and moments' titles, and its photos per country. */
export function copyContents(db, r) {
  const tripList = db.trips
    .filter((t) => r.tripIds.includes(t.id) && t.mapId === r.fromMapId)
    .sort(byDateAsc('startDate'))
    .map((t) => ({ id: t.id, title: t.title, startDate: day(t.startDate) }));
  const momentList = db.moments
    .filter((m) => r.momentIds.includes(m.id) && m.mapId === r.fromMapId)
    .sort(byDateAsc('happenedOn'))
    .map((m) => ({ id: m.id, title: m.title, happenedOn: day(m.happenedOn) }));
  const perCountry = new Map();
  for (const p of db.photos) {
    if (p.mapId !== r.fromMapId || !r.photoIds.includes(p.id)) continue;
    const code = p.countryCode || null;
    perCountry.set(code, (perCountry.get(code) ?? 0) + 1);
  }
  const countries = [...perCountry].map(([countryCode, photos]) => ({ countryCode, photos })).sort((a, b) => b.photos - a.photos);
  return { tripList, momentList, countries };
}

// Copying (server services/travel/travelCopies.js)

/** The new map's traveller ids for the person copying: their own traveller, else the only one. */
function ownTravellerIds(db, mapId, userId) {
  const travellers = db.travellers.filter((t) => t.mapId === mapId);
  const own = travellers.find((t) => t.userId === userId);
  if (own) return [own.id];
  return travellers.length === 1 ? [travellers[0].id] : [];
}

/** The trips, with their stops; completed ones mark their countries visited. -> Map original id -> copy id */
function copyTrips(db, request, ctx) {
  const copies = copiesOn(db.trips, ctx.toMap.id, request.tripIds);
  for (const tripId of request.tripIds) {
    if (copies.has(tripId)) continue;
    const trip = db.trips.find((t) => t.id === tripId && t.mapId === request.fromMapId);
    if (!trip) continue;
    const copy = {
      id: newId(),
      mapId: ctx.toMap.id,
      createdById: ctx.userId,
      title: trip.title,
      description: trip.description ?? null,
      status: trip.status,
      startDate: trip.startDate ?? null,
      endDate: trip.endDate ?? null,
      coverPhotoId: null,
      linkAccess: 'RESTRICTED',
      shareCode: newShareCode(),
      travellerIds: [...ctx.travellerIds],
      copiedFromId: trip.id,
      createdAt: ctx.now,
    };
    const stops = db.stops
      .filter((s) => s.tripId === trip.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => {
        const landmark = s.landmarkId ? landmarkById(s.landmarkId) : null;
        const place = placeCopy(
          { countryCode: s.countryCode, ukNation: s.ukNation ?? null, latitude: landmark?.latitude ?? null, longitude: landmark?.longitude ?? null },
          ctx.splitUk,
        );
        return {
          id: newId(),
          tripId: copy.id,
          position: s.position,
          ...place,
          landmarkId: s.landmarkId ?? null,
          placeName: s.placeName ?? null,
          arriveOn: s.arriveOn ?? null,
          leaveOn: s.leaveOn ?? null,
          notes: s.notes ?? null,
        };
      });
    db.trips.push(copy);
    db.stops.push(...stops);
    if (trip.status === 'COMPLETED') for (const code of new Set(stops.map((s) => s.countryCode))) markVisited(ctx.toMap.id, code, 'TRIP');
    copies.set(trip.id, copy.id);
  }
  return copies;
}

/**
 * One photo, saved on the new map as an upload is (the plan's photos per country checked),
 * with its landmark matches as they were (its passport stamps). -> 'copied' or 'skipped'
 * (gone, hidden since, or over the caps)
 */
function copyOnePhoto(db, sourceId, ctx, trips) {
  if (ctx.locked) return 'skipped';
  const source = db.photos.find((p) => p.id === sourceId && p.mapId === ctx.fromMapId && isCopyable(p));
  if (!source || !source.image) return 'skipped';
  const place = placeCopy(source, ctx.splitUk);
  if (countryCapProblem(ctx.toMap, place.countryCode)) return 'skipped';
  const photo = {
    id: newId(),
    mapId: ctx.toMap.id,
    uploaderId: ctx.userId,
    tripId: (source.tripId && trips.get(source.tripId)) || null,
    kind: 'PHOTO',
    durationS: null,
    ...place,
    caption: source.caption ?? null,
    takenAt: source.takenAt ?? null,
    latitude: source.latitude ?? null,
    longitude: source.longitude ?? null,
    width: source.width,
    height: source.height,
    hidden: false,
    // The server copies each file under the new map's keys; the mock shows the same picture
    image: { ...source.image },
    copiedFromId: source.id,
    createdAt: ctx.now,
  };
  setShotAt(photo);
  // First in its country's gallery and its trip's, as a new upload
  photo.countryPosition = firstPosition(db.photos, 'country', photo);
  photo.tripPosition = photo.tripId ? firstPosition(db.photos, 'trip', photo) : 0;
  db.photos.push(photo);
  markVisited(ctx.toMap.id, photo.countryCode, 'PHOTO');
  const matches = db.photoLandmarks.filter((pl) => pl.photoId === source.id);
  db.photoLandmarks.push(...matches.map((pl) => ({ ...pl, photoId: photo.id, mapId: ctx.toMap.id })));
  return 'copied';
}

/** The moments, with the copies of their photos, on their trip's copy if it came too. Their spots are private. */
function copyMoments(db, request, ctx, trips) {
  const copies = copiesOn(db.moments, ctx.toMap.id, request.momentIds);
  const sources = db.moments.filter((m) => request.momentIds.includes(m.id) && !copies.has(m.id) && m.mapId === request.fromMapId && !m.hidden);
  const photoCopies = copiesOn(db.photos, ctx.toMap.id, [...new Set(sources.flatMap((m) => m.photoIds))]);
  for (const m of sources) {
    const landmark = m.landmarkId ? landmarkById(m.landmarkId) : null;
    const place = placeCopy(
      {
        countryCode: m.countryCode,
        ukNation: m.ukNation ?? null,
        latitude: m.latitude ?? landmark?.latitude ?? null,
        longitude: m.longitude ?? landmark?.longitude ?? null,
      },
      ctx.splitUk,
    );
    db.moments.push({
      id: newId(),
      mapId: ctx.toMap.id,
      kind: m.kind,
      title: m.title,
      text: m.text ?? null,
      happenedOn: m.happenedOn ?? null,
      datePrecision: m.datePrecision ?? null,
      ...place,
      landmarkId: m.landmarkId ?? null,
      placeName: m.placeName ?? null,
      latitude: m.latitude ?? null,
      longitude: m.longitude ?? null,
      // Its exact spot is private on the new map until they share it
      spotShared: false,
      hidden: false,
      tripId: (m.tripId && trips.get(m.tripId)) || null,
      createdById: ctx.userId,
      copiedFromId: m.id,
      travellerIds: [...ctx.travellerIds],
      photoIds: m.photoIds.map((id) => photoCopies.get(id)).filter(Boolean),
      createdAt: ctx.now,
      updatedAt: ctx.now,
    });
  }
}

/**
 * The copied trips' covers (where the cover came too), and the first visits: a country's
 * first visit becomes the earliest copied photo or completed stop there when that's earlier
 * than what the new map has (never the family's own first visit).
 */
function finishCopy(db, request, ctx, trips) {
  const photoCopies = copiesOn(db.photos, ctx.toMap.id, request.photoIds);
  for (const tripId of request.tripIds) {
    const source = db.trips.find((t) => t.id === tripId && t.mapId === request.fromMapId);
    const copy = trips.has(tripId) ? db.trips.find((t) => t.id === trips.get(tripId)) : null;
    const cover = source?.coverPhotoId ? db.photos.find((p) => p.mapId === ctx.toMap.id && p.copiedFromId === source.coverPhotoId) : null;
    if (copy && cover && !copy.coverPhotoId) copy.coverPhotoId = cover.id;
  }
  const dates = [];
  for (const id of photoCopies.values()) {
    const photo = db.photos.find((p) => p.id === id);
    if (photo?.takenAt && photo.countryCode) dates.push({ countryCode: photo.countryCode, date: day(photo.takenAt) });
  }
  for (const trip of db.trips.filter((t) => t.mapId === ctx.toMap.id && t.copiedFromId && request.tripIds.includes(t.copiedFromId) && t.status === 'COMPLETED')) {
    for (const stop of db.stops.filter((s) => s.tripId === trip.id)) {
      const date = day(stop.arriveOn ?? trip.startDate);
      if (date) dates.push({ countryCode: stop.countryCode, date });
    }
  }
  const earliest = new Map();
  for (const { countryCode, date } of dates) {
    if (!earliest.has(countryCode) || date < earliest.get(countryCode)) earliest.set(countryCode, date);
  }
  for (const [countryCode, date] of earliest) {
    const visit = db.visits.find((v) => v.mapId === ctx.toMap.id && v.countryCode === countryCode);
    if (visit && (!visit.firstVisitedOn || day(visit.firstVisitedOn) > date)) visit.firstVisitedOn = date;
  }
}

/**
 * Copy an approved request onto its new map, all of it: the trips, the photos from where it
 * stands (each copied once: one already on the new map counts as copied), then the moments,
 * the covers and the first visits. The request is DONE after.
 */
export function runTravelCopy(request) {
  const db = getDb();
  const toMap = db.maps.find((m) => m.id === request.toMapId);
  if (request.status !== 'APPROVED' || !toMap) return request;
  const ctx = {
    fromMapId: request.fromMapId,
    toMap,
    splitUk: Boolean(toMap.splitUk),
    userId: request.requestedById,
    travellerIds: ownTravellerIds(db, toMap.id, request.requestedById),
    locked: isMapLocked(toMap),
    now: new Date().toISOString(),
  };
  const trips = copyTrips(db, request, ctx);
  let { photoCursor, copiedPhotos, skippedPhotos } = request;
  const present = copiesOn(db.photos, toMap.id, request.photoIds.slice(photoCursor));
  while (photoCursor < request.photoIds.length) {
    const sourceId = request.photoIds[photoCursor];
    const outcome = present.has(sourceId) ? 'present' : copyOnePhoto(db, sourceId, ctx, trips);
    if (outcome === 'skipped') skippedPhotos += 1;
    else copiedPhotos += 1;
    photoCursor += 1;
  }
  copyMoments(db, request, ctx, trips);
  finishCopy(db, request, ctx, trips);
  Object.assign(request, { photoCursor, copiedPhotos, skippedPhotos, status: 'DONE', finishedAt: new Date().toISOString() });
  return request;
}
