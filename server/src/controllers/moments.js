// Moments: life events and notes on a map ("We had our baby in Paris", "We saw a
// volcano"), with the same access rules as photos (docs/API.md "Moments")
import { parseImportKey } from '../utils/imports.js';
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMomentEvent } from '../event/travelUtils.js';
import { clampInt, sanitizeText } from '../utils/sanitize.js';
import { canEdit, canSeeMoment, canView, momentPhotoScope } from '../utils/access.js';
import { isSubsetOf, isUuid } from '../utils/travelValidation.js';
import { isMomentKind } from '../utils/constants/momentKinds.js';
import {
  MOMENT_PAGE_DEFAULT,
  MOMENT_PAGE_MAX,
  MOMENT_PHOTOS_MAX,
  MOMENT_PLACE_MAX,
  MOMENT_TEXT_MAX,
  MOMENT_TITLE_MAX,
  momentCursor,
  parseMomentCursor,
  parseMomentDate,
} from '../utils/moments.js';
import { findTravellerIds } from '../domain/maps.js';
import { anniversaryDay } from '../utils/onThisDay.js';
import { findLandmarkById } from '../domain/places.js';
import {
  createMomentInDB,
  deleteMomentInDB,
  findAnniversaryMoments,
  findMapPhotosByIds,
  findMomentDetail,
  findMomentPhotoRefs,
  findMomentsPage,
  isTripOnMap,
  updateMomentInDB,
} from '../domain/moments.js';
import { badRequest, conflict, denyUnless, forbidden, handler, loadMap, loadMoment, loadTrip, notFound } from './helpers/travel.js';
import { landmarkPlace, placeOnMap } from '../utils/ukNations.js';
import { parseMomentSpot, spotFitsPlace } from '../utils/momentSpots.js';
import { isKnownCountry } from './helpers/countries.js';
import { momentView } from './helpers/views.js';

const D = DOMAINS.moments;

// Input

const isText = (value) => typeof value === 'string';
const isTextOrNull = (value) => value === null || typeof value === 'string';

/**
 * A moment from a request body; `partial` for PATCH (missing fields stay as they are;
 * `current` is the stored moment). `photoScope` is the trip the writer's photos must be
 * on (a trip-only editor), or null for the whole map. The trip itself is handled by the
 * caller. -> `{ value: { data, travellerIds?, photoIds? } }` or `{ error }`
 */
async function parseMoment(body, { partial = false, current = null, mapId, photoScope = null, splitUk = false }) {
  const data = {};
  if (!partial || body.kind !== undefined) {
    if (!isMomentKind(body.kind)) return { error: EVENT_MESSAGES.invalidMomentKind };
    data.kind = body.kind;
  }
  if (!partial || body.title !== undefined) {
    const title = isText(body.title) ? sanitizeText(body.title, { maxLength: MOMENT_TITLE_MAX }) : null;
    if (!title) return { error: EVENT_MESSAGES.invalidMomentTitle };
    data.title = title;
  }
  for (const [field, maxLength] of [
    ['text', MOMENT_TEXT_MAX],
    ['placeName', MOMENT_PLACE_MAX],
  ]) {
    if (body[field] === undefined) continue;
    if (!isTextOrNull(body[field])) return { error: EVENT_MESSAGES.invalidMomentText };
    data[field] = sanitizeText(body[field], { maxLength });
  }

  // A year, a month or a day, or none (an undated note)
  const date = parseMomentDate(body.happenedOn, body.datePrecision);
  if (!date.ok) return { error: EVENT_MESSAGES.invalidMomentDate };
  if (date.value) Object.assign(data, date.value);

  // Every moment is in a country (or a special place); a landmark must be in it. Places as
  // the map keeps them: on a map that splits the UK, a UK landmark is in its nation, and a
  // nation is the UK on one that doesn't (utils/ukNations.js)
  if (!partial || body.countryCode !== undefined) {
    if (!(await isKnownCountry(body.countryCode))) return { error: EVENT_MESSAGES.countryNotFound };
    data.countryCode = placeOnMap(body.countryCode, splitUk);
    // Placed by hand: the nation it had before the UK split was turned off no longer applies
    if (partial && data.countryCode !== current?.countryCode) data.ukNation = null;
  }
  const countryCode = data.countryCode ?? current?.countryCode;
  if (body.landmarkId !== undefined) {
    if (body.landmarkId === null || body.landmarkId === '') data.landmarkId = null;
    else {
      const landmark = isUuid(body.landmarkId) ? await findLandmarkById(body.landmarkId) : null;
      if (!landmark) return { error: EVENT_MESSAGES.landmarkNotFound };
      if (landmarkPlace(landmark, splitUk) !== countryCode) return { error: EVENT_MESSAGES.momentLandmarkWrongCountry };
      data.landmarkId = landmark.id;
    }
  } else if (current?.landmarkId && countryCode !== current.countryCode) {
    // A new country with the old landmark: it must still fit (or be cleared with it)
    const landmark = await findLandmarkById(current.landmarkId);
    if (landmark && landmarkPlace(landmark, splitUk) !== countryCode) return { error: EVENT_MESSAGES.momentLandmarkWrongCountry };
  }

  // A pin on the map: in the moment's country, like a landmark (utils/momentSpots.js)
  const spot = parseMomentSpot(body.spot);
  if (!spot.ok) return { error: EVENT_MESSAGES.invalidMomentSpot };
  if (spot.value) {
    if (spot.value.latitude !== null && !spotFitsPlace(spot.value, countryCode)) return { error: EVENT_MESSAGES.momentSpotWrongCountry };
    Object.assign(data, spot.value);
  } else if (current?.latitude != null && countryCode !== current.countryCode && !spotFitsPlace(current, countryCode)) {
    // A new country with the old pin: it must still fit (or be moved or taken off with it)
    return { error: EVENT_MESSAGES.momentSpotWrongCountry };
  }

  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') return { error: EVENT_MESSAGES.malformedData };
    data.hidden = body.hidden;
  }

  const value = { data };
  if (body.travellerIds !== undefined) {
    if (!isSubsetOf(body.travellerIds, await findTravellerIds(mapId))) return { error: EVENT_MESSAGES.travellersNotOnMap };
    value.travellerIds = body.travellerIds;
  }
  if (body.photoIds !== undefined) {
    const ids = body.photoIds;
    if (!Array.isArray(ids) || ids.length > MOMENT_PHOTOS_MAX || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
      return { error: EVENT_MESSAGES.momentPhotosInvalid };
    }
    const found = await findMapPhotosByIds(mapId, ids);
    if (found.length !== ids.length) return { error: EVENT_MESSAGES.momentPhotosInvalid };
    if (photoScope && found.some((photo) => photo.tripId !== photoScope)) return { error: EVENT_MESSAGES.momentPhotosNotOnTrip };
    value.photoIds = ids;
  }
  return { value };
}

