// The travel endpoints from docs/API.md. Each function returns the payload (`res.data.data`);
// errors keep the client's `friendlyMessage`.
import client from './client';
import {
  ACCEPT_INVITE_API,
  inviteApi,
  GOALS_API,
  LANDMARKS_API,
  MAPS_API,
  MAP_SETTINGS_API,
  MOMENTS_API,
  PHOTOS_API,
  PINS_API,
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
// A landmark ticked "been here", or not (docs/API.md "Collecting")
export const tickLandmark = (mapId, landmarkId) => data(client.put(`${MAPS_API}/${enc(mapId)}/landmarks/${enc(landmarkId)}/been`, {}));
export const untickLandmark = (mapId, landmarkId) => data(client.delete(`${MAPS_API}/${enc(mapId)}/landmarks/${enc(landmarkId)}/been`));
// Strings between places (docs/API.md "Strings"): tie one -> { string }; the automatic ones
// -> { strings, added, full }; untie one -> { removed: id }; untie them all -> { removed: count }
export const tieMapString = (mapId, from, to) => data(client.post(`${MAPS_API}/${enc(mapId)}/strings`, { from, to }));
export const tieAutoMapStrings = (mapId) => data(client.post(`${MAPS_API}/${enc(mapId)}/strings/auto`, {}));
export const untieMapString = (mapId, stringId) => data(client.delete(`${MAPS_API}/${enc(mapId)}/strings/${enc(stringId)}`));
export const untieAllMapStrings = (mapId) => data(client.delete(`${MAPS_API}/${enc(mapId)}/strings`));
// One year of a map (docs/API.md "Year in travel") -> { recap }
export const getYearRecap = (mapId, year) => data(client.get(`${MAPS_API}/${enc(mapId)}/recap/${enc(year)}`));
// A map's own design for a map style (docs/API.md "Map designs"):
// { style, shown?, countries?, names?, grid?, hover? } -> { design }
export const updateMapDesign = (mapId, body) => data(client.patch(`${MAPS_API}/${enc(mapId)}/design`, body));
// Its sea picture: presign ({ contentType, bytes } -> { key, upload }), save ({ key, style } ->
// { design }), remove (that style's)
export const presignDesignPicture = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/design/picture/presign`, body));
export const saveDesignPicture = (mapId, style, key) => data(client.put(`${MAPS_API}/${enc(mapId)}/design/picture`, { key, style }));
export const removeDesignPicture = (mapId, style) =>
  data(client.delete(`${MAPS_API}/${enc(mapId)}/design/picture${query({ style })}`));
// The owner's main (included) map; the old one becomes an extra map
export const makeMainMap = (mapId) => data(client.post(`${MAPS_API}/${enc(mapId)}/main`, {}));
// Put a map on the owner's plan (a paid extra map's slot), or take it back -> { map } (its `tier` says where it is)
export const upgradeMap = (mapId) => data(client.post(`${MAPS_API}/${enc(mapId)}/upgrade`, {}));
export const cancelMapUpgrade = (mapId) => data(client.delete(`${MAPS_API}/${enc(mapId)}/upgrade`));
// Hand the map to someone already on it -> { map } (as an editor sees it when you stay)
export const transferMap = (mapId, { userId, stayAsEditor = true }) =>
  data(client.post(`${MAPS_API}/${enc(mapId)}/transfer`, { userId, stayAsEditor }));

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
// Group trips: show a trip on one of your own maps ("Add to my map") -> { trip }, or take it off
export const addTripToMap = (tripId, mapId) => data(client.post(`${TRIPS_API}/${enc(tripId)}/maps`, { mapId }));
export const removeTripFromMap = (tripId, mapId) =>
  data(client.delete(`${TRIPS_API}/${enc(tripId)}/maps/${enc(mapId)}`));

// Moments: a page of a map's, a trip's or a share link's moments, in date order
// (`country` and, on a map or a share link, `tripId` filter) -> { moments, nextCursor }.
// `anniversary` ("YYYY-MM-DD", the viewer's today): instead, the moments dated to that day in
// an earlier year, newest first (21 Nov 2026)
export const getMomentPage = ({ mapId, tripId, shareCode, country, cursor, limit, anniversary }) => {
  const filters = query({ country, cursor, limit, anniversary, tripId: mapId || shareCode ? tripId : undefined });
  if (shareCode) return data(client.get(`${SHARED_API}/${enc(shareCode)}/moments${filters}`));
  if (mapId) return data(client.get(`${MAPS_API}/${enc(mapId)}/moments${filters}`));
  return data(client.get(`${TRIPS_API}/${enc(tripId)}/moments${filters}`));
};
export const createMoment = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/moments`, body));
export const updateMoment = (momentId, body) => data(client.patch(`${MOMENTS_API}/${enc(momentId)}`, body));
export const deleteMoment = (momentId) => data(client.delete(`${MOMENTS_API}/${enc(momentId)}`));

