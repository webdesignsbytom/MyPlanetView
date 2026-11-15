import { prisma } from '../prisma.js';
import { COUNTED_VISIT_STATUSES } from '../utils/travelValidation.js';
import { PARENT_PLACE, SPECIAL_PLACE_CODES, withParentPlaces } from '../utils/specialPlaces.js';
import { canEdit } from '../utils/access.js';
import { countPerParent, countPhotosPer } from './counts.js';

// Maps, travellers, visits, map members

// Enough to decide the caller's role
const MAP_ACCESS_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  groupType: true,
  isDefault: true,
  linkAccess: true,
  shareCode: true,
};

/**
 * The map and the caller's own membership, read side by side (one round trip, not a
 * nested read). The membership is read only when there's a user: a filter with
 * `userId: undefined` means no filter, and an anonymous caller would get the first
 * member's role. -> `{ ...map, members: [] | [{ role }] }`, or null
 */
async function findMapWithMembership(mapWhere, userId) {
  const [map, member] = await Promise.all([
    prisma.travelMap.findUnique({ where: mapWhere, select: MAP_ACCESS_SELECT }),
    userId ? prisma.mapMember.findFirst({ where: { userId, map: mapWhere }, select: { role: true } }) : null,
  ]);
  return map && { ...map, members: member ? [member] : [] };
}

export const findMapAccess = (mapId, userId) => findMapWithMembership({ id: mapId }, userId);

export const findMapAccessByShareCode = (shareCode, userId) => findMapWithMembership({ shareCode }, userId);

const mapSummarySelect = {
  id: true,
  name: true,
  groupType: true,
  isDefault: true,
  ownerId: true,
  createdAt: true,
  owner: { select: { name: true } },
};

/**
 * Adds `counts: { countries, photos, trips }` to each map, counted over these
 * maps' ids only (see domain/counts.js). `includeHidden[i]`: whether map i's
 * hidden photos count (the caller is its owner or an editor).
 */
async function withMapCounts(maps, includeHidden) {
  const ids = maps.map((m) => m.id);
  const [countries, photos, trips] = await Promise.all([
    // Countries only: special places (Antarctica, the poles) have their own stat
    countPerParent('countryVisit', 'mapId', ids, {
      status: { in: [...COUNTED_VISIT_STATUSES] },
      countryCode: { notIn: [...SPECIAL_PLACE_CODES] },
    }),
    countPhotosPer('mapId', ids, includeHidden),
    countPerParent('trip', 'mapId', ids),
  ]);
  return maps.map((m) => ({
    ...m,
    counts: {
      countries: countries.get(m.id) ?? 0,
      photos: photos.get(m.id) ?? 0,
      trips: trips.get(m.id) ?? 0,
    },
  }));
}

