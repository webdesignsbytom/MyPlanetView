// Shared by the travel controllers: error replies, the handler wrapper, and
// loading a map, trip or photo together with the caller's role on it.
import { logEvent } from '../../utils/events/logEvent.js';
import {
  BadRequestEvent,
  ConflictEvent,
  NoPermissionEvent,
  NotFoundEvent,
  ServerErrorEvent,
  createGenericErrorEvent,
} from '../../event/errorUtils.js';
import { sendMessageResponse } from '../../utils/responses/responses.js';
import { canView, mapRoleFor, tripRoleFor } from '../../utils/access.js';
import { isUuid } from '../../utils/travelValidation.js';
import { findMapAccess } from '../../domain/maps.js';
import { findTripAccess } from '../../domain/trips.js';
import { findPhotoAccess } from '../../domain/photos.js';

export const reply = (res, errorEvent) => {
  logEvent(createGenericErrorEvent(errorEvent));
  return sendMessageResponse(res, errorEvent.code, errorEvent.message);
};

export const badRequest = (req, res, domain, message) => reply(res, new BadRequestEvent(req.user, domain, message));
// No role is answered as "not found", so ids and codes can't be probed
export const notFound = (req, res, domain, message) => reply(res, new NotFoundEvent(req.user, domain, message));
export const conflict = (req, res, domain, message) => reply(res, new ConflictEvent(req.user, domain, message));
export const forbidden = (req, res, domain, message) => reply(res, new NoPermissionEvent(req.user, domain, message));

/**
 * Answer and return true unless `check(role)` passes: no role at all is a 404
 * (nothing to probe), a role that isn't enough is a 403.
 */
export function denyUnless(req, res, domain, role, check, notFoundMessage) {
  if (!canView(role)) {
    notFound(req, res, domain, notFoundMessage);
    return true;
  }
  if (!check(role)) {
    forbidden(req, res, domain);
    return true;
  }
  return false;
}

/** Wrap a handler: anything thrown becomes a logged 500 with the generic message. */
export const handler = (domain, label, fn) =>
  async function travelHandler(req, res) {
    try {
      return await fn(req, res);
    } catch (err) {
      if (res.headersSent) return undefined;
      // Thrown by the media service with a client-facing status (size, type)
      if (err?.status >= 400 && err.status < 500) return sendMessageResponse(res, err.status, err.message);
      return reply(res, new ServerErrorEvent(req.user, domain, `${label} failed: ${err?.message}`));
    }
  };

/** `{ map, role }`; role is null when the caller has none (or the map doesn't exist). */
export async function loadMap(req, mapId) {
  if (!isUuid(mapId)) return { map: null, role: null };
  const userId = req.user?.id;
  const map = await findMapAccess(mapId, userId);
  return { map, role: mapRoleFor(map, userId, map?.members?.[0]) };
}

/** `{ trip, mapRole, role }`: role is the higher of the map role and the trip's own. */
export async function loadTrip(req, tripId) {
  if (!isUuid(tripId)) return { trip: null, mapRole: null, role: null };
  const userId = req.user?.id;
  const trip = await findTripAccess(tripId, userId);
  if (!trip) return { trip: null, mapRole: null, role: null };
  const mapRole = mapRoleFor(trip.map, userId, trip.map.members?.[0]);
  return { trip, mapRole, role: tripRoleFor(mapRole, trip.members?.[0]) };
}

/** `{ photo, mapRole, role }`: a trip-only member reaches only that trip's photos. */
export async function loadPhoto(req, photoId) {
  if (!isUuid(photoId)) return { photo: null, mapRole: null, role: null };
  const userId = req.user?.id;
  const photo = await findPhotoAccess(photoId, userId);
  if (!photo) return { photo: null, mapRole: null, role: null };
  const mapRole = mapRoleFor(photo.map, userId, photo.map.members?.[0]);
  return { photo, mapRole, role: tripRoleFor(mapRole, photo.trip?.members?.[0]) };
}

/**
 * The caller's role for adding photos to a map, optionally into one trip:
 * a map editor anywhere on the map, a trip editor only into that trip.
 * -> `{ map, role }`, role null when they can't see the map or the trip.
 */
export async function loadUploadTarget(req, mapId, tripId) {
  const { map, role: mapRole } = await loadMap(req, mapId);
  if (!map) return { map: null, role: null };
  if (!tripId) return { map, role: mapRole };
  const { trip, role } = await loadTrip(req, tripId);
  if (!trip || trip.mapId !== map.id) return { map, role: null };
  return { map, role };
}
