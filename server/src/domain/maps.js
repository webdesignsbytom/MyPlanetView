import { prisma } from '../prisma.js';
import { COUNTED_VISIT_STATUSES, MAX_TRAVELLERS, maxTravellersFor } from '../utils/travelValidation.js';
import { PARENT_PLACE, SPECIAL_PLACE_CODES, withParentPlaces } from '../utils/specialPlaces.js';
import { UK, UK_NATION_CODES } from '../utils/ukNations.js';
import { REGION_CODES } from '../utils/regionPlaces.js';
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
  // Which places its writes go to (utils/ukNations.js placeOnMap)
  splitUk: true,
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
  // Which of an owner's maps are on their plan, on Economy or locked (utils/mapSlots.js); shown to the owner only
  graceUntil: true,
  upgradedAt: true,
  owner: { select: { name: true } },
};

/** The ids of these maps with the UK and at least one of its nations both counted as visited. */
async function mapsWithUkAndNations(ids) {
  if (!ids.length) return new Set();
  const rows = await prisma.countryVisit.findMany({
    where: { mapId: { in: ids }, status: { in: [...COUNTED_VISIT_STATUSES] }, countryCode: { in: [UK, ...UK_NATION_CODES] } },
    select: { mapId: true, countryCode: true },
  });
  const withUk = new Set(rows.filter((r) => r.countryCode === UK).map((r) => r.mapId));
  return new Set(rows.filter((r) => r.countryCode !== UK && withUk.has(r.mapId)).map((r) => r.mapId));
}

/**
 * Adds `counts: { countries, photos, trips }` to each map, counted over these
 * maps' ids only (see domain/counts.js). `includeHidden[i]`: whether map i's
 * hidden photos count (the caller is its owner or an editor).
 */
