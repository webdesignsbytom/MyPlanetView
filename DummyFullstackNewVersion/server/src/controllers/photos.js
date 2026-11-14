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
import { boundingBox, matchLandmarks } from '../utils/landmarkMatch.js';
import { PHOTO_CONTENT_TYPES, PHOTO_MAX_BYTES } from '../utils/constants/mediaConstants.js';
import {
  buildPhotoKey,
  deleteStoredObjects,
  headPrivateObject,
  photoKeyFolder,
  presignPhotoUpload,
} from '../services/s3/mediaService.js';
import { findLandmarkById, findLandmarksInBox } from '../domain/places.js';
import { createMissingVisits } from '../domain/maps.js';
import {
  confirmPhotoLandmarkInDB,
  createPhotoInDB,
  deletePhotoInDB,
  deletePhotoLandmarkInDB,
  findMediaItemsByKeys,
  findPhotoById,
  findPhotoDetail,
  findPhotoFileKeys,
  findPhotosPage,
  updatePhotoInDB,
  upsertPhotoLandmarkInDB,
} from '../domain/photos.js';
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
import { isKnownCountry, parseOptionalCountry } from './helpers/countries.js';
import { photoDetailView, photoListItem, visiblePhotos } from './helpers/views.js';

const D = DOMAINS.photos;
const REQUIRED_SIZES = ['THUMB', 'DISPLAY'];
const PAGE_DEFAULT = 30;
const PAGE_MAX = 60;

const hasRequiredSizes = (sizes) => REQUIRED_SIZES.every((s) => sizes.includes(s));
const distinct = (list) => new Set(list).size === list.length;

// Upload, step 1: presigned PUTs into the private bucket

