// Importing from Polarsteps (docs/API.md "Importing from Polarsteps"). Each returns the
// payload; errors keep the client's `friendlyMessage` (and axios's `response`).
import client from './client';
import { MAPS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const path = (mapId) => `${MAPS_API}/${encodeURIComponent(mapId)}/imports/polarsteps`;

/** -> `{ trips: [{ key, tripId }], photos: [key], moments: [key] }`: what the map has imported already */
export const getImports = (mapId) => data(client.get(path(mapId)));
/** `[{ key, title, status, startDate, endDate, stops }]` -> `{ trips: [{ key, tripId, created }] }` */
export const importTrips = (mapId, trips) => data(client.post(path(mapId), { trips }));
