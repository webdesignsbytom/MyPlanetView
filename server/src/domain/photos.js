import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';
import { UK, isUkNation } from '../utils/ukNations.js';
import { POSITION_FIELD, POSITION_STEP, positionBetween, positionFirst } from '../utils/photoOrder.js';
import { checkCountryCap, checkStorageCap, checkVideoCap } from '../utils/planLimits.js';
import { planOf } from '../utils/constants/plans.js';

// Photos, their stored sizes and landmark matches

const variantKeys = { select: { size: true, width: true, height: true, media: { select: { key: true } } } };

const PHOTO_LIST_SELECT = {
  id: true,
  mapId: true,
  tripId: true,
  countryCode: true,
  kind: true,
  durationS: true,
  // A video's Stream id and state (views.js signs its playback links; never sent as is)
  streamUid: true,
  videoState: true,
  caption: true,
  takenAt: true,
  shotAt: true,
  width: true,
  height: true,
  hidden: true,
  createdAt: true,
  variants: { where: { size: 'THUMB' }, ...variantKeys },
  landmarks: { select: { confirmed: true, landmark: { select: { id: true, name: true } } } },
};

/**
 * The order a list is shown in: a trip's photos in the trip's gallery order, a
 * country's (or the unplaced ones) in that gallery's order, and the whole map's (the
 * hover postcards) newest upload first. `order: 'shot'` is the slideshows' order
 * instead, oldest taken first, for any of them; a landmark's photos have no gallery, so
 * they're always in that order (the stamp's own: its earliest photo first). Each ends on
 * the id, so the order is total and pages by cursor.
 */
const listOrder = ({ tripId, countryCode, unplaced, landmarkId, order }) => {
  if (order === 'shot' || landmarkId) return [{ shotAt: 'asc' }, { id: 'asc' }];
  if (tripId) return [{ tripPosition: 'asc' }, { id: 'asc' }];
  if (unplaced || countryCode) return [{ countryPosition: 'asc' }, { id: 'asc' }];
  return [{ createdAt: 'desc' }, { id: 'desc' }];
};

// The slideshows' lists: the DISPLAY copy too (a video's playback link comes from Stream);
// the year recap's highlights too (domain/recaps.js)
export const DISPLAY_LIST_SELECT = {
  ...PHOTO_LIST_SELECT,
  variants: { where: { size: { in: ['THUMB', 'DISPLAY'] } }, ...variantKeys },
};

// The download lists (`best=1`, editors only): the best copy kept too, with its type and
// size, so the browser can fetch and zip it (the ORIGINAL, or an Economy map's PRINT copy)
const BEST_LIST_SELECT = {
  ...PHOTO_LIST_SELECT,
  variants: {
    where: { size: { in: ['THUMB', 'ORIGINAL', 'PRINT'] } },
    select: { size: true, width: true, height: true, media: { select: { key: true, contentType: true, bytes: true } } },
  },
};

const listSelect = ({ withDisplay, withBest }) =>
  withBest ? BEST_LIST_SELECT : withDisplay ? DISPLAY_LIST_SELECT : PHOTO_LIST_SELECT;

const photoListWhere = ({ mapId, tripId, countryCode, unplaced, landmarkId, includeHidden }) => ({
  ...(mapId ? { mapId } : {}),
  ...(tripId ? { tripId } : {}),
  // Unplaced: no country, or on a map that splits the UK, in the UK with its nation not
  // chosen yet (utils/ukNations.js)
  ...(unplaced
    ? { AND: [{ OR: [{ countryCode: null }, { countryCode: UK, map: { is: { splitUk: true } } }] }] }
    : countryCode
      ? { countryCode }
      : {}),
  // A landmark's photos: those confirmed as it, whichever country they're in (a border photo)
  ...(landmarkId ? { landmarks: { some: { landmarkId, confirmed: true } } } : {}),
  // Below editor: nothing hidden, and a video only once Stream has converted it
  ...(includeHidden ? {} : { hidden: false, OR: [{ kind: 'PHOTO' }, { videoState: 'READY' }] }),
});

