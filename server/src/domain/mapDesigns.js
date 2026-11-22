// A map's own designs, one per map style (docs/API.md "Map designs"): thin queries
import { prisma } from '../prisma.js';

const DESIGN_SELECT = {
  style: true,
  shown: true,
  countryColours: true,
  namesColour: true,
  gridColour: true,
  picture: { select: { key: true } },
};

/** A map's designs (one per style it has one for). */
export const findMapDesigns = (mapId) => prisma.mapDesign.findMany({ where: { mapId }, select: DESIGN_SELECT });

const one = (mapId, style) => ({ mapId_style: { mapId, style } });

/** The kinds of these place codes (unknown codes are simply missing). */
export const findPlaceKinds = (codes) =>
  codes.length ? prisma.country.findMany({ where: { code: { in: codes } }, select: { code: true, kind: true } }) : [];

/** Write some of a map's design for a style, making it if it has none. -> the design */
export const saveMapDesignInDB = (mapId, style, data) =>
  prisma.mapDesign.upsert({ where: one(mapId, style), create: { mapId, style, ...data }, update: data, select: DESIGN_SELECT });

/** An upload's row, to check a picture before it's saved. */
export const findDesignUpload = (key) =>
  prisma.mediaItem.findUnique({
    where: { key },
    select: { id: true, key: true, resource: true, ownerId: true, createdAt: true },
  });

/**
 * Put a saved picture on a map's design for a style (and show the design), in one transaction.
 * -> `{ design, oldKey }`: the picture it replaced, whose file the caller deletes after.
 * Two at once both keep their files; the one that lost is unused, and the daily clean-up
 * removes it.
 */
export const setDesignPictureInDB = ({ mapId, style, mediaId, bytes, contentType }) =>
  prisma.$transaction(async (tx) => {
    const before = await tx.mapDesign.findUnique({ where: one(mapId, style), select: { picture: { select: { id: true, key: true } } } });
    await tx.mediaItem.update({ where: { id: mediaId }, data: { bytes, contentType } });
    const design = await tx.mapDesign.upsert({
      where: one(mapId, style),
      create: { mapId, style, pictureId: mediaId },
      update: { pictureId: mediaId, shown: true },
      select: DESIGN_SELECT,
    });
    const old = before?.picture;
    return { design, oldKey: old && old.id !== mediaId ? old.key : null };
  });

/** Take the picture off a map's design for a style. -> `{ design, oldKey }` (null when there was none) */
export const clearDesignPictureInDB = (mapId, style) =>
  prisma.$transaction(async (tx) => {
    const before = await tx.mapDesign.findUnique({ where: one(mapId, style), select: { picture: { select: { key: true } } } });
    if (!before) return { design: null, oldKey: null };
    const design = await tx.mapDesign.update({ where: one(mapId, style), data: { pictureId: null }, select: DESIGN_SELECT });
    return { design, oldKey: before.picture?.key ?? null };
  });

/** The design pictures' files of a map (every style's), or of several (read before deleting them). */
export const findMapDesignPictureKeys = async (mapIds) =>
  (
    await prisma.mediaItem.findMany({
      where: { usedAsMapDesign: { mapId: Array.isArray(mapIds) ? { in: mapIds } : mapIds } },
      select: { key: true },
    })
  ).map((item) => item.key);
