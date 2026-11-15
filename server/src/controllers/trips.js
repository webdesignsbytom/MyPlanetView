// Trips (planned and completed), their stops and who went
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createTripEvent } from '../event/travelUtils.js';
import { sanitizeText } from '../utils/sanitize.js';
import { canDeleteTrip, canEdit, canView } from '../utils/access.js';
import {
  DESCRIPTION_MAX,
  NOTES_MAX,
  TITLE_MAX,
  TRIP_STATUSES,
  datesInOrder,
  isOneOf,
  isSubsetOf,
  isUuid,
  parseDateOnly,
} from '../utils/travelValidation.js';
import { findTravellerIds } from '../domain/maps.js';
import { findLandmarkById } from '../domain/places.js';
import {
  createStopInDB,
  createTripInDB,
  deleteStopInDB,
  deleteTripInDB,
  findStop,
  findStopIds,
  findTripDetail,
  findTripPhoto,
  findTripsForMap,
  findTripsSharedWithUser,
  reorderStopsInDB,
  setTripTravellersInDB,
  updateStopInDB,
  updateTripInDB,
} from '../domain/trips.js';
import { newUniqueShareCode } from '../services/travel/maps.js';
import { badRequest, denyUnless, forbidden, handler, loadMap, loadTrip, notFound } from './helpers/travel.js';
import { isKnownCountry } from './helpers/countries.js';
import { tripDetailView, tripSummary } from './helpers/views.js';

const D = DOMAINS.trips;

const cleanTitle = (value) => sanitizeText(value, { maxLength: TITLE_MAX });
const cleanText = (value, maxLength) => (value === undefined ? undefined : sanitizeText(value, { maxLength }));

/** The whole trip; `mapRole` (the caller's role on its map) sets `canOpenMap` and `canDelete`. */
export async function tripView(tripId, role, mapRole = null) {
  const detail = await findTripDetail(tripId);
  return detail ? tripDetailView(detail, role, { mapRole }) : null;
}

// Trips on a map

export const getMapTripsHandler = handler(D, 'Get map trips', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const trips = await findTripsForMap(map.id, { includeHidden: canEdit(role) });
  return sendDataResponse(res, 200, { trips: await Promise.all(trips.map((t) => tripSummary(t, role))) });
});

export const createTripHandler = handler(D, 'Create trip', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const body = req.body || {};
  const title = cleanTitle(body.title);
  if (!title) return badRequest(req, res, D, EVENT_MESSAGES.invalidTitle);
  const status = body.status ?? 'PLANNED';
  if (!isOneOf(status, TRIP_STATUSES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidTripStatus);
  const startDate = parseDateOnly(body.startDate);
  const endDate = parseDateOnly(body.endDate);
  if (!startDate.ok || !endDate.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
  if (!datesInOrder(startDate.value, endDate.value)) return badRequest(req, res, D, EVENT_MESSAGES.datesOutOfOrder);
  const travellerIds = body.travellerIds ?? [];
  if (!isSubsetOf(travellerIds, await findTravellerIds(map.id))) {
    return badRequest(req, res, D, EVENT_MESSAGES.travellersNotOnMap);
  }

  const created = await createTripInDB({
    mapId: map.id,
    createdById: req.user.id,
    title,
    description: cleanText(body.description, DESCRIPTION_MAX) ?? null,
    status,
    startDate: startDate.value ?? null,
    endDate: endDate.value ?? null,
    shareCode: await newUniqueShareCode(),
    travellerIds,
  });
  logEvent(createTripEvent({ user: req.user, action: 'Create Success', id: created.id, statusCode: 201 }));
  // Created from the map, so the caller's trip role is their map role
  return sendDataResponse(res, 201, { trip: await tripView(created.id, role, role) });
});

// Trips added to someone directly (not through a map they can see)
export const getTripsSharedWithMeHandler = handler(D, 'Get shared trips', async (req, res) => {
  const memberships = await findTripsSharedWithUser(req.user.id);
  const trips = await Promise.all(
    memberships.map(async (m) => ({ ...(await tripSummary(m.trip, m.role)), role: m.role, mapName: m.trip.map.name }))
  );
  return sendDataResponse(res, 200, { trips });
});

// One trip

export const getTripHandler = handler(D, 'Get trip', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole) });
});

export const updateTripHandler = handler(D, 'Update trip', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;

  const body = req.body || {};
  const current = await findTripDetail(trip.id);
  const data = {};

  if (body.title !== undefined) {
    const title = cleanTitle(body.title);
    if (!title) return badRequest(req, res, D, EVENT_MESSAGES.invalidTitle);
    data.title = title;
  }
  if (body.description !== undefined) data.description = cleanText(body.description, DESCRIPTION_MAX);
  if (body.status !== undefined) {
    if (!isOneOf(body.status, TRIP_STATUSES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidTripStatus);
    data.status = body.status;
  }
  const startDate = parseDateOnly(body.startDate);
  const endDate = parseDateOnly(body.endDate);
  if (!startDate.ok || !endDate.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
  if (startDate.value !== undefined) data.startDate = startDate.value;
  if (endDate.value !== undefined) data.endDate = endDate.value;
  const nextStart = data.startDate !== undefined ? data.startDate : current.startDate;
  const nextEnd = data.endDate !== undefined ? data.endDate : current.endDate;
  if (!datesInOrder(nextStart, nextEnd)) return badRequest(req, res, D, EVENT_MESSAGES.datesOutOfOrder);

  if (body.coverPhotoId !== undefined) {
    if (body.coverPhotoId === null) data.coverPhotoId = null;
    else if (!isUuid(body.coverPhotoId) || !(await findTripPhoto(trip.id, body.coverPhotoId))) {
      return badRequest(req, res, D, EVENT_MESSAGES.coverPhotoInvalid);
    } else data.coverPhotoId = body.coverPhotoId;
  }

  if (Object.keys(data).length) {
    // Completing it marks its stops' countries visited on the map, in the same
    // transaction (also for a trip-only editor: the visits carry source TRIP)
    const completing = data.status === 'COMPLETED' && current.status !== 'COMPLETED';
    await updateTripInDB(trip.id, data, { markVisited: completing });
    logEvent(createTripEvent({ user: req.user, action: 'Update Success', id: trip.id, detail: Object.keys(data).join(',') }));
  }
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole) });
});

