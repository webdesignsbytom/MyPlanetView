// Mock mode only. Moments as the server shapes, checks and lists them (docs/API.md
// "Moments"; server/src/controllers/moments.js, utils/moments.js and utils/access.js).
import { serverText } from '@/utils/regex/regex';
import { isMomentKind, MOMENT_PAGE_DEFAULT, MOMENT_PAGE_MAX, MOMENT_PHOTOS_MAX, MOMENT_PLACE_MAX, MOMENT_TEXT_MAX, MOMENT_TITLE_MAX } from '@/utils/moments/momentKinds';
import { compareMoments, momentCursor, parseMomentCursor, parseMomentDate } from '@/utils/moments/momentDates';
import { getDb } from './store';
import { atLeast, countryExists, landmarkById, photoThumbUrl } from './views';
import { landmarkPlace, placeOnMap } from '@/utils/map/ukNations';
import { parseMomentSpot, spotFitsPlace, spotView } from './momentSpots';

// The server's EVENT_MESSAGES
export const MOMENT_MESSAGES = {
  notFound: "That moment doesn't exist, or it hasn't been shared with you.",
  kind: 'Choose what kind of moment it is from the list.',
  title: 'Give the moment a title of 1 to 120 characters.',
  text: "A moment's title, story and place name must be text.",
  date: "A moment's date is a year (2019), a month (2019-06) or a day (2019-06-14), from 1800 to 2200, with DAY, MONTH or YEAR saying how much of it is known. Leave it empty for an undated note.",
  landmarkWrongCountry: "That landmark isn't in the moment's country.",
  spot: 'A pin needs a latitude from -90 to 90 and a longitude from -180 to 180, and "shared" is true or false.',
  spotWrongCountry: "That spot isn't in the moment's country. Move the pin, or take it off.",
  photos: 'Choose up to 20 photos, each from this map.',
  photosNotOnTrip: 'You can only choose photos from this trip.',
  tripChangeNeedsMap: "Only the map's owner and its editors can move a moment to another trip.",
  countryNotFound: "That country isn't on the map.",
  landmarkNotFound: "That landmark doesn't exist.",
  tripNotFound: "That trip doesn't exist, or it hasn't been shared with you.",
  mapNotFound: "That map doesn't exist, or it hasn't been shared with you.",
  travellersNotOnMap: "Every traveller must be one of this map's travellers.",
  malformed: 'Data incorrectly formatted or malformed request',
};

// As the server's sanitizeText: tags and control characters gone, trimmed, cut; null when empty
export const sanitizeText = (value, maxLength) => (value == null ? null : serverText(value).slice(0, maxLength) || null);

/** Viewers never see hidden moments (as hidden photos). */
export const canSeeMoment = (role, moment) => atLeast(role, 'VIEWER') && (!moment.hidden || atLeast(role, 'EDITOR'));

/**
 * As the server's canSeeMomentPhoto: someone with no role on the map sees only the
 * photos of the trip they came through (`trip: { id, role }`); hidden photos only show to
 * an editor of the map, or of the trip for the trip's own photos.
 */
export function canSeeMomentPhoto(photo, { mapRole = null, trip = null } = {}) {
  if (!photo) return false;
  const onTrip = Boolean(trip?.id) && photo.tripId === trip.id;
  if (!atLeast(mapRole, 'VIEWER') && !(onTrip && atLeast(trip.role, 'VIEWER'))) return false;
  return !photo.hidden || atLeast(mapRole, 'EDITOR') || (onTrip && atLeast(trip.role, 'EDITOR'));
}

/** Which photos a writer may attach: a map editor any (null), anyone else only the moment's trip's. */
export const momentPhotoScope = (mapRole, momentTripId) => (atLeast(mapRole, 'EDITOR') ? null : momentTripId ?? null);

