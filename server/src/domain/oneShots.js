// Life's One Shots ticked on a map (docs/API.md "Life's One Shots"): thin queries.
import { prisma } from '../prisma.js';
import { createMissingVisits } from './maps.js';

const ONE_SHOT_SELECT = {
  id: true,
  itemKey: true,
  seenOn: true,
  datePrecision: true,
  countryCode: true,
  notes: true,
  source: true,
  createdAt: true,
  photo: { select: { id: true, hidden: true, mapId: true } },
  travellers: { select: { travellerId: true } },
};

/**
 * A map's ticks, the latest seen first (undated last), each with its photo (`{ id, hidden }`)
 * and the travellers on it.
 */
export const findOneShots = (mapId) =>
  prisma.oneShot.findMany({
    where: { mapId },
    select: ONE_SHOT_SELECT,
    orderBy: [{ seenOn: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });

/** The item keys ticked on a map (the badges count them). */
export const findOneShotKeys = async (mapId) => (await prisma.oneShot.findMany({ where: { mapId }, select: { itemKey: true } })).map((row) => row.itemKey);

/** One photo of a map, if it's there (a tick's picture must be the map's own). */
export const findMapPhotoForOneShot = (mapId, photoId) => prisma.photo.findFirst({ where: { id: photoId, mapId }, select: { id: true } });

/**
 * Tick an item, or change its tick, in one transaction: the fields given (`data`), the
 * travellers named (all of them, when `travellerIds` is given), and the place it was seen
 * marked visited (MANUAL; `place` null for none), as a "been here" landmark's is.
 * -> `{ oneShot, created }`
 */
export const saveOneShotInDB = ({ mapId, itemKey, data, travellerIds, userId, place }) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.oneShot.findUnique({ where: { mapId_itemKey: { mapId, itemKey } }, select: { id: true } });
    const row = existing
      ? await tx.oneShot.update({ where: { id: existing.id }, data, select: { id: true } })
      : await tx.oneShot.create({ data: { mapId, itemKey, createdById: userId, ...data }, select: { id: true } });
    if (travellerIds) {
      await tx.oneShotTraveller.deleteMany({ where: { oneShotId: row.id } });
      if (travellerIds.length) await tx.oneShotTraveller.createMany({ data: travellerIds.map((travellerId) => ({ oneShotId: row.id, travellerId })) });
    }
    if (place) await createMissingVisits(mapId, [place], 'MANUAL', tx);
    const oneShot = await tx.oneShot.findUnique({ where: { id: row.id }, select: ONE_SHOT_SELECT });
    return { oneShot, created: !existing };
  });

/** Take a tick off. -> how many went (0 or 1) */
export const deleteOneShotInDB = async (mapId, itemKey) => (await prisma.oneShot.deleteMany({ where: { mapId, itemKey } })).count;

/** "Your data": a map's ticks with everything on them, oldest first. */
export const findOneShotsForExport = (mapId) =>
  prisma.oneShot.findMany({
    where: { mapId },
    select: { itemKey: true, seenOn: true, datePrecision: true, countryCode: true, notes: true, source: true, photoId: true, createdAt: true, travellers: { select: { travellerId: true } } },
    orderBy: { createdAt: 'asc' },
  });