// Views

/** A moment as its writer sees it after a change (role: their role on the moment). */
async function writerView(momentId, { role, mapRole }) {
  const detail = await findMomentDetail(momentId);
  const trip = detail.tripId ? { id: detail.tripId, role } : null;
  return momentView(detail, { role, photoAccess: { mapRole, trip } });
}

/**
 * One page of moments, shared by the map, trip and share-link lists: date order, oldest
 * first, undated last; `country`, `tripId` (the map's list), `cursor` and `limit` (1–60,
 * default 30) from the query. `role` hides hidden moments below editor; `photoAccess`
 * (`{ mapRole, trip }`) decides which photos show inside them.
 * -> `{ moments, nextCursor }` or `{ error }`
 */
export async function momentPage({ query, mapId, tripId, role, photoAccess }) {
  // ?anniversary=YYYY-MM-DD (the viewer's today): the moments dated to that day in an earlier
  // year, newest first, one page (docs/API.md "Moments": anniversaries)
  if (query.anniversary !== undefined && !tripId) {
    const day = anniversaryDay(query.anniversary);
    if (!day) return { error: EVENT_MESSAGES.malformedData };
    const rows = await findAnniversaryMoments({ mapId, ...day, includeHidden: canEdit(role) });
    return {
      moments: await Promise.all(rows.filter((m) => canSeeMoment(role, m)).map((m) => momentView(m, { role, photoAccess }))),
      nextCursor: null,
    };
  }
  const country = query.country;
  if (country !== undefined && !(await isKnownCountry(country))) return { error: EVENT_MESSAGES.countryNotFound };
  const filterTrip = tripId ?? query.tripId;
  if (filterTrip !== undefined && !isUuid(filterTrip)) return { error: EVENT_MESSAGES.tripNotFound };
  const cursor = parseMomentCursor(query.cursor);
  if (!cursor.ok) return { error: EVENT_MESSAGES.malformedData };
  const limit = clampInt(query.limit, { min: 1, max: MOMENT_PAGE_MAX, fallback: MOMENT_PAGE_DEFAULT });

  const rows = await findMomentsPage({
    mapId,
    tripId: filterTrip,
    countryCode: country,
    includeHidden: canEdit(role),
    cursor: cursor.value,
    limit,
  });
  const page = rows.slice(0, limit);
  return {
    // The query already left hidden ones out below editor; this is a second check
    moments: await Promise.all(page.filter((m) => canSeeMoment(role, m)).map((m) => momentView(m, { role, photoAccess }))),
    nextCursor: rows.length > limit ? momentCursor(page[page.length - 1]) : null,
  };
}

// Lists

