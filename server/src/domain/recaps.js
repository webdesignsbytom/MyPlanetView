// "Your year in travel" (docs/API.md "Year in travel"): thin queries for one map and one year.
// `includeHidden`: the owner and editors see hidden photos and moments; others never do.
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

// As the photo lists: viewers see photos and ready videos that aren't hidden
const photoVisibility = (includeHidden) => (includeHidden ? {} : { hidden: false, OR: [{ kind: 'PHOTO' }, { videoState: 'READY' }] });

/** The years the map has anything in, newest first (photos' shot dates, first visits, trips, moments). */
export async function findRecapYears(mapId, { includeHidden }) {
  const hiddenPhotos = includeHidden ? Prisma.empty : Prisma.sql`AND p."hidden" = false`;
  const hiddenMoments = includeHidden ? Prisma.empty : Prisma.sql`AND m."hidden" = false`;
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT y FROM (
      SELECT EXTRACT(YEAR FROM p."shotAt")::int AS y FROM "photo" p WHERE p."mapId" = ${mapId} ${hiddenPhotos}
      UNION SELECT EXTRACT(YEAR FROM v."firstVisitedOn")::int FROM "country_visit" v
        WHERE v."mapId" = ${mapId} AND v."firstVisitedOn" IS NOT NULL AND v."status" IN ('VISITED', 'LIVED')
      UNION SELECT EXTRACT(YEAR FROM t."startDate")::int FROM "trip" t
        WHERE t."mapId" = ${mapId} AND t."startDate" IS NOT NULL AND t."status" IN ('ACTIVE', 'COMPLETED')
      UNION SELECT EXTRACT(YEAR FROM t."endDate")::int FROM "trip" t
        WHERE t."mapId" = ${mapId} AND t."endDate" IS NOT NULL AND t."status" IN ('ACTIVE', 'COMPLETED')
      UNION SELECT EXTRACT(YEAR FROM m."happenedOn")::int FROM "moment" m
        WHERE m."mapId" = ${mapId} AND m."happenedOn" IS NOT NULL ${hiddenMoments}
    ) years
    WHERE y IS NOT NULL
    ORDER BY y DESC`;
  return rows.map((row) => Number(row.y));
}

/** The year's photos and videos per country and kind: `[{ countryCode, kind, count }]`. */
export async function findYearPhotoGroups(mapId, { from, to, includeHidden }) {
  const groups = await prisma.photo.groupBy({
    by: ['countryCode', 'kind'],
    where: { mapId, shotAt: { gte: from, lt: to }, ...photoVisibility(includeHidden) },
    _count: { _all: true },
  });
  return groups.map((group) => ({ countryCode: group.countryCode, kind: group.kind, count: group._count._all }));
}

/** The first photo shot that year in each of these countries, for the highlights (as the slideshows' lists select it). */
export const findYearHighlightPhotos = (mapId, { from, to, includeHidden, countryCodes, select }) =>
  Promise.all(
    countryCodes.map((countryCode) =>
      prisma.photo.findFirst({
        where: { mapId, countryCode, kind: 'PHOTO', shotAt: { gte: from, lt: to }, ...(includeHidden ? {} : { hidden: false }) },
        orderBy: [{ shotAt: 'asc' }, { id: 'asc' }],
        select,
      }),
    ),
  ).then((photos) => photos.filter(Boolean));

/** The map's visits with a first-visit date (the recap takes the year's). */
export const findDatedVisits = (mapId) =>
  prisma.countryVisit.findMany({
    where: { mapId, firstVisitedOn: { not: null } },
    select: { countryCode: true, status: true, firstVisitedOn: true },
  });

/** The map's own trips that are done or under way, with their stops (the recap takes the year's). */
export const findTripsForRecap = (mapId) =>
  prisma.trip.findMany({
    where: { mapId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      stops: { select: { countryCode: true, arriveOn: true } },
    },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
  });

/** The year's moments' places. */
export const findYearMoments = (mapId, { from, to, includeHidden }) =>
  prisma.moment.findMany({
    where: { mapId, happenedOn: { gte: from, lt: to }, ...(includeHidden ? {} : { hidden: false }) },
    select: { countryCode: true },
  });

/** The landmarks stamped by the year's photos: confirmed matches, one row each. */
export async function findYearStamps(mapId, { from, to, includeHidden }) {
  const rows = await prisma.photoLandmark.findMany({
    where: { mapId, confirmed: true, photo: { shotAt: { gte: from, lt: to }, ...(includeHidden ? {} : { hidden: false }) } },
    select: { landmarkId: true, landmark: { select: { name: true, countryCode: true } } },
  });
  return rows.map((row) => ({ landmarkId: row.landmarkId, name: row.landmark.name, countryCode: row.landmark.countryCode }));
}
