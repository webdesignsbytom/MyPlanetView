// Importing from other apps (docs/API.md "Importing from Polarsteps"; 21 Nov 2026, the user's
// wish). The browser reads the person's own Polarsteps download; the server only ever gets
// what's imported. Here: what a map has imported already, and the trips with their stops.
// Photos and step stories come through the usual upload and moment routes with their keys.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createTripEvent } from '../event/travelUtils.js';
import { canEdit } from '../utils/access.js';
import { firstDatesOf, parseImportedTrips } from '../utils/imports.js';
import { placeCopy } from '../utils/travelCopies.js';
import { createImportedTripInDB, findImportedKeys, findLinkedTravellerId } from '../domain/imports.js';
import { setFirstVisitIfEarlierInDB } from '../domain/travelCopies.js';
import { newUniqueShareCode } from '../services/travel/maps.js';
import { isKnownCountry } from './helpers/countries.js';
import { badRequest, denyUnless, handler, loadMap } from './helpers/travel.js';

const D = DOMAINS.trips;

// GET /maps/:mapId/imports/polarsteps (editors): `{ trips: [{ key, tripId }], photos, moments }`
export const getImportsHandler = handler(D, 'Get imports', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  return sendDataResponse(res, 200, await findImportedKeys(map.id));
});

// POST /maps/:mapId/imports/polarsteps (editors, verified): `{ trips }` (utils/imports.js) ->
// `{ trips: [{ key, tripId, created }] }`. Places follow the map (a UK step goes to its nation
// on a map that splits the UK, by its position); a stop in a place the map doesn't have is
// left out. A trip imported before is answered with its id and left as it is. Completed trips
// mark their countries visited, and give a country its first visit when theirs is earlier.
export const importTripsHandler = handler(D, 'Import trips', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const parsed = parseImportedTrips(req.body);
  if (parsed.error) return badRequest(req, res, D, EVENT_MESSAGES[parsed.error]);

  const known = new Map((await findImportedKeys(map.id)).trips.map((trip) => [trip.key, trip.tripId]));
  const travellerId = await findLinkedTravellerId(map.id, req.user.id);
  const results = [];
  for (const raw of parsed.trips) {
    if (known.has(raw.key)) {
      results.push({ key: raw.key, tripId: known.get(raw.key), created: false });
      continue;
    }
    const stops = [];
    for (const stop of raw.stops) {
      if (!(await isKnownCountry(stop.countryCode))) continue;
      const { countryCode } = placeCopy(stop, Boolean(map.splitUk));
      stops.push({ ...stop, countryCode });
    }
    const trip = { ...raw, stops };
    const tripId = await createImportedTripInDB({ mapId: map.id, userId: req.user.id, travellerId, trip, shareCode: await newUniqueShareCode() });
    if (trip.status === 'COMPLETED') {
      for (const [countryCode, date] of firstDatesOf(trip)) await setFirstVisitIfEarlierInDB(map.id, countryCode, date);
    }
    results.push({ key: raw.key, tripId, created: true });
  }
  const created = results.filter((r) => r.created).length;
  if (created) logEvent(createTripEvent({ user: req.user, action: 'Import Success', id: map.id, detail: `source=polarsteps trips=${created}`, statusCode: 201 }));
  return sendDataResponse(res, created ? 201 : 200, { trips: results });
});
