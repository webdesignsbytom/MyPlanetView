// Friends challenges (docs/API.md, "Friends challenges"): the challenges, who's in them and
// the map that counts for each, and the counts. Thin Prisma queries; the rules are
// utils/challenges.js.
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { generateShareCode } from '../utils/shareCodes.js';
import { isSpecialPlace } from '../utils/specialPlaces.js';

const CHALLENGE_SELECT = {
  id: true,
  title: true,
  measure: true,
  startsOn: true,
  endsOn: true,
  target: true,
  joinCode: true,
  createdById: true,
  createdAt: true,
};

// A new join code, tried again on the (unlikely) clash with another challenge's
async function withFreshCode(write) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await write(generateShareCode());
    } catch (err) {
      const clash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && String(err.meta?.target).includes('joinCode');
      if (!clash) throw err;
    }
  }
  throw new Error('Could not make a unique join code');
}

/** Make a challenge with its creator in it, counting `mapId`. -> the challenge */
export const createChallengeInDB = ({ data, userId, mapId }) =>
  withFreshCode((joinCode) =>
    prisma.$transaction(async (tx) => {
      const challenge = await tx.friendChallenge.create({ data: { ...data, joinCode, createdById: userId }, select: CHALLENGE_SELECT });
      await tx.friendChallengeEntry.create({ data: { challengeId: challenge.id, userId, mapId } });
      return challenge;
    }),
  );

export const findChallengeById = (id) => prisma.friendChallenge.findUnique({ where: { id }, select: CHALLENGE_SELECT });

export const findChallengeByJoinCode = (joinCode) => prisma.friendChallenge.findUnique({ where: { joinCode }, select: CHALLENGE_SELECT });

/** The caller's place in a challenge: `{ mapId, joinedAt }`, or null when they're not in it. */
export const findChallengeEntry = (challengeId, userId) =>
  prisma.friendChallengeEntry.findUnique({ where: { challengeId_userId: { challengeId, userId } }, select: { mapId: true, joinedAt: true } });

/** Every challenge `userId` is in, newest first: `[{ challenge, mapId, joinedAt }]`. */
export const findUserChallenges = (userId) =>
  prisma.friendChallengeEntry.findMany({
    where: { userId },
    select: { mapId: true, joinedAt: true, challenge: { select: CHALLENGE_SELECT } },
    orderBy: { joinedAt: 'desc' },
  });

/** How many people are in each of `challengeIds`: Map(id -> count) (one groupBy). */
export async function countMembers(challengeIds) {
  if (!challengeIds.length) return new Map();
  const rows = await prisma.friendChallengeEntry.groupBy({ by: ['challengeId'], where: { challengeId: { in: challengeIds } }, _count: { _all: true } });
  return new Map(rows.map((row) => [row.challengeId, row._count._all]));
}

