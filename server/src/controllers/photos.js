// Photos: upload (presign, then confirm), list, open, change, delete, landmark matches
import crypto from 'node:crypto';
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createPhotoEvent } from '../event/travelUtils.js';
import { clampInt, sanitizeText } from '../utils/sanitize.js';
import { canEdit, canSeePhoto, canView } from '../utils/access.js';
import {
  CAPTION_MAX,
  PHOTO_SIZES,
  isPixelSize,
  isUuid,
  parseDateTime,
  parsePosition,
} from '../utils/travelValidation.js';
import { countryAtPosition } from '../utils/countryLookup.js';
import { UK, placeOnMap, ukNationAt } from '../utils/ukNations.js';
import { boundingBox, matchLandmarks } from '../utils/landmarkMatch.js';
import { PHOTO_CONTENT_TYPES, PHOTO_MAX_BYTES, PHOTO_SAVE_WINDOW_MINUTES } from '../utils/constants/mediaConstants.js';
import {
  assertPhotoUploadsUnderCap,
  buildPhotoKey,
  deleteStoredObjects,
  headPrivateObject,
  photoKeyFolder,
  presignPhotoUpload,
} from '../services/s3/mediaService.js';
import { findLandmarkById, findLandmarksInBox } from '../domain/places.js';
import { loadMapPlan } from '../services/travel/plans.js';
import { LOCKED_MAP_MESSAGE, VIDEO_MESSAGES, checkCountryCap, checkPhotoSizesForPlan } from '../utils/planLimits.js';
import {
  confirmPhotoLandmarkInDB,
  countPhotosInCountry,
  createPhotoInDB,
  deletePhotoInDB,
  deletePhotoLandmarkInDB,
  findMediaItemsByKeys,
  findPhotoById,
  findPhotoDetail,
  findPhotoFileKeys,
  findPhotoIdsForList,
  findPhotosByIds,
  findPhotosPage,
  movePhotoInDB,
  updatePhotoInDB,
  upsertPhotoLandmarkInDB,
} from '../domain/photos.js';
import { PHOTO_GALLERIES } from '../utils/photoOrder.js';
import { deleteStreamVideoQuietly, refreshVideoState } from '../services/stream/videos.js';
import { pageAfter, parseShuffleSeed, shuffled } from '../utils/shuffle.js';
import { findTripAccess } from '../domain/trips.js';
import {
  badRequest,
  conflict,
  denyUnless,
  forbidden,
  handler,
  loadMap,
  loadPhoto,
  loadTrip,
  loadUploadTarget,
  notFound,
} from './helpers/travel.js';
import { countryNameOf, isKnownCountry, parseOptionalCountry } from './helpers/countries.js';
import { photoDetailView, photoListItem, visiblePhotos } from './helpers/views.js';

const D = DOMAINS.photos;
const REQUIRED_SIZES = ['THUMB', 'DISPLAY'];
const PAGE_DEFAULT = 30;
const PAGE_MAX = 60;
// The download lists (`best=1`) page further: signing is local, and a big map is many pages
const BEST_PAGE_MAX = 200;

const hasRequiredSizes = (sizes) => REQUIRED_SIZES.every((s) => sizes.includes(s));
const distinct = (list) => new Set(list).size === list.length;

// What the plan rules need about a country, for the photo writes (domain/photos.js)
const photoLimits = async (planId, countryCode, kind = 'PHOTO') => ({
  planId,
  kind,
  countryName: countryCode ? await countryNameOf(countryCode) : null,
});

// This upload takes photos only; videos go to Cloudflare Stream (controllers/videos.js)
const PHOTO_KINDS = ['PHOTO'];

/** -> `{ kind: 'PHOTO', durationS: null }`, or `{ status, message }` for anything else */
function parseUploadKind(body) {
  const kind = body.kind ?? 'PHOTO';
  // Videos upload to Cloudflare Stream instead (controllers/videos.js)
  if (kind === 'VIDEO') return { status: 400, message: VIDEO_MESSAGES.useVideoUpload };
  if (!PHOTO_KINDS.includes(kind)) return { status: 400, message: EVENT_MESSAGES.photoUploadInvalid };
  return { kind, durationS: null };
}