export const presignPhotoHandler = handler(D, 'Presign photo', async (req, res) => {
  const body = req.body || {};
  const tripId = body.tripId || null;
  if (tripId && !isUuid(tripId)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const { map, role } = await loadUploadTarget(req, req.params.mapId, tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

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
    if (!Number.isInteger(file.bytes) || file.bytes <= 0 || file.bytes > PHOTO_MAX_BYTES[file.size]) {
      return sendMessageResponse(res, 413, EVENT_MESSAGES.photoTooLarge);
    }
  }

  const photoId = crypto.randomUUID();
  const uploads = [];
  for (const file of files) {
    const key = buildPhotoKey({ mapId: map.id, photoId, size: file.size, contentType: file.contentType });
    const { url, expiresIn } = await presignPhotoUpload({ key, contentType: file.contentType, userId: req.user.id });
    uploads.push({ size: file.size, key, url, method: 'PUT', headers: { 'Content-Type': file.contentType }, expiresIn });
  }
  return sendDataResponse(res, 200, { photoId, uploads });
});

// Upload, step 3: check what arrived in R2, then save the photo

/** Checks every uploaded file; returns `{ variants }` or `{ status, message }`. */
async function checkUploadedFiles({ mapId, photoId, variants, userId }) {
  const folder = photoKeyFolder({ mapId, photoId });
  const keys = variants.map((v) => v.key);
  const items = await findMediaItemsByKeys(keys);
  const itemByKey = new Map(items.map((item) => [item.key, item]));

  const checked = [];
  for (const variant of variants) {
    const item = itemByKey.get(variant.key);
    const keyFits =
      typeof variant.key === 'string' && variant.key.startsWith(`${folder}${String(variant.size).toLowerCase()}-`);
    if (!keyFits || !item || item.resource !== 'photo' || item.ownerId !== userId) {
      return { status: 400, message: EVENT_MESSAGES.photoUploadInvalid };
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

export const createPhotoHandler = handler(D, 'Save photo', async (req, res) => {
  const body = req.body || {};
  const tripId = body.tripId || null;
  if (tripId && !isUuid(tripId)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const { map, role } = await loadUploadTarget(req, req.params.mapId, tripId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const { photoId } = body;
  if (!isUuid(photoId)) return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
  if (await findPhotoById(photoId)) return conflict(req, res, D, EVENT_MESSAGES.photoAlreadySaved);

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
  if (!isPixelSize(body.width) || !isPixelSize(body.height)) {
    return badRequest(req, res, D, EVENT_MESSAGES.photoUploadInvalid);
  }

  const position = parsePosition(body.latitude, body.longitude);
  if (!position.ok) return badRequest(req, res, D, EVENT_MESSAGES.photoPositionInvalid);
  const takenAt = parseDateTime(body.takenAt);
  if (!takenAt.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
  // Without GPS the uploader may say which country it is
  const chosenCountry = await parseOptionalCountry(body.countryCode);
  if (!chosenCountry.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);

  const checked = await checkUploadedFiles({ mapId: map.id, photoId, variants, userId: req.user.id });
  if (checked.status) {
    // Nothing from a failed upload is kept
    await deleteStoredObjects(variants.map((v) => v.key).filter((k) => typeof k === 'string' && k.startsWith(photoKeyFolder({ mapId: map.id, photoId }))));
    return sendMessageResponse(res, checked.status, checked.message);
  }

  const hasGps = position.latitude !== null;
  const countryCode = (hasGps ? countryAtPosition(position.latitude, position.longitude) : null) ?? chosenCountry.value ?? null;
  const landmarkMatches = hasGps
    ? matchLandmarks(position, await findLandmarksInBox(boundingBox(position.latitude, position.longitude)))
    : [];

  await createPhotoInDB({
    photo: {
      id: photoId,
      mapId: map.id,
      uploaderId: req.user.id,
      tripId,
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
  });
  logEvent(createPhotoEvent({ user: req.user, action: 'Create Success', id: photoId, detail: `map=${map.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { photo: await photoDetailView(await findPhotoDetail(photoId), role) });
});

// Lists

/** Shared by the map list and the share-code list. */
export async function photoPage({ query, mapId, tripId, role }) {
  const country = query.country;
  if (country !== undefined && !(await isKnownCountry(country))) return { error: EVENT_MESSAGES.countryNotFound };
  const filterTrip = tripId ?? query.tripId;
  if (filterTrip !== undefined && !isUuid(filterTrip)) return { error: EVENT_MESSAGES.tripNotFound };
  if (query.cursor !== undefined && !isUuid(query.cursor)) return { error: EVENT_MESSAGES.malformedData };
  const limit = clampInt(query.limit, { min: 1, max: PAGE_MAX, fallback: PAGE_DEFAULT });

  const rows = await findPhotosPage({
    mapId,
    tripId: filterTrip,
    countryCode: country,
    includeHidden: canEdit(role),
    cursor: query.cursor,
    limit,
  });
  const page = rows.slice(0, limit);
  return {
    photos: await Promise.all(visiblePhotos(page, role).map((p) => photoListItem(p, role))),
    nextCursor: rows.length > limit ? page[page.length - 1].id : null,
  };
}

export const getMapPhotosHandler = handler(D, 'Get map photos', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const result = await photoPage({ query: req.query || {}, mapId: map.id, role });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// Trip-only members reach a trip's photos here (they can't list the map)
export const getTripPhotosHandler = handler(D, 'Get trip photos', async (req, res) => {
  const { trip, role } = await loadTrip(req, req.params.tripId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.tripNotFound);
  const result = await photoPage({ query: req.query || {}, mapId: trip.mapId, tripId: trip.id, role });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// One photo

export const getPhotoHandler = handler(D, 'Get photo', async (req, res) => {
  const { photo, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
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
    data.countryCode = country.value;
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
    await updatePhotoInDB(photo.id, data);
    // A photo taken there proves a visit, as it does at upload
    if (data.countryCode) await createMissingVisits(photo.mapId, [data.countryCode], 'PHOTO');
    logEvent(createPhotoEvent({ user: req.user, action: 'Update Success', id: photo.id, detail: Object.keys(data).join(',') }));
  }
  return sendDataResponse(res, 200, { photo: await photoDetailView(await findPhotoDetail(photo.id), role) });
});

export const deletePhotoHandler = handler(D, 'Delete photo', async (req, res) => {
  const { photo, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) return notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
  if (!canEdit(role)) return forbidden(req, res, D);

  // Rows first: a file still referenced by a PhotoVariant can't be removed
  const keys = await findPhotoFileKeys(photo.id);
  await deletePhotoInDB(photo.id);
  await deleteStoredObjects(keys);
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
  const { landmarkId } = req.body || {};
  if (!isUuid(landmarkId) || !(await findLandmarkById(landmarkId))) {
    return badRequest(req, res, D, EVENT_MESSAGES.landmarkNotFound);
  }
  await upsertPhotoLandmarkInDB(loaded.photo.id, landmarkId);
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
