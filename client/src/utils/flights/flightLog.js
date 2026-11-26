// The flight log (23 Nov 2026, the user's wish; docs/API.md "Flights"): what a boarding pass's
// flights mean for the map, and the log's words. Pure.
import { MILES_PER_KM } from '@/utils/map/distanceUnits';
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
/**
 * "5,555 km (3,452 miles)", or in miles first, "3,452 miles (5,555 km)", for a map shown in miles
 * (utils/map/distanceUnits.js; 24 Nov 2026).
 */
export const distanceWords = (km, unit = 'km') =>
  unit === 'miles' ? `${thousands(km * MILES_PER_KM)} miles (${thousands(km)} km)` : `${thousands(km)} km (${thousands(km * MILES_PER_KM)} miles)`;
/** "BA 117", or '' for a flight with no airline and number */
export const flightCode = (flight) => [flight.carrier, flight.flightNumber].filter(Boolean).join(' ');

// The airport stamps (components/flights/AirportStamp.jsx; 25 Nov 2026, the user's wish: "a bit
// more style on the stamps")

/** Each airport's first flight there or from there: code -> "YYYY-MM-DD". */
export function firstFlownByAirport(flights) {
  const first = new Map();
  for (const flight of flights || []) {
    if (!flight.flownOn) continue;
    for (const code of [flight.from, flight.to]) {
      if (code && (!first.has(code) || flight.flownOn < first.get(code))) first.set(code, flight.flownOn);
    }
  }
  return first;
}

/** The city as a stamp prints it: "Venezia (VE)" and "Paris (Roissy-en-France, …)" lose the brackets. */
export const stampCity = (city) => String(city || '').replace(/\s*\(.*$/, '').trim().toUpperCase();

const SHORT_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** "2026-02-13" -> "13 FEB 2026", as a rubber stamp's date; '' for anything else. */
export function stampDay(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(day || ''));
  return match ? `${Number(match[3])} ${SHORT_MONTHS[Number(match[2]) - 1]} ${match[1]}` : '';
}
