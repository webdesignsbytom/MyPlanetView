import { prisma } from '../prisma.js';
import { canEdit } from '../utils/access.js';
import { countPerParent, countPhotosPer } from './counts.js';
import { createMissingVisits } from './maps.js';

// Trips, stops, trip travellers, trip members

// Enough to decide the caller's role: the trip row, its map's owner, and the caller's
// own map and trip memberships
const TRIP_ACCESS_SELECT = { id: true, mapId: true, title: true, linkAccess: true, shareCode: true };

/**
 * The four reads run side by side, each finding its row through the trip (one round
 * trip, not a nested read three levels deep). Memberships are read only when there's a
 * user: a filter with `userId: undefined` means no filter, and an anonymous caller
 * would get the first member's role.
 * -> `{ ...trip, map: { id, ownerId, name, members }, members }` (members: [] or [{ role }]), or null
 */
async function findTripWithMemberships(tripWhere, userId) {
  const [trip, map, mapMember, tripMember] = await Promise.all([
    prisma.trip.findUnique({ where: tripWhere, select: TRIP_ACCESS_SELECT }),
    prisma.travelMap.findFirst({ where: { trips: { some: tripWhere } }, select: { id: true, ownerId: true, name: true } }),
    userId
      ? prisma.mapMember.findFirst({ where: { userId, map: { trips: { some: tripWhere } } }, select: { role: true } })
      : null,
    userId ? prisma.tripMember.findFirst({ where: { userId, trip: tripWhere }, select: { role: true } }) : null,
  ]);
  if (!trip || !map) return null;
  return {
    ...trip,
    map: { ...map, members: mapMember ? [mapMember] : [] },
    members: tripMember ? [tripMember] : [],
  };
}

export const findTripAccess = (tripId, userId) => findTripWithMemberships({ id: tripId }, userId);

export const findTripAccessByShareCode = (shareCode, userId) => findTripWithMemberships({ shareCode }, userId);

const thumbOf = { where: { size: 'THUMB' }, select: { media: { select: { key: true } } } };

const TRIP_SUMMARY_SELECT = {
  id: true,
  mapId: true,
  title: true,
  status: true,
  startDate: true,
  endDate: true,
  coverPhoto: { select: { hidden: true, variants: thumbOf } },
  travellers: { select: { travellerId: true } },
};

/**
 * Adds `counts: { stops, photos }` to each trip, counted over these trips' ids
 * only (see domain/counts.js). `includeHidden[i]`: whether trip i's hidden
 * photos count (the caller is an editor there).
 */
async function withTripCounts(trips, includeHidden) {
  const ids = trips.map((t) => t.id);
  const [stops, photos] = await Promise.all([
    countPerParent('tripStop', 'tripId', ids),
    countPhotosPer('tripId', ids, includeHidden),
  ]);
  return trips.map((t) => ({ ...t, counts: { stops: stops.get(t.id) ?? 0, photos: photos.get(t.id) ?? 0 } }));
}

