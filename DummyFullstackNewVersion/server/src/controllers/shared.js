// Opening a share link (/shared/<code>): anyone, signed in or not.
// Reads only, so nothing is logged; lookups are rate limited per IP.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { canSeePhoto, canView, higherRole, linkRoleFor, mapRoleFor, tripRoleFor } from '../utils/access.js';
import { normaliseShareCode } from '../utils/shareCodes.js';
import { isUuid } from '../utils/travelValidation.js';
import { findMapAccessByShareCode } from '../domain/maps.js';
import { findTripAccessByShareCode, findTripsForMap } from '../domain/trips.js';
import { findPhotoAccess, findPhotoDetail } from '../domain/photos.js';
import { badRequest, handler, notFound } from './helpers/travel.js';
import { photoDetailView, tripSummary } from './helpers/views.js';
import { mapDetailView } from './maps.js';
import { tripView } from './trips.js';
import { photoPage } from './photos.js';

const D = DOMAINS.sharing;

/**
 * The map or trip a code opens, with the caller's role: a member keeps their
 * own role, anyone else gets VIEWER when the link is on. Null when neither.
 */
async function resolveCode(req) {
  const code = normaliseShareCode(req.params.code);
  if (!code) return null;
  const userId = req.user?.id;

  const map = await findMapAccessByShareCode(code, userId);
  if (map) {
    const role = higherRole(mapRoleFor(map, userId, map.members?.[0]), linkRoleFor(map.linkAccess));
    return role ? { kind: 'map', map, role } : null;
  }

  const trip = await findTripAccessByShareCode(code, userId);
  if (trip) {
    const memberRole = tripRoleFor(mapRoleFor(trip.map, userId, trip.map.members?.[0]), trip.members?.[0]);
    const role = higherRole(memberRole, linkRoleFor(trip.linkAccess));
    return role ? { kind: 'trip', trip, role } : null;
  }
  return null;
}

export const getSharedHandler = handler(D, 'Open share link', async (req, res) => {
  const shared = await resolveCode(req);
  if (!shared) return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);

  if (shared.kind === 'map') {
    const [map, trips] = await Promise.all([
      mapDetailView(shared.map.id, shared.role),
      findTripsForMap(shared.map.id),
    ]);
    return sendDataResponse(res, 200, {
      resource: 'map',
      id: shared.map.id,
      role: shared.role,
      map,
      trips: await Promise.all(trips.map((t) => tripSummary(t, shared.role))),
    });
  }
  return sendDataResponse(res, 200, {
    resource: 'trip',
    id: shared.trip.id,
    role: shared.role,
    trip: await tripView(shared.trip.id, shared.role),
  });
});

export const getSharedPhotosHandler = handler(D, 'Open share link photos', async (req, res) => {
  const shared = await resolveCode(req);
  if (!shared) return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
  const scope =
    shared.kind === 'map'
      ? { mapId: shared.map.id }
      : { mapId: shared.trip.mapId, tripId: shared.trip.id };
  const result = await photoPage({ query: req.query || {}, ...scope, role: shared.role });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

export const getSharedPhotoHandler = handler(D, 'Open share link photo', async (req, res) => {
  const shared = await resolveCode(req);
  if (!shared) return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
  const photo = isUuid(req.params.photoId) ? await findPhotoAccess(req.params.photoId, null) : null;
  const inScope =
    photo &&
    (shared.kind === 'map' ? photo.mapId === shared.map.id : photo.tripId === shared.trip.id);
  if (!inScope || !canView(shared.role) || !canSeePhoto(shared.role, photo)) {
    return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
  }
  return sendDataResponse(res, 200, { photo: await photoDetailView(await findPhotoDetail(photo.id), shared.role) });
});
