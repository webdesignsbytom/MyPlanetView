// Trips (planned and completed), their stops and who went
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createTripEvent } from '../event/travelUtils.js';
import { sanitizeText } from '../utils/sanitize.js';
import {
  canAddTripToMap,
  canDeleteTrip,
  canEdit,
  canRemoveTripFromMap,
  canView,
  mapRoleFor,
  tripRoleFor,
} from '../utils/access.js';
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
  addTripToMapInDB,
  byTripOrder,
  createStopInDB,
  createTripInDB,
  deleteStopInDB,
  deleteTripInDB,
  deleteTripMapLink,
  findMembershipsForTrips,
  findStop,
  findStopIds,
  findTripDetail,
  findTripLinksOnUsersMaps,
  findTripMapLink,
  findTripPhoto,
  findTripsForMap,
  findTripsLinkedToMap,
  findTripsSharedWithUser,
  hasEditableMapOtherThan,
  reorderStopsInDB,
  setTripTravellersInDB,
  updateStopInDB,
  updateTripInDB,
  withTripCounts,
} from '../domain/trips.js';
import { newUniqueShareCode } from '../services/travel/maps.js';
import { badRequest, denyUnless, forbidden, handler, loadMap, loadTrip, notFound } from './helpers/travel.js';
import { isKnownCountry } from './helpers/countries.js';
import { linkedTripSummary, tripDetailView, tripSummary } from './helpers/views.js';
import { loadUploadRules } from '../services/travel/plans.js';

const D = DOMAINS.trips;

const cleanTitle = (value) => sanitizeText(value, { maxLength: TITLE_MAX });
const cleanText = (value, maxLength) => (value === undefined ? undefined : sanitizeText(value, { maxLength }));

/**
 * Which of `userId`'s own maps (owned or edited) show the trip, and whether they have one
 * besides the trip's own to add it to (docs/API.md "Group trips").
 * -> `{ links: [{ mapId, name, canRemove }], canAdd }`
 */
async function loadMyMaps(trip, userId) {
  const [links, canAdd] = await Promise.all([
    findTripLinksOnUsersMaps(trip.id, userId),
    hasEditableMapOtherThan(userId, trip.mapId),
  ]);
  return {
    links: links.map((l) => ({
      mapId: l.mapId,
      name: l.map.name,
      canRemove: canRemoveTripFromMap({ userId, addedById: l.addedById, targetMapOwnerId: l.map.ownerId }),
    })),
    canAdd,
  };
}

/**
 * The trip as the trip routes answer it, for the signed-in `userId`: with `uploadRules`
 * (the map owner's plan: originals or print copies, photos per country, locked) for
 * anyone who can add photos to it, so a trip-only editor, who never loads the map, knows
 * them too; and which of the caller's own maps show it (`onMyMaps`, `canAddToMyMap`).
 */
const tripReply = async (detail, role, mapRole, userId) => {
  const [uploadRules, myMaps] = await Promise.all([
    canEdit(role) ? loadUploadRules(detail.mapId) : null,
    loadMyMaps(detail, userId),
  ]);
  return tripDetailView(detail, role, { mapRole, uploadRules, myMaps });
};

// The trip routes' own answers are for the caller (tripReply); GET /shared/:code reuses
// tripView without them
const mine = (req) => ({ forUser: req.user.id });

/**
 * The whole trip; `mapRole` (the caller's role on its map) sets `canOpenMap` and
 * `canDelete`. `forUser` (the caller's id, the trip routes only) adds tripReply's fields.
 */
export async function tripView(tripId, role, mapRole = null, { forUser = null } = {}) {
  const detail = await findTripDetail(tripId);
  if (!detail) return null;
  return forUser ? tripReply(detail, role, mapRole, forUser) : tripDetailView(detail, role, { mapRole });
}

// Trips on a map

/**
 * A map's trips for someone with `role` on it (`userId` signed in, or null): its own
 * trips, then the group trips added to it (docs/API.md "Group trips") in one list, in
 * the map's trip order. A linked trip opens (`canOpen`, with its summary) only for
 * someone with a role on the trip itself; through a share link (`viaShareLink`) never.
 * Its photos stay on the organiser's map, so they're in none of this map's counts.
 */
