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
 * `cursor` is the last photo id of the previous page.
 */
export const findPhotosPage = ({ mapId, tripId, countryCode, includeHidden, cursor, limit }) =>
  prisma.photo.findMany({
    where: {
      ...(mapId ? { mapId } : {}),
      ...(tripId ? { tripId } : {}),
      ...(countryCode ? { countryCode } : {}),
      ...(includeHidden ? {} : { hidden: false }),
    },
    select: PHOTO_LIST_SELECT,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

/** Enough to decide the caller's role on a photo. */
export const findPhotoAccess = (photoId, userId) =>
  prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      mapId: true,
      tripId: true,
      hidden: true,
      map: {
        select: {
          ownerId: true,
          ...(userId ? { members: { where: { userId }, select: { role: true } } } : {}),
        },
      },
      trip: userId ? { select: { members: { where: { userId }, select: { role: true } } } } : false,
    },
  });

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

/** The MediaItem rows for an upload's keys (to check owner and resource). */
export const findMediaItemsByKeys = (keys) =>
  prisma.mediaItem.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, resource: true, ownerId: true, bytes: true },
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

export const updatePhotoInDB = (photoId, data) =>
  prisma.photo.update({ where: { id: photoId }, data, select: { id: true, mapId: true } });

export const deletePhotoInDB = (photoId) => prisma.photo.delete({ where: { id: photoId } });

export const findPhotoFileKeys = async (photoId) =>
  (
    await prisma.photoVariant.findMany({ where: { photoId }, select: { media: { select: { key: true } } } })
  ).map((v) => v.media.key);

/** Every stored file of every photo a user uploaded (account deletion). */
export const findUploadedPhotoFiles = async (userId) => {
  const photos = await prisma.photo.findMany({
    where: { uploaderId: userId },
    select: { id: true, variants: { select: { media: { select: { key: true } } } } },
  });
  return { photoIds: photos.map((p) => p.id), keys: photos.flatMap((p) => p.variants.map((v) => v.media.key)) };
};

export const deletePhotosInDB = (photoIds) => prisma.photo.deleteMany({ where: { id: { in: photoIds } } });

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
