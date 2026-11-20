// Taking your travels with you (docs/API.md "Travel copies"): the queries. Someone on a
// family map asks to copy the trips, moments and photos they're in onto a map of their own;
// the family map's owner or a co-owner approves; services/travel/travelCopies.js copies.
import { prisma } from '../prisma.js';

// What a traveller can take: never a hidden photo or moment, never a video (its file is in
// Cloudflare Stream, not R2: it stays on the family map)
const COPYABLE_PHOTO = { kind: 'PHOTO', hidden: false };

// Choosing

/** A map's travellers, for "Which one are you?". */
export const findTravellersForCopy = (mapId) =>
  prisma.traveller.findMany({
    where: { mapId },
    select: { id: true, name: true, userId: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

/**
 * What `travellerId` can take from map `mapId`: the map's own trips they went on (with how
 * many photos each has), the moments about them (with their photos' ids) and the countries
 * with photos (with how many). Hidden photos and moments, and videos, are left out.
 */
export async function findCopyChoices(mapId, travellerId) {
  const [trips, moments, countries] = await Promise.all([
    prisma.trip.findMany({
      where: { mapId, travellers: { some: { travellerId } } },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        stops: { select: { countryCode: true }, orderBy: { position: 'asc' } },
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.moment.findMany({
      where: { mapId, hidden: false, travellers: { some: { travellerId } } },
      select: {
        id: true,
        kind: true,
        title: true,
        happenedOn: true,
        datePrecision: true,
        countryCode: true,
        photos: { where: { photo: COPYABLE_PHOTO }, select: { photoId: true }, orderBy: { position: 'asc' } },
      },
      orderBy: [{ happenedOn: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.photo.groupBy({
      by: ['countryCode'],
      where: { mapId, ...COPYABLE_PHOTO, countryCode: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const tripPhotoCounts = trips.length
    ? await prisma.photo.groupBy({
        by: ['tripId'],
        where: { mapId, ...COPYABLE_PHOTO, tripId: { in: trips.map((t) => t.id) } },
        _count: { _all: true },
      })
    : [];
  const perTrip = new Map(tripPhotoCounts.map((row) => [row.tripId, row._count._all]));
  return {
    trips: trips.map((t) => ({ ...t, photos: perTrip.get(t.id) ?? 0 })),
    moments,
    countries: countries.map((row) => ({ countryCode: row.countryCode, photos: row._count._all })),
  };
}

/** How many of `tripIds` are trips on `mapId` that `travellerId` went on. */
export const countTravellerTrips = (mapId, travellerId, tripIds) =>
  prisma.trip.count({ where: { id: { in: tripIds }, mapId, travellers: { some: { travellerId } } } });

/** How many of `momentIds` are shown moments on `mapId` about `travellerId`. */
export const countTravellerMoments = (mapId, travellerId, momentIds) =>
  prisma.moment.count({ where: { id: { in: momentIds }, mapId, hidden: false, travellers: { some: { travellerId } } } });

/**
 * Every photo the choice takes from `mapId`: the photos of `tripIds`, in `countryCodes`, in
 * `momentIds` and `photoIds` themselves, copyable ones only, in the order they were taken.
 * -> `[{ id, countryCode, ukNation, latitude, longitude }]`
 */
export function findPhotosToCopy(mapId, { tripIds = [], countryCodes = [], photoIds = [], momentIds = [] }) {
  const or = [
    tripIds.length ? { tripId: { in: tripIds } } : null,
    countryCodes.length ? { countryCode: { in: countryCodes } } : null,
    photoIds.length ? { id: { in: photoIds } } : null,
    momentIds.length ? { moments: { some: { momentId: { in: momentIds } } } } : null,
  ].filter(Boolean);
  if (!or.length) return [];
  return prisma.photo.findMany({
    where: { mapId, ...COPYABLE_PHOTO, OR: or },
    select: { id: true, countryCode: true, ukNation: true, latitude: true, longitude: true },
    orderBy: [{ shotAt: 'asc' }, { id: 'asc' }],
  });
}

// Requests

const REQUEST_SELECT = {
  id: true,
  status: true,
  fromMapId: true,
  toMapId: true,
  travellerId: true,
  requestedById: true,
  decidedById: true,
  tripIds: true,
  momentIds: true,
  photoIds: true,
  photoCursor: true,
  copiedPhotos: true,
  skippedPhotos: true,
  createdAt: true,
  decidedAt: true,
  finishedAt: true,
  fromMap: { select: { id: true, name: true, ownerId: true } },
  toMap: { select: { id: true, name: true, ownerId: true, splitUk: true } },
  traveller: { select: { id: true, name: true } },
  requestedBy: { select: { id: true, name: true } },
};

export const createCopyRequestInDB = (data) => prisma.travelCopyRequest.create({ data, select: REQUEST_SELECT });

export const findCopyRequest = (id) => prisma.travelCopyRequest.findUnique({ where: { id }, select: REQUEST_SELECT });

/** A request still waiting, for the same traveller from the same map onto the same map. */
export const findPendingCopy = ({ fromMapId, toMapId, travellerId }) =>
  prisma.travelCopyRequest.findFirst({ where: { fromMapId, toMapId, travellerId, status: 'PENDING' }, select: { id: true } });

// Requests shown on a map: every one still waiting or copying, and the last 20 finished
const LIST_LIMIT = 20;
async function requestsWhere(where) {
  const [open, finished] = await Promise.all([
    prisma.travelCopyRequest.findMany({
      where: { ...where, status: { in: ['PENDING', 'APPROVED'] } },
      select: REQUEST_SELECT,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.travelCopyRequest.findMany({
      where: { ...where, status: { in: ['DONE', 'DECLINED'] } },
      select: REQUEST_SELECT,
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
    }),
  ]);
  return [...open, ...finished];
}

/** Requests to copy from `mapId` (`incoming`, for its managers) and onto it (`outgoing`). */
export const findCopyRequestsFromMap = (mapId) => requestsWhere({ fromMapId: mapId });
export const findCopyRequestsToMap = (mapId) => requestsWhere({ toMapId: mapId });

/**
 * What a request holds, for deciding: its trips' and moments' titles and dates, and its
 * photos per country. -> `{ trips, moments, countries: [{ countryCode, photos }] }`
 */
export async function findCopyContents({ fromMapId, tripIds, momentIds, photoIds }) {
  const [trips, moments, countries] = await Promise.all([
    tripIds.length
      ? prisma.trip.findMany({
          where: { id: { in: tripIds }, mapId: fromMapId },
          select: { id: true, title: true, startDate: true },
          orderBy: { startDate: 'asc' },
        })
      : [],
    momentIds.length
      ? prisma.moment.findMany({
          where: { id: { in: momentIds }, mapId: fromMapId },
          select: { id: true, title: true, happenedOn: true },
          orderBy: { happenedOn: 'asc' },
        })
      : [],
    photoIds.length
      ? prisma.photo.groupBy({ by: ['countryCode'], where: { id: { in: photoIds }, mapId: fromMapId }, _count: { _all: true } })
      : [],
  ]);
  return {
    trips,
    moments,
    countries: countries.map((c) => ({ countryCode: c.countryCode, photos: c._count._all })).sort((a, b) => b.photos - a.photos),
  };
}

/** Approve or decline a request still waiting. -> true if this call decided it (not a second click). */
export const decideCopyRequestInDB = async (id, { status, decidedById }) =>
  (
    await prisma.travelCopyRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status, decidedById, decidedAt: new Date() },
    })
  ).count === 1;

/** Withdraw a request still waiting. -> true if it was. */
export const deletePendingCopyInDB = async (id) =>
  (await prisma.travelCopyRequest.deleteMany({ where: { id, status: 'PENDING' } })).count === 1;

// Copying (services/travel/travelCopies.js)

/** Hold an approved request for one run (`lockMs`), unless another run holds it. -> true if held. */
export const claimCopyRequest = async (id, lockMs, now = new Date()) =>
  (
    await prisma.travelCopyRequest.updateMany({
      where: { id, status: 'APPROVED', OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
      data: { lockedUntil: new Date(now.getTime() + lockMs) },
    })
  ).count === 1;

/**
 * Save a run's progress. `release` lets the request go (the run's end); `done` marks it
 * finished.
 */
export const saveCopyProgressInDB = (id, { photoCursor, copiedPhotos, skippedPhotos, release = true, done = false }) =>
  prisma.travelCopyRequest.update({
    where: { id },
    data: {
      photoCursor,
      copiedPhotos,
      skippedPhotos,
      ...(release ? { lockedUntil: null } : {}),
      ...(done ? { status: 'DONE', finishedAt: new Date() } : {}),
    },
    select: REQUEST_SELECT,
  });

/** Approved requests not finished: the daily cron carries on with them, oldest first. */
export const findApprovedCopyIds = async () =>
  (
    await prisma.travelCopyRequest.findMany({
      where: { status: 'APPROVED' },
      select: { id: true },
      orderBy: { decidedAt: 'asc' },
      take: 50,
    })
  ).map((r) => r.id);

/** The new map's traveller ids for the person copying: their own traveller, else the only one. */
export async function findOwnTravellerIds(mapId, userId) {
  const travellers = await prisma.traveller.findMany({ where: { mapId }, select: { id: true, userId: true } });
  const own = travellers.find((t) => t.userId === userId);
  if (own) return [own.id];
  return travellers.length === 1 ? [travellers[0].id] : [];
}

/** The copies already on `toMapId` of the originals `ids` (`model`: 'photo', 'trip', 'moment'). -> Map original -> copy */
export async function findCopiesOn(model, toMapId, ids) {
  if (!ids.length) return new Map();
  const rows = await prisma[model].findMany({
    where: { mapId: toMapId, copiedFromId: { in: ids } },
    select: { id: true, copiedFromId: true },
  });
  return new Map(rows.map((r) => [r.copiedFromId, r.id]));
}

/** A photo to copy, with its files and landmark matches: on `mapId`, copyable, or null. */
export const findPhotoToCopy = (id, mapId) =>
  prisma.photo.findFirst({
    where: { id, mapId, ...COPYABLE_PHOTO },
    select: {
      id: true,
      tripId: true,
      countryCode: true,
      ukNation: true,
      caption: true,
      takenAt: true,
      latitude: true,
      longitude: true,
      width: true,
      height: true,
      variants: { select: { size: true, width: true, height: true, media: { select: { key: true, contentType: true, bytes: true } } } },
      landmarks: { select: { landmarkId: true, source: true, distanceM: true, confirmed: true, confirmedAt: true } },
    },
  });

/** The landmark matches of a copied photo, as the original had them (its passport stamps). */
export const createCopiedLandmarksInDB = (photoId, mapId, landmarks) =>
  landmarks.length
    ? prisma.photoLandmark.createMany({
        data: landmarks.map((l) => ({ ...l, photoId, mapId })),
        skipDuplicates: true,
      })
    : null;

/** The trips to copy, with their stops (and each stop's landmark, to place it). */
export const findTripsToCopy = (ids, mapId) =>
  prisma.trip.findMany({
    where: { id: { in: ids }, mapId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      coverPhotoId: true,
      stops: {
        orderBy: { position: 'asc' },
        select: {
          position: true,
          countryCode: true,
          ukNation: true,
          landmarkId: true,
          placeName: true,
          arriveOn: true,
          leaveOn: true,
          notes: true,
          landmark: { select: { latitude: true, longitude: true } },
        },
      },
    },
  });

/** The moments to copy, shown ones only, with their photos in order. */
export const findMomentsToCopy = (ids, mapId) =>
  prisma.moment.findMany({
    where: { id: { in: ids }, mapId, hidden: false },
    select: {
      id: true,
      kind: true,
      title: true,
      text: true,
      happenedOn: true,
      datePrecision: true,
      countryCode: true,
      ukNation: true,
      landmarkId: true,
      placeName: true,
      latitude: true,
      longitude: true,
      tripId: true,
      landmark: { select: { latitude: true, longitude: true } },
      photos: { select: { photoId: true }, orderBy: { position: 'asc' } },
    },
  });

/** Set copied trips' covers (`[{ tripId, coverPhotoId }]`) where they have none yet. */
export const setTripCoversInDB = (covers) =>
  prisma.$transaction(
    covers.map(({ tripId, coverPhotoId }) =>
      prisma.trip.updateMany({ where: { id: tripId, coverPhotoId: null }, data: { coverPhotoId } }),
    ),
  );

/**
 * The copies' dates per place on `toMapId`, for first visits: each copied photo's date taken
 * and each copied completed trip's stops' arrivals (else the trip's start).
 * -> `[{ countryCode, date }]`
 */
export async function findCopiedDates(toMapId, { photoIds, tripIds }) {
  const [photos, stops] = await Promise.all([
    photoIds.length
      ? prisma.photo.findMany({
          where: { mapId: toMapId, copiedFromId: { in: photoIds }, takenAt: { not: null }, countryCode: { not: null } },
          select: { countryCode: true, takenAt: true },
        })
      : [],
    tripIds.length
      ? prisma.tripStop.findMany({
          where: { trip: { mapId: toMapId, copiedFromId: { in: tripIds }, status: 'COMPLETED' } },
          select: { countryCode: true, arriveOn: true, trip: { select: { startDate: true } } },
        })
      : [],
  ]);
  return [
    ...photos.map((p) => ({ countryCode: p.countryCode, date: p.takenAt })),
    ...stops.map((s) => ({ countryCode: s.countryCode, date: s.arriveOn ?? s.trip.startDate })).filter((s) => s.date),
  ];
}

/** Who to email: `{ email, name, isActive }`, or null. */
export const findCopyEmailContact = (userId) =>
  prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, isActive: true } });

/** A visit's first date becomes `date` where it has none or a later one. */
export const setFirstVisitIfEarlierInDB = (mapId, countryCode, date) =>
  prisma.countryVisit.updateMany({
    where: { mapId, countryCode, OR: [{ firstVisitedOn: null }, { firstVisitedOn: { gt: date } }] },
    data: { firstVisitedOn: date },
  });
