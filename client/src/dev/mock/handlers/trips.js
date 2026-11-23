// Mock mode only: one trip, its travellers and stops, its photos, the trips shared
// with you on their own, and group trips added to other maps ("Add to my map"). Every
// change answers with the whole trip.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import {
  atLeast,
  countryExists,
  landmarkById,
  mapRole,
  markVisited,
  photoPage,
  tripMapIds,
  tripRole,
  tripSummary,
  tripView,
} from '../views';
import { adsFor } from '../offers';
import { editedTripDatesProblem } from '../tripDates';
import { placeOnMap } from '@/utils/map/ukNations';

const TRIP_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];
const NOT_FOUND = 'This trip could not be found.';
// The server's EVENT_MESSAGES for group trips
const LINK = {
  invalidMap: 'Choose one of your maps to add the trip to.',
  ownMap: 'This trip is already on its own map.',
  mapNotFound: "That map doesn't exist, or it hasn't been shared with you.",
  notFound: "That trip isn't on that map.",
  removeNotAllowed: "Only the person who added the trip, or the map's owner, can take it off the map.",
};
const findTrip = (id) => getDb().trips.find((t) => t.id === id) || null;
const cleanText = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
const stopCountries = (trip) => getDb().stops.filter((s) => s.tripId === trip.id).map((s) => s.countryCode);

// As the server (controllers/trips.js): a trip becoming COMPLETED adds a TRIP visit for
// each stop's country, on the trip's own map and on every map it was added to (group
// trips); on a completed trip, a new stop, or a stop given a country, adds its own.
// Nothing else does: a visit removed by hand stays removed after other edits. The South
// Pole brings Antarctica (markVisited).
function addTripVisits(trip, codes = stopCountries(trip)) {
  for (const mapId of tripMapIds(trip)) codes.forEach((code) => markVisited(mapId, code, 'TRIP'));
}

// `trip`'s map keeps places its way: a UK nation is the UK on a map that doesn't split it
function stopFields(body, trip) {
  const out = {};
  if (body.countryCode !== undefined) {
    const code = String(body.countryCode || '').toUpperCase();
    if (!countryExists(code)) return { error: 'Choose a country for this stop.' };
    out.countryCode = placeOnMap(code, Boolean(getDb().maps.find((m) => m.id === trip.mapId)?.splitUk));
    out.ukNation = null;
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
    // How often its gallery shows an offer card to the caller: the trip's map owner's plan and theirs
    return reply || ok({ trip: { ...tripView(trip, role), ads: adsFor(getDb().maps.find((m) => m.id === trip.mapId)) } });
  });

  route('PATCH', '/api/trips/:tripId', ({ params, body }) => {
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    const datesProblem = editedTripDatesProblem(trip, body.startDate, body.endDate);
    if (datesProblem) return fail(400, datesProblem);
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
    if (body.startDate !== undefined) trip.startDate = body.startDate;
    if (body.endDate !== undefined) trip.endDate = body.endDate;
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
    db.tripMaps = db.tripMaps.filter((l) => l.tripId !== trip.id);
    db.invites = db.invites.filter((i) => i.tripId !== trip.id);
    db.photos.forEach((p) => {
      if (p.tripId === trip.id) p.tripId = null;
    });
    // Its moments stay on the map, off any trip
    db.moments.forEach((m) => {
      if (m.tripId === trip.id) m.tripId = null;
    });
    return ok({ message: 'Trip deleted.' });
  });

  // Group trips: show the trip on one of your own maps (anyone on the trip, onto a map
  // they own or edit). A completed trip's countries are marked there at once.
  route('POST', '/api/trips/:tripId/maps', ({ params, body }) => {
    const db = getDb();
    const trip = findTrip(params.tripId);
    const role = tripRole(trip);
    if (!atLeast(role, 'VIEWER')) return fail(404, NOT_FOUND);
    const { mapId } = body || {};
    if (typeof mapId !== 'string' || !mapId) return fail(400, LINK.invalidMap);
    if (mapId === trip.mapId) return fail(400, LINK.ownMap);
    const target = db.maps.find((m) => m.id === mapId) || null;
    const targetRole = mapRole(target);
    if (!atLeast(targetRole, 'VIEWER')) return fail(404, LINK.mapNotFound);
    if (!atLeast(targetRole, 'EDITOR')) return fail(403, 'You do not have permission to do that.');
    if (db.tripMaps.some((l) => l.tripId === trip.id && l.mapId === target.id)) return ok({ trip: tripView(trip, role) });
    db.tripMaps.push({ tripId: trip.id, mapId: target.id, addedById: me().id, createdAt: new Date().toISOString() });
    if (trip.status === 'COMPLETED') stopCountries(trip).forEach((code) => markVisited(target.id, code, 'TRIP'));
    return ok({ trip: tripView(trip, role) }, 201);
  });

  // Taking it off: whoever added it, or that map's owner. The visits it marked stay.
  route('DELETE', '/api/trips/:tripId/maps/:mapId', ({ params }) => {
    const db = getDb();
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const link = db.tripMaps.find((l) => l.tripId === params.tripId && l.mapId === params.mapId);
    if (!link) return fail(404, LINK.notFound);
    const map = db.maps.find((m) => m.id === link.mapId);
    if (me().id !== link.addedById && me().id !== map?.ownerId) {
      if (!atLeast(tripRole(findTrip(link.tripId)), 'VIEWER') && !atLeast(mapRole(map), 'VIEWER')) return fail(404, LINK.notFound);
      return fail(403, LINK.removeNotAllowed);
    }
    db.tripMaps = db.tripMaps.filter((l) => l !== link);
    return ok({ message: 'Trip taken off the map. Its countries stay marked.' });
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
    const page = photoPage(getDb().photos.filter((p) => p.tripId === trip.id), role, { ...query, tripId: trip.id });
    return page.error ? fail(page.status ?? 400, page.error) : ok(page);
  });

  // Stops
  route('POST', '/api/trips/:tripId/stops', ({ params, body }) => {
    const db = getDb();
    const { trip, role, reply } = loadTrip(params.tripId, 'EDITOR');
    if (reply) return reply;
    const { fields, error } = stopFields({ landmarkId: null, placeName: null, arriveOn: null, leaveOn: null, notes: null, ...body }, trip);
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
    const { fields, error } = stopFields(body, trip);
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
