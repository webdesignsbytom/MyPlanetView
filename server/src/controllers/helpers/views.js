// What the travel routes send back, shaped by the caller's role.
import {
  canDeleteTrip,
  canEdit,
  canSeeLocation,
  canSeeMomentPhoto,
  canSeePhoto,
  canView,
} from '../../utils/access.js';
import { toDateOnly } from '../../utils/travelValidation.js';
import { buildMapStats } from '../../utils/mapStats.js';
import { bestCopySize } from '../../utils/planLimits.js';
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

/**
 * A photo in a list: thumbnail only, unless the list asked for the DISPLAY copy too
 * (the slideshows); viewers see confirmed landmarks only.
 */
export async function photoListItem(photo, role) {
  const editor = canEdit(role);
  const displayKey = keyOf(photo, 'DISPLAY');
  // A video's file is its ORIGINAL (location metadata overwritten before upload), so anyone
  // who can see the video can play it; a photo's original never goes in a list
  const videoKey = photo.kind === 'VIDEO' ? keyOf(photo, 'ORIGINAL') : null;
  return {
    id: photo.id,
    kind: photo.kind ?? 'PHOTO',
    durationS: photo.durationS ?? null,
    caption: photo.caption,
    takenAt: photo.takenAt,
    countryCode: photo.countryCode,
    tripId: photo.tripId,
    width: photo.width,
    height: photo.height,
    thumbUrl: await signed(keyOf(photo, 'THUMB')),
    ...(displayKey ? { displayUrl: await signed(displayKey) } : {}),
    ...(videoKey ? { videoUrl: await signed(videoKey) } : {}),
    landmarks: photo.landmarks
      .filter((l) => editor || l.confirmed)
      .map((l) => ({ id: l.landmark.id, name: l.landmark.name, confirmed: l.confirmed })),
    ...(editor ? { hidden: photo.hidden } : {}),
  };
}

/**
 * One opened photo: display size, plus for editors the best copy kept and its position.
 * `originalUrl` is the ORIGINAL (Business and First Class maps), else the PRINT copy
 * (Economy), and `bestCopy` says which (null when the photo has neither).
 */
export async function photoDetailView(photo, role) {
  const base = await photoListItem(photo, role);
  const view = { ...base, displayUrl: await signed(keyOf(photo, 'DISPLAY')) };
  if (photo.kind === 'VIDEO') view.videoUrl = await signed(keyOf(photo, 'ORIGINAL'));
  if (canSeeLocation(role)) {
    const bestCopy = bestCopySize((photo.variants ?? []).map((v) => v.size));
    view.originalUrl = await signed(bestCopy ? keyOf(photo, bestCopy) : null);
    view.bestCopy = bestCopy;
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
 * A group trip from another map in this map's list (docs/API.md "Group trips"). Someone
 * with a role on the trip (`canOpen`) gets its summary as well; anyone else only its
 * title, dates, status and countries: no cover, counts or travellers.
 */
export async function linkedTripSummary(trip, { canOpen, role = null }) {
  const limited = {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    startDate: toDateOnly(trip.startDate),
    endDate: toDateOnly(trip.endDate),
    countryCodes: trip.countryCodes,
    linked: true,
    organiserMapName: trip.map.name,
    canOpen,
  };
  return canOpen ? { ...(await tripSummary(trip, role)), ...limited } : limited;
}

/**
 * One trip. `mapRole` is the caller's role on the trip's map: `canOpenMap` tells the
 * client whether to link back to it (a trip-only member can't open it), `canDelete`
 * whether to offer deleting the trip (the map's owner and editors only). Left out (a
 * share link), both are false. `uploadRules` (services/travel/plans.js) is added when
 * given: the trip routes give it to the trip's editors only. `myMaps` (`{ links:
 * [{ mapId, name, canRemove }], canAdd }`, the trip routes only) says which of the
 * caller's own maps show the trip, and whether they have one to add it to.
 */
export async function tripDetailView(trip, role, { mapRole = null, uploadRules = null, myMaps = null } = {}) {
  return {
    ...(uploadRules ? { uploadRules } : {}),
    id: trip.id,
    mapId: trip.mapId,
    mapName: trip.map.name,
    canOpenMap: canView(mapRole),
    canDelete: canDeleteTrip(mapRole),
    onMyMaps: myMaps?.links ?? [],
    canAddToMyMap: myMaps?.canAdd ?? false,
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
  // The country's one note ("I want to visit here"), for everyone who can see the map
  notes: v.notes,
});

/**
 * One moment (docs/API.md "Moments"). `role` decides `hidden` (editors only); `photoAccess`
 * (`{ mapRole, trip }`, see canSeeMomentPhoto) which of its photos the caller may see:
 * never a hidden one below editor, and only the trip's own through a trip. Never
 * coordinates: a landmark is its id and name.
 */
export async function momentView(moment, { role, photoAccess }) {
  const photos = moment.photos.map((p) => p.photo).filter((photo) => canSeeMomentPhoto(photo, photoAccess));
  return {
    id: moment.id,
    kind: moment.kind,
    title: moment.title,
    text: moment.text,
    happenedOn: toDateOnly(moment.happenedOn),
    datePrecision: moment.datePrecision,
    countryCode: moment.countryCode,
    landmark: moment.landmark ? { id: moment.landmark.id, name: moment.landmark.name } : null,
    placeName: moment.placeName,
    tripId: moment.tripId,
    travellerIds: moment.travellers.map((t) => t.travellerId),
    photos: await Promise.all(photos.map(async (p) => ({ id: p.id, thumbUrl: await signed(keyOf(p, 'THUMB')) }))),
    ...(canEdit(role) ? { hidden: moment.hidden } : {}),
    createdAt: moment.createdAt,
  };
}

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
