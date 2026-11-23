// The flight log (docs/API.md "Flights"; 23 Nov 2026). Each returns the payload; errors keep the
// client's `friendlyMessage`.
import client from './client';
import { FLIGHTS_API, MAPS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** -> `{ flights: [{ id, tripId, from, to, flownOn, carrier, flightNumber, distanceKm, source }], totals }` */
export const getMapFlights = (mapId) => data(client.get(`${MAPS_API}/${enc(mapId)}/flights`));
/** `{ flights: [{ from, to, flownOn, carrier?, flightNumber? }], tripId?, source? }` -> `{ flights, skipped }` */
export const addFlights = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/flights`, body));
export const deleteFlight = (flightId) => data(client.delete(`${FLIGHTS_API}/${enc(flightId)}`));
