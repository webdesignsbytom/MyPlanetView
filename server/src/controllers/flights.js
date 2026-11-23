// The flight log (23 Nov 2026, the user's wish; docs/API.md "Flights"): a map's flights, read from
// boarding passes in the browser or typed in, with the distance flown and the airports collected.
// Anyone on the map sees them (never through a share link); its editors add and delete them.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createFlightEvent } from '../event/travelUtils.js';
import { canEdit, canView } from '../utils/access.js';
import { isUuid, toDateOnly } from '../utils/travelValidation.js';
import { flightTotals, parseFlights } from '../utils/flights.js';
import { createFlightsInDB, deleteFlightInDB, findFlightById, findFlightsForMap, isTripOfMap } from '../domain/flights.js';
import { badRequest, denyUnless, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.flights;
const SOURCES = ['BOARDING_PASS', 'MANUAL'];

export const flightView = (flight) => ({
  id: flight.id,
  tripId: flight.tripId,
  from: flight.fromAirport,
  to: flight.toAirport,
  flownOn: toDateOnly(flight.flownOn),
  carrier: flight.carrier,
  flightNumber: flight.flightNumber,
  distanceKm: flight.distanceKm,
  source: flight.source,
});

// GET /api/maps/:mapId/flights (anyone on the map) -> { flights, totals }
export const getMapFlightsHandler = handler(D, 'Get flights', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const flights = await findFlightsForMap(map.id);
  return sendDataResponse(res, 200, { flights: flights.map(flightView), totals: flightTotals(flights) });
});

// POST /api/maps/:mapId/flights { flights: [{ from, to, flownOn, carrier?, flightNumber? }], tripId?, source? }
// (editors, verified) -> 201 { flights, skipped }: the flights logged, and how many were there already
export const addFlightsHandler = handler(D, 'Add flights', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const body = req.body || {};
  const source = body.source ?? 'MANUAL';
  const rows = SOURCES.includes(source) ? parseFlights(body.flights, { source }) : null;
  if (!rows) return badRequest(req, res, D, EVENT_MESSAGES.flightsInvalid);
  const tripId = body.tripId ?? null;
  if (tripId !== null && (!isUuid(tripId) || !(await isTripOfMap(tripId, map.id)))) return badRequest(req, res, D, EVENT_MESSAGES.flightTripInvalid);

  const made = await createFlightsInDB(rows.map((row) => ({ ...row, mapId: map.id, tripId, createdById: req.user.id })));
  logEvent(createFlightEvent({ user: req.user, action: 'Create Success', id: map.id, detail: `flights=${made.length}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { flights: made.map(flightView), skipped: rows.length - made.length });
});

// DELETE /api/flights/:flightId (editors of its map, verified)
export const deleteFlightHandler = handler(D, 'Delete flight', async (req, res) => {
  const flight = isUuid(req.params.flightId) ? await findFlightById(req.params.flightId) : null;
  const { role } = flight ? await loadMap(req, flight.mapId) : { role: null };
  if (!flight || !canView(role)) return notFound(req, res, D, EVENT_MESSAGES.flightNotFound);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.flightNotFound)) return undefined;
  await deleteFlightInDB(flight.id);
  logEvent(createFlightEvent({ user: req.user, action: 'Delete Success', id: flight.id }));
  return sendDataResponse(res, 200, { deleted: true });
});
