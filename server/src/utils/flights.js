// The flight log (23 Nov 2026, the user's wish: scan a boarding pass, and the trip and its
// countries fill in; flights, airports and distance flown to collect, like the passport's stamps;
// docs/API.md "Flights"). Pure, so tested on its own (tests/flights.test.js). The client reads
// boarding passes itself (client/src/utils/flights/boardingPass.js) and sends the flights.
import AIRPORTS from '../data/airports.json' with { type: 'json' };
import { distanceKm } from './travelStats.js';
import { parseDateOnly } from './travelValidation.js';

// One request's flights (a boarding pass holds up to four; a return trip's two passes)
export const FLIGHTS_PER_REQUEST = 10;
const CARRIER = /^[A-Z0-9]{2,3}$/;
const FLIGHT_NUMBER = /^[0-9]{1,4}[A-Z]?$/;

/** An airport by its IATA code: `{ code, name, city, place, latitude, longitude, nation }`, or null. */
export function airportByCode(code) {
  const row = typeof code === 'string' ? AIRPORTS[code.toUpperCase()] : null;
  if (!row) return null;
  const [name, city, place, latitude, longitude, nation] = row;
  return { code: code.toUpperCase(), name, city, place, latitude, longitude, nation };
}

/** The great circle between two airports, in whole km. */
export const flightDistanceKm = (from, to) => Math.round(distanceKm(from, to));

/**
 * A request's flights: 1 to 10, each between two different known airports on a real day, with
 * an optional airline (2–3 letters or digits) and flight number ("117", "12A"). -> rows ready to
 * save (`{ fromAirport, toAirport, flownOn, carrier, flightNumber, distanceKm, source }`), or null
 */
export function parseFlights(value, { source = 'MANUAL' } = {}) {
  if (!Array.isArray(value) || value.length < 1 || value.length > FLIGHTS_PER_REQUEST) return null;
  const rows = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const from = airportByCode(item.from);
    const to = airportByCode(item.to);
    const day = parseDateOnly(item.flownOn);
    if (!from || !to || from.code === to.code || !day.ok || !day.value) return null;
    const carrier = item.carrier ? String(item.carrier).trim().toUpperCase() : null;
    const flightNumber = item.flightNumber ? String(item.flightNumber).trim().toUpperCase() : null;
    if ((carrier && !CARRIER.test(carrier)) || (flightNumber && !FLIGHT_NUMBER.test(flightNumber))) return null;
    rows.push({ fromAirport: from.code, toAirport: to.code, flownOn: day.value, carrier, flightNumber, distanceKm: flightDistanceKm(from, to), source });
  }
  return rows;
}

/**
 * A map's flight log in numbers: flights, distance flown, airports (each once), the airlines'
 * codes and the longest flight.
 */
export function flightTotals(flights) {
  const airports = new Set();
  const airlines = new Set();
  let longest = null;
  let distance = 0;
  for (const flight of flights) {
    airports.add(flight.fromAirport);
    airports.add(flight.toAirport);
    if (flight.carrier) airlines.add(flight.carrier);
    distance += flight.distanceKm;
    if (!longest || flight.distanceKm > longest.distanceKm) longest = flight;
  }
  return {
    flights: flights.length,
    distanceKm: distance,
    airports: [...airports].sort(),
    airlines: airlines.size,
    longest: longest ? { id: longest.id, fromAirport: longest.fromAirport, toAirport: longest.toAirport, distanceKm: longest.distanceKm } : null,
  };
}