// Country maps (docs/API.md "Country maps"): one country's states visited and pins, on a map
// or through its share link (`source`: { mapId } or { shareCode }), and the changes
const countryMapBase = ({ mapId, shareCode }) => (shareCode ? `${SHARED_API}/${enc(shareCode)}` : `${MAPS_API}/${enc(mapId)}`);

/**
 * Every country ticket's first pages at once (docs/API.md "Country lists"): `photos` and
 * `moments` are lists of codes, `limit`/`display` the photo list's, `momentLimit` the moment
 * list's. -> `{ photos: { [code]: { photos, nextCursor } }, moments: { [code]: { moments, nextCursor } } }`
 */
export const getCountryLists = (source, { photos = [], moments = [], limit, display, momentLimit }) =>
  data(
    client.get(
      `${countryMapBase(source)}/country-lists${query({
        photos: photos.length ? photos.join(',') : undefined,
        moments: moments.length ? moments.join(',') : undefined,
        limit,
        display: display ? 1 : undefined,
        momentLimit,
      })}`,
    ),
  );
// -> { subdivisions: [{ code, status }] }
export const getSubdivisions = (source, country) => data(client.get(`${countryMapBase(source)}/subdivisions${query({ country })}`));
// -> { subdivision, implied }: the visits it brought (its country, a region)
export const setSubdivision = (mapId, code, status) => data(client.put(`${MAPS_API}/${enc(mapId)}/subdivisions/${enc(code)}`, { status }));
export const clearSubdivision = (mapId, code) => data(client.delete(`${MAPS_API}/${enc(mapId)}/subdivisions/${enc(code)}`));
// -> { pins: [{ id, name, countryCode, latitude, longitude, visitCount, latestVisit, hidden? }] }
export const getPins = (source, country) => data(client.get(`${countryMapBase(source)}/pins${query({ country })}`));
// -> { pin } with its visits, newest first
export const getPin = (source, pinId) =>
  data(client.get(source.shareCode ? `${SHARED_API}/${enc(source.shareCode)}/pins/${enc(pinId)}` : `${PINS_API}/${enc(pinId)}`));
