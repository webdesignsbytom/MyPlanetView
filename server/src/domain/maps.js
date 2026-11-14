import { prisma } from '../prisma.js';
import { COUNTED_VISIT_STATUSES } from '../utils/travelValidation.js';

// Maps, travellers, visits, map members

// Enough to decide the caller's role
const mapAccessSelect = (userId) => ({
  id: true,
  ownerId: true,
  name: true,
  groupType: true,
  isDefault: true,
  linkAccess: true,
  shareCode: true,
  ...(userId ? { members: { where: { userId }, select: { role: true } } } : {}),
});

export const findMapAccess = (mapId, userId) =>
  prisma.travelMap.findUnique({ where: { id: mapId }, select: mapAccessSelect(userId) });

export const findMapAccessByShareCode = (shareCode, userId) =>
  prisma.travelMap.findUnique({ where: { shareCode }, select: mapAccessSelect(userId) });

const mapSummarySelect = {
  id: true,
  name: true,
  groupType: true,
  isDefault: true,
  ownerId: true,
  createdAt: true,
  owner: { select: { name: true } },
  _count: {
    select: {
      visits: { where: { status: { in: [...COUNTED_VISIT_STATUSES] } } },
      photos: true,
      trips: true,
    },
  },
};

export const findOwnedMaps = (userId) =>
  prisma.travelMap.findMany({
    where: { ownerId: userId },
    select: mapSummarySelect,
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });

export const findMemberMaps = (userId) =>
  prisma.mapMember.findMany({
    where: { userId },
    select: { role: true, map: { select: mapSummarySelect } },
    orderBy: { createdAt: 'asc' },
  });

export const findDefaultMap = (userId) =>
  prisma.travelMap.findFirst({ where: { ownerId: userId, isDefault: true }, select: { id: true } });

export const findMapDetail = (mapId) =>
  prisma.travelMap.findUnique({
    where: { id: mapId },
    select: {
      id: true,
      name: true,
      groupType: true,
      isDefault: true,
      ownerId: true,
      owner: { select: { name: true } },
      travellers: {
        select: { id: true, name: true, position: true, userId: true, birthCountryCode: true, favouriteCountryCode: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      },
      visits: {
        select: { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true },
        orderBy: { countryCode: 'asc' },
      },
    },
  });

/** A new map with its travellers (one transaction). */
export const createMapInDB = ({ ownerId, name, groupType, isDefault = false, shareCode, travellers }) =>
  prisma.travelMap.create({
    data: {
      ownerId,
      name,
      groupType,
      isDefault,
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

/** Every stored file of every photo on a map (read before deleting the map). */
export const findMapPhotoKeys = async (mapId) => {
  const variants = await prisma.photoVariant.findMany({
    where: { photo: { mapId } },
    select: { media: { select: { key: true } } },
  });
  return variants.map((v) => v.media.key);
};

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

export const upsertVisitInDB = ({ mapId, countryCode, status, firstVisitedOn, notes }) =>
  prisma.countryVisit.upsert({
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

export const deleteVisitInDB = (mapId, countryCode) =>
  prisma.countryVisit.deleteMany({ where: { mapId, countryCode } });

/** Mark countries visited where nothing is recorded yet (photos, completed trips). */
/**
 * A photo taken there or a completed trip proves a visit: missing countries are
 * added as VISITED, and "want to go" ones become VISITED. VISITED and LIVED
 * (set by hand or earlier) are left as they are.
 */
export const createMissingVisits = async (mapId, countryCodes, source, db = prisma) => {
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

export const findCompletedTripsForStats = (mapId) =>
  prisma.trip.findMany({
    where: { mapId, status: 'COMPLETED' },
    select: { travellers: { select: { travellerId: true } }, stops: { select: { countryCode: true } } },
  });

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
    prisma.travelMap.update({ where: { id: mapId }, data: { ownerId: newOwnerId, isDefault: false } }),
  ]);
