import { prisma } from '../prisma.js';
import { canEdit } from '../utils/access.js';
import { countPerParent, countPhotosPer } from './counts.js';
import { createMissingVisits } from './maps.js';
import { placeOnMap } from '../utils/ukNations.js';

// Trips, stops, trip travellers, trip members

// Enough to decide the caller's role: the trip row, its map's owner, and the caller's
// own map and trip memberships
const TRIP_ACCESS_SELECT = { id: true, mapId: true, title: true, linkAccess: true, shareCode: true };

/**
 * The four reads run side by side, each finding its row through the trip (one round
 * trip, not a nested read three levels deep). Memberships are read only when there's a
 * user: a filter with `userId: undefined` means no filter, and an anonymous caller
 * would get the first member's role.
 * -> `{ ...trip, map: { id, ownerId, name, splitUk, members }, members }` (members: [] or [{ role }]), or null
 */
async function findTripWithMemberships(tripWhere, userId) {
  const [trip, map, mapMember, tripMember] = await Promise.all([
    prisma.trip.findUnique({ where: tripWhere, select: TRIP_ACCESS_SELECT }),
    prisma.travelMap.findFirst({ where: { trips: { some: tripWhere } }, select: { id: true, ownerId: true, name: true, splitUk: true } }),
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
  // Only for ordering a map's own and linked trips together (byTripOrder)
  createdAt: true,
  coverPhoto: { select: { hidden: true, variants: thumbOf } },
  travellers: { select: { travellerId: true } },
};

/** A map's trips' order: latest start first (undated first), then newest. */
export const byTripOrder = (a, b) => {
  if (!a.startDate !== !b.startDate) return a.startDate ? 1 : -1;
  const byStart = a.startDate && b.startDate ? b.startDate.getTime() - a.startDate.getTime() : 0;
  return byStart || b.createdAt.getTime() - a.createdAt.getTime();
};

/**
 * Adds `counts: { stops, photos }` to each trip, counted over these trips' ids
 * only (see domain/counts.js). `includeHidden[i]`: whether trip i's hidden
 * photos count (the caller is an editor there).
 */
export async function withTripCounts(trips, includeHidden) {
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
    prisma.travelMap.findFirst({ where: ofTrip, select: { name: true, splitUk: true } }),
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
    map: { name: map.name, splitUk: map.splitUk, travellers: mapTravellers },
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

/** A trip's stops' countries, each once (in `db`). */
const stopCountries = async (db, tripId) =>
  (await db.tripStop.findMany({ where: { tripId }, select: { countryCode: true }, distinct: ['countryCode'] })).map(
    (s) => s.countryCode
  );

/**
 * A completed trip's countries count as visited on its own map and on every map it was
 * added to (group trips), in `tx`. `mapId` is the trip's own map.
 */
async function markVisitedOnTripMaps(tx, { tripId, mapId }, countryCodes) {
  if (!countryCodes.length) return;
  const links = await tx.tripMap.findMany({ where: { tripId }, select: { mapId: true } });
  await markTripVisits(tx, [mapId, ...links.map((l) => l.mapId)], countryCodes);
}

/**
 * TRIP visits for `countryCodes` on each of `mapIds`, as each map keeps places: a stop in a
 * UK nation is the UK on a map that doesn't split it (utils/ukNations.js), in `tx`.
 */
async function markTripVisits(tx, mapIds, countryCodes) {
  const maps = await tx.travelMap.findMany({ where: { id: { in: mapIds } }, select: { id: true, splitUk: true } });
  for (const map of maps) {
    await createMissingVisits(map.id, [...new Set(countryCodes.map((code) => placeOnMap(code, map.splitUk)))], 'TRIP', tx);
  }
}

/**
 * Change a trip. `markVisited` (the trip is being completed): its stops' countries
 * count as visited on its map and the maps it was added to, in the same transaction.
 */
export const updateTripInDB = (tripId, data, { markVisited = false } = {}) => {
  if (!markVisited) return prisma.trip.update({ where: { id: tripId }, data, select: TRIP_UPDATE_SELECT });
  return prisma.$transaction(async (tx) => {
    // The update locks the trip's row, so a link being added at the same time waits for
    // this, then sees the trip completed (addTripToMapInDB)
    const trip = await tx.trip.update({ where: { id: tripId }, data, select: TRIP_UPDATE_SELECT });
    await markVisitedOnTripMaps(tx, { tripId, mapId: trip.mapId }, await stopCountries(tx, tripId));
    return trip;
  });
};

/** A stop's country on a completed trip counts as visited on the trip's maps (in `tx`). */
async function markStopVisited(tx, tripId, countryCode) {
  const trip = await tx.trip.findUnique({ where: { id: tripId }, select: { mapId: true, status: true } });
  if (trip?.status === 'COMPLETED') await markVisitedOnTripMaps(tx, { tripId, mapId: trip.mapId }, [countryCode]);
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

/**
 * Someone leaves a trip, or is removed from it: their TripMember row goes, and so do the
 * maps they added the trip to ("Add to my map"); the visits it marked there stay. One
 * transaction. -> `{ count }` (member rows removed)
 */
export const deleteTripMember = async (tripId, userId) => {
  const [, member] = await prisma.$transaction([
    prisma.tripMap.deleteMany({ where: { tripId, addedById: userId } }),
    prisma.tripMember.deleteMany({ where: { tripId, userId } }),
  ]);
  return member;
};

// Group trips: a trip shown on other people's maps (TripMap, docs/API.md "Group trips")

/**
 * Show a trip on another map. Nothing happens when it's already there. A completed
 * trip's countries are marked visited on that map at once (the South Pole bringing
 * Antarctica, as everywhere). One transaction; the trip's row is share-locked first, so
 * a completion running at the same time either sees this link or is seen by it.
 * -> `{ created }`
 */
export const addTripToMapInDB = ({ tripId, mapId, addedById }) =>
  prisma.$transaction(async (tx) => {
    const [trip] = await tx.$queryRaw`SELECT "status"::text AS "status" FROM "trip" WHERE "id" = ${tripId} FOR SHARE`;
    if (!trip) return { created: false };
    const { count } = await tx.tripMap.createMany({ data: [{ tripId, mapId, addedById }], skipDuplicates: true });
    if (!count) return { created: false };
    if (trip.status === 'COMPLETED') await markTripVisits(tx, [mapId], await stopCountries(tx, tripId));
    return { created: true };
  });

/** One link: `{ addedById, map: { ownerId } }`, or null. */
export const findTripMapLink = (tripId, mapId) =>
  prisma.tripMap.findUnique({
    where: { tripId_mapId: { tripId, mapId } },
    select: { addedById: true, map: { select: { ownerId: true } } },
  });

/** Take a trip off a map (the visits it marked stay). -> `{ count }` */
export const deleteTripMapLink = (tripId, mapId) => prisma.tripMap.deleteMany({ where: { tripId, mapId } });

// Maps a user owns or edits (where they may add a trip). `userId` is always set here.
const mapsUserEdits = (userId) => ({ OR: [{ ownerId: userId }, { members: { some: { userId, role: 'EDITOR' } } }] });

/**
 * The maps of `userId` (owned or edited) a trip was added to, first added first:
 * `[{ mapId, addedById, map: { name, ownerId } }]`. Empty without a user.
 */
export const findTripLinksOnUsersMaps = (tripId, userId) =>
  userId
    ? prisma.tripMap.findMany({
        where: { tripId, map: mapsUserEdits(userId) },
        select: { mapId: true, addedById: true, map: { select: { name: true, ownerId: true } } },
        orderBy: { addedAt: 'asc' },
      })
    : [];

/** Does `userId` own or edit a map other than `exceptMapId`? */
export const hasEditableMapOtherThan = async (userId, exceptMapId) =>
  Boolean(
    userId &&
      (await prisma.travelMap.findFirst({ where: { id: { not: exceptMapId }, ...mapsUserEdits(userId) }, select: { id: true } }))
  );

/**
 * Trips from other maps shown on this one, with what a list needs: the summary fields,
 * the organiser's map (`map: { name, ownerId }`) and the stops' countries in trip order
 * (`countryCodes`). Counts are added later, only for the trips the caller can open.
 */
export const findTripsLinkedToMap = async (mapId) => {
  const links = await prisma.tripMap.findMany({
    where: { mapId },
    select: { trip: { select: { ...TRIP_SUMMARY_SELECT, map: { select: { name: true, ownerId: true } } } } },
  });
  const trips = links.map((l) => l.trip);
  if (!trips.length) return [];
  const stops = await prisma.tripStop.findMany({
    where: { tripId: { in: trips.map((t) => t.id) } },
    select: { tripId: true, countryCode: true },
    orderBy: [{ tripId: 'asc' }, { position: 'asc' }],
  });
  const countries = new Map(trips.map((t) => [t.id, []]));
  for (const s of stops) {
    const list = countries.get(s.tripId);
    if (!list.includes(s.countryCode)) list.push(s.countryCode);
  }
  return trips.map((t) => ({ ...t, countryCodes: countries.get(t.id) }));
};

/**
 * The caller's own memberships behind some trips (from other maps): their MapMember rows
 * on those trips' maps and their TripMember rows on the trips, side by side. Nothing is
 * read without a user (a filter on `userId: undefined` would match everyone's rows).
 * -> `{ mapRoles: Map<mapId, role>, tripRoles: Map<tripId, role> }`
 */
export const findMembershipsForTrips = async (trips, userId) => {
  if (!userId || !trips.length) return { mapRoles: new Map(), tripRoles: new Map() };
  const [mapMembers, tripMembers] = await Promise.all([
    prisma.mapMember.findMany({
      where: { userId, mapId: { in: [...new Set(trips.map((t) => t.mapId))] } },
      select: { mapId: true, role: true },
    }),
    prisma.tripMember.findMany({ where: { userId, tripId: { in: trips.map((t) => t.id) } }, select: { tripId: true, role: true } }),
  ]);
  return {
    mapRoles: new Map(mapMembers.map((m) => [m.mapId, m.role])),
    tripRoles: new Map(tripMembers.map((m) => [m.tripId, m.role])),
  };
};

/** How many trips from other maps are shown on a map (they count in its stats). */
export const countLinkedTrips = (mapId) => prisma.tripMap.count({ where: { mapId } });
