import { prisma } from '../prisma.js';

// The passport (docs/API.md, "Passport"): stamps are confirmed landmark matches, read
// through their own mapId (index [mapId, landmarkId]), never through every photo.

/**
 * Each stamped landmark on a map, with its earliest confirmed photo (by when it was
 * taken), how many confirmed photos it has, and when it was first confirmed. Below
 * editor, hidden photos neither count nor show. `scope` (one traveller's passport:
 * `{ tripIds, photoIds }`) counts only the photos on those trips or among those photos.
 * -> `[{ landmarkId, photoId, shotAt, photoCount, confirmedAt }]`
 */
export const findStamps = (mapId, { includeHidden, scope = null }) =>
  prisma.$queryRaw`
    SELECT DISTINCT ON (pl."landmarkId")
      pl."landmarkId",
      p."id" AS "photoId",
      p."shotAt",
      COUNT(*) OVER (PARTITION BY pl."landmarkId")::int AS "photoCount",
      MIN(pl."confirmedAt") OVER (PARTITION BY pl."landmarkId") AS "confirmedAt"
    FROM "photo_landmark" AS pl
    JOIN "photo" AS p ON p."id" = pl."photoId"
    WHERE pl."mapId" = ${mapId} AND pl."confirmed" AND p."kind" = 'PHOTO' AND (${includeHidden} OR NOT p."hidden")
      AND (${scope === null} OR p."tripId" = ANY(${scope?.tripIds ?? []}::text[]) OR p."id" = ANY(${scope?.photoIds ?? []}::text[]))
    ORDER BY pl."landmarkId", p."shotAt", p."id"`;

/** The photos picked for a map's stamps: `[{ landmarkId, photoId, hidden }]`. */
export const findLandmarkCovers = async (mapId) =>
  (
    await prisma.landmarkCover.findMany({
      where: { mapId },
      select: { landmarkId: true, photoId: true, photo: { select: { hidden: true } } },
    })
  ).map((cover) => ({ landmarkId: cover.landmarkId, photoId: cover.photoId, hidden: cover.photo.hidden }));

/**
 * Each country's earliest photo on a map (when it was taken): Map code -> Date. `scope` as
 * findStamps: one traveller's photos only.
 */
export const findFirstPhotoByCountry = async (mapId, { includeHidden, scope = null }) => {
  const rows = await prisma.photo.groupBy({
    by: ['countryCode'],
    where: {
      mapId,
      countryCode: { not: null },
      ...(includeHidden ? {} : { hidden: false }),
      ...(scope ? { OR: [{ tripId: { in: scope.tripIds } }, { id: { in: scope.photoIds } }] } : {}),
    },
    _min: { shotAt: true },
  });
  return new Map(rows.map((row) => [row.countryCode, row._min.shotAt]));
};

/** A map's visits, for the passport's pages: `[{ countryCode, status, firstVisitedOn, createdAt }]`. */
export const findVisitsForPassport = (mapId) =>
  prisma.countryVisit.findMany({
    where: { mapId },
    select: { countryCode: true, status: true, firstVisitedOn: true, createdAt: true },
  });

/** The landmarks of some countries, by name. */
export const findLandmarksInCountries = (countryCodes) =>
  countryCodes.length
    ? prisma.landmark.findMany({
        where: { countryCode: { in: countryCodes } },
        select: { id: true, name: true, countryCode: true, isUnesco: true, latitude: true, longitude: true },
        orderBy: { name: 'asc' },
      })
    : [];

/** Some landmarks by id (stamps whose landmark is in a country with no visit). */
export const findLandmarksByIds = (ids) =>
  ids.length
    ? prisma.landmark.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, countryCode: true, isUnesco: true, latitude: true, longitude: true },
      })
    : [];

/**
 * What one traveller's passport is made of (docs/API.md "Passport"; 21 Nov 2026): the trips
 * they went on (status, dates and stops' places and first days) and the moments about them
 * (place, date and photos; hidden ones only with `includeHidden`).
 * -> `{ trips: [{ id, status, startDate, stops: [{ countryCode, arriveOn }] }], moments: [{ countryCode, happenedOn, photoIds }] }`
 */
export async function findTravellerTravel(mapId, travellerId, { includeHidden }) {
  const [trips, moments] = await Promise.all([
    prisma.trip.findMany({
      where: { mapId, travellers: { some: { travellerId } } },
      select: { id: true, status: true, startDate: true, stops: { select: { countryCode: true, arriveOn: true } } },
    }),
    prisma.moment.findMany({
      where: { mapId, travellers: { some: { travellerId } }, ...(includeHidden ? {} : { hidden: false }) },
      select: { countryCode: true, happenedOn: true, photos: { select: { photoId: true } } },
    }),
  ]);
  return {
    trips,
    moments: moments.map((m) => ({ countryCode: m.countryCode, happenedOn: m.happenedOn, photoIds: m.photos.map((p) => p.photoId) })),
  };
}

/** The travellers on the passport's photo page. */
export const findPassportTravellers = (mapId) =>
  prisma.traveller.findMany({
    where: { mapId },
    select: { id: true, name: true, birthCountryCode: true, favouriteCountryCode: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

/** A confirmed match of this photo to this landmark, on this map (a cover must be one). */
export const findConfirmedMatch = (mapId, photoId, landmarkId) =>
  prisma.photoLandmark.findFirst({ where: { mapId, photoId, landmarkId, confirmed: true }, select: { photoId: true } });

export const upsertLandmarkCover = (mapId, landmarkId, photoId) =>
  prisma.landmarkCover.upsert({
    where: { mapId_landmarkId: { mapId, landmarkId } },
    create: { mapId, landmarkId, photoId },
    update: { photoId },
    select: { landmarkId: true, photoId: true },
  });

export const deleteLandmarkCover = (mapId, landmarkId) =>
  prisma.landmarkCover.deleteMany({ where: { mapId, landmarkId } });

/** The passport's cover: the map's name, kind and owner. */
export const findPassportMap = (mapId) =>
  prisma.travelMap.findUnique({
    where: { id: mapId },
    select: { id: true, name: true, groupType: true, owner: { select: { name: true } } },
  });

/** Each photo's thumbnail key: Map photoId -> key. */
export const findThumbKeys = async (photoIds) => {
  if (!photoIds.length) return new Map();
  const rows = await prisma.photoVariant.findMany({
    where: { photoId: { in: photoIds }, size: 'THUMB' },
    select: { photoId: true, media: { select: { key: true } } },
  });
  return new Map(rows.map((row) => [row.photoId, row.media.key]));
};

/**
 * The map's moments at some landmarks (the passport's stamps), oldest first, undated last:
 * `[{ id, title, kind, happenedOn, datePrecision, landmarkId }]`. Hidden ones only with
 * `includeHidden` (the owner and editors).
 */
export const findLandmarkMoments = (mapId, landmarkIds, { includeHidden }) =>
  landmarkIds.length
    ? prisma.moment.findMany({
        where: { mapId, landmarkId: { in: landmarkIds }, ...(includeHidden ? {} : { hidden: false }) },
        select: { id: true, title: true, kind: true, happenedOn: true, datePrecision: true, landmarkId: true },
        orderBy: [{ happenedOn: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
      })
    : [];