export const getMapMomentsHandler = handler(D, 'Get map moments', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const result = await momentPage({ query: req.query || {}, mapId: map.id, role, photoAccess: { mapRole: role, trip: null } });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// A trip's moments, for anyone on the trip (a trip-only member sees only its photos)
export const getTripMomentsHandler = handler(D, 'Get trip moments', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const result = await momentPage({
    query: req.query || {},
    mapId: trip.mapId,
    tripId: trip.id,
    role,
    photoAccess: { mapRole, trip: { id: trip.id, role } },
  });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// Writing

/**
 * The caller's role for adding a moment to a map, optionally on one of its trips: a map
 * editor anywhere, a trip editor (a trip-only one too) only on that trip.
 * -> `{ map, mapRole, role }`, role null when they can't see the map or the trip.
 */
async function loadMomentTarget(req, mapId, tripId) {
  const { map, role: mapRole } = await loadMap(req, mapId);
  if (!map) return { map: null, mapRole: null, role: null };
  if (!tripId) return { map, mapRole, role: mapRole };
  const { trip, role } = await loadTrip(req, tripId);
  if (!trip || trip.mapId !== map.id) return { map, mapRole, role: null };
  return { map, mapRole, role };
}

export const createMomentHandler = handler(D, 'Create moment', async (req, res) => {
  const body = req.body || {};
  const tripId = body.tripId || null;
  if (tripId && !isUuid(tripId)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const { map, mapRole, role } = await loadMomentTarget(req, req.params.mapId, tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const parsed = await parseMoment(body, { mapId: map.id, photoScope: momentPhotoScope(mapRole, tripId), splitUk: map.splitUk });
  if (parsed.error) return badRequest(req, res, D, parsed.error);
  const { data, travellerIds = [], photoIds = [] } = parsed.value;
  // An imported step's story (docs/API.md "Importing from Polarsteps"): unique on the map
  const imported = parseImportKey(body.importedFrom, 'moment');
  if (!imported.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidImportKey);

  let created;
  try {
    created = await createMomentInDB({
      happenedOn: null,
      datePrecision: null,
      ...data,
      mapId: map.id,
      tripId,
      createdById: req.user.id,
      ...(imported.value ? { importedFrom: imported.value } : {}),
      travellerIds,
      photoIds,
    });
  } catch (err) {
    if (err?.code !== 'P2002' || !imported.value) throw err;
    return conflict(req, res, D, EVENT_MESSAGES.momentAlreadyImported);
  }
  // Ids only: never the title, story or place
  logEvent(createMomentEvent({ user: req.user, action: 'Create Success', id: created.id, detail: `map=${map.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { moment: await writerView(created.id, { role, mapRole }) });
});

export const updateMomentHandler = handler(D, 'Update moment', async (req, res) => {
  const { moment, mapRole, role } = await loadMoment(req, req.params.momentId);
  if (!canSeeMoment(role, moment)) return notFound(req, res, D, EVENT_MESSAGES.momentNotFound);
  if (!canEdit(role)) return forbidden(req, res, D);
  const body = req.body || {};

  // Moving it to another trip, or off its trip, needs the map (as for photos): a
  // trip-only editor would lose it
  const trip = {};
  if (body.tripId !== undefined && (body.tripId || null) !== moment.tripId) {
    if (!canEdit(mapRole)) return forbidden(req, res, D, EVENT_MESSAGES.momentTripChangeNeedsMap);
    const next = body.tripId || null;
    if (next !== null && (!isUuid(next) || !(await isTripOnMap(moment.mapId, next)))) {
      return badRequest(req, res, D, EVENT_MESSAGES.tripNotFound);
    }
    trip.tripId = next;
  }

  const photoScope = momentPhotoScope(mapRole, moment.tripId);
  const parsed = await parseMoment(body, { partial: true, current: moment, mapId: moment.mapId, photoScope, splitUk: moment.map.splitUk });
  if (parsed.error) return badRequest(req, res, D, parsed.error);
  const { data, travellerIds } = parsed.value;
  let { photoIds } = parsed.value;
  // A trip-only editor sees and chooses only the trip's photos: the others on the moment
  // stay, after theirs
  if (photoIds && photoScope) {
    const kept = (await findMomentPhotoRefs(moment.id))
      .filter((p) => p.tripId !== photoScope && !photoIds.includes(p.photoId))
      .map((p) => p.photoId);
    photoIds = [...photoIds, ...kept];
    if (photoIds.length > MOMENT_PHOTOS_MAX) return badRequest(req, res, D, EVENT_MESSAGES.momentPhotosInvalid);
  }

  const changes = { ...trip, ...data };
  const fields = [...Object.keys(changes), ...(travellerIds ? ['travellerIds'] : []), ...(photoIds ? ['photoIds'] : [])];
  if (fields.length) {
    await updateMomentInDB(moment.id, changes, { travellerIds, photoIds });
    // Field names only: never the title, story or place
    logEvent(createMomentEvent({ user: req.user, action: 'Update Success', id: moment.id, detail: fields.join(',') }));
  }
  return sendDataResponse(res, 200, { moment: await writerView(moment.id, { role, mapRole }) });
});

export const deleteMomentHandler = handler(D, 'Delete moment', async (req, res) => {
  const { moment, role } = await loadMoment(req, req.params.momentId);
  if (!canSeeMoment(role, moment)) return notFound(req, res, D, EVENT_MESSAGES.momentNotFound);
  if (!canEdit(role)) return forbidden(req, res, D);
  await deleteMomentInDB(moment.id);
  logEvent(createMomentEvent({ user: req.user, action: 'Delete Success', id: moment.id, detail: `map=${moment.mapId}` }));
  return sendDataResponse(res, 200, { message: 'Moment deleted.' });
});
