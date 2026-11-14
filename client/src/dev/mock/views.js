// Mock mode only. Roles and response shapes, following docs/API.md (and the
// server's utils/access.js and utils/mapStats.js) so the client can't tell the difference.
import { COUNTRIES } from '@/utils/map/countries';
import { posterUrl } from '@/utils/map/posterData';
import { projectToMap } from '@/utils/map/projection';
import { LANDMARKS } from './data/landmarks';
import { getDb, me, session } from './store';

export const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
export const countryExists = (code) => continentByCode.has(code);

export const LANDMARK_ROWS = LANDMARKS.map((lm) => {
  const slug = slugify(lm.name);
  const pin = projectToMap(lm.latitude, lm.longitude);
  return {
    id: `lm-${slug}`,
    name: lm.name,
    slug,
    countryCode: lm.countryCode,
    latitude: lm.latitude,
    longitude: lm.longitude,
    pinX: Math.round(pin.x * 10) / 10,
    pinY: Math.round(pin.y * 10) / 10,
    matchRadiusM: lm.matchRadiusM,
  };
});
export const landmarkById = (id) => LANDMARK_ROWS.find((l) => l.id === id) || null;

// Roles
const RANK = { VIEWER: 1, EDITOR: 2, OWNER: 3 };
export const higherRole = (a, b) => (!a ? b || null : !b ? a : RANK[a] >= RANK[b] ? a : b);
export const atLeast = (role, needed) => Boolean(role && RANK[role] >= RANK[needed]);

export function mapRole(map) {
  if (!map || !session.signedIn) return null;
  if (map.ownerId === me().id) return 'OWNER';
  return getDb().mapMembers.find((m) => m.mapId === map.id && m.userId === me().id)?.role || null;
}

export function tripRole(trip) {
  if (!trip) return null;
  const map = getDb().maps.find((m) => m.id === trip.mapId);
  const own = session.signedIn ? getDb().tripMembers.find((m) => m.tripId === trip.id && m.userId === me().id)?.role : null;
  return higherRole(mapRole(map), own || null);
}

export const photoRole = (photo) => {
  const trip = photo.tripId ? getDb().trips.find((t) => t.id === photo.tripId) : null;
  return trip ? tripRole(trip) : mapRole(getDb().maps.find((m) => m.id === photo.mapId));
};

export const userName = (id) => getDb().users.find((u) => u.id === id)?.name || 'Someone';

// Photos
function photoUrls(photo) {
  // A poster stands in for a demo photo, at every size
  if (photo.image?.kind === 'asset') {
    const url = posterUrl(photo.image.name, 'avif');
    return { thumb: url, display: url, original: url };
  }
  return {
    thumb: session.blobs.get(photo.image?.thumbKey) || null,
    display: session.blobs.get(photo.image?.displayKey) || session.blobs.get(photo.image?.thumbKey) || null,
    original: session.blobs.get(photo.image?.originalKey) || null,
  };
}

const photoLandmarks = (photo, role) =>
  getDb()
    .photoLandmarks.filter((pl) => pl.photoId === photo.id && (atLeast(role, 'EDITOR') || pl.confirmed))
    .map((pl) => ({ pl, lm: landmarkById(pl.landmarkId) }))
    .filter(({ lm }) => lm);

export const canSeePhoto = (photo, role) => atLeast(role, 'VIEWER') && (!photo.hidden || atLeast(role, 'EDITOR'));

export function photoListItem(photo, role) {
  const item = {
    id: photo.id,
    caption: photo.caption,
    takenAt: photo.takenAt,
    countryCode: photo.countryCode,
    tripId: photo.tripId,
    width: photo.width,
    height: photo.height,
    thumbUrl: photoUrls(photo).thumb,
    landmarks: photoLandmarks(photo, role).map(({ pl, lm }) => ({ id: lm.id, name: lm.name, confirmed: pl.confirmed })),
  };
  if (atLeast(role, 'EDITOR')) item.hidden = photo.hidden;
  return item;
}

export function photoDetail(photo, role) {
  const urls = photoUrls(photo);
  const detail = { ...photoListItem(photo, role), displayUrl: urls.display };
  if (atLeast(role, 'EDITOR')) {
    Object.assign(detail, {
      originalUrl: urls.original,
      latitude: photo.latitude,
      longitude: photo.longitude,
      landmarks: photoLandmarks(photo, role).map(({ pl, lm }) => ({
        id: lm.id,
        name: lm.name,
        confirmed: pl.confirmed,
        source: pl.source,
        distanceM: pl.distanceM,
      })),
    });
  }
  return detail;
}

