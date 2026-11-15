// Mock mode only: one trip, its travellers and stops, its photos, and the trips
// shared with you on their own. Every change answers with the whole trip.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { atLeast, countryExists, landmarkById, mapRole, markVisited, photoPage, tripRole, tripSummary, tripView } from '../views';

const TRIP_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];
const NOT_FOUND = 'This trip could not be found.';
const findTrip = (id) => getDb().trips.find((t) => t.id === id) || null;
const cleanText = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);

// As the server (controllers/trips.js): a trip becoming COMPLETED adds a TRIP visit for
// each stop's country; on a completed trip, a new stop, or a stop given a country, adds
// its own. Nothing else does: a visit removed by hand stays removed after other edits.
function addTripVisits(trip, codes = getDb().stops.filter((s) => s.tripId === trip.id).map((s) => s.countryCode)) {
  codes.forEach((code) => markVisited(trip.mapId, code, 'TRIP'));
}

function stopFields(body) {
  const out = {};
  if (body.countryCode !== undefined) {
    const code = String(body.countryCode || '').toUpperCase();
    if (!countryExists(code)) return { error: 'Choose a country for this stop.' };
    out.countryCode = code;
  }
  if (body.landmarkId !== undefined) {
    if (body.landmarkId && !landmarkById(body.landmarkId)) return { error: 'Unknown landmark.' };
    out.landmarkId = body.landmarkId || null;
  }
  if (body.placeName !== undefined) out.placeName = cleanText(body.placeName, 120);
  if (body.arriveOn !== undefined) out.arriveOn = body.arriveOn || null;
  if (body.leaveOn !== undefined) out.leaveOn = body.leaveOn || null;
  if (body.notes !== undefined) out.notes = cleanText(body.notes, 1000);
  return { fields: out };
}

function renumber(tripId) {
  getDb()
    .stops.filter((s) => s.tripId === tripId)
    .sort((a, b) => a.position - b.position)
    .forEach((s, i) => {
      s.position = i;
    });
}

// Load the trip and check the caller's role; returns { trip, role } or { reply }
function loadTrip(tripId, needed) {
  const trip = findTrip(tripId);
  const role = tripRole(trip);
  const reply = deny(role, needed, NOT_FOUND);
  return reply ? { reply } : { trip, role };
}

