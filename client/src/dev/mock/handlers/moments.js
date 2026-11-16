// Mock mode only: moments (docs/API.md "Moments"), with the photo rules: the owner and the
// map's editors change any; a trip's editor (a trip-only one too) those on their trip;
// viewers and share links read them, never hidden ones. The share link's list is in
// handlers/sharing.js.
import { fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { atLeast, mapRole, tripRole } from '../views';
import { MOMENT_MESSAGES as M, canSeeMoment, momentPage, momentPhotoScope, momentView, parseMoment } from '../moments';

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
const findTrip = (id) => getDb().trips.find((t) => t.id === id) || null;

// No role at all is a 404 (nothing to probe); a role that isn't enough is a 403
const denyUnlessEditor = (role, notFound) => {
  if (!atLeast(role, 'VIEWER')) return fail(404, notFound);
  if (!atLeast(role, 'EDITOR')) return fail(403, 'You do not have permission to do that.');
  return null;
};

/** A moment with the caller's roles: on a trip, their trip role; else their map role. */
function loadMoment(momentId) {
  const moment = getDb().moments.find((m) => m.id === momentId) || null;
  if (!moment) return { moment: null, mapRole: null, role: null };
  const onMap = mapRole(findMap(moment.mapId));
  const trip = moment.tripId ? findTrip(moment.tripId) : null;
  return { moment, mapRole: onMap, role: trip ? tripRole(trip) : onMap };
}

/** The moment as its writer sees it after a change. */
const writerView = (moment, { role, mapRole: onMap }) =>
  momentView(moment, { role, photoAccess: { mapRole: onMap, trip: moment.tripId ? { id: moment.tripId, role } : null } });

export function registerMomentRoutes() {
  route('GET', '/api/maps/:mapId/moments', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    if (!atLeast(role, 'VIEWER')) return fail(404, M.mapNotFound);
    const page = momentPage({ query, mapId: map.id, role, photoAccess: { mapRole: role, trip: null } });
    return page.error ? fail(400, page.error) : ok(page);
  });

  // A trip's moments, for anyone on the trip (a trip-only member sees only its photos)
  route('GET', '/api/trips/:tripId/moments', ({ params, query }) => {
    const trip = findTrip(params.tripId);
    const role = tripRole(trip);
    if (!atLeast(role, 'VIEWER')) return fail(404, M.tripNotFound);
    const onMap = mapRole(findMap(trip.mapId));
    const page = momentPage({ query, mapId: trip.mapId, tripId: trip.id, role, photoAccess: { mapRole: onMap, trip: { id: trip.id, role } } });
    return page.error ? fail(400, page.error) : ok(page);
  });

  // A map editor anywhere on the map; a trip's editor only on that trip (`tripId`)
  route('POST', '/api/maps/:mapId/moments', ({ params, body }) => {
    const tripId = body.tripId || null;
    const map = findMap(params.mapId);
    const onMap = mapRole(map);
    let role = onMap;
    if (map && tripId) {
      const trip = findTrip(tripId);
      role = trip && trip.mapId === map.id ? tripRole(trip) : null;
    }
    const denied = denyUnlessEditor(map ? role : null, M.mapNotFound);
    if (denied) return denied;

    const parsed = parseMoment(body, { mapId: map.id, photoScope: momentPhotoScope(onMap, tripId) });
    if (parsed.error) return fail(400, parsed.error);
    const { data, travellerIds = [], photoIds = [] } = parsed.value;
    const now = new Date().toISOString();
    const moment = {
      id: newId(),
      text: null,
      placeName: null,
      landmarkId: null,
      hidden: false,
      happenedOn: null,
      datePrecision: null,
      ...data,
      mapId: map.id,
      tripId,
      createdById: session.signedIn ? me().id : null,
      travellerIds,
      photoIds,
      createdAt: now,
      updatedAt: now,
    };
    getDb().moments.push(moment);
    return ok({ moment: writerView(moment, { role, mapRole: onMap }) }, 201);
  });

  route('PATCH', '/api/moments/:momentId', ({ params, body }) => {
    const db = getDb();
    const { moment, mapRole: onMap, role } = loadMoment(params.momentId);
    if (!moment || !canSeeMoment(role, moment)) return fail(404, M.notFound);
    if (!atLeast(role, 'EDITOR')) return fail(403, 'You do not have permission to do that.');

    // Moving it to another trip, or off its trip, needs the map (a trip-only editor would lose it)
    const tripChange = {};
    if (body.tripId !== undefined && (body.tripId || null) !== moment.tripId) {
      if (!atLeast(onMap, 'EDITOR')) return fail(403, M.tripChangeNeedsMap);
      const next = body.tripId || null;
      if (next !== null && !db.trips.some((t) => t.id === next && t.mapId === moment.mapId)) return fail(400, M.tripNotFound);
      tripChange.tripId = next;
    }

    const photoScope = momentPhotoScope(onMap, moment.tripId);
    const parsed = parseMoment(body, { partial: true, current: moment, mapId: moment.mapId, photoScope });
    if (parsed.error) return fail(400, parsed.error);
    const { data, travellerIds } = parsed.value;
    let { photoIds } = parsed.value;
    // A trip-only editor sees and chooses only the trip's photos: the others stay, after theirs
    if (photoIds && photoScope) {
      const kept = moment.photoIds.filter((id) => !photoIds.includes(id) && db.photos.find((p) => p.id === id)?.tripId !== photoScope);
      photoIds = [...photoIds, ...kept];
      if (photoIds.length > 20) return fail(400, M.photos);
    }

    Object.assign(moment, tripChange, data, { updatedAt: new Date().toISOString() });
    if (travellerIds) moment.travellerIds = travellerIds;
    if (photoIds) moment.photoIds = photoIds;
    const nextRole = moment.tripId ? tripRole(findTrip(moment.tripId)) : onMap;
    return ok({ moment: writerView(moment, { role: nextRole, mapRole: onMap }) });
  });

  route('DELETE', '/api/moments/:momentId', ({ params }) => {
    const db = getDb();
    const { moment, role } = loadMoment(params.momentId);
    if (!moment || !canSeeMoment(role, moment)) return fail(404, M.notFound);
    if (!atLeast(role, 'EDITOR')) return fail(403, 'You do not have permission to do that.');
    db.moments = db.moments.filter((m) => m.id !== moment.id);
    return ok({ message: 'Moment deleted.' });
  });
}