// Newest first (by upload); cursor = the id of the last photo of the previous page
export function photoPage(photos, role, { country, tripId, cursor, limit }) {
  const size = Math.min(Math.max(Number(limit) || 30, 1), 60);
  const list = photos
    .filter((p) => canSeePhoto(p, role))
    .filter((p) => !country || p.countryCode === country)
    .filter((p) => !tripId || p.tripId === tripId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const start = cursor ? list.findIndex((p) => p.id === cursor) + 1 : 0;
  const page = list.slice(start, start + size);
  const nextCursor = start + size < list.length ? page[page.length - 1].id : null;
  return { photos: page.map((p) => photoListItem(p, role)), nextCursor };
}

// Maps
const visibleMapPhotos = (map, role) => getDb().photos.filter((p) => p.mapId === map.id && canSeePhoto(p, role));

export function mapStats(map, role) {
  const db = getDb();
  const counted = new Set(
    db.visits.filter((v) => v.mapId === map.id && (v.status === 'VISITED' || v.status === 'LIVED')).map((v) => v.countryCode),
  );
  const continents = new Set([...counted].map((c) => continentByCode.get(c)).filter(Boolean));
  const photos = visibleMapPhotos(map, role);
  const photoIds = new Set(photos.map((p) => p.id));
  const landmarks = new Set(db.photoLandmarks.filter((pl) => pl.confirmed && photoIds.has(pl.photoId)).map((pl) => pl.landmarkId));
  const trips = db.trips.filter((t) => t.mapId === map.id);
  const completed = trips
    .filter((t) => t.status === 'COMPLETED')
    .map((t) => ({ travellerIds: t.travellerIds, countryCodes: db.stops.filter((s) => s.tripId === t.id).map((s) => s.countryCode) }));
  const travellers = db.travellers.filter((t) => t.mapId === map.id).sort((a, b) => a.position - b.position);
  return {
    countries: counted.size,
    continents: continents.size,
    photos: photos.length,
    landmarks: landmarks.size,
    trips: trips.length,
    byTraveller: travellers.map((t) => {
      const countries = new Set();
      completed.forEach((trip) => trip.travellerIds.includes(t.id) && trip.countryCodes.forEach((c) => countries.add(c)));
      return { travellerId: t.id, name: t.name, countries: countries.size };
    }),
  };
}

export function mapSummary(map, role) {
  const db = getDb();
  const stats = mapStats(map, role);
  return {
    id: map.id,
    name: map.name,
    groupType: map.groupType,
    isDefault: map.isDefault,
    role,
    ownerName: userName(map.ownerId),
    counts: { countries: stats.countries, photos: stats.photos, trips: db.trips.filter((t) => t.mapId === map.id).length },
  };
}

export function mapView(map, role) {
  const db = getDb();
  return {
    id: map.id,
    name: map.name,
    groupType: map.groupType,
    isDefault: map.isDefault,
    role,
    ownerName: userName(map.ownerId),
    travellers: db.travellers
      .filter((t) => t.mapId === map.id)
      .sort((a, b) => a.position - b.position)
      .map((t) => {
        const out = { id: t.id, name: t.name, position: t.position, birthCountryCode: t.birthCountryCode, favouriteCountryCode: t.favouriteCountryCode };
        if (atLeast(role, 'EDITOR')) out.userId = t.userId;
        return out;
      }),
    visits: db.visits
      .filter((v) => v.mapId === map.id)
      .map(({ countryCode, status, source, firstVisitedOn, notes }) => ({ countryCode, status, source, firstVisitedOn, notes })),
    stats: mapStats(map, role),
  };
}

// Trips
function coverThumb(trip) {
  const photo = getDb().photos.find((p) => p.id === trip.coverPhotoId);
  return photo ? photoUrls(photo).thumb : null;
}

export function tripSummary(trip, role) {
  const db = getDb();
  return {
    id: trip.id,
    mapId: trip.mapId,
    title: trip.title,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverThumbUrl: coverThumb(trip),
    stopCount: db.stops.filter((s) => s.tripId === trip.id).length,
    photoCount: db.photos.filter((p) => p.tripId === trip.id && canSeePhoto(p, role)).length,
    travellerIds: [...trip.travellerIds],
  };
}

export function tripView(trip, role) {
  const db = getDb();
  const map = db.maps.find((m) => m.id === trip.mapId);
  return {
    id: trip.id,
    mapId: trip.mapId,
    mapName: map?.name || '',
    title: trip.title,
    description: trip.description,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverPhotoId: trip.coverPhotoId,
    coverThumbUrl: coverThumb(trip),
    role,
    travellerIds: [...trip.travellerIds],
    travellers: db.travellers
      .filter((t) => t.mapId === trip.mapId)
      .sort((a, b) => a.position - b.position)
      .map((t) => ({ id: t.id, name: t.name })),
    stops: db.stops
      .filter((s) => s.tripId === trip.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        position: s.position,
        countryCode: s.countryCode,
        landmarkId: s.landmarkId,
        landmarkName: landmarkById(s.landmarkId)?.name || null,
        placeName: s.placeName,
        arriveOn: s.arriveOn,
        leaveOn: s.leaveOn,
        notes: s.notes,
      })),
  };
}

// A WANT_TO_GO country becomes VISITED; an existing VISITED or LIVED one is left alone
export function markVisited(mapId, countryCode, source, firstVisitedOn = null) {
  if (!countryCode) return;
  const db = getDb();
  const visit = db.visits.find((v) => v.mapId === mapId && v.countryCode === countryCode);
  if (!visit) db.visits.push({ mapId, countryCode, status: 'VISITED', source, firstVisitedOn, notes: null });
  else if (visit.status === 'WANT_TO_GO') Object.assign(visit, { status: 'VISITED', source });
}

// Photos with GPS: the nearest country pin stands in for the server's point-in-polygon
export function countryNear(latitude, longitude) {
  const { x, y } = projectToMap(latitude, longitude);
  let best = null;
  for (const c of COUNTRIES) {
    const d = (c.pinX - x) ** 2 + (c.pinY - y) ** 2;
    if (!best || d < best.d) best = { code: c.code, d };
  }
  return best && best.d < 60 * 60 ? best.code : null;
}

export function distanceM(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
