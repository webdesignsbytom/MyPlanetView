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
import { homeOf } from '../../utils/travelStats.js';
import { bestCopySize } from '../../utils/planLimits.js';
import { themeView } from '../../utils/themes.js';
import { signPhotoUrl } from '../../services/s3/mediaService.js';
import { videoPlayback } from '../../services/stream/videos.js';
import {
  countMapPhotos,
  countMapTrips,
  findCompletedTripsForStats,
  findMapStatsRow,
  findMapStampedLandmarkIds,
  findMapTravellers,
  findMapVisitsForStats,
} from '../../domain/maps.js';
import { findTickedLandmarkIds } from '../../domain/landmarkVisits.js';
import { continentsByCode, placePositions, worldCountryTotals } from './countries.js';
import { spotView } from '../../utils/momentSpots.js';

const keyOf = (photo, size) => photo.variants?.find((v) => v.size === size)?.media?.key ?? null;
const signed = async (key) => (key ? signPhotoUrl(key) : null);

/**
 * The best copy kept, for the download lists (`best=1`, editors only; docs/API.md
 * "Downloads"): `{ copy: 'ORIGINAL'|'PRINT', url, contentType, bytes, width, height }`,
 * or null (a video: Stream keeps no file to hand back; an old photo saved with neither).
 */
async function bestFile(photo) {
  if (photo.kind === 'VIDEO') return null;
  const copy = bestCopySize((photo.variants ?? []).map((v) => v.size));
  const variant = copy ? photo.variants.find((v) => v.size === copy) : null;
  if (!variant?.media?.key) return null;
  return {
    copy,
    url: await signPhotoUrl(variant.media.key),
    contentType: variant.media.contentType,
    bytes: variant.media.bytes ?? null,
    width: variant.width,
    height: variant.height,
  };
}

/**
 * A photo in a list: thumbnail only, unless the list asked for the DISPLAY copy too
 * (the slideshows) or the best copy (`withBest`, the download lists); viewers see
 * confirmed landmarks only.
 */
export async function photoListItem(photo, role) {
  const editor = canEdit(role);
  const best = photo.withBest && editor ? { best: await bestFile(photo) } : {};
  if (photo.kind === 'VIDEO') return { ...videoListItem(photo, role), ...best };
  const displayKey = keyOf(photo, 'DISPLAY');
  return {
    id: photo.id,
    kind: 'PHOTO',
    durationS: null,
    caption: photo.caption,
    takenAt: photo.takenAt,
    countryCode: photo.countryCode,
    tripId: photo.tripId,
    width: photo.width,
    height: photo.height,
    thumbUrl: await signed(keyOf(photo, 'THUMB')),
    ...(displayKey ? { displayUrl: await signed(displayKey) } : {}),
    landmarks: photo.landmarks
      .filter((l) => editor || l.confirmed)
      .map((l) => ({ id: l.landmark.id, name: l.landmark.name, confirmed: l.confirmed })),
    ...(editor ? { hidden: photo.hidden } : {}),
    ...best,
  };
}

/**
 * A video in a list (docs/API.md "Videos"): it lives in Cloudflare Stream, so its pictures
 * are Stream's thumbnails and it plays from Stream's HLS link, each signed for the hour.
 * Only a READY video has them (viewers never get any other); editors also get `videoState`.
 * `displayUrl` and `videoUrl` come with the slideshow lists' DISPLAY copy, as for photos.
 */
function videoListItem(photo, role) {
  const editor = canEdit(role);
  const playback = photo.videoState === 'READY' ? videoPlayback(photo) : null;
  // Set by photoPage for the slideshows' lists (`display=1`)
  const withDisplay = Boolean(photo.withDisplay);
  return {
    id: photo.id,
    kind: 'VIDEO',
    durationS: photo.durationS ?? null,
    caption: photo.caption,
    takenAt: photo.takenAt,
    countryCode: photo.countryCode,
    tripId: photo.tripId,
    width: photo.width,
    height: photo.height,
    thumbUrl: playback ? playback.thumbnail(400) : null,
    ...(withDisplay && playback ? { displayUrl: playback.thumbnail(1080), videoUrl: playback.hls } : {}),
    landmarks: [],
    ...(editor ? { hidden: photo.hidden, videoState: photo.videoState } : {}),
  };
}

// The monthly themes a photo is in, newest month first (everyone who can see it sees them)
const photoThemes = (photo) =>
  (photo.themeEntries ?? [])
    .map((entry) => themeView(entry.theme))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

/** One opened video: its poster and playback link (READY only), never coordinates or files. */
function videoDetailView(photo, role) {
  const playback = photo.videoState === 'READY' ? videoPlayback(photo) : null;
  return {
    ...videoListItem(photo, role),
    displayUrl: playback ? playback.thumbnail(1080) : null,
    videoUrl: playback ? playback.hls : null,
    ...(canSeeLocation(role) ? { latitude: null, longitude: null, originalUrl: null, bestCopy: null } : {}),
  };
}

/**
 * One opened photo: display size, plus for editors the best copy kept and its position.
 * `originalUrl` is the ORIGINAL (Business and First Class maps), else the PRINT copy
 * (Economy), and `bestCopy` says which (null when the photo has neither).
 */