export async function mapTripsView(mapId, role, userId, { viaShareLink = false } = {}) {
  const [own, linked] = await Promise.all([
    findTripsForMap(mapId, { includeHidden: canEdit(role) }),
    findTripsLinkedToMap(mapId),
  ]);

  // The caller's role on each linked trip: the higher of their role on its map (owner or
  // member) and their own TripMember row. None through a share link.
  const { mapRoles, tripRoles } = await findMembershipsForTrips(viaShareLink ? [] : linked, userId);
  const roleOn = (trip) => {
    if (viaShareLink) return null;
    const mapMember = mapRoles.has(trip.mapId) ? { role: mapRoles.get(trip.mapId) } : null;
    const tripMember = tripRoles.has(trip.id) ? { role: tripRoles.get(trip.id) } : null;
    return tripRoleFor(mapRoleFor({ ownerId: trip.map.ownerId }, userId, mapMember), tripMember);
  };
  const roles = new Map(linked.map((t) => [t.id, roleOn(t)]));
  const openable = linked.filter((t) => canView(roles.get(t.id)));
  const counted = new Map(
    (await withTripCounts(openable, openable.map((t) => canEdit(roles.get(t.id))))).map((t) => [t.id, t])
  );

  const rows = [
    ...own.map((trip) => ({ trip, view: async () => ({ ...(await tripSummary(trip, role)), linked: false, canOpen: true }) })),
    ...linked.map((trip) => ({
      trip,
      view: () =>
        counted.has(trip.id)
          ? linkedTripSummary(counted.get(trip.id), { canOpen: true, role: roles.get(trip.id) })
          : linkedTripSummary(trip, { canOpen: false }),
    })),
  ].sort((a, b) => byTripOrder(a.trip, b.trip));
  return Promise.all(rows.map((row) => row.view()));
}

export const getMapTripsHandler = handler(D, 'Get map trips', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  return sendDataResponse(res, 200, { trips: await mapTripsView(map.id, role, req.user.id) });
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
  return sendDataResponse(res, 201, { trip: await tripView(created.id, role, role, mine(req)) });
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
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole, mine(req)) });
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
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole, mine(req)) });
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
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole, mine(req)) });
});

// Group trips: "Add to my map" (docs/API.md "Group trips")

/**
 * `{ mapId }`: show the trip on one of the caller's own maps. Anyone on the trip (any
 * trip role), onto a map they own or edit, other than the trip's own (400). Already
 * there: nothing changes (200). A completed trip marks its countries visited there at
 * once (201). Nothing is copied: the photos stay in the one trip.
 */
export const addTripToMapHandler = handler(D, 'Add trip to map', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const { mapId } = req.body || {};
  if (!isUuid(mapId)) return badRequest(req, res, D, EVENT_MESSAGES.tripMapInvalid);
  if (mapId === trip.mapId) return badRequest(req, res, D, EVENT_MESSAGES.tripOnOwnMap);

  const { map: target, role: targetRole } = await loadMap(req, mapId);
  if (!canView(targetRole)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  if (!canAddTripToMap({ tripRole: role, targetMapRole: targetRole })) return forbidden(req, res, D);

  const { created } = await addTripToMapInDB({ tripId: trip.id, mapId: target.id, addedById: req.user.id });
  if (created) {
    logEvent(createTripEvent({ user: req.user, action: 'Map Link Success', id: trip.id, detail: `map=${target.id}`, statusCode: 201 }));
  }
  return sendDataResponse(res, created ? 201 : 200, { trip: await tripView(trip.id, role, mapRole, mine(req)) });
});

/**
 * Take a trip off a map it was added to: whoever added it, or that map's owner (who
 * may no longer be on the trip). The visits it marked there stay. Someone who can see
 * neither the trip nor the map gets 404, like a link that doesn't exist.
 */
export const removeTripFromMapHandler = handler(D, 'Remove trip from map', async (req, res) => {
  const { tripId, mapId } = req.params;
  const link = isUuid(tripId) && isUuid(mapId) ? await findTripMapLink(tripId, mapId) : null;
  if (!link) return notFound(req, res, D, EVENT_MESSAGES.tripLinkNotFound);
  if (!canRemoveTripFromMap({ userId: req.user.id, addedById: link.addedById, targetMapOwnerId: link.map.ownerId })) {
    const [{ role }, { role: targetRole }] = await Promise.all([loadTrip(req, tripId), loadMap(req, mapId)]);
    if (!canView(role) && !canView(targetRole)) return notFound(req, res, D, EVENT_MESSAGES.tripLinkNotFound);
    return forbidden(req, res, D, EVENT_MESSAGES.tripLinkRemoveNotAllowed);
  }
  await deleteTripMapLink(tripId, mapId);
  logEvent(createTripEvent({ user: req.user, action: 'Map Unlink Success', id: tripId, detail: `map=${mapId}` }));
  return sendDataResponse(res, 200, { message: 'Trip taken off the map. Its countries stay marked.' });
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
  return sendDataResponse(res, 201, { trip: await tripReply(detail, role, mapRole, req.user.id) });
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
  return sendDataResponse(res, 200, { trip: await tripReply(detail, role, mapRole, req.user.id) });
});

export const deleteStopHandler = handler(D, 'Delete stop', async (req, res) => {
  const { trip, mapRole, role } = await loadTrip(req, req.params.tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.tripNotFound)) return undefined;
  const current = isUuid(req.params.stopId) ? await findStop(trip.id, req.params.stopId) : null;
  if (!current) return notFound(req, res, D, EVENT_MESSAGES.stopNotFound);
  await deleteStopInDB(current.id);
  logEvent(createTripEvent({ user: req.user, action: 'Stop Delete Success', id: trip.id, detail: `stop=${current.id}` }));
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole, mine(req)) });
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
  return sendDataResponse(res, 200, { trip: await tripView(trip.id, role, mapRole, mine(req)) });
});