/**
 * One page of a map's (or trip's) photos, in the gallery's order (listOrder).
 * `cursor` is the last photo id of the previous page. `unplaced` keeps only the photos
 * with no country (no location in the file and none chosen, or a location at sea);
 * `landmarkId` only those confirmed as that landmark.
 * `withDisplay` adds the DISPLAY copy (the slideshows show it, not the thumbnail);
 * `withBest` the best copy kept, with its type and size (the download lists).
 */
export const findPhotosPage = ({
  mapId,
  tripId,
  countryCode,
  unplaced = false,
  landmarkId,
  includeHidden,
  cursor,
  limit,
  order,
  withDisplay = false,
  withBest = false,
}) =>
  prisma.photo.findMany({
    where: photoListWhere({ mapId, tripId, countryCode, unplaced, landmarkId, includeHidden }),
    select: listSelect({ withDisplay, withBest }),
    orderBy: listOrder({ tripId, countryCode, unplaced, landmarkId, order }),
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

/**
 * Every id a list holds, in no particular order (a shuffled slideshow shuffles them and
 * pages through the shuffled list: `findPhotosByIds`). Ids only, so even a 20,000-photo
 * map is one small index read.
 */
export const findPhotoIdsForList = async (filters) =>
  (await prisma.photo.findMany({ where: photoListWhere(filters), select: { id: true } })).map((p) => p.id);

/** Some photos as list items, in the order of `ids` (the shuffled slideshow's pages). */
export const findPhotosByIds = async (ids, { withDisplay = false, withBest = false } = {}) => {
  const rows = await prisma.photo.findMany({
    where: { id: { in: ids } },
    select: listSelect({ withDisplay, withBest }),
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
};

// Gallery order (utils/photoOrder.js). A photo's galleries: its country's on its map
// (the unplaced photos, with no country, are one gallery), and its trip's.

const galleryWhere = (gallery, { mapId, countryCode, tripId }) =>
  gallery === 'trip' ? { tripId } : { mapId, countryCode: countryCode ?? null };

const galleryOrder = (field) => [{ [field]: 'asc' }, { id: 'asc' }];

/** The position for a photo going first in a gallery (leaving `exceptId` out). */
async function firstPosition(tx, gallery, scope, exceptId) {
  const field = POSITION_FIELD[gallery];
  const first = await tx.photo.findFirst({
    where: { ...galleryWhere(gallery, scope), ...(exceptId ? { id: { not: exceptId } } : {}) },
    orderBy: galleryOrder(field),
    select: { [field]: true },
  });
  return positionFirst(first ? first[field] : null);
}

// Renumber a gallery POSITION_STEP apart, keeping its order (when two neighbours have
// no room left between them). One statement per gallery kind: a column name can't be
// a query parameter.
function renumberGallery(tx, gallery, { mapId, countryCode, tripId }) {
  if (gallery === 'trip') {
    return tx.$executeRaw`
      UPDATE "photo" AS p SET "tripPosition" = ranked.rank * ${POSITION_STEP}
      FROM (
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "tripPosition", "id") AS rank
        FROM "photo" WHERE "tripId" = ${tripId}
      ) AS ranked
      WHERE p."id" = ranked."id"`;
  }
  const country = countryCode ? Prisma.sql`"countryCode" = ${countryCode}` : Prisma.sql`"countryCode" IS NULL`;
  return tx.$executeRaw`
    UPDATE "photo" AS p SET "countryPosition" = ranked.rank * ${POSITION_STEP}
    FROM (
      SELECT "id", ROW_NUMBER() OVER (ORDER BY "countryPosition", "id") AS rank
      FROM "photo" WHERE "mapId" = ${mapId} AND ${country}
    ) AS ranked
    WHERE p."id" = ranked."id"`;
}

/**
 * Move a photo within one of its galleries: straight after `afterId`, or first when
 * it's null. Only the photo's own position changes (halfway to its new neighbours),
 * unless they have no room left between them: then the gallery is renumbered first.
 * One transaction. `photo` is `{ id, mapId, countryCode, tripId }`.
 * -> `{ moved: true }`, or `{ targetGone: true }` when `afterId` isn't in that gallery.
 */
export const movePhotoInDB = ({ photo, gallery, afterId }) =>
  prisma.$transaction(async (tx) => {
    const field = POSITION_FIELD[gallery];
    const others = { ...galleryWhere(gallery, photo), id: { not: photo.id } };

    const neighbours = async () => {
      const before = afterId
        ? await tx.photo.findFirst({ where: { AND: [others, { id: afterId }] }, select: { id: true, [field]: true } })
        : null;
      if (afterId && !before) return null;
      // The photo that now follows it: the first one after `before` in the gallery's order
      const next = await tx.photo.findFirst({
        where: before
          ? { AND: [others, { OR: [{ [field]: { gt: before[field] } }, { [field]: before[field], id: { gt: before.id } }] }] }
          : others,
        orderBy: galleryOrder(field),
        select: { [field]: true },
      });
      return { before: before ? before[field] : null, after: next ? next[field] : null };
    };

    let around = await neighbours();
    if (!around) return { targetGone: true };
    let position = positionBetween(around.before, around.after);
    if (position === null) {
      await renumberGallery(tx, gallery, photo);
      around = await neighbours();
      position = positionBetween(around.before, around.after);
    }
    await tx.photo.update({ where: { id: photo.id }, data: { [field]: position } });
    return { moved: true };
  });

/**
 * Enough to decide the caller's role on a photo: the photo, its map's owner, and the
 * caller's own map and trip memberships, read side by side (one round trip, not a
 * nested read three levels deep). Memberships are read only when there's a user: a
 * filter with `userId: undefined` means no filter, and an anonymous caller would get
 * the first member's role.
 * -> `{ id, mapId, tripId, countryCode, hidden, map: { ownerId, members }, trip: { members } | null }`, or null
 */
export const findPhotoAccess = async (photoId, userId) => {
  const ofPhoto = { photos: { some: { id: photoId } } };
  const [photo, map, mapMember, tripMember] = await Promise.all([
    prisma.photo.findUnique({
      where: { id: photoId },
      select: { id: true, mapId: true, tripId: true, countryCode: true, hidden: true, kind: true, streamUid: true, videoState: true },
    }),
    prisma.travelMap.findFirst({ where: ofPhoto, select: { ownerId: true, splitUk: true } }),
    userId ? prisma.mapMember.findFirst({ where: { userId, map: ofPhoto }, select: { role: true } }) : null,
    userId ? prisma.tripMember.findFirst({ where: { userId, trip: ofPhoto }, select: { role: true } }) : null,
  ]);
  if (!photo || !map) return null;
  return {
    ...photo,
    map: { ...map, members: mapMember ? [mapMember] : [] },
    trip: photo.tripId ? { members: tripMember ? [tripMember] : [] } : null,
  };
};

export const findPhotoDetail = (photoId) =>
  prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      ...PHOTO_LIST_SELECT,
      latitude: true,
      longitude: true,
      uploaderId: true,
      variants: variantKeys,
      landmarks: {
        select: { confirmed: true, source: true, distanceM: true, landmark: { select: { id: true, name: true } } },
      },
      // The monthly themes it's entered in (docs/API.md, "Photo themes")
      themeEntries: { select: { theme: { select: { id: true, month: true, title: true, blurb: true } } } },
    },
  });

export const findPhotoById = (photoId) =>
  prisma.photo.findUnique({ where: { id: photoId }, select: { id: true } });

/** The MediaItem rows for an upload's keys (to check owner, resource and age). */
export const findMediaItemsByKeys = (keys) =>
  prisma.mediaItem.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, resource: true, ownerId: true, bytes: true, createdAt: true },
  });

