// What the travel routes send back, shaped by the caller's role.
import { canDeleteTrip, canEdit, canSeeLocation, canSeePhoto, canView } from '../../utils/access.js';
import { toDateOnly } from '../../utils/travelValidation.js';
import { buildMapStats } from '../../utils/mapStats.js';
import { signPhotoUrl } from '../../services/s3/mediaService.js';
import {
  countMapConfirmedLandmarks,
  countMapPhotos,
  countMapTrips,
  findCompletedTripsForStats,
  findMapTravellers,
  findMapVisitsForStats,
} from '../../domain/maps.js';
import { continentsByCode } from './countries.js';

const keyOf = (photo, size) => photo.variants?.find((v) => v.size === size)?.media?.key ?? null;
const signed = async (key) => (key ? signPhotoUrl(key) : null);

/** A photo in a list: thumbnail only; viewers see confirmed landmarks only. */
export async function photoListItem(photo, role) {
  const editor = canEdit(role);
  return {
    id: photo.id,
    caption: photo.caption,
    takenAt: photo.takenAt,
    countryCode: photo.countryCode,
    tripId: photo.tripId,
    width: photo.width,
    height: photo.height,
    thumbUrl: await signed(keyOf(photo, 'THUMB')),
    landmarks: photo.landmarks
      .filter((l) => editor || l.confirmed)
      .map((l) => ({ id: l.landmark.id, name: l.landmark.name, confirmed: l.confirmed })),
    ...(editor ? { hidden: photo.hidden } : {}),
  };
}

/** One opened photo: display size, plus the original and its position for editors. */
export async function photoDetailView(photo, role) {
  const base = await photoListItem(photo, role);
  const view = { ...base, displayUrl: await signed(keyOf(photo, 'DISPLAY')) };
  if (canSeeLocation(role)) {
    view.originalUrl = await signed(keyOf(photo, 'ORIGINAL'));
    view.latitude = photo.latitude;
    view.longitude = photo.longitude;
    view.landmarks = photo.landmarks.map((l) => ({
      id: l.landmark.id,
      name: l.landmark.name,
      confirmed: l.confirmed,
      source: l.source,
      distanceM: l.distanceM,
    }));
  }
  return view;
}

/** Hidden photos are left out of a page for viewers (the query already does it; this is a second check). */
export const visiblePhotos = (photos, role) => photos.filter((p) => canSeePhoto(role, p));

const coverThumb = async (trip, role) =>
  trip.coverPhoto && canSeePhoto(role, trip.coverPhoto) ? signed(trip.coverPhoto.variants?.[0]?.media?.key) : null;

/**
 * A trip in a list. `trip.counts` comes from domain/trips.js, which already left
 * hidden photos out for callers below editor.
 */
export async function tripSummary(trip, role) {
  return {
    id: trip.id,
    mapId: trip.mapId,
    title: trip.title,
    status: trip.status,
    startDate: toDateOnly(trip.startDate),
    endDate: toDateOnly(trip.endDate),
    coverThumbUrl: await coverThumb(trip, role),
    stopCount: trip.counts?.stops ?? 0,
    photoCount: trip.counts?.photos ?? 0,
    travellerIds: trip.travellers.map((t) => t.travellerId),
  };
}

/**
 * One trip. `mapRole` is the caller's role on the trip's map: `canOpenMap` tells the
 * client whether to link back to it (a trip-only member can't open it), `canDelete`
 * whether to offer deleting the trip (the map's owner and editors only). Left out (a
 * share link), both are false.
 */
export async function tripDetailView(trip, role, { mapRole = null } = {}) {
  return {
    id: trip.id,
    mapId: trip.mapId,
    mapName: trip.map.name,
    canOpenMap: canView(mapRole),
    canDelete: canDeleteTrip(mapRole),
    title: trip.title,
    description: trip.description,
    status: trip.status,
    startDate: toDateOnly(trip.startDate),
    endDate: toDateOnly(trip.endDate),
    coverPhotoId: trip.coverPhoto && canSeePhoto(role, trip.coverPhoto) ? trip.coverPhotoId : null,
    coverThumbUrl: await coverThumb(trip, role),
    role,
    travellerIds: trip.travellers.map((t) => t.travellerId),
    // Names for display (the trip's map's travellers)
    travellers: trip.map.travellers,
    stops: trip.stops.map((s) => ({
      id: s.id,
      position: s.position,
      countryCode: s.countryCode,
      landmarkId: s.landmarkId,
      landmarkName: s.landmark?.name ?? null,
      placeName: s.placeName,
      arriveOn: toDateOnly(s.arriveOn),
      leaveOn: toDateOnly(s.leaveOn),
      notes: s.notes,
    })),
  };
}

export const visitView = (v) => ({
  countryCode: v.countryCode,
  status: v.status,
  source: v.source,
  firstVisitedOn: toDateOnly(v.firstVisitedOn),
  notes: v.notes,
});

/**
 * What a map's stats need beyond its visits and travellers, counting only what the
 * caller may see. All side by side; continents come from the cached country list.
 */
export async function loadStatsCounts(mapId, role) {
  const includeHidden = canEdit(role);
  const [photoCount, landmarkCount, tripCount, completedTrips, continentByCode] = await Promise.all([
    countMapPhotos(mapId, { includeHidden }),
    countMapConfirmedLandmarks(mapId, { includeHidden }),
    countMapTrips(mapId),
    findCompletedTripsForStats(mapId),
    continentsByCode(),
  ]);
  return { photoCount, landmarkCount, tripCount, completedTrips, continentByCode };
}

/** Stats from a map's visits and travellers (`[{ id, name }]`) and loadStatsCounts. */
export const statsFrom = ({ visits, travellers }, counts) => buildMapStats({ visits, travellers, ...counts });

/** Stats for a map, counting only what the caller may see (GET /maps/:mapId/stats). */
export async function loadMapStats(mapId, role) {
  const [visits, travellers, counts] = await Promise.all([
    findMapVisitsForStats(mapId),
    findMapTravellers(mapId),
    loadStatsCounts(mapId, role),
  ]);
  return statsFrom({ visits, travellers }, counts);
}