/** One moment as the API answers it: a landmark is its id and name; its own pin (`spot`) per spotView. */
export function momentView(moment, { role, photoAccess }) {
  const db = getDb();
  const position = (id) => db.travellers.find((t) => t.id === id)?.position ?? 0;
  const landmark = landmarkById(moment.landmarkId);
  return {
    id: moment.id,
    kind: moment.kind,
    title: moment.title,
    text: moment.text,
    happenedOn: moment.happenedOn,
    datePrecision: moment.datePrecision,
    countryCode: moment.countryCode,
    landmark: landmark ? { id: landmark.id, name: landmark.name } : null,
    placeName: moment.placeName,
    spot: spotView(moment, { canEdit: atLeast(role, 'EDITOR') }),
    tripId: moment.tripId,
    travellerIds: [...moment.travellerIds].sort((a, b) => position(a) - position(b)),
    photos: moment.photoIds
      .map((id) => db.photos.find((p) => p.id === id))
      .filter((photo) => canSeeMomentPhoto(photo, photoAccess))
      .map((photo) => ({ id: photo.id, thumbUrl: photoThumbUrl(photo) })),
    ...(atLeast(role, 'EDITOR') ? { hidden: moment.hidden } : {}),
    createdAt: moment.createdAt,
  };
}

const clampLimit = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(MOMENT_PAGE_MAX, Math.max(1, n)) : MOMENT_PAGE_DEFAULT;
};

/**
 * One page of a map's moments, as the server's momentPage: date order, oldest first,
 * undated last (then by id); `country`, `tripId` (`tripId` here wins over the query's),
 * `cursor` and `limit` from the query. Below editor, hidden ones are left out.
 * -> `{ moments, nextCursor }` or `{ error }`
 */
export function momentPage({ query = {}, mapId, tripId, role, photoAccess }) {
  const country = query.country;
  if (country !== undefined && !countryExists(country)) return { error: MOMENT_MESSAGES.countryNotFound };
  const filterTrip = tripId ?? query.tripId;
  if (filterTrip !== undefined && !filterTrip) return { error: MOMENT_MESSAGES.tripNotFound };
  const cursor = parseMomentCursor(query.cursor);
  if (!cursor.ok) return { error: MOMENT_MESSAGES.malformed };
  const limit = clampLimit(query.limit);

  const list = getDb()
    .moments.filter(
      (m) =>
        m.mapId === mapId &&
        (!filterTrip || m.tripId === filterTrip) &&
        (!country || m.countryCode === country) &&
        canSeeMoment(role, m),
    )
    .sort(compareMoments);
  const after = cursor.value ? list.filter((m) => compareMoments(m, cursor.value) > 0) : list;
  const page = after.slice(0, limit);
  return {
    moments: page.map((m) => momentView(m, { role, photoAccess })),
    nextCursor: after.length > limit ? momentCursor(page[page.length - 1]) : null,
  };
}

const isTextOrNull = (value) => value === null || typeof value === 'string';
const isSubsetOf = (ids, allowed) => Array.isArray(ids) && new Set(ids).size === ids.length && ids.every((id) => allowed.includes(id));

/**
 * As the server's parseMoment: a moment from a request body; `partial` for PATCH (missing
 * fields stay; `current` is the stored moment). `photoScope` is the trip a writer's
 * photos must be on (a trip-only editor), or null. -> `{ value: { data, travellerIds?,
 * photoIds? } }` or `{ error }`
 */
/**
 * A moment's pin from a request body, once parseMoment has its place (`countryCode`, the
 * new or the current one), as the server: in that place, and a pinned moment moved to
 * another country needs its pin moved or taken off. -> `{ data }` (the fields to change,
 * none when the pin's left as is) or `{ error }`
 */
export async function parseMomentSpotFor(body, { countryCode, current = null }) {
  const spot = parseMomentSpot(body.spot);
  if (!spot.ok) return { error: MOMENT_MESSAGES.spot };
  if (spot.value) {
    if (spot.value.latitude !== null && !(await spotFitsPlace(spot.value, countryCode))) return { error: MOMENT_MESSAGES.spotWrongCountry };
    return { data: spot.value };
  }
  if (current?.latitude != null && countryCode !== current.countryCode && !(await spotFitsPlace(current, countryCode))) {
    return { error: MOMENT_MESSAGES.spotWrongCountry };
  }
  return { data: {} };
}