export async function photoDetailView(photo, role) {
  if (photo.kind === 'VIDEO') return videoDetailView(photo, role);
  const base = await photoListItem(photo, role);
  const view = { ...base, displayUrl: await signed(keyOf(photo, 'DISPLAY')), themes: photoThemes(photo) };
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
    // The trip's map shows the UK as its four nations (its stops' places and the mini map)
    splitUk: Boolean(trip.map.splitUk),
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
  // When it was marked (24 Nov 2026): with the first visit, the order the places were visited in
  // (the strings tied to a newly visited place, as the passport's pages)
  markedAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
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
    // Its pin: always for editors (with `shared`), else only when shared
    spot: spotView(moment, { canEdit: canEdit(role) }),
    tripId: moment.tripId,
    travellerIds: moment.travellers.map((t) => t.travellerId),
    photos: await Promise.all(photos.map(async (p) => ({ id: p.id, thumbUrl: await signed(keyOf(p, 'THUMB')) }))),
    ...(canEdit(role) ? { hidden: moment.hidden } : {}),
    createdAt: moment.createdAt,
  };
}

/**
 * A country map's pin in a list (docs/API.md "Country maps"): where it is, how many visits
 * and the latest one's date; `hidden` for editors only.
 */
export const pinSummaryView = (pin, { role }) => ({
  id: pin.id,
  name: pin.name,
  countryCode: pin.countryCode,
  latitude: pin.latitude,
  longitude: pin.longitude,
  visitCount: pin.visitCount,
  latestVisit: pin.latestVisit ? { visitedOn: toDateOnly(pin.latestVisit.visitedOn), datePrecision: pin.latestVisit.datePrecision } : null,
  ...(canEdit(role) ? { hidden: pin.hidden } : {}),
});

/**
 * One pin with its visits, newest first, each with the photos the caller may see (as a
 * moment's: never a hidden one below editor).
 */
export async function pinView(pin, { role }) {
  const photoAccess = { mapRole: role, trip: null };
  return {
    id: pin.id,
    name: pin.name,
    notes: pin.notes,
    countryCode: pin.countryCode,
    latitude: pin.latitude,
    longitude: pin.longitude,
    ...(canEdit(role) ? { hidden: pin.hidden } : {}),
    createdAt: pin.createdAt,
    visits: await Promise.all(
      pin.visits.map(async (visit) => ({
        id: visit.id,
        visitedOn: toDateOnly(visit.visitedOn),
        datePrecision: visit.datePrecision,
        notes: visit.notes,
        photos: await Promise.all(
          visit.photos
            .map((p) => p.photo)
            .filter((photo) => canSeeMomentPhoto(photo, photoAccess))
            .map(async (p) => ({ id: p.id, countryCode: p.countryCode, thumbUrl: await signed(keyOf(p, 'THUMB')) })),
        ),
      })),
    ),
  };
}

/**
 * What a map's stats need beyond its visits and travellers, counting only what the
 * caller may see. All side by side; continents come from the cached country list.
 */
export async function loadStatsCounts(mapId, role) {
  const includeHidden = canEdit(role);
  const [photoCount, stampedLandmarkIds, tickedLandmarkIds, tripCount, completedTrips, continentByCode, positions, worldTotals] = await Promise.all([
    countMapPhotos(mapId, { includeHidden }),
    findMapStampedLandmarkIds(mapId, { includeHidden }),
    findTickedLandmarkIds(mapId),
    countMapTrips(mapId),
    findCompletedTripsForStats(mapId),
    continentsByCode(),
    placePositions(),
    worldCountryTotals(),
  ]);
  // The ids too: the map's reply marks those landmarks' pins (mapDetailView). A tick stamps
  // the passport as a photo does (23 Nov 2026), so the stats count both, each landmark once
  const landmarkCount = new Set([...stampedLandmarkIds, ...tickedLandmarkIds]).size;
  return { photoCount, landmarkCount, stampedLandmarkIds, tickedLandmarkIds, tripCount, completedTrips, continentByCode, positions, worldTotals };
}

/**
 * Stats from a map's visits and travellers (`[{ id, name, userId, birthCountryCode }]`) and
 * loadStatsCounts; `splitUk`: the map counts the UK's nations one each (utils/ukNations.js);
 * `homeCountryCode` and `ownerId` find its home (utils/travelStats.js homeOf).
 */
export const statsFrom = ({ visits, travellers, splitUk = false, homeCountryCode = null, ownerId = null }, counts, { role = null } = {}) =>
  buildMapStats({
    visits,
    travellers,
    splitUk,
    ...counts,
    homeCountryCode: homeOf({ homeCountryCode, ownerId, travellers }),
    // Dates of birth are the editors' (23 Nov 2026): the share of a life away is theirs too
    showBirthDates: canEdit(role),
  });

/** Stats for a map, counting only what the caller may see (GET /maps/:mapId/stats). */
export async function loadMapStats(mapId, role) {
  const [visits, travellers, counts, row] = await Promise.all([
    findMapVisitsForStats(mapId),
    findMapTravellers(mapId),
    loadStatsCounts(mapId, role),
    findMapStatsRow(mapId),
  ]);
  return statsFrom({ visits, travellers, splitUk: Boolean(row?.splitUk), homeCountryCode: row?.homeCountryCode, ownerId: row?.ownerId }, counts, { role });
}