// The plan's limits on a map's photos (utils/planLimits.js)

/**
 * Photos (or, with `kind: 'VIDEO'`, videos) per country on a map, hidden ones included:
 * `{ [countryCode]: n }` (one groupBy on the map's country index). Each has its own cap.
 */
export const countPhotosByCountry = async (mapId, { kind = 'PHOTO' } = {}) => {
  const rows = await prisma.photo.groupBy({
    by: ['countryCode'],
    where: { mapId, countryCode: { not: null }, kind },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.countryCode, row._count._all]));
};

/** A map's photos (or videos) in one country, hidden ones and everyone's uploads included. */
export const countPhotosInCountry = (mapId, countryCode, db = prisma, kind = 'PHOTO') =>
  db.photo.count({ where: { mapId, countryCode, kind } });

/** The bytes of every file of every photo on a map, and of every video (kept in Stream). */
export const sumStoredPhotoBytes = async (mapId, db = prisma) => {
  const [row] = await db.$queryRaw`
    SELECT (
      COALESCE((
        SELECT SUM(m."bytes")
        FROM "photo" AS p
        JOIN "photo_variant" AS v ON v."photoId" = p."id"
        JOIN "media_item" AS m ON m."id" = v."mediaId"
        WHERE p."mapId" = ${mapId}
      ), 0)
      + COALESCE((SELECT SUM("videoBytes") FROM "photo" WHERE "mapId" = ${mapId}), 0)
    )::float8 AS "bytes"`;
  return Number(row?.bytes ?? 0);
};

