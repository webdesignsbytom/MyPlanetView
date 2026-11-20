// Taking your travels with you (docs/API.md "Travel copies"): someone on a family map chooses
// the trips, moments, countries and photos they're in, and asks for copies on a map of their
// own (one they own or co-own); the family map's owner or a co-owner approves or declines.
// Approved, services/travel/travelCopies.js copies them, a run at a time.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { runAfterResponse } from '../utils/background.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canManage, canView } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { LOCKED_MAP_MESSAGE } from '../utils/planLimits.js';
import { copyRoom, parseCopyChoice, placeCopy } from '../utils/travelCopies.js';
import { countPhotosByCountry, countPhotosInCountry } from '../domain/photos.js';
import {
  countTravellerMoments,
  countTravellerTrips,
  createCopyRequestInDB,
  decideCopyRequestInDB,
  deletePendingCopyInDB,
  findCopiesOn,
  findCopyChoices,
  findCopyContents,
  findCopyRequest,
  findCopyRequestsFromMap,
  findCopyRequestsToMap,
  findPendingCopy,
  findPhotosToCopy,
  findTravellersForCopy,
} from '../domain/travelCopies.js';
import { loadMapPlan } from '../services/travel/plans.js';
import { emailCopyDeclined, emailCopyRequested, runTravelCopy } from '../services/travel/travelCopies.js';
import { badRequest, conflict, denyUnless, forbidden, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.maps;

const day = (date) => (date ? date.toISOString().slice(0, 10) : null);

// Views

function copyView(r, userId, { canDecide = false } = {}) {
  return {
    id: r.id,
    status: r.status,
    fromMap: { id: r.fromMap.id, name: r.fromMap.name },
    toMap: { id: r.toMap.id, name: r.toMap.name },
    traveller: { id: r.traveller.id, name: r.traveller.name },
    requestedBy: { id: r.requestedBy.id, name: r.requestedBy.name },
    trips: r.tripIds.length,
    moments: r.momentIds.length,
    photos: r.photoIds.length,
    progress: { done: r.photoCursor, copied: r.copiedPhotos, skipped: r.skippedPhotos },
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    finishedAt: r.finishedAt,
    mine: r.requestedById === userId,
    canDecide: canDecide && r.status === 'PENDING',
    canCancel: r.requestedById === userId && r.status === 'PENDING',
  };
}

/** The caller's say over a request: decide it (the family map's managers), see it, or neither. */
async function copyAccess(req, request) {
  const userId = req.user.id;
  const [{ role: fromRole }, { role: toRole }] = await Promise.all([loadMap(req, request.fromMapId), loadMap(req, request.toMapId)]);
  const canDecide = canManage(fromRole);
  const canSee = canDecide || canManage(toRole) || request.requestedById === userId;
  return { canDecide, canSee };
}

// Choosing

/**
 * GET /api/maps/:mapId/travel-copy-choices?traveller=<id>: the map's travellers (which is the
 * caller's), and what the chosen traveller (else the caller's own) can take.
 */
export const getCopyChoicesHandler = handler(D, 'Travel copy choices', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canView, EVENT_MESSAGES.mapNotFound)) return undefined;
  const travellers = await findTravellersForCopy(map.id);
  const asked = isUuid(req.query.traveller) ? travellers.find((t) => t.id === req.query.traveller) : null;
  const traveller = asked ?? travellers.find((t) => t.userId === req.user.id) ?? null;
  const choices = traveller ? await findCopyChoices(map.id, traveller.id) : { trips: [], moments: [], countries: [] };
  return sendDataResponse(res, 200, {
    travellers: travellers.map((t) => ({
      id: t.id,
      name: t.name,
      mine: t.userId === req.user.id,
      // Linked to another account: not theirs to take
      taken: Boolean(t.userId) && t.userId !== req.user.id,
    })),
    travellerId: traveller?.id ?? null,
    trips: choices.trips.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      startDate: day(t.startDate),
      endDate: day(t.endDate),
      countries: [...new Set(t.stops.map((s) => s.countryCode))],
      photos: t.photos,
    })),
    moments: choices.moments.map((m) => ({
      id: m.id,
      kind: m.kind,
      title: m.title,
      happenedOn: day(m.happenedOn),
      datePrecision: m.datePrecision,
      countryCode: m.countryCode,
      photoIds: m.photos.map((p) => p.photoId),
    })),
    countries: choices.countries,
  });
});

/**
 * Check a choice from the body against the family map (`:mapId`) and the new map: answers
 * and returns null when it can't be taken. -> `{ fromMap, toMap, choice, photos }`
 */
