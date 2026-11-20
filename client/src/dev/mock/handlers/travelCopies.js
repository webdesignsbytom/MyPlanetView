// Mock mode only: taking your travels with you (docs/API.md "Travel copies"). Someone on a
// family map (any role) chooses the trips they went on, the moments about them, countries'
// photos and photos one by one, and asks for copies on a map they own or co-own; the family
// map's owner or a co-owner approves (the mock copies it all at once: ../travelCopies.js) or
// declines. The writes need a verified email (mockAdapter.js NEEDS_VERIFIED_EMAIL).
import { fail, ok, raw, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { atLeast, mapRole } from '../views';
import { LOCKED_MAP_MESSAGE, isMapLocked, mapPlanId, photoCounts } from '../plans';
import {
  COPY_MESSAGES as M,
  copiesOn,
  copyChoices,
  copyContents,
  copyRoom,
  copyView,
  countTravellerMoments,
  countTravellerTrips,
  findPhotosToCopy,
  isId,
  listedRequests,
  parseCopyChoice,
  placeCopy,
  pruneCopyRequests,
  runTravelCopy,
  travellersOf,
} from '../travelCopies';

const NO_PERMISSION = 'You do not have permission to do that.';
// As the server's TRAVEL_COPY_DAILY_USER_LIMIT: 20 requests a day per user, then 429
const ASKS_PER_DAY = 20;
const DAY_MS = 86400000;

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
// The map's settings and its sharing: the owner or a co-owner (the server's canManage)
const canManage = (role) => atLeast(role, 'CO_OWNER');
const signedOut = () => fail(401, 'No valid session. Please sign in.');

/**
 * A choice from the body against the family map (`mapId`) and the new map, as the server's
 * checkChoice. -> `{ fromMap, toMap, traveller, choice, photos }` or `{ error }` (a response)
 */
function checkChoice(mapId, body) {
  const db = getDb();
  const parsed = parseCopyChoice(body);
  if (parsed.error) return { error: fail(400, parsed.error) };
  const choice = parsed.value;
  const fromMap = findMap(mapId);
  const role = mapRole(fromMap);
  if (!atLeast(role, 'VIEWER')) return { error: fail(404, M.mapNotFound) };
  // The new map: one they own or co-own
  const toMap = findMap(choice.toMapId);
  const toRole = mapRole(toMap);
  if (!atLeast(toRole, 'VIEWER')) return { error: fail(404, M.copyTargetNotFound) };
  if (!canManage(toRole)) return { error: fail(403, NO_PERMISSION) };
  if (toMap.id === fromMap.id) return { error: fail(400, M.copyToSameMap) };
  const traveller = travellersOf(db, fromMap.id).find((t) => t.id === choice.travellerId);
  if (!traveller) return { error: fail(404, M.copyTravellerNotFound) };
  if (traveller.userId && traveller.userId !== me().id) return { error: fail(403, M.copyTravellerTaken) };
  // Their trips and moments only; photos they can see (never hidden ones or videos)
  const trips = countTravellerTrips(db, fromMap.id, traveller.id, choice.tripIds);
  const moments = countTravellerMoments(db, fromMap.id, traveller.id, choice.momentIds);
  const photos = findPhotosToCopy(db, fromMap.id, choice);
  const found = new Set(photos.map((p) => p.id));
  if (trips !== choice.tripIds.length || moments !== choice.momentIds.length || !choice.photoIds.every((id) => found.has(id))) {
    return { error: fail(400, M.invalidCopyChoice) };
  }
  if (!photos.length && !choice.tripIds.length && !choice.momentIds.length) return { error: fail(400, M.emptyCopyChoice) };
  return { fromMap, toMap, traveller, choice, photos };
}

/** A request the caller may see, with whether they decide it. -> `{ request, canDecide }` or `{ error }` */
function loadCopy(id) {
  const db = getDb();
  pruneCopyRequests(db);
  const request = isId(id) ? db.travelCopyRequests.find((r) => r.id === id) : null;
  if (!request) return { error: fail(404, M.copyRequestNotFound) };
  const canDecide = canManage(mapRole(findMap(request.fromMapId)));
  const canSee = canDecide || canManage(mapRole(findMap(request.toMapId))) || request.requestedById === me().id;
  if (!canSee) return { error: fail(404, M.copyRequestNotFound) };
  return { request, canDecide };
}

export function registerTravelCopyRoutes() {
  // The family map's travellers (which is the caller's), and what the one asked for (else the
  // caller's own) can take
  route('GET', '/api/maps/:mapId/travel-copy-choices', ({ params, query }) => {
    if (!session.signedIn) return signedOut();
    const db = getDb();
    const map = findMap(params.mapId);
    if (!atLeast(mapRole(map), 'VIEWER')) return fail(404, M.mapNotFound);
    const travellers = travellersOf(db, map.id);
    const asked = isId(query.traveller) ? travellers.find((t) => t.id === query.traveller) : null;
    const traveller = asked ?? travellers.find((t) => t.userId === me().id) ?? null;
    const choices = traveller ? copyChoices(db, map.id, traveller.id) : { trips: [], moments: [], countries: [] };
    return ok({
      travellers: travellers.map((t) => ({
        id: t.id,
        name: t.name,
        mine: t.userId === me().id,
        // Linked to another account: not theirs to take
        taken: Boolean(t.userId) && t.userId !== me().id,
      })),
      travellerId: traveller?.id ?? null,
      ...choices,
    });
  });

  // What a choice comes to on the new map, before asking
  route('POST', '/api/maps/:mapId/travel-copies/preview', ({ params, body }) => {
    if (!session.signedIn) return signedOut();
    const checked = checkChoice(params.mapId, body);
    if (checked.error) return checked.error;
    const { toMap, choice, photos } = checked;
    const db = getDb();
    const present = copiesOn(db.photos, toMap.id, photos.map((p) => p.id));
    const unplaced = db.photos.filter((p) => p.mapId === toMap.id && !p.countryCode && (p.kind || 'PHOTO') === 'PHOTO').length;
    const room = copyRoom({
      places: photos.filter((p) => !present.has(p.id)).map((p) => placeCopy(p, Boolean(toMap.splitUk)).countryCode),
      counts: { ...photoCounts(toMap.id), '': unplaced },
      planId: mapPlanId(toMap),
    });
    return ok({
      photos: photos.length,
      alreadyCopied: present.size,
      fits: room.fits,
      countries: room.countries,
      trips: choice.tripIds.length,
      moments: choice.momentIds.length,
      locked: isMapLocked(toMap),
    });
  });

  // Ask the family map's owner for the copy
  route('POST', '/api/maps/:mapId/travel-copies', ({ params, body }) => {
    if (!session.signedIn) return signedOut();
    const db = getDb();
    // The daily limit counts every request, as the server's limiter runs before the handler
    const since = Date.now() - DAY_MS;
    db.travelCopyAsks = (db.travelCopyAsks || []).filter((a) => a.at > since);
    if (db.travelCopyAsks.filter((a) => a.userId === me().id).length >= ASKS_PER_DAY) return fail(429, 'Too many requests — please try again later.');
    db.travelCopyAsks.push({ userId: me().id, at: Date.now() });

    const checked = checkChoice(params.mapId, body);
    if (checked.error) return checked.error;
    const { fromMap, toMap, traveller, choice, photos } = checked;
    if (isMapLocked(toMap)) return fail(403, LOCKED_MAP_MESSAGE);
    pruneCopyRequests(db);
    const waiting = db.travelCopyRequests.some(
      (r) => r.fromMapId === fromMap.id && r.toMapId === toMap.id && r.travellerId === traveller.id && r.status === 'PENDING',
    );
    if (waiting) return fail(409, M.copyAlreadyWaiting);
    const request = {
      id: newId(),
      status: 'PENDING',
      fromMapId: fromMap.id,
      toMapId: toMap.id,
      travellerId: traveller.id,
      requestedById: me().id,
      decidedById: null,
      tripIds: choice.tripIds,
      momentIds: choice.momentIds,
      // In the order they were taken: each copy goes first in its gallery, so the newest
      // taken ends up first
      photoIds: photos.map((p) => p.id),
      photoCursor: 0,
      copiedPhotos: 0,
      skippedPhotos: 0,
      createdAt: new Date().toISOString(),
      decidedAt: null,
      finishedAt: null,
    };
    db.travelCopyRequests.push(request);
    return ok({ request: copyView(request) }, 201);
  });

  // For the map's owner or a co-owner: requests to copy from it, and onto it. Anyone else: none
  route('GET', '/api/maps/:mapId/travel-copies', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const db = getDb();
    const map = findMap(params.mapId);
    const role = mapRole(map);
    if (!atLeast(role, 'VIEWER')) return fail(404, M.mapNotFound);
    if (!canManage(role)) return ok({ incoming: [], outgoing: [] });
    pruneCopyRequests(db);
    return ok({
      incoming: listedRequests(db.travelCopyRequests.filter((r) => r.fromMapId === map.id)).map((r) => copyView(r, { canDecide: true })),
      outgoing: listedRequests(db.travelCopyRequests.filter((r) => r.toMapId === map.id)).map((r) => copyView(r)),
    });
  });

  // One request, with what it holds
  route('GET', '/api/travel-copies/:id', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const loaded = loadCopy(params.id);
    if (loaded.error) return loaded.error;
    const { request, canDecide } = loaded;
    return ok({ request: { ...copyView(request, { canDecide }), ...copyContents(getDb(), request) } });
  });

  // The family map's owner or a co-owner says yes: the mock copies it all now
  route('POST', '/api/travel-copies/:id/approve', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const loaded = loadCopy(params.id);
    if (loaded.error) return loaded.error;
    const { request, canDecide } = loaded;
    if (!canDecide) return fail(403, NO_PERMISSION);
    if (request.status !== 'PENDING') return fail(409, M.copyAlreadyDecided);
    Object.assign(request, { status: 'APPROVED', decidedById: me().id, decidedAt: new Date().toISOString() });
    runTravelCopy(request);
    return ok({ request: copyView(request, { canDecide }) });
  });

  route('POST', '/api/travel-copies/:id/decline', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const loaded = loadCopy(params.id);
    if (loaded.error) return loaded.error;
    const { request, canDecide } = loaded;
    if (!canDecide) return fail(403, NO_PERMISSION);
    if (request.status !== 'PENDING') return fail(409, M.copyAlreadyDecided);
    Object.assign(request, { status: 'DECLINED', decidedById: me().id, decidedAt: new Date().toISOString() });
    return ok({ request: copyView(request, { canDecide }) });
  });

  // One more run of an approved copy (a store saved mid-copy); anything else as it is
  route('POST', '/api/travel-copies/:id/continue', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const loaded = loadCopy(params.id);
    if (loaded.error) return loaded.error;
    const { request, canDecide } = loaded;
    if (request.status === 'APPROVED') runTravelCopy(request);
    return ok({ request: copyView(request, { canDecide }) });
  });

  // The person who asked withdraws it while it's waiting
  route('DELETE', '/api/travel-copies/:id', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const loaded = loadCopy(params.id);
    if (loaded.error) return loaded.error;
    const { request } = loaded;
    if (request.requestedById !== me().id) return fail(403, NO_PERMISSION);
    if (request.status !== 'PENDING') return fail(409, M.copyNotWaiting);
    const db = getDb();
    db.travelCopyRequests = db.travelCopyRequests.filter((r) => r.id !== request.id);
    // The server's sendMessageResponse: `{ status, message }`
    return raw({ status: 'success', message: M.copyRequestWithdrawn });
  });
}
