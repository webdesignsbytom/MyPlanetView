import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';

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
 * One page of a map's (or trip's) photos, newest first.
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
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

/**
 * Enough to decide the caller's role on a photo: the photo, its map's owner, and the
 * caller's own map and trip memberships, read side by side (one round trip, not a
 * nested read three levels deep). Memberships are read only when there's a user: a
 * filter with `userId: undefined` means no filter, and an anonymous caller would get
 * the first member's role.
 * -> `{ id, mapId, tripId, hidden, map: { ownerId, members }, trip: { members } | null }`, or null
 */
export const findPhotoAccess = async (photoId, userId) => {
  const ofPhoto = { photos: { some: { id: photoId } } };
  const [photo, map, mapMember, tripMember] = await Promise.all([
    prisma.photo.findUnique({ where: { id: photoId }, select: { id: true, mapId: true, tripId: true, hidden: true } }),
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
 * PhotoVariants, the country marked visited, GPS landmark suggestions. One transaction.
 */
export const createPhotoInDB = ({ photo, variants, landmarkMatches }) =>
  prisma.$transaction(async (tx) => {
    for (const v of variants) {
      await tx.mediaItem.update({ where: { id: v.mediaId }, data: { bytes: v.bytes, contentType: v.contentType } });
    }
    await tx.photo.create({
      data: {
        ...photo,
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
 * Change a photo; a new country counts as visited on its map (as at upload). One
 * transaction, so the photo never moves without its visit.
 */
export const updatePhotoInDB = (photoId, data) => {
  const select = { id: true, mapId: true };
  if (!data.countryCode) return prisma.photo.update({ where: { id: photoId }, data, select });
  return prisma.$transaction(async (tx) => {
    const photo = await tx.photo.update({ where: { id: photoId }, data, select });
    await createMissingVisits(photo.mapId, [data.countryCode], 'PHOTO', tx);
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
