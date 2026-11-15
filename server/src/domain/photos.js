import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';
import { POSITION_FIELD, POSITION_STEP, positionBetween, positionFirst } from '../utils/photoOrder.js';

// Photos, their stored sizes and landmark matches

const variantKeys = { select: { size: true, width: true, height: true, media: { select: { key: true } } } };

const PHOTO_LIST_SELECT = {
  id: true,
  mapId: true,
  tripId: true,
  countryCode: true,
  caption: true,
  takenAt: true,
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
 * hover postcards) newest upload first. Each ends on the id, so the order is total and
 * pages by cursor.
 */
const listOrder = ({ tripId, countryCode, unplaced }) => {
  if (tripId) return [{ tripPosition: 'asc' }, { id: 'asc' }];
  if (unplaced || countryCode) return [{ countryPosition: 'asc' }, { id: 'asc' }];
  return [{ createdAt: 'desc' }, { id: 'desc' }];
};

/**
 * One page of a map's (or trip's) photos, in the gallery's order (listOrder).
 * `cursor` is the last photo id of the previous page. `unplaced` keeps only the photos
 * with no country (no location in the file and none chosen, or a location at sea).
 */
export const findPhotosPage = ({ mapId, tripId, countryCode, unplaced = false, includeHidden, cursor, limit }) =>
  prisma.photo.findMany({
    where: {
      ...(mapId ? { mapId } : {}),
      ...(tripId ? { tripId } : {}),
      ...(unplaced ? { countryCode: null } : countryCode ? { countryCode } : {}),
      ...(includeHidden ? {} : { hidden: false }),
    },
    select: PHOTO_LIST_SELECT,
    orderBy: listOrder({ tripId, countryCode, unplaced }),
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

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
      select: { id: true, mapId: true, tripId: true, countryCode: true, hidden: true },
    }),
    prisma.travelMap.findFirst({ where: ofPhoto, select: { ownerId: true } }),
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

/**
 * Save a confirmed photo: sizes recorded on its MediaItems, the Photo and its
 * PhotoVariants (first in its country's gallery and its trip's), the country marked
 * visited, GPS landmark suggestions. One transaction.
 */
export const createPhotoInDB = ({ photo, variants, landmarkMatches }) =>
  prisma.$transaction(async (tx) => {
    for (const v of variants) {
      await tx.mediaItem.update({ where: { id: v.mediaId }, data: { bytes: v.bytes, contentType: v.contentType } });
    }
    await tx.photo.create({
      data: {
        ...photo,
        countryPosition: await firstPosition(tx, 'country', photo),
        tripPosition: photo.tripId ? await firstPosition(tx, 'trip', photo) : 0,
        variants: {
          create: variants.map((v) => ({ size: v.size, mediaId: v.mediaId, width: v.width, height: v.height })),
        },
        landmarks: {
          create: landmarkMatches.map((m) => ({
            landmarkId: m.landmarkId,
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
 * its visit.
 */
export const updatePhotoInDB = (photoId, data) => {
  const select = { id: true, mapId: true };
  const galleryMayChange = data.countryCode !== undefined || data.tripId !== undefined;
  if (!galleryMayChange) return prisma.photo.update({ where: { id: photoId }, data, select });
  return prisma.$transaction(async (tx) => {
    const current = await tx.photo.findUnique({
      where: { id: photoId },
      select: { mapId: true, countryCode: true, tripId: true },
    });
    const next = { ...current, ...data };
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

// Landmark matches

export const upsertPhotoLandmarkInDB = (photoId, landmarkId) =>
  prisma.photoLandmark.upsert({
    where: { photoId_landmarkId: { photoId, landmarkId } },
    create: { photoId, landmarkId, source: 'MANUAL', confirmed: true },
    update: { confirmed: true },
    select: { confirmed: true, source: true, landmark: { select: { id: true, name: true } } },
  });

export const confirmPhotoLandmarkInDB = (photoId, landmarkId) =>
  prisma.photoLandmark.updateMany({ where: { photoId, landmarkId }, data: { confirmed: true } });

export const deletePhotoLandmarkInDB = (photoId, landmarkId) =>
  prisma.photoLandmark.deleteMany({ where: { photoId, landmarkId } });
