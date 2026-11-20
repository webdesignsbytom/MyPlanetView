// Opening a share link (/shared/<code>): anyone, signed in or not.
// Reads only, so nothing is logged; lookups are rate limited per IP.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { canEdit, canSeePhoto, canView, higherRole, linkRoleFor, mapRoleFor, tripRoleFor } from '../utils/access.js';
import { normaliseShareCode } from '../utils/shareCodes.js';
import { isUuid } from '../utils/travelValidation.js';
import { findMapAccessByShareCode } from '../domain/maps.js';
import { findTripAccessByShareCode } from '../domain/trips.js';
import { findPhotoAccess, findPhotoDetail } from '../domain/photos.js';
import { badRequest, forbidden, handler, notFound } from './helpers/travel.js';
import { photoDetailView } from './helpers/views.js';
import { mapDetailView } from './maps.js';
import { mapTripsView, tripView } from './trips.js';
import { photoPage } from './photos.js';
import { momentPage } from './moments.js';
import { countryListPages } from './countryLists.js';
import { adsFor } from '../services/offers.js';
import { buildPassport } from '../services/travel/passport.js';
import { mapBadges, mapGoals } from '../services/travel/achievements.js';
import { mapThemesView, themeAlbumPage } from './themes.js';
import { countryMapOf, pinDetail, pinList, subdivisionStatuses } from './countryMaps.js';

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
    // Group trips added to the map are listed with their limited fields only: a share
    // link never opens another map's trip
    const [map, trips, ads] = await Promise.all([
      mapDetailView(shared.map.id, shared.role),
      mapTripsView(shared.map.id, shared.role, req.user?.id ?? null, { viaShareLink: true }),
      adsFor({ mapId: shared.map.id, viewerId: req.user?.id ?? null }),
    ]);
    return sendDataResponse(res, 200, { resource: 'map', id: shared.map.id, role: shared.role, map: { ...map, ads }, trips });
  }
  const [trip, ads] = await Promise.all([
    tripView(shared.trip.id, shared.role),
    adsFor({ mapId: shared.trip.mapId, viewerId: req.user?.id ?? null }),
  ]);
  return sendDataResponse(res, 200, { resource: 'trip', id: shared.trip.id, role: shared.role, trip: { ...trip, ads } });
});

export const getSharedPhotosHandler = handler(D, 'Open share link photos', async (req, res) => {
  const shared = await resolveCode(req);
  if (!shared) return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
  const scope =
    shared.kind === 'map'
      ? { mapId: shared.map.id }
      : { mapId: shared.trip.mapId, tripId: shared.trip.id };
  // Never the best copies (`best=1`): those are for the map's own editors, on its own routes
  const result = await photoPage({ query: req.query || {}, ...scope, role: shared.role, allowBest: false });
  if (result.forbidden) return forbidden(req, res, D);
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// A map link's country tickets, every first page in one reply (controllers/countryLists.js):
// one request against the link's browse limit instead of one per country. Map links only:
// a trip's page has no country tickets
export const getSharedCountryListsHandler = handler(D, 'Open share link country lists', async (req, res) => {
  const shared = await resolveCode(req);
  if (!shared || shared.kind !== 'map') return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
  const result = await countryListPages({
    query: req.query || {},
    mapId: shared.map.id,
    role: shared.role,
    photoAccess: { mapRole: shared.role, trip: null },
  });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// The map's moments, or the trip's (with that trip's photos only); never hidden ones
// below editor
export const getSharedMomentsHandler = handler(D, 'Open share link moments', async (req, res) => {
  const shared = await resolveCode(req);
  if (!shared) return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
  const scope =
    shared.kind === 'map'
      ? { mapId: shared.map.id, photoAccess: { mapRole: shared.role, trip: null } }
      : {
          mapId: shared.trip.mapId,
          tripId: shared.trip.id,
          photoAccess: { mapRole: null, trip: { id: shared.trip.id, role: shared.role } },
        };
  const result = await momentPage({ query: req.query || {}, ...scope, role: shared.role });
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

// A map's passport, badges and goals through its link (a trip link has none: 404). Viewers
// see them as they see the map: no hidden photos; a member who edits it still awards.
async function sharedMap(req, res) {
  const shared = await resolveCode(req);
  if (!shared || shared.kind !== 'map') {
    notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
    return null;
  }
  return shared;
}

// A country map through a map's share link (docs/API.md "Country maps"): its states visited
// and its pins, as a viewer sees them (never a hidden pin, or a hidden photo in a visit)
async function sharedCountryMap(req, res) {
  const shared = await sharedMap(req, res);
  if (!shared) return null;
  const country = await countryMapOf(req.query?.country, shared.map.splitUk);
  if (!country) {
    badRequest(req, res, D, EVENT_MESSAGES.countryMapNotFound);
    return null;
  }
  return { shared, country };
}

export const getSharedSubdivisionsHandler = handler(D, 'Open share link states', async (req, res) => {
  const found = await sharedCountryMap(req, res);
  if (!found) return undefined;
  return sendDataResponse(res, 200, { subdivisions: await subdivisionStatuses(found.shared.map.id, found.country) });
});

export const getSharedPinsHandler = handler(D, 'Open share link pins', async (req, res) => {
  const found = await sharedCountryMap(req, res);
  if (!found) return undefined;
  return sendDataResponse(res, 200, { pins: await pinList(found.shared.map.id, found.country, found.shared.role) });
});

export const getSharedPinHandler = handler(D, 'Open share link pin', async (req, res) => {
  const shared = await sharedMap(req, res);
  if (!shared) return undefined;
  const pin = isUuid(req.params.pinId) ? await pinDetail(req.params.pinId, shared.role, { mapId: shared.map.id }) : null;
  if (!pin) return notFound(req, res, D, EVENT_MESSAGES.pinNotFound);
  return sendDataResponse(res, 200, { pin });
});

export const getSharedPassportHandler = handler(D, 'Open share link passport', async (req, res) => {
  const shared = await sharedMap(req, res);
  if (!shared) return undefined;
  const passport = await buildPassport(shared.map.id, shared.role);
  if (!passport) return notFound(req, res, D, EVENT_MESSAGES.shareCodeNotFound);
  return sendDataResponse(res, 200, { passport });
});

export const getSharedBadgesHandler = handler(D, 'Open share link badges', async (req, res) => {
  const shared = await sharedMap(req, res);
  if (!shared) return undefined;
  return sendDataResponse(res, 200, await mapBadges(shared.map.id, { award: canEdit(shared.role) }));
});

// A map's theme albums through its link (docs/API.md, "Photo themes"): as its viewers see
// them; never how many more an editor may enter (the link is for looking)
export const getSharedThemesHandler = handler(D, 'Open share link themes', async (req, res) => {
  const shared = await sharedMap(req, res);
  if (!shared) return undefined;
  const view = await mapThemesView(shared.map.id, shared.role);
  if (view.current) delete view.current.entriesLeft;
  return sendDataResponse(res, 200, view);
});

export const getSharedThemeAlbumHandler = handler(D, 'Open share link theme album', async (req, res) => {
  const shared = await sharedMap(req, res);
  if (!shared) return undefined;
  const result = await themeAlbumPage({ mapId: shared.map.id, themeId: req.params.themeId, role: shared.role, query: req.query || {} });
  if (result.notFound) return notFound(req, res, D, result.notFound);
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

export const getSharedGoalsHandler = handler(D, 'Open share link goals', async (req, res) => {
  const shared = await sharedMap(req, res);
  if (!shared) return undefined;
  return sendDataResponse(res, 200, await mapGoals(shared.map.id, { award: canEdit(shared.role) }));
});
