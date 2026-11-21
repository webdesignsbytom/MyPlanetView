// A map's own design (docs/API.md "Map designs"): thin queries
import { prisma } from '../prisma.js';

const DESIGN_SELECT = {
  shown: true,
  countryColours: true,
  namesColour: true,
  gridColour: true,
  picture: { select: { key: true } },
};

/** A map's design, or null when it has none. */
export const findMapDesign = (mapId) => prisma.mapDesign.findUnique({ where: { mapId }, select: DESIGN_SELECT });

/** The kinds of these place codes (unknown codes are simply missing). */
export const findPlaceKinds = (codes) =>
  codes.length ? prisma.country.findMany({ where: { code: { in: codes } }, select: { code: true, kind: true } }) : [];

/** Write some of a map's design, making it if it has none. -> the design */
export const saveMapDesignInDB = (mapId, data) =>
  prisma.mapDesign.upsert({ where: { mapId }, create: { mapId, ...data }, update: data, select: DESIGN_SELECT });

/** An upload's row, to check a picture before it's saved. */
export const findDesignUpload = (key) =>
  prisma.mediaItem.findUnique({
    where: { key },
    select: { id: true, key: true, resource: true, ownerId: true, createdAt: true },
  });

/**
 * Put a saved picture on a map's design (and show the design), in one transaction.
 * -> `{ design, oldKey }`: the picture it replaced, whose file the caller deletes after.
 * Two at once both keep their files; the one that lost is unused, and the daily clean-up
 * removes it.
 */
export const setDesignPictureInDB = ({ mapId, mediaId, bytes, contentType }) =>
  prisma.$transaction(async (tx) => {
    const before = await tx.mapDesign.findUnique({ where: { mapId }, select: { picture: { select: { id: true, key: true } } } });
    await tx.mediaItem.update({ where: { id: mediaId }, data: { bytes, contentType } });
    const design = await tx.mapDesign.upsert({
      where: { mapId },
      create: { mapId, pictureId: mediaId },
      update: { pictureId: mediaId, shown: true },
      select: DESIGN_SELECT,
    });
    const old = before?.picture;
    return { design, oldKey: old && old.id !== mediaId ? old.key : null };
  });

/** Take a map design's picture off. -> `{ design, oldKey }` (null when there was none) */
export const clearDesignPictureInDB = (mapId) =>
  prisma.$transaction(async (tx) => {
    const before = await tx.mapDesign.findUnique({ where: { mapId }, select: { picture: { select: { key: true } } } });
    if (!before) return { design: null, oldKey: null };
    const design = await tx.mapDesign.update({ where: { mapId }, data: { pictureId: null }, select: DESIGN_SELECT });
    return { design, oldKey: before.picture?.key ?? null };
  });

/** The design pictures' files of a map, or of several (read before deleting them). */
export const findMapDesignPictureKeys = async (mapIds) =>
  (
    await prisma.mediaItem.findMany({
      where: { usedAsMapDesign: { mapId: Array.isArray(mapIds) ? { in: mapIds } : mapIds } },
      select: { key: true },
    })
  ).map((item) => item.key);