export function registerTripRoutes() {
  route('GET', '/api/trips/shared-with-me', () => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const db = getDb();
    const trips = db.tripMembers
      .filter((m) => m.userId === me().id)
      .map((m) => db.trips.find((t) => t.id === m.tripId))
      .filter(Boolean)
      .map((t) => ({ ...tripSummary(t, tripRole(t)), role: tripRole(t), mapName: db.maps.find((m) => m.id === t.mapId)?.name || '' }));
    return ok({ trips });
  });

  route('GET', '/api/trips/:tripId', ({ params }) => {
    const { trip, role, reply } = loadTrip(params.tripId, 'VIEWER');
    return reply || ok({ trip: tripView(trip, role) });
  });

  route('PATCH', '/api/trips/:tripId', ({ params, body }) => {
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    if (body.title !== undefined) {
      const title = cleanText(body.title, 120);
      if (!title) return fail(400, 'Give the trip a title.');
      trip.title = title;
    }
    if (body.description !== undefined) trip.description = cleanText(body.description, 2000);
    const wasCompleted = trip.status === 'COMPLETED';
    if (body.status !== undefined) {
      if (!TRIP_STATUSES.includes(body.status)) return fail(400, 'Unknown trip status.');
      trip.status = body.status;
    }
    if (body.startDate !== undefined) trip.startDate = body.startDate || null;
    if (body.endDate !== undefined) trip.endDate = body.endDate || null;
    if (body.coverPhotoId !== undefined) {
      if (body.coverPhotoId && !getDb().photos.some((p) => p.id === body.coverPhotoId && p.tripId === trip.id)) {
        return fail(400, 'The cover must be one of this trip’s photos.');
      }
      trip.coverPhotoId = body.coverPhotoId || null;
    }
    if (trip.status === 'COMPLETED' && !wasCompleted) addTripVisits(trip);
    return ok({ trip: tripView(trip, role) });
  });

  route('DELETE', '/api/trips/:tripId', ({ params }) => {
    const db = getDb();
    const { trip, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    // As the server: an editor added to the trip alone can't delete it
    if (!atLeast(mapRole(db.maps.find((m) => m.id === trip.mapId)), 'EDITOR')) {
      return fail(403, "Only the map's owner and its editors can delete a trip.");
    }
    db.trips = db.trips.filter((t) => t.id !== trip.id);
    db.stops = db.stops.filter((s) => s.tripId !== trip.id);
    db.tripMembers = db.tripMembers.filter((m) => m.tripId !== trip.id);
    db.invites = db.invites.filter((i) => i.tripId !== trip.id);
    db.photos.forEach((p) => {
      if (p.tripId === trip.id) p.tripId = null;
    });
    return ok({ message: 'Trip deleted.' });
  });

  route('PUT', '/api/trips/:tripId/travellers', ({ params, body }) => {
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    const ids = Array.isArray(body.travellerIds) ? body.travellerIds : [];
    const mapTravellers = new Set(getDb().travellers.filter((t) => t.mapId === trip.mapId).map((t) => t.id));
    if (ids.some((id) => !mapTravellers.has(id))) return fail(400, 'Travellers must come from this trip’s map.');
    trip.travellerIds = [...new Set(ids)];
    return ok({ trip: tripView(trip, role) });
  });

  route('GET', '/api/trips/:tripId/photos', ({ params, query }) => {
    const { trip, role, reply } = loadTrip(params.tripId, 'VIEWER');
    if (reply) return reply;
    const page = photoPage(getDb().photos.filter((p) => p.tripId === trip.id), role, query);
    return page.error ? fail(400, page.error) : ok(page);
  });

  // Stops
  route('POST', '/api/trips/:tripId/stops', ({ params, body }) => {
    const db = getDb();
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    const { fields, error } = stopFields({ landmarkId: null, placeName: null, arriveOn: null, leaveOn: null, notes: null, ...body });
    if (error) return fail(400, error);
    if (!fields.countryCode) return fail(400, 'Choose a country for this stop.');
    const position = db.stops.filter((s) => s.tripId === trip.id).length;
    db.stops.push({ id: newId(), tripId: trip.id, position, ...fields });
    if (trip.status === 'COMPLETED') addTripVisits(trip, [fields.countryCode]);
    return ok({ trip: tripView(trip, role) }, 201);
  });

  route('PUT', '/api/trips/:tripId/stops/order', ({ params, body }) => {
    const db = getDb();
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    const stops = db.stops.filter((s) => s.tripId === trip.id);
    const ids = Array.isArray(body.stopIds) ? body.stopIds : [];
    if (ids.length !== stops.length || new Set(ids).size !== ids.length || !ids.every((id) => stops.some((s) => s.id === id))) {
      return fail(400, 'Send every stop of the trip, once each.');
    }
    ids.forEach((id, i) => {
      stops.find((s) => s.id === id).position = i;
    });
    return ok({ trip: tripView(trip, role) });
  });

  route('PATCH', '/api/trips/:tripId/stops/:stopId', ({ params, body }) => {
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    const stop = getDb().stops.find((s) => s.id === params.stopId && s.tripId === trip.id);
    if (!stop) return fail(404, 'That stop could not be found.');
    const { fields, error } = stopFields(body);
    if (error) return fail(400, error);
    Object.assign(stop, fields);
    if (trip.status === 'COMPLETED' && fields.countryCode) addTripVisits(trip, [fields.countryCode]);
    return ok({ trip: tripView(trip, role) });
  });

  route('DELETE', '/api/trips/:tripId/stops/:stopId', ({ params }) => {
    const db = getDb();
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    if (!db.stops.some((s) => s.id === params.stopId && s.tripId === trip.id)) return fail(404, 'That stop could not be found.');
    db.stops = db.stops.filter((s) => s.id !== params.stopId);
    renumber(trip.id);
    return ok({ trip: tripView(trip, role) });
  });
}