// Upload, step 1: presigned PUTs into the private bucket. The map's owner's plan decides:
// a locked map takes no photos (403); Economy sends a PRINT copy and no ORIGINAL, the
// paid plans an ORIGINAL (optional) and no PRINT (400); with a `countryCode` hint, a
// country that's full on the map is refused before anything is uploaded (409).

export const presignPhotoHandler = handler(D, 'Presign photo', async (req, res) => {
  const body = req.body || {};
  const tripId = body.tripId || null;
  if (tripId && !isUuid(tripId)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const { map, role } = await loadUploadTarget(req, req.params.mapId, tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const mapPlan = await loadMapPlan(map.id);
  if (!mapPlan) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  if (mapPlan.locked) return forbidden(req, res, D, LOCKED_MAP_MESSAGE);

  const upload = parseUploadKind(body);
  if (upload.status) return sendMessageResponse(res, upload.status, upload.message);
  const { kind } = upload;

  const files = Array.isArray(body.files) ? body.files : [];
  const sizes = files.map((f) => f?.size);
  if (!files.length || files.length > PHOTO_SIZES.length || !distinct(sizes)) {
    return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
  }
  if (!hasRequiredSizes(sizes)) return badRequest(req, res, D, EVENT_MESSAGES.photoSizesRequired);
  for (const file of files) {
    if (!PHOTO_SIZES.includes(file.size)) return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
    if (!PHOTO_CONTENT_TYPES[file.size].includes(file.contentType)) {
      return badRequest(req, res, D, EVENT_MESSAGES.photoTypeInvalid);
    }
    // The declared size is signed into the upload URL, so the PUT must be exactly this big
    if (!Number.isSafeInteger(file.bytes) || file.bytes <= 0) {
      return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
    }
    if (file.bytes > PHOTO_MAX_BYTES[file.size]) return sendMessageResponse(res, 413, EVENT_MESSAGES.photoTooLarge);
  }
  const sizeProblem = checkPhotoSizesForPlan(sizes, mapPlan.plan);
  if (sizeProblem) return badRequest(req, res, D, sizeProblem);

  // The country the uploader expects (confirm checks again with the final one)
  const hint = await parseOptionalCountry(body.countryCode);
  if (!hint.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
  if (hint.value) {
    // As the map keeps it: a UK nation is the UK on a map that doesn't split it
    const place = placeOnMap(hint.value, map.splitUk);
    const full = checkCountryCap({
      count: await countPhotosInCountry(map.id, place, undefined, kind),
      ...(await photoLimits(mapPlan.plan, place, kind)),
    });
    if (full) return conflict(req, res, D, full);
  }

  // At most UNCONFIRMED_UPLOAD_LIMIT.photo files presigned and never saved, per user (429)
  await assertPhotoUploadsUnderCap(req.user.id, files.length);

  const photoId = crypto.randomUUID();
  const uploads = [];
  for (const file of files) {
    const key = buildPhotoKey({ mapId: map.id, photoId, size: file.size, contentType: file.contentType });
    const { url, expiresIn } = await presignPhotoUpload({
      key,
      contentType: file.contentType,
      bytes: file.bytes,
      userId: req.user.id,
    });
    uploads.push({
      size: file.size,
      key,
      url,
      method: 'PUT',
      headers: { 'Content-Type': file.contentType },
      bytes: file.bytes,
      expiresIn,
    });
  }
  return sendDataResponse(res, 200, { photoId, uploads });
});

// Upload, step 3: check what arrived in R2, then save the photo

/**
 * Checks every uploaded file; returns `{ variants }` or `{ status, message }`. A photo
 * must be saved within PHOTO_SAVE_WINDOW_MINUTES of its presign: after an hour the
 * daily clean-up may delete its files, so it never deletes a photo being saved.
 */
async function checkUploadedFiles({ mapId, photoId, variants, userId, kind = 'PHOTO' }) {
  const folder = photoKeyFolder({ mapId, photoId });
  const keys = variants.map((v) => v.key);
  const items = await findMediaItemsByKeys(keys);
  const itemByKey = new Map(items.map((item) => [item.key, item]));
  const presignedSince = Date.now() - PHOTO_SAVE_WINDOW_MINUTES * 60 * 1000;

  const checked = [];
  for (const variant of variants) {
    const item = itemByKey.get(variant.key);
    const keyFits =
      typeof variant.key === 'string' && variant.key.startsWith(`${folder}${String(variant.size).toLowerCase()}-`);
    if (!keyFits || !item || item.resource !== 'photo' || item.ownerId !== userId) {
      return { status: 400, message: EVENT_MESSAGES.photoUploadInvalid };
    }
    if (new Date(item.createdAt).getTime() < presignedSince) {
      return { status: 400, message: EVENT_MESSAGES.photoUploadExpired };
    }
    const stored = await headPrivateObject(variant.key);
    if (!stored) return { status: 400, message: EVENT_MESSAGES.photoUploadInvalid };
    if (stored.bytes > PHOTO_MAX_BYTES[variant.size]) return { status: 413, message: EVENT_MESSAGES.photoTooLarge };
    if (!PHOTO_CONTENT_TYPES[variant.size].includes(stored.contentType)) {
      return { status: 400, message: EVENT_MESSAGES.photoTypeInvalid };
    }
    checked.push({
      size: variant.size,
      mediaId: item.id,
      bytes: stored.bytes,
      contentType: stored.contentType,
      width: variant.width,
      height: variant.height,
    });
  }
  return { variants: checked };
}

/** The keys of one photo's upload (only those in its own folder, so nothing else can be named). */
const uploadKeysOf = (mapId, photoId, variants) =>
  (Array.isArray(variants) ? variants : [])
    .map((v) => v?.key)
    .filter((k) => typeof k === 'string' && k.startsWith(photoKeyFolder({ mapId, photoId })));

// Upload, step 3 (confirm). The plan rules are checked again: a map locked meanwhile
// (403), the sizes for the owner's plan (400), and, in the save's own transaction, the
// country cap with the final country and the storage safety net (409). A refused
// upload's files are deleted.
export const createPhotoHandler = handler(D, 'Save photo', async (req, res) => {
  const body = req.body || {};
  const tripId = body.tripId || null;
  if (tripId && !isUuid(tripId)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const { map, role } = await loadUploadTarget(req, req.params.mapId, tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const { photoId } = body;
  if (!isUuid(photoId)) return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
  if (await findPhotoById(photoId)) return conflict(req, res, D, EVENT_MESSAGES.photoAlreadySaved);

  // Not saved, so nothing uses this photo's folder yet: its files can go
  const discardUpload = () => deleteStoredObjects(uploadKeysOf(map.id, photoId, body.variants));
  const mapPlan = await loadMapPlan(map.id);
  if (!mapPlan) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  if (mapPlan.locked) {
    await discardUpload();
    return forbidden(req, res, D, LOCKED_MAP_MESSAGE);
  }

  const upload = parseUploadKind(body);
  if (upload.status) {
    await discardUpload();
    return sendMessageResponse(res, upload.status, upload.message);
  }
  const { kind, durationS } = upload;

  const variants = Array.isArray(body.variants) ? body.variants : [];
  const sizes = variants.map((v) => v?.size);
  if (
    !variants.length ||
    !distinct(sizes) ||
    !sizes.every((s) => PHOTO_SIZES.includes(s)) ||
    !variants.every((v) => isPixelSize(v.width) && isPixelSize(v.height))
  ) {
    return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
  }
  if (!hasRequiredSizes(sizes)) return badRequest(req, res, D, EVENT_MESSAGES.photoSizesRequired);
  const sizeProblem = checkPhotoSizesForPlan(sizes, mapPlan.plan);
  if (sizeProblem) return badRequest(req, res, D, sizeProblem);
  if (!isPixelSize(body.width) || !isPixelSize(body.height)) {
    return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
  }

  // Version 1 keeps no position for a video: the uploader chooses its country
  const position = kind === 'VIDEO' ? parsePosition(null, null) : parsePosition(body.latitude, body.longitude);
  if (!position.ok) return badRequest(req, res, D, EVENT_MESSAGES.photoPositionInvalid);
  const takenAt = parseDateTime(body.takenAt);
  if (!takenAt.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
  // The uploader's chosen country: used when there's no GPS, or when the GPS position
  // isn't in any country (a photo taken at sea)
  const chosenCountry = await parseOptionalCountry(body.countryCode);
  if (!chosenCountry.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);

  const checked = await checkUploadedFiles({ mapId: map.id, photoId, variants, userId: req.user.id, kind });
  if (checked.status) {
    // Nothing from a failed upload is kept
    await discardUpload();
    return sendMessageResponse(res, checked.status, checked.message);
  }

  const hasGps = position.latitude !== null;
  // On a map that splits the UK, a position in the UK is in its nation (utils/ukNations.js);
  // a chosen country is kept as the map keeps places
  const gpsCountry = hasGps ? countryAtPosition(position.latitude, position.longitude) : null;
  const gpsPlace = gpsCountry === UK && map.splitUk ? (ukNationAt(position.latitude, position.longitude) ?? UK) : gpsCountry;
  const countryCode = gpsPlace ?? (chosenCountry.value ? placeOnMap(chosenCountry.value, map.splitUk) : null);
  const landmarkMatches = hasGps
    ? matchLandmarks(position, await findLandmarksInBox(boundingBox(position.latitude, position.longitude)))
    : [];

  const saved = await createPhotoInDB({
    photo: {
      id: photoId,
      mapId: map.id,
      uploaderId: req.user.id,
      tripId,
      kind,
      durationS,
      countryCode,
      caption: sanitizeText(body.caption, { maxLength: CAPTION_MAX }),
      takenAt: takenAt.value ?? null,
      latitude: position.latitude,
      longitude: position.longitude,
      width: body.width,
      height: body.height,
    },
    variants: checked.variants,
    landmarkMatches,
    // The country cap with the final country (the video cap for a video), and the storage safety net
    limits: await photoLimits(mapPlan.plan, countryCode, kind),
  });
  if (saved.refused) {
    await discardUpload();
    return conflict(req, res, D, saved.refused);
  }
  logEvent(createPhotoEvent({ user: req.user, action: 'Create Success', id: photoId, detail: `map=${map.id} kind=${kind}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { photo: await photoDetailView(await findPhotoDetail(photoId), role) });
});

// Lists

// The slideshows' orders (docs/API.md, "Slideshows"): `taken` plays oldest taken first,
// `shuffle` a shuffled order fixed by `seed` (the same seed pages the same order)
const PHOTO_ORDERS = ['gallery', 'taken', 'shuffle'];
const isTrue = (value) => value === '1' || value === 'true';

const isFlag = (value) => value === undefined || isTrue(value) || value === '0' || value === 'false';

/**
 * Shared by the map list and the share-code list. `unplaced=1` lists only the photos
 * with no country (it can't be combined with `country`); `landmark=<id>` only those
 * confirmed as that landmark, in any country (the passport's stamp photo picker).
 * `order` and `display=1` are for the slideshows (docs/API.md, "Slideshows"). `best=1`
 * (editors only: `{ forbidden }` below) adds each photo's best copy for "Print or
 * download" (docs/API.md, "Downloads").
 */
export async function photoPage({ query, mapId, tripId, role, allowBest = true }) {
  if (!isFlag(query.best)) return { error: EVENT_MESSAGES.malformedData };
  const withBest = isTrue(query.best);
  // The best copy is the original or print copy, which only editors may download, and
  // never through a share link (`allowBest: false`), whoever opens it
  if (withBest && (!allowBest || !canEdit(role))) return { forbidden: true };
  const country = query.country;
  const unplaced = query.unplaced === '1' || query.unplaced === 'true';
  if (query.unplaced !== undefined && !unplaced && query.unplaced !== '0' && query.unplaced !== 'false') {
    return { error: EVENT_MESSAGES.malformedData };
  }
  if (unplaced && country !== undefined) return { error: EVENT_MESSAGES.malformedData };
  if (country !== undefined && !(await isKnownCountry(country))) return { error: EVENT_MESSAGES.countryNotFound };
  const filterTrip = tripId ?? query.tripId;
  if (filterTrip !== undefined && !isUuid(filterTrip)) return { error: EVENT_MESSAGES.tripNotFound };
  const landmarkId = query.landmark;
  if (landmarkId !== undefined && !isUuid(landmarkId)) return { error: EVENT_MESSAGES.landmarkNotFound };
  if (query.cursor !== undefined && !isUuid(query.cursor)) return { error: EVENT_MESSAGES.malformedData };
  const limit = clampInt(query.limit, { min: 1, max: withBest ? BEST_PAGE_MAX : PAGE_MAX, fallback: PAGE_DEFAULT });
  const order = query.order ?? 'gallery';
  if (!PHOTO_ORDERS.includes(order)) return { error: EVENT_MESSAGES.malformedData };
  const seed = order === 'shuffle' ? parseShuffleSeed(query.seed) : null;
  if (order === 'shuffle' && seed === null) return { error: EVENT_MESSAGES.malformedData };
  if (!isFlag(query.display)) return { error: EVENT_MESSAGES.malformedData };
  // The download list has no use for the DISPLAY copy
  const withDisplay = isTrue(query.display) && !withBest;
  const mark = (p) => (withBest ? { ...p, withBest: true } : withDisplay ? { ...p, withDisplay: true } : p);

  const filters = { mapId, tripId: filterTrip, countryCode: country, unplaced, landmarkId, includeHidden: canEdit(role) };
  let page;
  let nextCursor;
  if (order === 'shuffle') {
    // Every id in the list, shuffled the same way for the same seed, then this page of it
    const ids = shuffled(await findPhotoIdsForList(filters), seed);
    const slice = pageAfter(ids, query.cursor, limit);
    if (!slice) return { error: EVENT_MESSAGES.malformedData };
    page = await findPhotosByIds(slice.ids, { withDisplay, withBest });
    nextCursor = slice.more ? slice.ids[slice.ids.length - 1] : null;
  } else {
    const rows = await findPhotosPage({
      ...filters,
      cursor: query.cursor,
      limit,
      order: order === 'taken' ? 'shot' : undefined,
      withDisplay,
      withBest,
    });
    page = rows.slice(0, limit);
    nextCursor = rows.length > limit ? page[page.length - 1].id : null;
  }
  return {
    photos: await Promise.all(visiblePhotos(page, role).map((p) => photoListItem(mark(p), role))),
    nextCursor,
  };
}

/** Answer a photoPage result that failed: 403 for `best=1` below editor, else 400. */
export function replyPhotoPageError(req, res, result) {
  if (result.forbidden) return forbidden(req, res, D);
  return badRequest(req, res, D, result.error);
}

export const getMapPhotosHandler = handler(D, 'Get map photos', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const result = await photoPage({ query: req.query || {}, mapId: map.id, role });
  if (result.error || result.forbidden) return replyPhotoPageError(req, res, result);
  return sendDataResponse(res, 200, result);
});

// Trip-only members reach a trip's photos here (they can't list the map)
export const getTripPhotosHandler = handler(D, 'Get trip photos', async (req, res) => {
  const { trip, role } = await loadTrip(req, req.params.tripId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const result = await photoPage({ query: req.query || {}, mapId: trip.mapId, tripId: trip.id, role });
  if (result.error || result.forbidden) return replyPhotoPageError(req, res, result);
  return sendDataResponse(res, 200, result);
});

// One photo

export const getPhotoHandler = handler(D, 'Get photo', async (req, res) => {
  const { photo, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
  // A video still converting (only editors see one): ask Stream, in case its notice is late
  if (photo.kind === 'VIDEO' && photo.videoState === 'PROCESSING') await refreshVideoState(photo);
  return sendDataResponse(res, 200, { photo: await photoDetailView(await findPhotoDetail(photo.id), role) });
});

export const updatePhotoHandler = handler(D, 'Update photo', async (req, res) => {
  const { photo, mapRole, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
  if (!canEdit(role)) return forbidden(req, res, D);

  const body = req.body || {};
  const data = {};
  if (body.caption !== undefined) data.caption = sanitizeText(body.caption, { maxLength: CAPTION_MAX });
  if (body.countryCode !== undefined) {
    const country = await parseOptionalCountry(body.countryCode);
    if (!country.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
    data.countryCode = country.value ? placeOnMap(country.value, photo.map.splitUk) : country.value;
    // Placed by hand: the nation it was in before the UK split was turned off no longer applies
    if (data.countryCode !== photo.countryCode) data.ukNation = null;
  }
  if (body.takenAt !== undefined) {
    const takenAt = parseDateTime(body.takenAt);
    if (!takenAt.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
    data.takenAt = takenAt.value;
  }
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
    data.hidden = body.hidden;
  }
  if (body.tripId !== undefined) {
    // Moving between trips needs the map: a trip-only editor would lose the photo
    if (!canEdit(mapRole)) return forbidden(req, res, D);
    if (body.tripId === null) data.tripId = null;
    else {
      const trip = isUuid(body.tripId) ? await findTripAccess(body.tripId, null) : null;
      if (!trip || trip.mapId !== photo.mapId) return badRequest(req, res, D, EVENT_MESSAGES.tripNotFound);
      data.tripId = trip.id;
    }
  }

  if (Object.keys(data).length) {
    // A photo taken there proves a visit, as it does at upload: a new country is
    // marked visited in the same transaction (a trip-only editor's too: the visit
    // carries its source). A country that's full on the map takes no more (409).
    let limits = null;
    // (Moving one out of every country counts too: the ones with no country have a cap)
    if (data.countryCode !== undefined && data.countryCode !== photo.countryCode) {
      const mapPlan = await loadMapPlan(photo.mapId);
      limits = await photoLimits(mapPlan?.plan ?? 'FREE', data.countryCode, photo.kind ?? 'PHOTO');
    }
    const updated = await updatePhotoInDB(photo.id, data, { limits });
    if (updated?.refused) return conflict(req, res, D, updated.refused);
    logEvent(createPhotoEvent({ user: req.user, action: 'Update Success', id: photo.id, detail: Object.keys(data).join(',') }));
  }
  return sendDataResponse(res, 200, { photo: await photoDetailView(await findPhotoDetail(photo.id), role) });
});

// Rearranging a gallery: `{ gallery: 'country' | 'trip', afterId }` puts the photo
// straight after `afterId` there, or first when it's null. The country gallery is the
// map's (editor on the map); the trip's gallery is the trip's (a trip-only editor too).
export const movePhotoHandler = handler(D, 'Move photo', async (req, res) => {
  const { photo, mapRole, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);

  const body = req.body || {};
  const { gallery } = body;
  if (!PHOTO_GALLERIES.includes(gallery) || (gallery === 'trip' && !photo.tripId)) {
    return badRequest(req, res, D, EVENT_MESSAGES.photoGalleryInvalid);
  }
  if (!canEdit(gallery === 'trip' ? role : mapRole)) return forbidden(req, res, D);
  const afterId = body.afterId ?? null;
  if (afterId !== null && (!isUuid(afterId) || afterId === photo.id)) {
    return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  }

  const result = await movePhotoInDB({ photo, gallery, afterId });
  if (result.targetGone) return conflict(req, res, D, EVENT_MESSAGES.photoMoveTargetGone);
  logEvent(createPhotoEvent({ user: req.user, action: 'Move Success', id: photo.id, detail: `gallery=${gallery}` }));
  return sendDataResponse(res, 200, { message: 'Photo moved.' });
});

export const deletePhotoHandler = handler(D, 'Delete photo', async (req, res) => {
  const { photo, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
  if (!canEdit(role)) return forbidden(req, res, D);

  // Rows first: a file still referenced by a PhotoVariant can't be removed. A video's file
  // is in Stream (a failed delete there is left for the daily clean-up).
  const keys = await findPhotoFileKeys(photo.id);
  await deletePhotoInDB(photo.id);
  await deleteStoredObjects(keys);
  if (photo.streamUid) await deleteStreamVideoQuietly(photo.streamUid);
  logEvent(createPhotoEvent({ user: req.user, action: 'Delete Success', id: photo.id }));
  return sendDataResponse(res, 200, { message: 'Photo deleted.' });
});

// Landmark matches

async function loadEditablePhoto(req, res) {
  const { photo, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) {
    notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
    return null;
  }
  if (!canEdit(role)) {
    forbidden(req, res, D);
    return null;
  }
  return { photo, role };
}

export const addPhotoLandmarkHandler = handler(D, 'Add photo landmark', async (req, res) => {
  const loaded = await loadEditablePhoto(req, res);
  if (!loaded) return undefined;
  if (loaded.photo.kind === 'VIDEO') return badRequest(req, res, D, VIDEO_MESSAGES.landmark);
  const { landmarkId } = req.body || {};
  if (!isUuid(landmarkId) || !(await findLandmarkById(landmarkId))) {
    return badRequest(req, res, D, EVENT_MESSAGES.landmarkNotFound);
  }
  await upsertPhotoLandmarkInDB(loaded.photo, landmarkId);
  logEvent(createPhotoEvent({ user: req.user, action: 'Landmark Add Success', id: loaded.photo.id, detail: `landmark=${landmarkId}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { photo: await photoDetailView(await findPhotoDetail(loaded.photo.id), loaded.role) });
});

export const confirmPhotoLandmarkHandler = handler(D, 'Confirm photo landmark', async (req, res) => {
  const loaded = await loadEditablePhoto(req, res);
  if (!loaded) return undefined;
  if ((req.body || {}).confirmed !== true) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  const result = await confirmPhotoLandmarkInDB(loaded.photo.id, req.params.landmarkId);
  if (!result.count) return notFound(req, res, D, EVENT_MESSAGES.landmarkNotFound);
  logEvent(createPhotoEvent({ user: req.user, action: 'Landmark Confirm Success', id: loaded.photo.id, detail: `landmark=${req.params.landmarkId}` }));
  return sendDataResponse(res, 200, { photo: await photoDetailView(await findPhotoDetail(loaded.photo.id), loaded.role) });
});

export const removePhotoLandmarkHandler = handler(D, 'Remove photo landmark', async (req, res) => {
  const loaded = await loadEditablePhoto(req, res);
  if (!loaded) return undefined;
  const result = await deletePhotoLandmarkInDB(loaded.photo.id, req.params.landmarkId);
  if (!result.count) return notFound(req, res, D, EVENT_MESSAGES.landmarkNotFound);
  logEvent(createPhotoEvent({ user: req.user, action: 'Landmark Remove Success', id: loaded.photo.id, detail: `landmark=${req.params.landmarkId}` }));
  return sendDataResponse(res, 200, { photo: await photoDetailView(await findPhotoDetail(loaded.photo.id), loaded.role) });
});