export function parseMoment(body, { partial = false, current = null, mapId, photoScope = null }) {
  const db = getDb();
  const data = {};
  if (!partial || body.kind !== undefined) {
    if (!isMomentKind(body.kind)) return { error: MOMENT_MESSAGES.kind };
    data.kind = body.kind;
  }
  if (!partial || body.title !== undefined) {
    const title = typeof body.title === 'string' ? sanitizeText(body.title, MOMENT_TITLE_MAX) : null;
    if (!title) return { error: MOMENT_MESSAGES.title };
    data.title = title;
  }
  for (const [field, max] of [
    ['text', MOMENT_TEXT_MAX],
    ['placeName', MOMENT_PLACE_MAX],
  ]) {
    if (body[field] === undefined) continue;
    if (!isTextOrNull(body[field])) return { error: MOMENT_MESSAGES.text };
    data[field] = sanitizeText(body[field], max);
  }

  const date = parseMomentDate(body.happenedOn, body.datePrecision);
  if (!date.ok) return { error: MOMENT_MESSAGES.date };
  if (date.value) Object.assign(data, date.value);

  // Places as the map keeps them (as the server): on a map that splits the UK, a UK landmark
  // is in its nation, and a nation is the UK on one that doesn't
  const splitUk = Boolean(getDb().maps.find((m) => m.id === mapId)?.splitUk);
  if (!partial || body.countryCode !== undefined) {
    if (typeof body.countryCode !== 'string' || !countryExists(body.countryCode)) return { error: MOMENT_MESSAGES.countryNotFound };
    data.countryCode = placeOnMap(body.countryCode, splitUk);
    if (partial && data.countryCode !== current?.countryCode) data.ukNation = null;
  }
  const countryCode = data.countryCode ?? current?.countryCode;
  if (body.landmarkId !== undefined) {
    if (body.landmarkId === null || body.landmarkId === '') data.landmarkId = null;
    else {
      const landmark = landmarkById(body.landmarkId);
      if (!landmark) return { error: MOMENT_MESSAGES.landmarkNotFound };
      if (landmarkPlace(landmark, splitUk) !== countryCode) return { error: MOMENT_MESSAGES.landmarkWrongCountry };
      data.landmarkId = landmark.id;
    }
  } else if (current?.landmarkId && countryCode !== current.countryCode) {
    const landmark = landmarkById(current.landmarkId);
    if (landmark && landmarkPlace(landmark, splitUk) !== countryCode) return { error: MOMENT_MESSAGES.landmarkWrongCountry };
  }

  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') return { error: MOMENT_MESSAGES.malformed };
    data.hidden = body.hidden;
  }

  const value = { data };
  if (body.travellerIds !== undefined) {
    const mapTravellers = db.travellers.filter((t) => t.mapId === mapId).map((t) => t.id);
    if (!isSubsetOf(body.travellerIds, mapTravellers)) return { error: MOMENT_MESSAGES.travellersNotOnMap };
    value.travellerIds = body.travellerIds;
  }
  if (body.photoIds !== undefined) {
    const ids = body.photoIds;
    if (!Array.isArray(ids) || ids.length > MOMENT_PHOTOS_MAX || !ids.every((id) => typeof id === 'string' && id) || new Set(ids).size !== ids.length) {
      return { error: MOMENT_MESSAGES.photos };
    }
    const found = db.photos.filter((p) => p.mapId === mapId && ids.includes(p.id));
    if (found.length !== ids.length) return { error: MOMENT_MESSAGES.photos };
    if (photoScope && found.some((p) => p.tripId !== photoScope)) return { error: MOMENT_MESSAGES.photosNotOnTrip };
    value.photoIds = ids;
  }
  return { value };
}