export const createPin = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/pins`, body));
export const updatePin = (pinId, body) => data(client.patch(`${PINS_API}/${enc(pinId)}`, body));
export const deletePin = (pinId) => data(client.delete(`${PINS_API}/${enc(pinId)}`));
export const addPinVisit = (pinId, body) => data(client.post(`${PINS_API}/${enc(pinId)}/visits`, body));
export const updatePinVisit = (pinId, visitId, body) => data(client.patch(`${PINS_API}/${enc(pinId)}/visits/${enc(visitId)}`, body));
export const deletePinVisit = (pinId, visitId) => data(client.delete(`${PINS_API}/${enc(pinId)}/visits/${enc(visitId)}`));

// Photos: a page of a map's, a trip's or a share link's photos (`unplaced`: only those with no
// country). The slideshows (docs/API.md, "Slideshows") pass `order` ('taken', or 'shuffle'
// with a `seed`) and `display` (each photo also carries its displayUrl). "Print or download"
// passes `best` (editors only, never a share link; docs/API.md "Downloads"): each photo
// carries its best copy's link, type and size. `landmark` lists only the photos confirmed
// as that landmark, in any country (the passport's stamp photo picker).
export const getPhotoPage = ({ mapId, tripId, shareCode, country, unplaced, landmark, cursor, limit, order, seed, display, best }) => {
  const filters = query({
    country,
    unplaced: unplaced ? 1 : undefined,
    landmark,
    cursor,
    limit,
    tripId: mapId && tripId ? tripId : undefined,
    order,
    seed: order === 'shuffle' ? seed : undefined,
    display: display ? 1 : undefined,
    best: best ? 1 : undefined,
  });
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
// Videos (First Class; docs/API.md "Videos"): start an upload to Cloudflare Stream
// ({ bytes, contentType, durationS, tripId?, countryCode? } -> { photoId, uploadUrl, ticket,
// expiresAt }), then, once the file is there, save it ({ ticket, countryCode?, caption?, takenAt? })
export const startVideoUpload = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/videos/upload`, body));
export const saveVideo = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/videos`, body));
export const updatePhoto = (photoId, body) => data(client.patch(`${PHOTOS_API}/${enc(photoId)}`, body));
export const deletePhoto = (photoId) => data(client.delete(`${PHOTOS_API}/${enc(photoId)}`));
// Rearranging: put the photo straight after `afterId` in its country's ('country') or its
// trip's ('trip') gallery, or first there when `afterId` is null
export const movePhoto = (photoId, { gallery, afterId }) =>
  data(client.post(`${PHOTOS_API}/${enc(photoId)}/move`, { gallery, afterId: afterId ?? null }));
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
// What an invite is for, before signing in: { invite: { email, role, kind, id, name, invitedBy, travellerName, expiresAt } }
export const getInvite = (token) => data(client.get(inviteApi(token)));

// Share links (no sign-in needed; cookies still go, so members get their own role)
export const openShareCode = (code) => data(client.get(`${SHARED_API}/${enc(code)}`));

// The passport, badges and goals (docs/API.md, "Passport", "Badges and goals"). With a
// `shareCode`, through the map's share link (read only).
const mapOrShared = ({ mapId, shareCode }, what) =>
  shareCode ? `${SHARED_API}/${enc(shareCode)}/${what}` : `${MAPS_API}/${enc(mapId)}/${what}`;
// `travellerId`: that traveller's own passport (their places and stamps; 21 Nov 2026)
// Ticking several countries at once (the map's "Where have you been?"; 22 Nov 2026) -> { added }
export const quickFillVisits = (mapId, countryCodes) => data(client.post(`${MAPS_API}/${enc(mapId)}/visits/quick-fill`, { countryCodes }));
export const getPassport = (where, { travellerId = null } = {}) =>
  data(client.get(`${mapOrShared(where, 'passport')}${query({ traveller: travellerId || undefined })}`));
// A stamp's photo isn't chosen in the passport any more (24 Nov 2026, the user's wish): the
// server's PUT|DELETE …/passport/stamps/:landmarkId/photo stay, unused by the site
// -> { badges, newlyEarned } (the owner and editors award as they load)
export const getBadges = (where) => data(client.get(mapOrShared(where, 'badges')));
// Life's One Shots (docs/API.md "Life's One Shots"): the ticks (and, for editors, what the
// flights suggest), one ticked or changed (`{ oneShot, created, countryCode }`), one taken off
export const getOneShots = (where) => data(client.get(mapOrShared(where, 'one-shots')));
export const saveOneShot = (mapId, itemKey, body) => data(client.put(`${MAPS_API}/${enc(mapId)}/one-shots/${enc(itemKey)}`, body));
export const deleteOneShot = (mapId, itemKey) => data(client.delete(`${MAPS_API}/${enc(mapId)}/one-shots/${enc(itemKey)}`));
// -> { goals, newlyAchieved }
export const getGoals = (where) => data(client.get(mapOrShared(where, 'goals')));
export const createGoal = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/goals`, body));
export const updateGoal = (goalId, body) => data(client.patch(`${GOALS_API}/${enc(goalId)}`, body));
export const deleteGoal = (goalId) => data(client.delete(`${GOALS_API}/${enc(goalId)}`));
