import { prisma } from '../prisma.js';

// Moments: life events and notes on a map, with their travellers and photos
// (docs/API.md "Moments")

/**
 * Enough to decide the caller's role on a moment: the moment, its map's owner, and the
 * caller's own map and trip memberships, read side by side (as findPhotoAccess).
 * Memberships are read only when there's a user: a filter with `userId: undefined`
 * means no filter, and an anonymous caller would get the first member's role.
 * -> `{ id, mapId, tripId, countryCode, landmarkId, hidden, map: { ownerId, members }, trip: { members } | null }`, or null
 */
export const findMomentAccess = async (momentId, userId) => {
  const ofMoment = { moments: { some: { id: momentId } } };
  const [moment, map, mapMember, tripMember] = await Promise.all([
    prisma.moment.findUnique({
      where: { id: momentId },
      select: { id: true, mapId: true, tripId: true, countryCode: true, landmarkId: true, hidden: true },
    }),
    prisma.travelMap.findFirst({ where: ofMoment, select: { ownerId: true, splitUk: true } }),
    userId ? prisma.mapMember.findFirst({ where: { userId, map: ofMoment }, select: { role: true } }) : null,
    userId ? prisma.tripMember.findFirst({ where: { userId, trip: ofMoment }, select: { role: true } }) : null,
  ]);
  if (!moment || !map) return null;
  return {
    ...moment,
    map: { ...map, members: mapMember ? [mapMember] : [] },
    trip: moment.tripId ? { members: tripMember ? [tripMember] : [] } : null,
  };
};

const thumbOf = { where: { size: 'THUMB' }, select: { size: true, media: { select: { key: true } } } };

const MOMENT_SELECT = {
  id: true,
  mapId: true,
  kind: true,
  title: true,
  text: true,
  happenedOn: true,
  datePrecision: true,
  countryCode: true,
  // Never its coordinates
  landmark: { select: { id: true, name: true } },
  placeName: true,
  tripId: true,
  hidden: true,
  createdAt: true,
  travellers: { select: { travellerId: true }, orderBy: { traveller: { position: 'asc' } } },
  photos: {
    select: { photo: { select: { id: true, tripId: true, hidden: true, variants: thumbOf } } },
    orderBy: [{ position: 'asc' }, { photoId: 'asc' }],
  },
};

/** One moment as the views need it, or null. */
export const findMomentDetail = (momentId) => prisma.moment.findUnique({ where: { id: momentId }, select: MOMENT_SELECT });

/**
 * Keyset paging in the list's order, (happenedOn, id) with undated moments last: the
 * moments after `cursor` (`{ happenedOn: Date | null, id }`).
 */
const momentsAfter = ({ happenedOn, id }) =>
  happenedOn === null
    ? { happenedOn: null, id: { gt: id } }
    : { OR: [{ happenedOn: { gt: happenedOn } }, { happenedOn, id: { gt: id } }, { happenedOn: null }] };

/**
 * One page of a map's moments in date order, oldest first, undated last (on the
 * `[mapId, happenedOn]` and `[mapId, countryCode, happenedOn]` indexes). `tripId` and
 * `countryCode` filter; `includeHidden` for editors. Reads `limit + 1` to know if more
 * follow.
 */
export const findMomentsPage = ({ mapId, tripId, countryCode, includeHidden, cursor, limit }) =>
  prisma.moment.findMany({
    where: {
      mapId,
      ...(tripId ? { tripId } : {}),
      ...(countryCode ? { countryCode } : {}),
      ...(includeHidden ? {} : { hidden: false }),
      ...(cursor ? momentsAfter(cursor) : {}),
    },
    select: MOMENT_SELECT,
    orderBy: [{ happenedOn: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    take: limit + 1,
  });

/** Moments per country on a map, `{ [code]: n }` (one groupBy); hidden ones for editors only. */
export const countMomentsByCountry = async (mapId, { includeHidden = false } = {}) => {
  const rows = await prisma.moment.groupBy({
    by: ['countryCode'],
    where: { mapId, ...(includeHidden ? {} : { hidden: false }) },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.countryCode, row._count._all]));
};

/** Which of `photoIds` are on the map: `[{ id, tripId }]`. */
export const findMapPhotosByIds = (mapId, photoIds) =>
  photoIds.length ? prisma.photo.findMany({ where: { mapId, id: { in: photoIds } }, select: { id: true, tripId: true } }) : [];

/** A moment's photos in order, with each one's trip: `[{ photoId, tripId }]`. */
export const findMomentPhotoRefs = async (momentId) =>
  (
    await prisma.momentPhoto.findMany({
      where: { momentId },
      select: { photoId: true, photo: { select: { tripId: true } } },
      orderBy: [{ position: 'asc' }, { photoId: 'asc' }],
    })
  ).map((row) => ({ photoId: row.photoId, tripId: row.photo.tripId }));

/** Is `tripId` one of this map's own trips? */
export const isTripOnMap = async (mapId, tripId) =>
  Boolean(await prisma.trip.findFirst({ where: { id: tripId, mapId }, select: { id: true } }));

/** A new moment with its travellers and photos (in order), in one statement. -> `{ id }` */
export const createMomentInDB = ({ travellerIds = [], photoIds = [], ...data }) =>
  prisma.moment.create({
    data: {
      ...data,
      travellers: { create: travellerIds.map((travellerId) => ({ travellerId })) },
      photos: { create: photoIds.map((photoId, position) => ({ photoId, position })) },
    },
    select: { id: true },
  });

/**
 * Change a moment. `travellerIds` and `photoIds`, when given, replace its lists (photos
 * in that order). One transaction.
 */
export const updateMomentInDB = (momentId, data, { travellerIds, photoIds } = {}) =>
  prisma.$transaction(async (tx) => {
    // Always written, so updatedAt moves when only the lists change
    await tx.moment.update({ where: { id: momentId }, data: { ...data, updatedAt: new Date() } });
    if (travellerIds) {
      await tx.momentTraveller.deleteMany({ where: { momentId } });
      await tx.momentTraveller.createMany({ data: travellerIds.map((travellerId) => ({ momentId, travellerId })) });
    }
    if (photoIds) {
      await tx.momentPhoto.deleteMany({ where: { momentId } });
      await tx.momentPhoto.createMany({ data: photoIds.map((photoId, position) => ({ momentId, photoId, position })) });
    }
  });

export const deleteMomentInDB = (momentId) => prisma.moment.delete({ where: { id: momentId } });