/** A map's trips with their counts. `includeHidden`: count hidden photos (editors and the owner). */
export const findTripsForMap = async (mapId, { includeHidden = false } = {}) => {
  const trips = await prisma.trip.findMany({
    where: { mapId },
    select: TRIP_SUMMARY_SELECT,
    orderBy: [{ startDate: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
  });
  return withTripCounts(trips, trips.map(() => includeHidden));
};

/**
 * Trips someone was added to directly (not through the map), with counts;
 * hidden photos count only where they were added as an editor.
 */
export const findTripsSharedWithUser = async (userId) => {
  const memberships = await prisma.tripMember.findMany({
    where: { userId },
    select: { role: true, trip: { select: { ...TRIP_SUMMARY_SELECT, map: { select: { name: true, ownerId: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const trips = await withTripCounts(
    memberships.map((m) => m.trip),
    memberships.map((m) => canEdit(m.role))
  );
  return memberships.map((m, i) => ({ role: m.role, trip: trips[i] }));
};

/**
 * One trip with everything its page shows: travellers, its map's name and travellers,
 * stops, and the cover's thumbnail. Flat queries side by side, each reaching its rows
 * through the trip (the nested select read them four levels deep, one after another).
 * Same shape as before: `coverPhoto: { hidden, variants: [{ media: { key } }] } | null`.
 */
export const findTripDetail = async (tripId) => {
  const ofTrip = { trips: { some: { id: tripId } } };
  const cover = { coverOf: { some: { id: tripId } } };
  const [trip, travellers, map, mapTravellers, stops, coverPhoto, coverThumb] = await Promise.all([
    prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        mapId: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        coverPhotoId: true,
      },
    }),
    prisma.tripTraveller.findMany({ where: { tripId }, select: { travellerId: true } }),
    prisma.travelMap.findFirst({ where: ofTrip, select: { name: true } }),
    prisma.traveller.findMany({
      where: { map: ofTrip },
      select: { id: true, name: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.tripStop.findMany({
      where: { tripId },
      select: {
        id: true,
        position: true,
        countryCode: true,
        landmarkId: true,
        landmark: { select: { name: true } },
        placeName: true,
        arriveOn: true,
        leaveOn: true,
        notes: true,
      },
      orderBy: { position: 'asc' },
    }),
    prisma.photo.findFirst({ where: cover, select: { hidden: true } }),
    prisma.mediaItem.findFirst({ where: { photoVariant: { size: 'THUMB', photo: cover } }, select: { key: true } }),
  ]);
  if (!trip || !map) return null;
  return {
    ...trip,
    travellers,
    map: { name: map.name, travellers: mapTravellers },
    stops,
    coverPhoto: coverPhoto && { hidden: coverPhoto.hidden, variants: coverThumb ? [{ media: coverThumb }] : [] },
  };
};

export const createTripInDB = ({ travellerIds = [], ...data }) =>
  prisma.trip.create({
    data: {
      ...data,
      travellers: { create: travellerIds.map((travellerId) => ({ travellerId })) },
    },
    select: { id: true },
  });

const TRIP_UPDATE_SELECT = { id: true, mapId: true, status: true };

/**
 * Change a trip. `markVisited` (the trip is being completed): its stops' countries
 * count as visited on its map, in the same transaction.
 */
export const updateTripInDB = (tripId, data, { markVisited = false } = {}) => {
  if (!markVisited) return prisma.trip.update({ where: { id: tripId }, data, select: TRIP_UPDATE_SELECT });
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({ where: { id: tripId }, data, select: TRIP_UPDATE_SELECT });
    const stops = await tx.tripStop.findMany({ where: { tripId }, select: { countryCode: true }, distinct: ['countryCode'] });
    await createMissingVisits(trip.mapId, stops.map((s) => s.countryCode), 'TRIP', tx);
    return trip;
  });
};

/** A stop's country on a completed trip counts as visited on the trip's map (in `tx`). */
async function markStopVisited(tx, tripId, countryCode) {
  const trip = await tx.trip.findUnique({ where: { id: tripId }, select: { mapId: true, status: true } });
  if (trip?.status === 'COMPLETED') await createMissingVisits(trip.mapId, [countryCode], 'TRIP', tx);
}

export const deleteTripInDB = (tripId) => prisma.trip.delete({ where: { id: tripId } });

export const setTripTravellersInDB = (tripId, travellerIds) =>
  prisma.$transaction([
    prisma.tripTraveller.deleteMany({ where: { tripId } }),
    prisma.tripTraveller.createMany({ data: travellerIds.map((travellerId) => ({ tripId, travellerId })) }),
  ]);

// A photo that may be a trip's cover
export const findTripPhoto = (tripId, photoId) =>
  prisma.photo.findFirst({ where: { id: photoId, tripId }, select: { id: true } });

// Stops

const STOP_SELECT = {
  id: true,
  position: true,
  countryCode: true,
  landmarkId: true,
  placeName: true,
  arriveOn: true,
  leaveOn: true,
  notes: true,
};

export const findStop = (tripId, stopId) =>
  prisma.tripStop.findFirst({ where: { id: stopId, tripId }, select: STOP_SELECT });

export const findStopIds = async (tripId) =>
  (await prisma.tripStop.findMany({ where: { tripId }, select: { id: true } })).map((s) => s.id);

/**
 * Added after the current last stop. On a completed trip its country counts as
 * visited on the map. One transaction.
 */
export const createStopInDB = (data) =>
  prisma.$transaction(async (tx) => {
    const last = await tx.tripStop.aggregate({ where: { tripId: data.tripId }, _max: { position: true } });
    const stop = await tx.tripStop.create({
      data: { ...data, position: (last._max.position ?? -1) + 1 },
      select: STOP_SELECT,
    });
    await markStopVisited(tx, data.tripId, stop.countryCode);
    return stop;
  });

/** A changed country on a completed trip counts as visited, as for a new stop. One transaction. */
export const updateStopInDB = (tripId, stopId, data) =>
  prisma.$transaction(async (tx) => {
    const stop = await tx.tripStop.update({ where: { id: stopId }, data, select: STOP_SELECT });
    if (data.countryCode) await markStopVisited(tx, tripId, data.countryCode);
    return stop;
  });

export const deleteStopInDB = (stopId) => prisma.tripStop.delete({ where: { id: stopId } });

export const reorderStopsInDB = (stopIds) =>
  prisma.$transaction(
    stopIds.map((id, position) => prisma.tripStop.update({ where: { id }, data: { position } }))
  );

// Trip members

const MEMBER_SELECT = { userId: true, role: true, user: { select: { name: true, email: true } } };

export const findTripMembers = (tripId) =>
  prisma.tripMember.findMany({ where: { tripId }, select: MEMBER_SELECT, orderBy: { createdAt: 'asc' } });

export const findTripMember = (tripId, userId) =>
  prisma.tripMember.findUnique({ where: { tripId_userId: { tripId, userId } }, select: { role: true } });

export const upsertTripMember = (tripId, userId, role) =>
  prisma.tripMember.upsert({
    where: { tripId_userId: { tripId, userId } },
    create: { tripId, userId, role },
    update: { role },
    select: MEMBER_SELECT,
  });

export const deleteTripMember = (tripId, userId) =>
  prisma.tripMember.deleteMany({ where: { tripId, userId } });
