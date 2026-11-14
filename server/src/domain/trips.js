import { prisma } from '../prisma.js';

// Trips, stops, trip travellers, trip members

// Enough to decide the caller's role (trip row + its map's owner/member row)
const tripAccessSelect = (userId) => ({
  id: true,
  mapId: true,
  title: true,
  linkAccess: true,
  shareCode: true,
  map: {
    select: {
      id: true,
      ownerId: true,
      name: true,
      ...(userId ? { members: { where: { userId }, select: { role: true } } } : {}),
    },
  },
  ...(userId ? { members: { where: { userId }, select: { role: true } } } : {}),
});

export const findTripAccess = (tripId, userId) =>
  prisma.trip.findUnique({ where: { id: tripId }, select: tripAccessSelect(userId) });

export const findTripAccessByShareCode = (shareCode, userId) =>
  prisma.trip.findUnique({ where: { shareCode }, select: tripAccessSelect(userId) });

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
  _count: { select: { stops: true, photos: true } },
};

export const findTripsForMap = (mapId) =>
  prisma.trip.findMany({
    where: { mapId },
    select: TRIP_SUMMARY_SELECT,
    orderBy: [{ startDate: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
  });

/** Trips someone was added to directly (not through the map). */
export const findTripsSharedWithUser = (userId) =>
  prisma.tripMember.findMany({
    where: { userId },
    select: { role: true, trip: { select: { ...TRIP_SUMMARY_SELECT, map: { select: { name: true, ownerId: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

export const findTripDetail = (tripId) =>
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
      coverPhoto: { select: { hidden: true, variants: thumbOf } },
      travellers: { select: { travellerId: true } },
      map: {
        select: {
          name: true,
          travellers: { select: { id: true, name: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        },
      },
      stops: {
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
      },
    },
  });

export const createTripInDB = ({ travellerIds = [], ...data }) =>
  prisma.trip.create({
    data: {
      ...data,
      travellers: { create: travellerIds.map((travellerId) => ({ travellerId })) },
    },
    select: { id: true },
  });

export const updateTripInDB = (tripId, data) =>
  prisma.trip.update({ where: { id: tripId }, data, select: { id: true, mapId: true, status: true } });

export const deleteTripInDB = (tripId) => prisma.trip.delete({ where: { id: tripId } });

export const setTripTravellersInDB = (tripId, travellerIds) =>
  prisma.$transaction([
    prisma.tripTraveller.deleteMany({ where: { tripId } }),
    prisma.tripTraveller.createMany({ data: travellerIds.map((travellerId) => ({ tripId, travellerId })) }),
  ]);

export const findTripStopCountryCodes = async (tripId) =>
  [...new Set((await prisma.tripStop.findMany({ where: { tripId }, select: { countryCode: true } })).map((s) => s.countryCode))];

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

/** Added after the current last stop. */
export const createStopInDB = async (data) => {
  const last = await prisma.tripStop.aggregate({ where: { tripId: data.tripId }, _max: { position: true } });
  return prisma.tripStop.create({
    data: { ...data, position: (last._max.position ?? -1) + 1 },
    select: STOP_SELECT,
  });
};

export const updateStopInDB = (stopId, data) =>
  prisma.tripStop.update({ where: { id: stopId }, data, select: STOP_SELECT });

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
