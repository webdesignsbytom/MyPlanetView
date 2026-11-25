// Slideshows of chosen photos, shared by a link of their own (docs/API.md "Photo slideshows").
// Thin Prisma queries; the rules are utils/photoShows.js.
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { generateShareCode } from '../utils/shareCodes.js';

const SHOW_SELECT = { id: true, mapId: true, code: true, title: true, photoIds: true, seconds: true, createdById: true, createdAt: true, updatedAt: true };

// A write with a new code, tried again on the (unlikely) clash with another show's
async function withFreshCode(write) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await write(generateShareCode());
    } catch (err) {
      const clash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && String(err.meta?.target).includes('code');
      if (!clash) throw err;
    }
  }
  throw new Error('Could not make a unique slideshow code');
}

// What a show can hold when it's made: the map's own photos and videos, not hidden
const choosableWhere = (mapId, photoIds) => ({ id: { in: photoIds }, mapId, hidden: false });

/** How many of `photoIds` a show on this map can hold. */
export const countChoosablePhotos = (mapId, photoIds) => prisma.photo.count({ where: choosableWhere(mapId, photoIds) });

/**
 * Of `photoIds`, those a viewer may see now: on the map, not hidden, and a video only once
 * Stream has converted it (as a share link's lists: domain/photos.js photoListWhere).
 */
export const findVisibleShowPhotoIds = async (mapId, photoIds) =>
  (
    await prisma.photo.findMany({
      where: { id: { in: photoIds }, mapId, hidden: false, OR: [{ kind: 'PHOTO' }, { videoState: 'READY' }] },
      select: { id: true },
    })
  ).map((photo) => photo.id);

/**
 * A show made, unless the map has `cap` already (counted with the map's row locked, as every
 * cap is). -> `{ show }`, or `{ tooMany: true }`
 */
export const createPhotoShowInDB = ({ mapId, title, photoIds, seconds, createdById, cap }) =>
  withFreshCode((code) =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;
      if ((await tx.photoShow.count({ where: { mapId } })) >= cap) return { tooMany: true };
      return { show: await tx.photoShow.create({ data: { mapId, code, title, photoIds, seconds, createdById }, select: SHOW_SELECT }) };
    }),
  );

export const findPhotoShowById = (id) => prisma.photoShow.findUnique({ where: { id }, select: SHOW_SELECT });

export const findPhotoShowByCode = (code) => prisma.photoShow.findUnique({ where: { code }, select: SHOW_SELECT });

/** A map's shows, newest first. */
export const findPhotoShowsForMap = (mapId) =>
  prisma.photoShow.findMany({ where: { mapId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: SHOW_SELECT });

/** Its title, seconds or photos changed (only what `data` has). */
export const updatePhotoShowInDB = (id, data) => prisma.photoShow.update({ where: { id }, data, select: SHOW_SELECT });

/** A new link: a new code, so the old link finds nothing. */
export const resetPhotoShowCodeInDB = (id) =>
  withFreshCode((code) => prisma.photoShow.update({ where: { id }, data: { code }, select: SHOW_SELECT }));

export const deletePhotoShowInDB = (id) => prisma.photoShow.delete({ where: { id } });