/** The user's own maps with their counts (hidden photos included: they own them). */
export const findOwnedMaps = async (userId) => {
  const maps = await prisma.travelMap.findMany({
    where: { ownerId: userId },
    select: mapSummarySelect,
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return withMapCounts(maps, maps.map(() => true));
};

/** Maps shared with the user, with counts; hidden photos count only where they're an editor. */
export const findMemberMaps = async (userId) => {
  const memberships = await prisma.mapMember.findMany({
    where: { userId },
    select: { role: true, map: { select: mapSummarySelect } },
    orderBy: { createdAt: 'asc' },
  });
  const maps = await withMapCounts(
    memberships.map((m) => m.map),
    memberships.map((m) => canEdit(m.role))
  );
  return memberships.map((m, i) => ({ role: m.role, map: maps[i] }));
};

export const findDefaultMap = (userId) =>
  prisma.travelMap.findUnique({ where: { defaultForOwnerId: userId }, select: { id: true } });

/**
 * The whole map: its row, owner's name, travellers and visits. Four flat queries run
 * side by side (a nested select reads the map first, then the rest).
 */
export const findMapDetail = async (mapId) => {
  const [map, owner, travellers, visits] = await Promise.all([
    prisma.travelMap.findUnique({
      where: { id: mapId },
      select: { id: true, name: true, groupType: true, isDefault: true, ownerId: true },
    }),
    prisma.user.findFirst({ where: { ownedMaps: { some: { id: mapId } } }, select: { name: true } }),
    prisma.traveller.findMany({
      where: { mapId },
      select: { id: true, name: true, position: true, userId: true, birthCountryCode: true, favouriteCountryCode: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.countryVisit.findMany({
      where: { mapId },
      select: { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true },
      orderBy: { countryCode: 'asc' },
    }),
  ]);
  return map && { ...map, owner, travellers, visits };
};

/** A new map with its travellers (one transaction). */
export const createMapInDB = ({ ownerId, name, groupType, isDefault = false, shareCode, travellers }) =>
  prisma.travelMap.create({
    data: {
      ownerId,
      name,
      groupType,
      isDefault,
      // Unique: a second default map for the same owner fails (P2002)
      defaultForOwnerId: isDefault ? ownerId : null,
      shareCode,
      travellers: {
        create: travellers.map((t, index) => ({
          name: t.name,
          position: index,
          userId: t.userId ?? null,
          birthCountryCode: t.birthCountryCode ?? null,
          favouriteCountryCode: t.favouriteCountryCode ?? null,
        })),
      },
    },
    select: { id: true },
  });

export const updateMapInDB = (mapId, data) =>
  prisma.travelMap.update({ where: { id: mapId }, data, select: { id: true } });

export const deleteMapInDB = (mapId) => prisma.travelMap.delete({ where: { id: mapId } });

/** Several maps at once (account deletion); their photos, trips and members cascade. */
export const deleteMapsInDB = (mapIds) => prisma.travelMap.deleteMany({ where: { id: { in: mapIds } } });

// Share codes are unique per table; a new code is checked against both
export const isShareCodeTaken = async (shareCode) => {
  const [map, trip] = await Promise.all([
    prisma.travelMap.findUnique({ where: { shareCode }, select: { id: true } }),
    prisma.trip.findUnique({ where: { shareCode }, select: { id: true } }),
  ]);
  return Boolean(map || trip);
};

// Travellers

export const countTravellers = (mapId) => prisma.traveller.count({ where: { mapId } });

export const findMapTravellers = (mapId) =>
  prisma.traveller.findMany({
    where: { mapId },
    select: { id: true, name: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

export const findTravellerIds = async (mapId) =>
  (await prisma.traveller.findMany({ where: { mapId }, select: { id: true } })).map((t) => t.id);

export const findTraveller = (mapId, travellerId) =>
  prisma.traveller.findFirst({ where: { id: travellerId, mapId }, select: { id: true } });

const TRAVELLER_SELECT = {
  id: true,
  name: true,
  position: true,
  userId: true,
  birthCountryCode: true,
  favouriteCountryCode: true,
};

export const createTravellerInDB = (data) => prisma.traveller.create({ data, select: TRAVELLER_SELECT });

export const updateTravellerInDB = (travellerId, data) =>
  prisma.traveller.update({ where: { id: travellerId }, data, select: TRAVELLER_SELECT });

export const deleteTravellerInDB = (travellerId) => prisma.traveller.delete({ where: { id: travellerId } });

// Visits

const VISIT_SELECT = { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true };

/**
 * Set a visit by hand -> { visit, implied }. Visiting a place inside another (the South
 * Pole, in Antarctica) also visits that one, in the same transaction: `implied` is those
 * visits as they now are, when the rule changed them (else []).
 */
export const upsertVisitInDB = async ({ mapId, countryCode, status, firstVisitedOn, notes }) => {
  const upsert = (db) =>
    db.countryVisit.upsert({
      where: { mapId_countryCode: { mapId, countryCode } },
      create: { mapId, countryCode, status, source: 'MANUAL', firstVisitedOn: firstVisitedOn ?? null, notes: notes ?? null },
      update: {
        status,
        source: 'MANUAL',
        ...(firstVisitedOn !== undefined ? { firstVisitedOn } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      select: VISIT_SELECT,
    });
  const parent = PARENT_PLACE[countryCode];
  if (!parent || !COUNTED_VISIT_STATUSES.includes(status)) return { visit: await upsert(prisma), implied: [] };
  return prisma.$transaction(async (tx) => {
    const visit = await upsert(tx);
    const { count } = await createMissingVisits(mapId, [parent], 'MANUAL', tx);
    const implied = count
      ? await tx.countryVisit.findMany({ where: { mapId, countryCode: parent }, select: VISIT_SELECT })
      : [];
    return { visit, implied };
  });
};

export const deleteVisitInDB = (mapId, countryCode) =>
  prisma.countryVisit.deleteMany({ where: { mapId, countryCode } });

/** Mark countries visited where nothing is recorded yet (photos, completed trips). */
/**
 * A photo taken there or a completed trip proves a visit: missing countries are
 * added as VISITED, and "want to go" ones become VISITED. VISITED and LIVED
 * (set by hand or earlier) are left as they are.
 */
export const createMissingVisits = async (mapId, places, source, db = prisma) => {
  // The South Pole brings Antarctica with it (utils/specialPlaces.js)
  const countryCodes = withParentPlaces(places);
  if (!countryCodes.length) return { count: 0 };
  const upgraded = await db.countryVisit.updateMany({
    where: { mapId, countryCode: { in: countryCodes }, status: 'WANT_TO_GO' },
    data: { status: 'VISITED', source },
  });
  const created = await db.countryVisit.createMany({
    data: countryCodes.map((countryCode) => ({ mapId, countryCode, status: 'VISITED', source })),
    skipDuplicates: true,
  });
  return { count: upgraded.count + created.count };
};

// Stats inputs

export const findMapVisitsForStats = (mapId) =>
  prisma.countryVisit.findMany({ where: { mapId }, select: { countryCode: true, status: true } });

export const countMapPhotos = (mapId, { includeHidden }) =>
  prisma.photo.count({ where: { mapId, ...(includeHidden ? {} : { hidden: false }) } });

export const countMapConfirmedLandmarks = async (mapId, { includeHidden }) =>
  (
    await prisma.photoLandmark.findMany({
      where: { confirmed: true, photo: { mapId, ...(includeHidden ? {} : { hidden: false }) } },
      distinct: ['landmarkId'],
      select: { landmarkId: true },
    })
  ).length;

export const countMapTrips = (mapId) => prisma.trip.count({ where: { mapId } });

/**
 * Who went on each completed trip and where it stopped: `[{ travellerIds, countryCodes }]`.
 * Two flat queries side by side; a completed trip with neither travellers nor stops
 * adds nothing to the stats, so it's not listed.
 */
export const findCompletedTripsForStats = async (mapId) => {
  const completed = { mapId, status: 'COMPLETED' };
  const [travellers, stops] = await Promise.all([
    prisma.tripTraveller.findMany({ where: { trip: completed }, select: { tripId: true, travellerId: true } }),
    prisma.tripStop.findMany({ where: { trip: completed }, select: { tripId: true, countryCode: true } }),
  ]);
  const byTrip = new Map();
  const tripOf = (tripId) => {
    if (!byTrip.has(tripId)) byTrip.set(tripId, { travellerIds: [], countryCodes: [] });
    return byTrip.get(tripId);
  };
  for (const t of travellers) tripOf(t.tripId).travellerIds.push(t.travellerId);
  for (const s of stops) tripOf(s.tripId).countryCodes.push(s.countryCode);
  return [...byTrip.values()];
};

// Map members

const MEMBER_SELECT = { userId: true, role: true, user: { select: { name: true, email: true } } };

export const findMapMembers = (mapId) =>
  prisma.mapMember.findMany({ where: { mapId }, select: MEMBER_SELECT, orderBy: { createdAt: 'asc' } });

export const findMapMember = (mapId, userId) =>
  prisma.mapMember.findUnique({ where: { mapId_userId: { mapId, userId } }, select: { role: true } });

export const upsertMapMember = (mapId, userId, role) =>
  prisma.mapMember.upsert({
    where: { mapId_userId: { mapId, userId } },
    create: { mapId, userId, role },
    update: { role },
    select: MEMBER_SELECT,
  });

export const deleteMapMember = (mapId, userId) =>
  prisma.mapMember.deleteMany({ where: { mapId, userId } });

// Account deletion

/** Maps a user owns, with their longest-standing editor (if any). */
/** A user's maps with their editors, longest-standing first (to pick an heir on account deletion). */
export const findOwnedMapsWithFirstEditor = (userId) =>
  prisma.travelMap.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      members: {
        where: { role: 'EDITOR' },
        orderBy: { createdAt: 'asc' },
        select: { userId: true, user: { select: { isActive: true } } },
      },
    },
  });

/** Hand a map to one of its editors: they become owner, their member row goes. */
export const transferMapOwnership = (mapId, newOwnerId) =>
  prisma.$transaction([
    prisma.mapMember.deleteMany({ where: { mapId, userId: newOwnerId } }),
    // The new owner already has their own default map
    prisma.travelMap.update({ where: { id: mapId }, data: { ownerId: newOwnerId, isDefault: false, defaultForOwnerId: null } }),
  ]);