/**
 * The plan's caps, checked inside a photo write's transaction. The map's row is locked
 * first (FOR NO KEY UPDATE: two saves to one map queue up, so neither counts without the
 * other's photo; other writes' foreign-key checks aren't blocked). `limits` is
 * `{ planId, countryName }` (the owner's plan; the name of `countryCode`).
 * -> null, or the 409 message
 */
async function photoLimitProblem(tx, { mapId, countryCode, addingBytes = 0, limits }) {
  await tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;
  // Photos and videos each have their own cap per country; the ones with no country are
  // one more gallery under the same cap
  const kind = limits.kind ?? 'PHOTO';
  const count = await countPhotosInCountry(mapId, countryCode ?? null, tx, kind);
  const check = kind === 'VIDEO' ? checkVideoCap : checkCountryCap;
  const full = check({ count, planId: limits.planId, countryName: countryCode ? limits.countryName : null });
  if (full) return full;
  if (addingBytes > 0 && planOf(limits.planId).limits.storageCapBytes !== null) {
    return checkStorageCap({ storedBytes: await sumStoredPhotoBytes(mapId, tx), addingBytes, planId: limits.planId });
  }
  return null;
}

/**
 * Save a confirmed photo: sizes recorded on its MediaItems, the Photo and its
 * PhotoVariants (first in its country's gallery and its trip's), the country marked
 * visited, GPS landmark suggestions. One transaction. With `limits` (`{ planId,
 * countryName }`), the plan's caps are checked first in the same transaction, and a
 * photo over them isn't saved. -> `{ id }`, or `{ id: null, refused: message }`
 */
export const createPhotoInDB = ({ photo, variants, landmarkMatches, limits = null }) =>
  prisma.$transaction(async (tx) => {
    // The map's UK split as it is now, its row locked: if the split was turned off since this
    // photo was placed, a nation's photo goes to the UK remembering its nation, as turning it
    // off does (setMapSplitUk takes the same lock; 19 Nov 2026, the audit)
    const [map] = await tx.$queryRaw`SELECT "splitUk" FROM "travel_map" WHERE "id" = ${photo.mapId} FOR NO KEY UPDATE`;
    if (map && !map.splitUk && isUkNation(photo.countryCode)) photo = { ...photo, countryCode: UK, ukNation: photo.countryCode };
    if (limits) {
      // A video has no files here (it's in Stream): its own size counts instead
      const addingBytes = variants.reduce((sum, v) => sum + (Number(v.bytes) || 0), 0) + (Number(photo.videoBytes) || 0);
      const refused = await photoLimitProblem(tx, { mapId: photo.mapId, countryCode: photo.countryCode, addingBytes, limits });
      if (refused) return { id: null, refused };
    }
    for (const v of variants) {
      await tx.mediaItem.update({ where: { id: v.mediaId }, data: { bytes: v.bytes, contentType: v.contentType } });
    }
    // shotAt is always takenAt ?? createdAt (the slideshows' order)
    const now = new Date();
    await tx.photo.create({
      data: {
        ...photo,
        createdAt: now,
        shotAt: photo.takenAt ?? now,
        countryPosition: await firstPosition(tx, 'country', photo),
        tripPosition: photo.tripId ? await firstPosition(tx, 'trip', photo) : 0,
        variants: {
          create: variants.map((v) => ({ size: v.size, mediaId: v.mediaId, width: v.width, height: v.height })),
        },
        landmarks: {
          // A video never has a position, so never a GPS suggestion
          create: landmarkMatches.map((m) => ({
            landmarkId: m.landmarkId,
            mapId: photo.mapId,
            source: 'GPS',
            distanceM: m.distanceM,
            confirmed: false,
          })),
        },
      },
    });
    if (photo.countryCode) await createMissingVisits(photo.mapId, [photo.countryCode], 'PHOTO', tx);
    return { id: photo.id };
  });