async function checkChoice(req, res) {
  const parsed = parseCopyChoice(req.body);
  if (parsed.error) {
    badRequest(req, res, D, EVENT_MESSAGES[parsed.error]);
    return null;
  }
  const choice = parsed.value;
  const { map: fromMap, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canView, EVENT_MESSAGES.mapNotFound)) return null;
  // The new map: one they own or co-own
  const { map: toMap, role: toRole } = await loadMap(req, choice.toMapId);
  if (!toMap || !canView(toRole)) {
    notFound(req, res, D, EVENT_MESSAGES.copyTargetNotFound);
    return null;
  }
  if (!canManage(toRole)) {
    forbidden(req, res, D);
    return null;
  }
  if (toMap.id === fromMap.id) {
    badRequest(req, res, D, EVENT_MESSAGES.copyToSameMap);
    return null;
  }
  const traveller = (await findTravellersForCopy(fromMap.id)).find((t) => t.id === choice.travellerId);
  if (!traveller) {
    notFound(req, res, D, EVENT_MESSAGES.copyTravellerNotFound);
    return null;
  }
  if (traveller.userId && traveller.userId !== req.user.id) {
    forbidden(req, res, D, EVENT_MESSAGES.copyTravellerTaken);
    return null;
  }
  // Their trips and moments only; photos they can see (never hidden ones or videos)
  const [trips, moments, photos] = await Promise.all([
    choice.tripIds.length ? countTravellerTrips(fromMap.id, traveller.id, choice.tripIds) : 0,
    choice.momentIds.length ? countTravellerMoments(fromMap.id, traveller.id, choice.momentIds) : 0,
    findPhotosToCopy(fromMap.id, choice),
  ]);
  const found = new Set(photos.map((p) => p.id));
  if (trips !== choice.tripIds.length || moments !== choice.momentIds.length || !choice.photoIds.every((id) => found.has(id))) {
    badRequest(req, res, D, EVENT_MESSAGES.invalidCopyChoice);
    return null;
  }
  if (!photos.length && !choice.tripIds.length && !choice.momentIds.length) {
    badRequest(req, res, D, EVENT_MESSAGES.emptyCopyChoice);
    return null;
  }
  return { fromMap, toMap, traveller, choice, photos };
}

/**
 * POST /api/maps/:mapId/travel-copies/preview: what a choice comes to on the new map, before
 * asking. -> `{ photos, alreadyCopied, fits, countries: [{ countryCode, photos, room, fits }],
 * trips, moments, locked }`
 */
export const previewCopyHandler = handler(D, 'Travel copy preview', async (req, res) => {
  const checked = await checkChoice(req, res);
  if (!checked) return undefined;
  const { toMap, choice, photos } = checked;
  const [mapPlan, counts, unplaced, present] = await Promise.all([
    loadMapPlan(toMap.id),
    countPhotosByCountry(toMap.id),
    countPhotosInCountry(toMap.id, null),
    findCopiesOn(
      'photo',
      toMap.id,
      photos.map((p) => p.id),
    ),
  ]);
  const toCopy = photos.filter((p) => !present.has(p.id));
  const room = copyRoom({
    places: toCopy.map((p) => placeCopy(p, toMap.splitUk).countryCode),
    counts: { ...counts, '': unplaced },
    planId: mapPlan?.plan ?? 'FREE',
  });
  return sendDataResponse(res, 200, {
    photos: photos.length,
    alreadyCopied: present.size,
    fits: room.fits,
    countries: room.countries,
    trips: choice.tripIds.length,
    moments: choice.momentIds.length,
    locked: Boolean(mapPlan?.locked),
  });
});

/** POST /api/maps/:mapId/travel-copies: ask the family map's owner for the copy. -> 201 `{ request }` */
export const createCopyHandler = handler(D, 'Travel copy request', async (req, res) => {
  const checked = await checkChoice(req, res);
  if (!checked) return undefined;
  const { fromMap, toMap, traveller, choice, photos } = checked;
  const mapPlan = await loadMapPlan(toMap.id);
  if (mapPlan?.locked) return forbidden(req, res, D, LOCKED_MAP_MESSAGE);
  if (await findPendingCopy({ fromMapId: fromMap.id, toMapId: toMap.id, travellerId: traveller.id })) {
    return conflict(req, res, D, EVENT_MESSAGES.copyAlreadyWaiting);
  }
  const request = await createCopyRequestInDB({
    fromMapId: fromMap.id,
    toMapId: toMap.id,
    travellerId: traveller.id,
    requestedById: req.user.id,
    tripIds: choice.tripIds,
    momentIds: choice.momentIds,
    // In the order they were taken (findPhotosToCopy): each copy goes first in its gallery,
    // so the newest taken ends up first, as a gallery shows
    photoIds: photos.map((p) => p.id),
  });
  runAfterResponse(emailCopyRequested(request));
  logEvent(
    createMapEvent({
      user: req.user,
      action: 'Travel Copy Request Success',
      id: fromMap.id,
      detail: `request=${request.id} toMap=${toMap.id} photos=${photos.length}`,
      statusCode: 201,
    }),
  );
  return sendDataResponse(res, 201, { request: copyView(request, req.user.id) });
});

/**
 * GET /api/maps/:mapId/travel-copies: for a map's owner or a co-owner, the requests to copy
 * from it (`incoming`) and onto it (`outgoing`). Anyone else: none.
 */
