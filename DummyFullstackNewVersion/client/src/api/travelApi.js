// The travel endpoints from docs/API.md. Each function returns the payload (`res.data.data`);
// errors keep the client's `friendlyMessage`.
import client from './client';
import {
  ACCEPT_INVITE_API,
  LANDMARKS_API,
  MAPS_API,
  MAP_SETTINGS_API,
  PHOTOS_API,
  SHARED_API,
  TRIPS_API,
} from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const query = (params) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};
const enc = encodeURIComponent;

// Reference data
// (The country list is static in the client: utils/map/countries.js mirrors GET /countries.)
export const getLandmarks = (countryCode) => data(client.get(`${LANDMARKS_API}${query({ country: countryCode })}`, false));

// Map settings (the viewer's own)
export const getMapSettings = () => data(client.get(MAP_SETTINGS_API));
export const putMapSettings = (mapSettings) => data(client.put(MAP_SETTINGS_API, { mapSettings }));

// Maps
export const getMyMaps = () => data(client.get(MAPS_API));
export const createMap = (body) => data(client.post(MAPS_API, body));
export const getMap = (mapId) => data(client.get(`${MAPS_API}/${enc(mapId)}`));
export const updateMap = (mapId, body) => data(client.patch(`${MAPS_API}/${enc(mapId)}`, body));
export const deleteMap = (mapId) => data(client.delete(`${MAPS_API}/${enc(mapId)}`));
export const getMapStats = (mapId) => data(client.get(`${MAPS_API}/${enc(mapId)}/stats`));

// Travellers
export const createTraveller = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/travellers`, body));
export const updateTraveller = (mapId, travellerId, body) =>
  data(client.patch(`${MAPS_API}/${enc(mapId)}/travellers/${enc(travellerId)}`, body));
export const deleteTraveller = (mapId, travellerId) =>
  data(client.delete(`${MAPS_API}/${enc(mapId)}/travellers/${enc(travellerId)}`));

// Countries visited
export const putVisit = (mapId, countryCode, body) =>
  data(client.put(`${MAPS_API}/${enc(mapId)}/visits/${enc(countryCode)}`, body));
export const deleteVisit = (mapId, countryCode) =>
  data(client.delete(`${MAPS_API}/${enc(mapId)}/visits/${enc(countryCode)}`));

// Trips
export const getMapTrips = (mapId) => data(client.get(`${MAPS_API}/${enc(mapId)}/trips`));
export const createTrip = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/trips`, body));
export const getTripsSharedWithMe = () => data(client.get(`${TRIPS_API}/shared-with-me`));
export const getTrip = (tripId) => data(client.get(`${TRIPS_API}/${enc(tripId)}`));
export const updateTrip = (tripId, body) => data(client.patch(`${TRIPS_API}/${enc(tripId)}`, body));
export const deleteTrip = (tripId) => data(client.delete(`${TRIPS_API}/${enc(tripId)}`));
export const putTripTravellers = (tripId, travellerIds) =>
  data(client.put(`${TRIPS_API}/${enc(tripId)}/travellers`, { travellerIds }));
export const createStop = (tripId, body) => data(client.post(`${TRIPS_API}/${enc(tripId)}/stops`, body));
export const updateStop = (tripId, stopId, body) =>
  data(client.patch(`${TRIPS_API}/${enc(tripId)}/stops/${enc(stopId)}`, body));
export const deleteStop = (tripId, stopId) => data(client.delete(`${TRIPS_API}/${enc(tripId)}/stops/${enc(stopId)}`));
export const reorderStops = (tripId, stopIds) => data(client.put(`${TRIPS_API}/${enc(tripId)}/stops/order`, { stopIds }));

// Photos: a page of a map's, a trip's or a share link's photos
export const getPhotoPage = ({ mapId, tripId, shareCode, country, cursor, limit }) => {
  const filters = query({ country, cursor, limit, tripId: mapId && tripId ? tripId : undefined });
  if (shareCode) return data(client.get(`${SHARED_API}/${enc(shareCode)}/photos${filters}`));
  if (mapId) return data(client.get(`${MAPS_API}/${enc(mapId)}/photos${filters}`));
  return data(client.get(`${TRIPS_API}/${enc(tripId)}/photos${filters}`));
};
export const getPhoto = (photoId, { shareCode } = {}) =>
  shareCode
    ? data(client.get(`${SHARED_API}/${enc(shareCode)}/photos/${enc(photoId)}`))
    : data(client.get(`${PHOTOS_API}/${enc(photoId)}`));
export const presignPhoto = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/photos/presign`, body));
export const createPhoto = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/photos`, body));
export const updatePhoto = (photoId, body) => data(client.patch(`${PHOTOS_API}/${enc(photoId)}`, body));
export const deletePhoto = (photoId) => data(client.delete(`${PHOTOS_API}/${enc(photoId)}`));
export const addPhotoLandmark = (photoId, landmarkId) =>
  data(client.post(`${PHOTOS_API}/${enc(photoId)}/landmarks`, { landmarkId }));
export const confirmPhotoLandmark = (photoId, landmarkId) =>
  data(client.patch(`${PHOTOS_API}/${enc(photoId)}/landmarks/${enc(landmarkId)}`, { confirmed: true }));
export const removePhotoLandmark = (photoId, landmarkId) =>
  data(client.delete(`${PHOTOS_API}/${enc(photoId)}/landmarks/${enc(landmarkId)}`));

// Sharing: resource is 'maps' or 'trips'
const resourceBase = (resource, id) => `${resource === 'trips' ? TRIPS_API : MAPS_API}/${enc(id)}`;
export const getSharing = (resource, id) => data(client.get(`${resourceBase(resource, id)}/sharing`));
export const updateSharing = (resource, id, linkAccess) =>
  data(client.patch(`${resourceBase(resource, id)}/sharing`, { linkAccess }));
export const resetShareLink = (resource, id) => data(client.post(`${resourceBase(resource, id)}/sharing/reset-link`, {}));
export const addMember = (resource, id, body) => data(client.post(`${resourceBase(resource, id)}/members`, body));
export const updateMember = (resource, id, userId, role) =>
  data(client.patch(`${resourceBase(resource, id)}/members/${enc(userId)}`, { role }));
export const removeMember = (resource, id, userId) =>
  data(client.delete(`${resourceBase(resource, id)}/members/${enc(userId)}`));
export const cancelInvite = (resource, id, inviteId) =>
  data(client.delete(`${resourceBase(resource, id)}/invites/${enc(inviteId)}`));
export const acceptInvite = (token) => data(client.post(ACCEPT_INVITE_API, { token }));

// Share links (no sign-in needed; cookies still go, so members get their own role)
export const openShareCode = (code) => data(client.get(`${SHARED_API}/${enc(code)}`));