/**
 * Change a photo. A new country counts as visited on its map (as at upload), and a
 * photo that lands in another gallery (a new country, no country, or a new trip) goes
 * first there, as a new upload does. One transaction, so the photo never moves without
 * its visit. With `limits` (`{ planId, countryName }` of the new country), a move into a
 * country that's full on the map is refused before anything changes.
 * -> `{ id, mapId }`, or `{ refused: message }`
 */
export const updatePhotoInDB = (photoId, data, { limits = null } = {}) => {
  const select = { id: true, mapId: true };
  const galleryMayChange = data.countryCode !== undefined || data.tripId !== undefined;
  // shotAt follows takenAt; a date taken away falls back to the upload time
  if (data.takenAt) data = { ...data, shotAt: data.takenAt };
  if (!galleryMayChange && data.takenAt !== null) return prisma.photo.update({ where: { id: photoId }, data, select });
  return prisma.$transaction(async (tx) => {
    const current = await tx.photo.findUnique({
      where: { id: photoId },
      select: { mapId: true, countryCode: true, tripId: true, createdAt: true },
    });
    if (data.takenAt === null) data = { ...data, shotAt: current.createdAt };
    if (!galleryMayChange) return tx.photo.update({ where: { id: photoId }, data, select });
    // Into another country, or out of every country (the ones with no country have a cap too)
    if (limits && data.countryCode !== undefined && data.countryCode !== current.countryCode) {
      const refused = await photoLimitProblem(tx, { mapId: current.mapId, countryCode: data.countryCode, limits });
      if (refused) return { refused };
    }
    const { createdAt: _createdAt, ...currentGallery } = current;
    const next = { ...currentGallery, ...data };
    const positions = {};
    if (data.countryCode !== undefined && data.countryCode !== current.countryCode) {
      positions.countryPosition = await firstPosition(tx, 'country', next, photoId);
    }
    if (data.tripId && data.tripId !== current.tripId) {
      positions.tripPosition = await firstPosition(tx, 'trip', next, photoId);
    }
    const photo = await tx.photo.update({ where: { id: photoId }, data: { ...data, ...positions }, select });
    if (data.countryCode) await createMissingVisits(photo.mapId, [data.countryCode], 'PHOTO', tx);
    // A trip's cover is one of its own photos: moving the cover off the trip clears it
    if (data.tripId !== undefined && current.tripId && data.tripId !== current.tripId) {
      await tx.trip.updateMany({ where: { id: current.tripId, coverPhotoId: photoId }, data: { coverPhotoId: null } });
    }
    return photo;
  });
};

export const deletePhotoInDB = (photoId) => prisma.photo.delete({ where: { id: photoId } });

// The stored files of some photos, in one query (a relation filter, not nested reads)
const photoFileKeys = async (photoWhere) =>
  (
    await prisma.mediaItem.findMany({ where: { photoVariant: { photo: photoWhere } }, select: { key: true } })
  ).map((item) => item.key);

export const findPhotoFileKeys = (photoId) => photoFileKeys({ id: photoId });

