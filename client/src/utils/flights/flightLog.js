// The flight log (23 Nov 2026, the user's wish; docs/API.md "Flights"): what a boarding pass's
// flights mean for the map, and the log's words. Pure.
import { placeOfAirport } from './airports';

const EARTH_RADIUS_KM = 6371.0088;
const rad = (deg) => (deg * Math.PI) / 180;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The great circle between two airports, in whole km (as the server works it out). */
export function flightKm(a, b) {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h))));
}

/**
 * The places a pass's flights touch, in order, each once: `{ code, connection }`. A connection
 * is a place flown into and out of again within a day (changing planes in Dubai), which the
 * form leaves unticked: you may never have left the airport. `airportOf(code)` gives an airport.
 */
export function flightPlaces(flights, airportOf, splitUk) {
  // The flights whose arrival is a change of planes: the next flight leaves from there within a day
  const changes = new Set();
  flights.forEach((flight, i) => {
    const next = flights[i + 1];
    if (next && next.from === flight.to && Math.abs(Date.parse(next.flownOn) - Date.parse(flight.flownOn)) <= DAY_MS) changes.add(i);
  });
  // A place is a connection only if every time the pass is there, it's changing planes
  const places = new Map();
  const note = (code, connection) => {
    const airport = airportOf(code);
    if (!airport) return;
    const place = placeOfAirport(airport, splitUk);
    places.set(place, places.has(place) ? places.get(place) && connection : connection);
  };
  flights.forEach((flight, i) => {
    note(flight.from, i > 0 && changes.has(i - 1));
    note(flight.to, changes.has(i));
  });
  return [...places].map(([code, connection]) => ({ code, connection }));
}

/** A trip's days from its flights: the first and the last day flown. */
export function flightDays(flights) {
  const days = flights.map((f) => f.flownOn).filter(Boolean).sort();
  return { startDate: days[0] ?? '', endDate: days.at(-1) ?? '' };
}

/** The trip a flight was on: the map's own trip whose days hold the flight's (the first). */
export const tripForDay = (trips, day) => (trips || []).find((t) => !t.linked && t.startDate && t.endDate && t.startDate <= day && day <= t.endDate) ?? null;

const thousands = (n) => Math.round(n).toLocaleString('en-GB');
/** "5,555 km (3,452 miles)" */
export const distanceWords = (km) => `${thousands(km)} km (${thousands(km * 0.621371)} miles)`;
/** "BA 117", or '' for a flight with no airline and number */
export const flightCode = (flight) => [flight.carrier, flight.flightNumber].filter(Boolean).join(' ');
/** Times round the world (40,075 km at the equator), to one decimal place */
export const aroundTheWorld = (km) => Math.round((km / 40075) * 10) / 10;