export const getMapCopiesHandler = handler(D, 'Travel copies', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canView, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (!canManage(role)) return sendDataResponse(res, 200, { incoming: [], outgoing: [] });
  const [incoming, outgoing] = await Promise.all([findCopyRequestsFromMap(map.id), findCopyRequestsToMap(map.id)]);
  return sendDataResponse(res, 200, {
    incoming: incoming.map((r) => copyView(r, req.user.id, { canDecide: true })),
    outgoing: outgoing.map((r) => copyView(r, req.user.id)),
  });
});

// One request

/** Load a request the caller may see: answers 404 and returns null otherwise. */
async function loadCopy(req, res) {
  const request = isUuid(req.params.id) ? await findCopyRequest(req.params.id) : null;
  if (!request) {
    notFound(req, res, D, EVENT_MESSAGES.copyRequestNotFound);
    return null;
  }
  const access = await copyAccess(req, request);
  if (!access.canSee) {
    notFound(req, res, D, EVENT_MESSAGES.copyRequestNotFound);
    return null;
  }
  return { request, ...access };
}

/**
 * GET /api/travel-copies/:id: a request with what it holds, for deciding: the trips' and
 * moments' titles, and the photos per country.
 */
export const getCopyHandler = handler(D, 'Travel copy', async (req, res) => {
  const loaded = await loadCopy(req, res);
  if (!loaded) return undefined;
  const { request, canDecide } = loaded;
  const { trips, moments, countries } = await findCopyContents(request);
  return sendDataResponse(res, 200, {
    request: {
      ...copyView(request, req.user.id, { canDecide }),
      tripList: trips.map((t) => ({ id: t.id, title: t.title, startDate: day(t.startDate) })),
      momentList: moments.map((m) => ({ id: m.id, title: m.title, happenedOn: day(m.happenedOn) })),
      countries,
    },
  });
});

/** POST /api/travel-copies/:id/approve: the family map's owner or a co-owner says yes; copying starts. */
export const approveCopyHandler = handler(D, 'Travel copy approve', async (req, res) => {
  const loaded = await loadCopy(req, res);
  if (!loaded) return undefined;
  const { request, canDecide } = loaded;
  if (!canDecide) return forbidden(req, res, D);
  if (!(await decideCopyRequestInDB(request.id, { status: 'APPROVED', decidedById: req.user.id }))) {
    return conflict(req, res, D, EVENT_MESSAGES.copyAlreadyDecided);
  }
  logEvent(createMapEvent({ user: req.user, action: 'Travel Copy Approve Success', id: request.fromMapId, detail: `request=${request.id}` }));
  // The first run now; the browser asks for the rest (…/continue), the daily cron as a backstop
  let current;
  try {
    current = await runTravelCopy(request.id);
  } catch (err) {
    console.error('[travel-copy] first run failed:', err?.message);
    current = await findCopyRequest(request.id);
  }
  return sendDataResponse(res, 200, { request: copyView(current, req.user.id, { canDecide }) });
});

/** POST /api/travel-copies/:id/decline: the family map's owner or a co-owner says no. */
export const declineCopyHandler = handler(D, 'Travel copy decline', async (req, res) => {
  const loaded = await loadCopy(req, res);
  if (!loaded) return undefined;
  const { request, canDecide } = loaded;
  if (!canDecide) return forbidden(req, res, D);
  if (!(await decideCopyRequestInDB(request.id, { status: 'DECLINED', decidedById: req.user.id }))) {
    return conflict(req, res, D, EVENT_MESSAGES.copyAlreadyDecided);
  }
  const current = await findCopyRequest(request.id);
  runAfterResponse(emailCopyDeclined(current));
  logEvent(createMapEvent({ user: req.user, action: 'Travel Copy Decline Success', id: request.fromMapId, detail: `request=${request.id}` }));
  return sendDataResponse(res, 200, { request: copyView(current, req.user.id, { canDecide }) });
});

/** POST /api/travel-copies/:id/continue: one more run of an approved copy (either side may ask). */
export const continueCopyHandler = handler(D, 'Travel copy continue', async (req, res) => {
  const loaded = await loadCopy(req, res);
  if (!loaded) return undefined;
  const { request, canDecide } = loaded;
  const current = request.status === 'APPROVED' ? await runTravelCopy(request.id) : request;
  return sendDataResponse(res, 200, { request: copyView(current, req.user.id, { canDecide }) });
});

/** DELETE /api/travel-copies/:id: the person who asked withdraws it while it's waiting. */
export const cancelCopyHandler = handler(D, 'Travel copy withdraw', async (req, res) => {
  const loaded = await loadCopy(req, res);
  if (!loaded) return undefined;
  const { request } = loaded;
  if (request.requestedById !== req.user.id) return forbidden(req, res, D);
  if (!(await deletePendingCopyInDB(request.id))) return conflict(req, res, D, EVENT_MESSAGES.copyNotWaiting);
  logEvent(createMapEvent({ user: req.user, action: 'Travel Copy Withdraw Success', id: request.fromMapId, detail: `request=${request.id}` }));
  return sendMessageResponse(res, 200, EVENT_MESSAGES.copyRequestWithdrawn);
});