/** Every stored file of every photo a user uploaded, on any map (account deletion). */
export const findUploadedPhotoFiles = (userId) => photoFileKeys({ uploaderId: userId });

/** Every stored file of every photo on a map, or on several (read before deleting them). */
export const findMapPhotoKeys = (mapIds) => photoFileKeys({ mapId: Array.isArray(mapIds) ? { in: mapIds } : mapIds });

/** Every photo a user uploaded, on any map (account deletion; their files go after). */
export const deletePhotosByUploader = (userId) => prisma.photo.deleteMany({ where: { uploaderId: userId } });

/** How many photos a user uploaded to maps they don't own (GET /users/leaving-options). */
export const countPhotosOnOtherMaps = (userId) =>
  prisma.photo.count({ where: { uploaderId: userId, map: { ownerId: { not: userId } } } });

/**
 * Account deletion, leaving photos behind: every photo a user uploaded to a map they
 * don't own (only the maps in `mapIds`, when given) becomes that map's owner's (the
 * uploader's row cascades to their photos otherwise). One updateMany per map, in one
 * transaction. -> `{ count }`
 */
export const reassignUploadsToMapOwners = async (userId, mapIds) => {
  if (Array.isArray(mapIds) && !mapIds.length) return { count: 0 };
  const maps = await prisma.travelMap.findMany({
    where: {
      ownerId: { not: userId },
      photos: { some: { uploaderId: userId } },
      ...(Array.isArray(mapIds) ? { id: { in: mapIds } } : {}),
    },
    select: { id: true, ownerId: true },
  });
  if (!maps.length) return { count: 0 };
  const results = await prisma.$transaction(
    maps.map((m) => prisma.photo.updateMany({ where: { mapId: m.id, uploaderId: userId }, data: { uploaderId: m.ownerId } }))
  );
  return { count: results.reduce((sum, r) => sum + r.count, 0) };
};

// Landmark matches

/**
 * Match a photo to a landmark by hand (confirmed at once). An existing GPS suggestion
 * is confirmed instead; one already confirmed keeps its date. `photo` is `{ id, mapId }`.
 */
export const upsertPhotoLandmarkInDB = (photo, landmarkId) =>
  prisma.$transaction(async (tx) => {
    const key = { photoId_landmarkId: { photoId: photo.id, landmarkId } };
    const existing = await tx.photoLandmark.findUnique({ where: key, select: { confirmed: true } });
    if (!existing) {
      return tx.photoLandmark.create({
        data: { photoId: photo.id, landmarkId, mapId: photo.mapId, source: 'MANUAL', confirmed: true, confirmedAt: new Date() },
      });
    }
    if (existing.confirmed) return existing;
    return tx.photoLandmark.update({ where: key, data: { confirmed: true, confirmedAt: new Date() } });
  });

/** Confirm a GPS suggestion (stamping the passport). -> `{ count }`: 0 when there's no such match. */
export const confirmPhotoLandmarkInDB = async (photoId, landmarkId) => {
  const confirmed = await prisma.photoLandmark.updateMany({
    where: { photoId, landmarkId, confirmed: false },
    data: { confirmed: true, confirmedAt: new Date() },
  });
  if (confirmed.count) return confirmed;
  // Already confirmed is fine; no match at all is a 404
  return { count: await prisma.photoLandmark.count({ where: { photoId, landmarkId } }) };
};

export const deletePhotoLandmarkInDB = (photoId, landmarkId) =>
  prisma.photoLandmark.deleteMany({ where: { photoId, landmarkId } });

// Videos in Cloudflare Stream

/** A video's state, length or size, from a Stream notice. -> `{ count }` */
export const updateVideoByStreamUid = (streamUid, data) => prisma.photo.updateMany({ where: { streamUid }, data });

/** Which of these Stream ids a row points at (the daily clean-up deletes the rest). */
export const findStreamUidsIn = async (uids) =>
  new Set(
    (await prisma.photo.findMany({ where: { streamUid: { in: uids } }, select: { streamUid: true } })).map((p) => p.streamUid)
  );