async function withMapCounts(maps, includeHidden) {
  const ids = maps.map((m) => m.id);
  const [countries, ukBoth, photos, trips, linkedTrips] = await Promise.all([
    // Countries only: special places (Antarctica, the poles) and regions (Bali, Tasmania)
    // have their own stats
    countPerParent('countryVisit', 'mapId', ids, {
      status: { in: [...COUNTED_VISIT_STATUSES] },
      countryCode: { notIn: [...SPECIAL_PLACE_CODES, ...REGION_CODES] },
    }),
    // A map with the UK marked and some of its nations too (the UK from before the split,
    // not yet given its nations) counts the nations, not the UK as well (utils/ukNations.js)
    mapsWithUkAndNations(ids),
    countPhotosPer('mapId', ids, includeHidden),
    countPerParent('trip', 'mapId', ids),
    // Group trips added to these maps count too (their photos don't: they stay on the
    // organiser's map)
    countPerParent('tripMap', 'mapId', ids),
  ]);
  return maps.map((m) => ({
    ...m,
    counts: {
      countries: (countries.get(m.id) ?? 0) - (ukBoth.has(m.id) ? 1 : 0),
      photos: photos.get(m.id) ?? 0,
      trips: (trips.get(m.id) ?? 0) + (linkedTrips.get(m.id) ?? 0),
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

/** Whether a map shows the UK as its four nations (false for a map that's gone). */
export const findMapSplitUk = async (mapId) =>
  Boolean((await prisma.travelMap.findUnique({ where: { id: mapId }, select: { splitUk: true } }))?.splitUk);

/** What the stats need of the map row: `{ splitUk, homeCountryCode, ownerId }`, or null. */
export const findMapStatsRow = (mapId) =>
  prisma.travelMap.findUnique({ where: { id: mapId }, select: { splitUk: true, homeCountryCode: true, ownerId: true } });

/**
 * The whole map: its row, owner's name and map settings (the style the map is shown in when
 * it has none of its own), travellers and visits. Five flat queries run side by side (a
 * nested select reads the map first, then the rest).
 */
export const findMapDetail = async (mapId) => {
  const [map, owner, ownerProfile, travellers, visits] = await Promise.all([
    prisma.travelMap.findUnique({
      where: { id: mapId },
      select: { id: true, name: true, groupType: true, isDefault: true, ownerId: true, splitUk: true, homeCountryCode: true, style: true, visitedLook: true, visitedColour: true, visitedFinish: true },
    }),
    prisma.user.findFirst({ where: { ownedMaps: { some: { id: mapId } } }, select: { name: true } }),
    prisma.profile.findFirst({ where: { user: { ownedMaps: { some: { id: mapId } } } }, select: { mapSettings: true } }),
    prisma.traveller.findMany({
      where: { mapId },
      select: { id: true, name: true, lastName: true, position: true, userId: true, nationalityCode: true, birthCountryCode: true, favouriteCountryCode: true, birthDate: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.countryVisit.findMany({
      where: { mapId },
      select: { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true, createdAt: true },
      orderBy: { countryCode: 'asc' },
    }),
  ]);
  return map && { ...map, owner, ownerSettings: ownerProfile?.mapSettings ?? null, travellers, visits };
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
          lastName: t.lastName ?? null,
          nationalityCode: t.nationalityCode ?? null,
          position: index,
          userId: t.userId ?? null,
          birthCountryCode: t.birthCountryCode ?? null,
          favouriteCountryCode: t.favouriteCountryCode ?? null,
          birthDate: t.birthDate ?? null,
        })),
      },
    },
    select: { id: true },
  });

/**
 * Change a map's fields. A new kind (`groupType`) is checked against its travellers with the
 * map row locked, so a traveller added at the same moment can't take it past the new kind's
 * room. -> `{ ok: true }`, or `{ tooMany: true }` (nothing changed)
 */
export const updateMapInDB = (mapId, data) =>
  prisma.$transaction(async (tx) => {
    if (data.groupType) {
      await lockMap(tx, mapId);
      if ((await tx.traveller.count({ where: { mapId } })) > maxTravellersFor(data.groupType)) return { tooMany: true };
    }
    await tx.travelMap.update({ where: { id: mapId }, data, select: { id: true } });
    return { ok: true };
  });

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

export const countTravellers = (mapId, db = prisma) => db.traveller.count({ where: { mapId } });

export const findMapTravellers = (mapId) =>
  prisma.traveller.findMany({
    where: { mapId },
    // The account and birth country find the map's home when it has none set (utils/travelStats.js
    // homeOf); the date of birth, each traveller's share of a life away (editors' stats)
    select: { id: true, name: true, userId: true, birthCountryCode: true, birthDate: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

export const findTravellerIds = async (mapId) =>
  (await prisma.traveller.findMany({ where: { mapId }, select: { id: true } })).map((t) => t.id);

export const findTraveller = (mapId, travellerId) =>
  prisma.traveller.findFirst({ where: { id: travellerId, mapId }, select: { id: true, name: true, birthCountryCode: true } });

const TRAVELLER_SELECT = {
  id: true,
  name: true,
  lastName: true,
  nationalityCode: true,
  position: true,
  userId: true,
  birthCountryCode: true,
  favouriteCountryCode: true,
  birthDate: true,
};

// A map's row locked while its travellers are counted (FOR NO KEY UPDATE), so two adds, two
// removals, or an add and a change of kind at the same moment can't pass a cap together
// (19 Nov 2026, the audit)
const lockMap = (tx, mapId) => tx.$queryRaw`SELECT "groupType"::text AS "groupType" FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;

/**
 * A new traveller, last in order, unless the map is full: `{ traveller }`, or
 * `{ full: 'total' }` (MAX_TRAVELLERS) or `{ full: <the map's kind> }` (maxTravellersFor).
 */
export const createTravellerInDB = (mapId, data) =>
  prisma.$transaction(async (tx) => {
    const [map] = await lockMap(tx, mapId);
    const count = await tx.traveller.count({ where: { mapId } });
    if (count >= MAX_TRAVELLERS) return { full: 'total' };
    if (count >= maxTravellersFor(map?.groupType)) return { full: map.groupType };
    return { traveller: await tx.traveller.create({ data: { ...data, mapId, position: count }, select: TRAVELLER_SELECT }) };
  });

export const updateTravellerInDB = (travellerId, data) =>
  prisma.traveller.update({ where: { id: travellerId }, data, select: TRAVELLER_SELECT });

/** Remove a traveller, never the map's last one. -> `{ deleted }` (false when not there), or `{ last: true }` */
export const deleteTravellerInDB = (mapId, travellerId) =>
  prisma.$transaction(async (tx) => {
    await lockMap(tx, mapId);
    const travellers = await tx.traveller.count({ where: { mapId } });
    if (travellers <= 1) return { last: true };
    // A co-owner is their traveller, and the owner keeps one (19 Nov 2026): a co-owner's, or
    // one invited as a co-owner, stays until that's taken away; the rest stay one more
    // than the co-owners
    const traveller = await tx.traveller.findFirst({ where: { id: travellerId, mapId }, select: { userId: true } });
    if (!traveller) return { deleted: false };
    const now = new Date();
    const [ownCoOwner, invited, coOwners] = await Promise.all([
      traveller.userId ? tx.mapMember.count({ where: { mapId, userId: traveller.userId, role: 'CO_OWNER' } }) : 0,
      tx.shareInvite.count({ where: { travellerId, ...pendingInvite(now) } }),
      countMapCoOwnerSeats(mapId, {}, tx),
    ]);
    if (ownCoOwner || invited) return { coOwner: true };
    if (travellers - 1 < coOwners + 1) return { coOwnerRoom: true };
    const { count } = await tx.traveller.deleteMany({ where: { id: travellerId, mapId } });
    return { deleted: count > 0 };
  });

// Visits

const VISIT_SELECT = { countryCode: true, status: true, source: true, firstVisitedOn: true, notes: true, createdAt: true };

/**
 * Set a visit by hand -> { visit, implied }. Visiting a place inside another (the South
 * Pole, in Antarctica) also visits that one, in the same transaction: `implied` is those
 * visits as they now are, when the rule changed them (else []).
 */
export const upsertVisitInDB = async ({ mapId, countryCode, status, firstVisitedOn, notes }) => {
  const upsert = async (db) => {
    // A new or changed status is the person's own (MANUAL); saving only a note or a date
    // keeps where the visit came from (a completed trip, a photo)
    const current = await db.countryVisit.findUnique({
      where: { mapId_countryCode: { mapId, countryCode } },
      select: { status: true },
    });
    const sameStatus = current?.status === status;
    // A wish become a visit was marked visited now (24 Nov 2026): its row's `createdAt` is when
    // the place joined the map as visited, which orders the passport's pages and the strings
    const nowVisited = Boolean(current) && !COUNTED_VISIT_STATUSES.includes(current.status) && COUNTED_VISIT_STATUSES.includes(status);
    return db.countryVisit.upsert({
      where: { mapId_countryCode: { mapId, countryCode } },
      create: { mapId, countryCode, status, source: 'MANUAL', firstVisitedOn: firstVisitedOn ?? null, notes: notes ?? null },
      update: {
        status,
        ...(sameStatus ? {} : { source: 'MANUAL' }),
        ...(nowVisited ? { createdAt: new Date() } : {}),
        ...(firstVisitedOn !== undefined ? { firstVisitedOn } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      select: VISIT_SELECT,
    });
  };
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
  // A wish become a visit was marked visited now (24 Nov 2026; upsertVisitInDB)
  const upgraded = await db.countryVisit.updateMany({
    where: { mapId, countryCode: { in: countryCodes }, status: 'WANT_TO_GO' },
    data: { status: 'VISITED', source, createdAt: new Date() },
  });
  const created = await db.countryVisit.createMany({
    data: countryCodes.map((countryCode) => ({ mapId, countryCode, status: 'VISITED', source })),
    skipDuplicates: true,
  });
  return { count: upgraded.count + created.count };
};

// Stats inputs

// With each visit's dates, for goals with a deadline (utils/goals.js)
export const findMapVisitsForStats = (mapId) =>
  prisma.countryVisit.findMany({ where: { mapId }, select: { countryCode: true, status: true, firstVisitedOn: true, createdAt: true } });

export const countMapPhotos = (mapId, { includeHidden }) =>
  prisma.photo.count({ where: { mapId, ...(includeHidden ? {} : { hidden: false }) } });

/**
 * The `n`th photo (or video) put on the map, as countMapPhotos counts them (a photo badge's
 * story: the one that reached its count), or null. Oldest upload first, on the
 * `[mapId, createdAt, id]` index.
 */
export const findNthPhoto = (mapId, n, { includeHidden }) =>
  prisma.photo.findFirst({
    where: { mapId, ...(includeHidden ? {} : { hidden: false }) },
    select: { id: true, kind: true, countryCode: true, takenAt: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    skip: Math.max(0, n - 1),
  });

/**
 * The landmarks a map has stamped with a photo: those with a confirmed photo (never a
 * video: a video can't be matched). A landmark ticked "been here" is a stamp too (23 Nov
 * 2026; landmarkVisits.js findTickedLandmarkIds): the stats count both, and the map marks
 * both pins.
 */
export const findMapStampedLandmarkIds = async (mapId, { includeHidden }) =>
  (
    // Grouped by Postgres: Prisma's `distinct` would fetch every match and drop the repeats
    // itself (19 Nov 2026, the audit)
    await prisma.photoLandmark.groupBy({
      by: ['landmarkId'],
      // The match's own mapId (index [mapId, landmarkId]); viewers' only from visible photos
      where: { mapId, confirmed: true, ...(includeHidden ? {} : { photo: { hidden: false } }) },
    })
  ).map((row) => row.landmarkId);

/** The map's own trips plus the group trips added to it ("Add to my map"). */
export const countMapTrips = async (mapId) => {
  const [own, linked] = await Promise.all([
    prisma.trip.count({ where: { mapId } }),
    prisma.tripMap.count({ where: { mapId } }),
  ]);
  return own + linked;
};

/**
 * Each completed trip of the map's own, for the stats: who went, where it stopped (each
 * stop's place, dates, position and its landmark's position), its dates, and its id and
 * title (the longest trip): `[{ id, title, travellerIds, countryCodes, startDate, endDate,
 * stops }]`. Three flat queries side by side.
 */
export const findCompletedTripsForStats = async (mapId) => {
  const completed = { mapId, status: 'COMPLETED' };
  const [trips, travellers, stops] = await Promise.all([
    prisma.trip.findMany({ where: completed, select: { id: true, title: true, startDate: true, endDate: true } }),
    prisma.tripTraveller.findMany({ where: { trip: completed }, select: { tripId: true, travellerId: true } }),
    prisma.tripStop.findMany({
      where: { trip: completed },
      select: {
        tripId: true,
        position: true,
        countryCode: true,
        arriveOn: true,
        leaveOn: true,
        landmark: { select: { latitude: true, longitude: true } },
      },
      orderBy: [{ tripId: 'asc' }, { position: 'asc' }],
    }),
  ]);
  const byTrip = new Map(
    trips.map((t) => [t.id, { id: t.id, title: t.title, travellerIds: [], countryCodes: [], startDate: t.startDate, endDate: t.endDate, stops: [] }]),
  );
  for (const t of travellers) byTrip.get(t.tripId)?.travellerIds.push(t.travellerId);
  for (const { tripId, ...stop } of stops) {
    const trip = byTrip.get(tripId);
    if (!trip) continue;
    trip.countryCodes.push(stop.countryCode);
    trip.stops.push(stop);
  }
  return [...byTrip.values()];
};

// Map members

const MEMBER_SELECT = { userId: true, role: true, user: { select: { name: true, email: true } } };

/** A map's members, longest-standing first, each with the traveller they are on it (co-owners). */
export const findMapMembers = (mapId) =>
  prisma.mapMember.findMany({
    where: { mapId },
    select: { ...MEMBER_SELECT, user: { select: { name: true, email: true, travellerOf: { where: { mapId }, select: { id: true, name: true }, take: 1 } } } },
    orderBy: { createdAt: 'asc' },
  });

export const findMapMember = (mapId, userId) =>
  prisma.mapMember.findUnique({ where: { mapId_userId: { mapId, userId } }, select: { role: true } });

export const upsertMapMember = (mapId, userId, role, db = prisma) =>
  db.mapMember.upsert({
    where: { mapId_userId: { mapId, userId } },
    create: { mapId, userId, role },
    update: { role },
    select: MEMBER_SELECT,
  });

/**
 * Someone leaves a map, or is removed from it: their MapMember row goes, and so do the links
 * they added to its trips on their own maps ("Add to my map"), unless they're on that trip
 * themselves (a TripMember), which keeps it theirs to open (17 Nov 2026, the audit: the
 * trips stayed on their maps, and kept marking visits there). The visits already marked
 * stay. One transaction. -> `{ count }` (member rows removed)
 */
export const deleteMapMember = async (mapId, userId) => {
  const [, member] = await prisma.$transaction([
    prisma.tripMap.deleteMany({ where: { addedById: userId, trip: { mapId, members: { none: { userId } } } } }),
    prisma.mapMember.deleteMany({ where: { mapId, userId } }),
    // A co-owner's traveller stays on the map, with no login (19 Nov 2026)
    prisma.traveller.updateMany({ where: { mapId, userId }, data: { userId: null } }),
  ]);
  return member;
};

// Transferring a map, and account deletion

/**
 * A user's maps with everyone added to them, longest-standing first: to choose who
 * takes each one when they leave (GET /users/leaving-options, and the heir on account
 * deletion). -> `[{ id, name, isDefault, members: [{ userId, role, user: { name, isActive } }] }]`
 */
export const findOwnedMapsWithMembers = (userId) =>
  prisma.travelMap.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      isDefault: true,
      members: {
        orderBy: { createdAt: 'asc' },
        select: { userId: true, role: true, user: { select: { name: true, isActive: true } } },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });

/**
 * Make `toUserId` a map's owner, in one transaction: their member row goes, the map
 * stops being anyone's default (the new owner has their own), `graceUntil` is set (or
 * cleared), and with `keepOldOwnerAsEditor` the old owner becomes an EDITOR member.
 * -> `{ fromUserId, wasDefault }`, or null when the map doesn't exist
 */
export const transferMapInDB = ({ mapId, toUserId, keepOldOwnerAsEditor = false, graceUntil = null }) =>
  prisma.$transaction(async (tx) => {
    const map = await tx.travelMap.findUnique({ where: { id: mapId }, select: { ownerId: true, isDefault: true } });
    if (!map) return null;
    const before = await tx.mapMember.findUnique({ where: { mapId_userId: { mapId, userId: toUserId } }, select: { role: true } });
    await tx.mapMember.deleteMany({ where: { mapId, userId: toUserId } });
    // isDefault and defaultForOwnerId change together (the travel_map_default_owner CHECK)
    await tx.travelMap.update({
      where: { id: mapId },
      data: { ownerId: toUserId, isDefault: false, defaultForOwnerId: null, graceUntil },
    });
    if (keepOldOwnerAsEditor && map.ownerId !== toUserId) {
      // Handed to a co-owner, the two swap places when the old owner is one of the travellers
      // (co-owners are travellers; 19 Nov 2026), so the count of co-owners stays the same
      const isTraveller = await tx.traveller.count({ where: { mapId, userId: map.ownerId } });
      const role = before?.role === 'CO_OWNER' && isTraveller ? 'CO_OWNER' : 'EDITOR';
      await tx.mapMember.upsert({
        where: { mapId_userId: { mapId, userId: map.ownerId } },
        create: { mapId, userId: map.ownerId, role },
        update: { role },
      });
    } else if (map.ownerId !== toUserId) {
      // Gone from the map: their traveller stays, with no login
      await tx.traveller.updateMany({ where: { mapId, userId: map.ownerId }, data: { userId: null } });
      // Leaving the map: the links they added to its trips on their other maps go too,
      // unless they're on that trip themselves, as when a member is removed (deleteMapMember;
      // 19 Nov 2026, the audit). The visits already marked stay.
      await tx.tripMap.deleteMany({ where: { addedById: map.ownerId, trip: { mapId, members: { none: { userId: map.ownerId } } } } });
    }
    return { fromUserId: map.ownerId, wasDefault: map.isDefault };
  });

/**
 * Make one of an owner's maps their default (the included one), in one transaction:
 * the old default is cleared first, so the unique defaultForOwnerId and the CHECK hold
 * after each statement.
 */
export const makeDefaultMapInDB = (mapId, ownerId) =>
  prisma.$transaction(async (tx) => {
    await tx.travelMap.updateMany({
      where: { ownerId, isDefault: true, id: { not: mapId } },
      data: { isDefault: false, defaultForOwnerId: null },
    });
    await tx.travelMap.update({ where: { id: mapId }, data: { isDefault: true, defaultForOwnerId: ownerId } });
  });

// Caps on people (utils/planLimits.js). The person being added is left out, so adding
// someone already counted changes nothing; `except*` are only applied when given (a
// filter on undefined would mean no filter at all, which is what we want then anyway).

const pendingInvite = (now) => ({ acceptedAt: null, expiresAt: { gt: now } });

/** A map's editors: EDITOR members plus pending EDITOR invites. */
export const countMapEditorSeats = async (mapId, { exceptUserId, exceptEmail } = {}, db = prisma) => {
  const now = new Date();
  const [members, invites] = await Promise.all([
    db.mapMember.count({ where: { mapId, role: 'EDITOR', ...(exceptUserId ? { userId: { not: exceptUserId } } : {}) } }),
    db.shareInvite.count({
      where: { mapId, role: 'EDITOR', ...pendingInvite(now), ...(exceptEmail ? { email: { not: exceptEmail } } : {}) },
    }),
  ]);
  return members + invites;
};

/** The owner's choice to put a map on their plan (POST /maps/:mapId/upgrade), or taking it back (null). */
export const setMapUpgradedInDB = (mapId, upgradedAt) => prisma.travelMap.update({ where: { id: mapId }, data: { upgradedAt } });

/** A map's co-owners: CO_OWNER members plus pending CO_OWNER invites. */
export const countMapCoOwnerSeats = async (mapId, { exceptUserId, exceptEmail } = {}, db = prisma) => {
  const now = new Date();
  const [members, invites] = await Promise.all([
    db.mapMember.count({ where: { mapId, role: 'CO_OWNER', ...(exceptUserId ? { userId: { not: exceptUserId } } : {}) } }),
    db.shareInvite.count({
      where: { mapId, role: 'CO_OWNER', ...pendingInvite(now), ...(exceptEmail ? { email: { not: exceptEmail } } : {}) },
    }),
  ]);
  return members + invites;
};

/** A trip's people: members of any role plus pending invites. */
export const countTripSeats = async (tripId, { exceptUserId, exceptEmail } = {}, db = prisma) => {
  const now = new Date();
  const [members, invites] = await Promise.all([
    db.tripMember.count({ where: { tripId, ...(exceptUserId ? { userId: { not: exceptUserId } } : {}) } }),
    db.shareInvite.count({ where: { tripId, ...pendingInvite(now), ...(exceptEmail ? { email: { not: exceptEmail } } : {}) } }),
  ]);
  return members + invites;
};
