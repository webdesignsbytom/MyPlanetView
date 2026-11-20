// Taking your travels with you (docs/API.md, "Travel copies"). Each function returns the
// payload (`res.data.data`); errors keep the client's `friendlyMessage`.
import client from './client';
import { MAPS_API, TRAVEL_COPIES_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;
const onMap = (mapId, path) => `${MAPS_API}/${enc(mapId)}/${path}`;
const one = (id, path = '') => `${TRAVEL_COPIES_API}/${enc(id)}${path}`;

/** On the family map: its travellers, and what one of them (else the caller's own) can take. */
export const getCopyChoices = (mapId, travellerId) =>
  data(client.get(onMap(mapId, `travel-copy-choices${travellerId ? `?traveller=${enc(travellerId)}` : ''}`)));

/** What a choice (`{ toMapId, travellerId, tripIds, momentIds, countryCodes, photoIds }`) comes to on the new map. */
export const previewTravelCopy = (fromMapId, choice) => data(client.post(onMap(fromMapId, 'travel-copies/preview'), choice));

/** Ask the family map's owner for it. -> `{ request }` */
export const requestTravelCopy = (fromMapId, choice) => data(client.post(onMap(fromMapId, 'travel-copies'), choice));

/** For a map's owner or a co-owner: `{ incoming, outgoing }` (copies from it, and onto it). */
export const getMapTravelCopies = (mapId) => data(client.get(onMap(mapId, 'travel-copies')));

/** One request, with its trips, moments and photos per country. -> `{ request }` */
export const getTravelCopy = (id) => data(client.get(one(id)));
export const approveTravelCopy = (id) => data(client.post(one(id, '/approve')));
export const declineTravelCopy = (id) => data(client.post(one(id, '/decline')));
/** One more run of an approved copy. -> `{ request }` */
export const continueTravelCopy = (id) => data(client.post(one(id, '/continue')));
/** Withdraw a request still waiting. */
export const withdrawTravelCopy = (id) => client.delete(one(id)).then((res) => res.data);