/** Who's in a challenge: `[{ userId, mapId, joinedAt, name }]`, in the order they joined. */
export async function findChallengeMembers(challengeId) {
  const rows = await prisma.friendChallengeEntry.findMany({
    where: { challengeId },
    select: { userId: true, mapId: true, joinedAt: true, user: { select: { name: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  return rows.map(({ user, ...row }) => ({ ...row, name: user?.name || 'Someone' }));
}

/**
 * Join a challenge counting `mapId`, unless it's full or the person is in too many (counted
 * with the challenge row locked, so two joins at once can't pass the cap together).
 * -> `{ joined: true }`, `{ joined: false }` (already in), `{ full: true }` or `{ tooMany: true }`
 */
export const joinChallengeInDB = ({ challengeId, userId, mapId, memberCap, perUserCap }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "friend_challenge" WHERE "id" = ${challengeId} FOR NO KEY UPDATE`;
    const existing = await tx.friendChallengeEntry.findUnique({ where: { challengeId_userId: { challengeId, userId } }, select: { userId: true } });
    if (existing) return { joined: false };
    if ((await tx.friendChallengeEntry.count({ where: { challengeId } })) >= memberCap) return { full: true };
    if ((await tx.friendChallengeEntry.count({ where: { userId } })) >= perUserCap) return { tooMany: true };
    await tx.friendChallengeEntry.create({ data: { challengeId, userId, mapId } });
    return { joined: true };
  });

export const setEntryMap = (challengeId, userId, mapId) =>
  prisma.friendChallengeEntry.update({ where: { challengeId_userId: { challengeId, userId } }, data: { mapId } });

/** -> true if they were in it */
export const deleteChallengeEntry = async (challengeId, userId) =>
  (await prisma.friendChallengeEntry.deleteMany({ where: { challengeId, userId } })).count > 0;

export const countUserChallenges = (userId) => prisma.friendChallengeEntry.count({ where: { userId } });

export const updateChallengeInDB = (id, data) => prisma.friendChallenge.update({ where: { id }, data, select: CHALLENGE_SELECT });

export const resetJoinCodeInDB = (id) =>
  withFreshCode((joinCode) => prisma.friendChallenge.update({ where: { id }, data: { joinCode }, select: CHALLENGE_SELECT }));

export const deleteChallengeInDB = (id) => prisma.friendChallenge.delete({ where: { id } });

/**
 * Which of `pairs` (`[{ userId, mapId }]`) still hold: the user owns the map or edits it.
 * -> Set of "userId:mapId" (two flat queries, whatever the number of people)
 */
export async function mapsStillTheirs(pairs) {
  const wanted = pairs.filter((p) => p.mapId);
  if (!wanted.length) return new Set();
  const mapIds = [...new Set(wanted.map((p) => p.mapId))];
  const userIds = [...new Set(wanted.map((p) => p.userId))];
  const [maps, editors] = await Promise.all([
    prisma.travelMap.findMany({ where: { id: { in: mapIds } }, select: { id: true, ownerId: true } }),
    prisma.mapMember.findMany({ where: { mapId: { in: mapIds }, userId: { in: userIds }, role: 'EDITOR' }, select: { mapId: true, userId: true } }),
  ]);
  const ok = new Set([...maps.map((m) => `${m.ownerId}:${m.id}`), ...editors.map((e) => `${e.userId}:${e.mapId}`)]);
  return new Set(wanted.map((p) => `${p.userId}:${p.mapId}`).filter((key) => ok.has(key)));
}

/** Can `userId` count `mapId` (they own it, or edit it)? */
export const canCountMap = async (userId, mapId) => (await mapsStillTheirs([{ userId, mapId }])).size === 1;

export const findMapName = async (mapId) => (await prisma.travelMap.findUnique({ where: { id: mapId }, select: { name: true } }))?.name ?? null;

// Counting: the dates each counted item counted, from the map's own data (hidden photos too)

const firstShotByCountry = (where) =>
  prisma.photo.groupBy({ by: ['countryCode'], where: { countryCode: { not: null }, ...where }, _min: { shotAt: true } });

const countriesOnly = (rows) => rows.filter((row) => !isSpecialPlace(row.countryCode)).map((row) => row._min.shotAt);

const COUNTERS = {
  // Countries whose first-ever photo on the map was taken in the dates
  NEW_COUNTRIES: async (mapId, { from, before }) =>
    countriesOnly(await firstShotByCountry({ mapId })).filter((at) => at >= from && at < before),
  // Countries with a photo taken in the dates (the first one there counts its date)
  COUNTRIES: async (mapId, { from, before }) => countriesOnly(await firstShotByCountry({ mapId, shotAt: { gte: from, lt: before } })),
  // Landmarks confirmed on a photo taken in the dates
  LANDMARKS: async (mapId, { from, before }) => {
    const rows = await prisma.photoLandmark.findMany({
      where: { mapId, confirmedAt: { not: null }, photo: { shotAt: { gte: from, lt: before } } },
      select: { landmarkId: true, photo: { select: { shotAt: true } } },
    });
    const first = new Map();
    for (const row of rows) {
      const seen = first.get(row.landmarkId);
      if (!seen || row.photo.shotAt < seen) first.set(row.landmarkId, row.photo.shotAt);
    }
    return [...first.values()];
  },
  // Photos entered in the monthly themes in the dates
  THEME_PHOTOS: async (mapId, { from, before }) =>
    (await prisma.photoThemeEntry.findMany({ where: { mapId, enteredAt: { gte: from, lt: before } }, select: { enteredAt: true } })).map(
      (row) => row.enteredAt,
    ),
};

/** The dates a map's counted items counted for `measure` within `window` (`{ from, before }`). */
export const countedDates = (measure, mapId, window) => COUNTERS[measure](mapId, window);
