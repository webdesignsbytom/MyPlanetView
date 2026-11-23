// Mock mode only: the flight log (docs/API.md "Flights"), as the server's controllers/flights.js:
// anyone on a map reads its flights and their totals, its editors add and delete them.
// `db.flights`: { id, mapId, tripId, from, to, flownOn, carrier, flightNumber, distanceKm, source, createdAt }.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { mapRole } from '../views';
import { AIRPORT_DATA } from '@/utils/flights/airportData';
import { airportFrom } from '@/utils/flights/airports';
import { flightKm } from '@/utils/flights/flightLog';

const MAP_NOT_FOUND = 'This map could not be found.';
const INVALID = 'Give 1 to 10 flights, each between two different airports (IATA codes such as LHR) on a real day.';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const realDay = (text) => typeof text === 'string' && DAY.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) && new Date(`${text}T00:00:00Z`).toISOString().startsWith(text);

const view = (f) => ({ id: f.id, tripId: f.tripId, from: f.from, to: f.to, flownOn: f.flownOn, carrier: f.carrier, flightNumber: f.flightNumber, distanceKm: f.distanceKm, source: f.source });

/** The server's flightTotals over the store's rows. */
export function flightTotals(flights) {
  const airports = new Set();
  const airlines = new Set();
  let longest = null;
  for (const f of flights) {
    airports.add(f.from);
    airports.add(f.to);
    if (f.carrier) airlines.add(f.carrier);
    if (!longest || f.distanceKm > longest.distanceKm) longest = f;
  }
  return {
    flights: flights.length,
    distanceKm: flights.reduce((sum, f) => sum + f.distanceKm, 0),
    airports: [...airports].sort(),
    airlines: airlines.size,
    longest: longest ? { id: longest.id, fromAirport: longest.from, toAirport: longest.to, distanceKm: longest.distanceKm } : null,
  };
}

const parse = (list) => {
  if (!Array.isArray(list) || list.length < 1 || list.length > 10) return null;
  const rows = [];
  for (const item of list) {
    const from = airportFrom(AIRPORT_DATA, item?.from);
    const to = airportFrom(AIRPORT_DATA, item?.to);
    if (!from || !to || from.code === to.code || !realDay(item.flownOn)) return null;
    const carrier = item.carrier ? String(item.carrier).trim().toUpperCase() : null;
    const flightNumber = item.flightNumber ? String(item.flightNumber).trim().toUpperCase() : null;
    if ((carrier && !/^[A-Z0-9]{2,3}$/.test(carrier)) || (flightNumber && !/^[0-9]{1,4}[A-Z]?$/.test(flightNumber))) return null;
    rows.push({ from: from.code, to: to.code, flownOn: item.flownOn, carrier, flightNumber, distanceKm: flightKm(from, to) });
  }
  return rows;
};

export function registerFlightRoutes() {
  route('GET', '/api/maps/:mapId/flights', ({ params }) => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const map = getDb().maps.find((m) => m.id === params.mapId);
    const denied = deny(mapRole(map), 'VIEWER', MAP_NOT_FOUND);
    if (denied) return denied;
    const flights = getDb()
      .flights.filter((f) => f.mapId === map.id)
      .sort((a, b) => (a.flownOn === b.flownOn ? (a.createdAt < b.createdAt ? 1 : -1) : a.flownOn < b.flownOn ? 1 : -1));
    return ok({ flights: flights.map(view), totals: flightTotals(flights) });
  });

  route('POST', '/api/maps/:mapId/flights', ({ params, body }) => {
    const db = getDb();
    const map = db.maps.find((m) => m.id === params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    const source = body?.source ?? 'MANUAL';
    const rows = ['BOARDING_PASS', 'MANUAL'].includes(source) ? parse(body?.flights) : null;
    if (!rows) return fail(400, INVALID);
    const tripId = body.tripId ?? null;
    if (tripId !== null && !db.trips.some((t) => t.id === tripId && t.mapId === map.id)) return fail(400, 'That trip isn’t one of this map’s own.');
    const same = (a, b) => a.from === b.from && a.to === b.to && a.flownOn === b.flownOn && a.carrier && a.carrier === b.carrier && a.flightNumber && a.flightNumber === b.flightNumber;
    const made = [];
    for (const row of rows) {
      if (db.flights.some((f) => f.mapId === map.id && same(f, row))) continue;
      const flight = { id: newId(), mapId: map.id, tripId, ...row, source, createdById: me().id, createdAt: new Date().toISOString() };
      db.flights.push(flight);
      made.push(flight);
    }
    return ok({ flights: made.map(view), skipped: rows.length - made.length }, 201);
  });

  route('DELETE', '/api/flights/:flightId', ({ params }) => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const db = getDb();
    const flight = db.flights.find((f) => f.id === params.flightId);
    const denied = deny(flight ? mapRole(db.maps.find((m) => m.id === flight.mapId)) : null, 'EDITOR', 'That flight isn’t on this map.');
    if (denied) return denied;
    db.flights = db.flights.filter((f) => f.id !== flight.id);
    return ok({ deleted: true });
  });
}