export const deleteTripHandler = handler(D, 'Delete trip', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  // Removing a trip takes the map's owner or an editor of the map: someone added to
  // the trip alone edits it, but can't delete it
  if (!canDeleteTrip(mapRole)) return forbidden(req, res, D, EVENT_MESSAGES.tripDeleteNeedsMap);
  // Photos stay on the map: Photo.trip is ON DELETE SET NULL
  await deleteTripInDB(trip.id);
  logEvent(createTripEvent({ user: req.user, action: 'Delete Success', id: trip.id }));
  return sendDataResponse(res, 200, { message: 'Trip deleted. Its photos are still on the map.' });
});

export const putTripTravellersHandler = handler(D, 'Set trip travellers', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  const { travellerIds } = req.body || {};
  if (!isSubsetOf(travellerIds, await findTravellerIds(trip.mapId))) {
    return badRequest(req, res, D, EVENT_MESSAGES.travellersNotOnMap);
  }
  await setTripTravellersInDB(trip.id, travellerIds);
  logEvent(createTripEvent({ user: req.user, action: 'Travellers Update Success', id: trip.id, detail: `count=${travellerIds.length}` }));
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole) });
});

// Stops

/** A stop from a request body; `partial` for PATCH. */
async function parseStop(body, { partial = false, current = {} } = {}) {
  const out = {};
  if (!partial || body.countryCode !== undefined) {
    if (!(await isKnownCountry(body.countryCode))) return { error: EVENT_MESSAGES.countryNotFound };
    out.countryCode = body.countryCode;
  }
  if (body.landmarkId !== undefined) {
    if (body.landmarkId === null || body.landmarkId === '') out.landmarkId = null;
    else if (!isUuid(body.landmarkId) || !(await findLandmarkById(body.landmarkId))) {
      return { error: EVENT_MESSAGES.landmarkNotFound };
    } else out.landmarkId = body.landmarkId;
  }
  if (body.placeName !== undefined) out.placeName = sanitizeText(body.placeName, { maxLength: TITLE_MAX });
  if (body.notes !== undefined) out.notes = sanitizeText(body.notes, { maxLength: NOTES_MAX });
  const arriveOn = parseDateOnly(body.arriveOn);
  const leaveOn = parseDateOnly(body.leaveOn);
  if (!arriveOn.ok || !leaveOn.ok) return { error: EVENT_MESSAGES.invalidDate };
  if (arriveOn.value !== undefined) out.arriveOn = arriveOn.value;
  if (leaveOn.value !== undefined) out.leaveOn = leaveOn.value;
  const nextArrive = out.arriveOn !== undefined ? out.arriveOn : current.arriveOn;
  const nextLeave = out.leaveOn !== undefined ? out.leaveOn : current.leaveOn;
  if (!datesInOrder(nextArrive, nextLeave)) return { error: EVENT_MESSAGES.datesOutOfOrder };
  return { value: out };
}

export const createStopHandler = handler(D, 'Create stop', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  const parsed = await parseStop(req.body || {});
  if (parsed.error) return badRequest(req, res, D, parsed.error);

  // On a completed trip, the country is marked visited in the same transaction
  const stop = await createStopInDB({ tripId: trip.id, ...parsed.value });
  const detail = await findTripDetail(trip.id);
  logEvent(createTripEvent({ user: req.user, action: 'Stop Create Success', id: trip.id, detail: `stop=${stop.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { trip: await tripDetailView(detail, role, { mapRole }) });
});

export const updateStopHandler = handler(D, 'Update stop', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  const current = isUuid(req.params.stopId) ? await findStop(trip.id, req.params.stopId) : null;
  if (!current) return notFound(req, res, D, EVENT_MESSAGES.stopNotFound);
  const parsed = await parseStop(req.body || {}, { partial: true, current });
  if (parsed.error) return badRequest(req, res, D, parsed.error);

  await updateStopInDB(trip.id, current.id, parsed.value);
  const detail = await findTripDetail(trip.id);
  logEvent(createTripEvent({ user: req.user, action: 'Stop Update Success', id: trip.id, detail: `stop=${current.id}` }));
  return sendDataResponse(res, 200, { trip: await tripDetailView(detail, role, { mapRole }) });
});

export const deleteStopHandler = handler(D, 'Delete stop', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  const current = isUuid(req.params.stopId) ? await findStop(trip.id, req.params.stopId) : null;
  if (!current) return notFound(req, res, D, EVENT_MESSAGES.stopNotFound);
  await deleteStopInDB(current.id);
  logEvent(createTripEvent({ user: req.user, action: 'Stop Delete Success', id: trip.id, detail: `stop=${current.id}` }));
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole) });
});

export const reorderStopsHandler = handler(D, 'Reorder stops', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  const { stopIds } = req.body || {};
  const existing = await findStopIds(trip.id);
  if (!isSubsetOf(stopIds, existing) || stopIds.length !== existing.length) {
    return badRequest(req, res, D, EVENT_MESSAGES.invalidStopOrder);
  }
  await reorderStopsInDB(stopIds);
  logEvent(createTripEvent({ user: req.user, action: 'Stops Reorder Success', id: trip.id }));
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole) });
});
