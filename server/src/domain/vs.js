// Vs mode (docs/API.md "Vs mode"): the comparisons, who's in them and the map that counts for
// each. Thin Prisma queries; the rules are utils/vs.js. Whether a map is still someone's to
// count is the friends challenges' rule (domain/challenges.js mapsStillTheirs).
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { generateShareCode } from '../utils/shareCodes.js';

const GROUP_SELECT = { id: true, title: true, joinCode: true, createdById: true, createdAt: true };

// A new join code, tried again on the (unlikely) clash with another comparison's
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

// The person's row locked while their comparisons are counted, so two at once can't pass the cap
const lockPerson = (tx, userId) => tx.$queryRaw`SELECT 1 FROM "user" WHERE "id" = ${userId} FOR NO KEY UPDATE`;

/**
 * A comparison made with its starter in it, counting `mapId`, unless they're in `perUserCap`
 * already. -> `{ group }`, or `{ tooMany: true }`
 */
export const createVsGroupInDB = ({ title, userId, mapId, perUserCap }) =>
  withFreshCode((joinCode) =>
    prisma.$transaction(async (tx) => {
      await lockPerson(tx, userId);
      if ((await tx.vsMember.count({ where: { userId } })) >= perUserCap) return { tooMany: true };
      const group = await tx.vsGroup.create({ data: { title, joinCode, createdById: userId }, select: GROUP_SELECT });
      await tx.vsMember.create({ data: { groupId: group.id, userId, mapId } });
      return { group };
    }),
  );

export const findVsGroupById = (id) => prisma.vsGroup.findUnique({ where: { id }, select: GROUP_SELECT });
export const findVsGroupByJoinCode = (joinCode) => prisma.vsGroup.findUnique({ where: { joinCode }, select: GROUP_SELECT });

/** The caller's place in a comparison: `{ mapId, joinedAt }`, or null when they're not in it. */
export const findVsMember = (groupId, userId) =>
  prisma.vsMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { mapId: true, joinedAt: true } });

/** Everyone in a comparison, in the order they joined: `[{ userId, mapId, joinedAt, name }]`. */
export async function findVsMembers(groupId) {
  const rows = await prisma.vsMember.findMany({
    where: { groupId },
    select: { userId: true, mapId: true, joinedAt: true, user: { select: { name: true } } },
    orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }],
  });
  return rows.map(({ user, ...row }) => ({ ...row, name: user?.name || 'Someone' }));
}

/** Every comparison `userId` is in, newest joined first: `[{ group, mapId, joinedAt }]`. */
export const findUserVsGroups = (userId) =>
  prisma.vsMember.findMany({ where: { userId }, select: { mapId: true, joinedAt: true, group: { select: GROUP_SELECT } }, orderBy: { joinedAt: 'desc' } });

/** How many people are in each of `groupIds`: Map(id -> count) (one groupBy). */
export async function countVsMembers(groupIds) {
  if (!groupIds.length) return new Map();
  const rows = await prisma.vsMember.groupBy({ by: ['groupId'], where: { groupId: { in: groupIds } }, _count: { _all: true } });
  return new Map(rows.map((row) => [row.groupId, row._count._all]));
}

/**
 * Join a comparison counting `mapId`, unless it's full or the person is in too many (counted
 * with the comparison's row locked, so two joins at once can't pass the cap together).
 * -> `{ joined: true }`, `{ joined: false }` (already in), `{ full: true }` or `{ tooMany: true }`
 */
export const joinVsGroupInDB = ({ groupId, userId, mapId, memberCap, perUserCap }) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "vs_group" WHERE "id" = ${groupId} FOR NO KEY UPDATE`;
    await lockPerson(tx, userId);
    const existing = await tx.vsMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { userId: true } });
    if (existing) return { joined: false };
    if ((await tx.vsMember.count({ where: { groupId } })) >= memberCap) return { full: true };
    if ((await tx.vsMember.count({ where: { userId } })) >= perUserCap) return { tooMany: true };
    await tx.vsMember.create({ data: { groupId, userId, mapId } });
    return { joined: true };
  });

export const setVsMemberMap = (groupId, userId, mapId) => prisma.vsMember.update({ where: { groupId_userId: { groupId, userId } }, data: { mapId } });

/** -> true if they were in it */
export const deleteVsMember = async (groupId, userId) => (await prisma.vsMember.deleteMany({ where: { groupId, userId } })).count > 0;

export const updateVsGroupInDB = (id, data) => prisma.vsGroup.update({ where: { id }, data, select: GROUP_SELECT });
export const resetVsJoinCodeInDB = (id) => withFreshCode((joinCode) => prisma.vsGroup.update({ where: { id }, data: { joinCode }, select: GROUP_SELECT }));
export const deleteVsGroupInDB = (id) => prisma.vsGroup.delete({ where: { id } });

/** What's compared that the map's stats don't hold: Life's One Shots, badges earned and flights. */
export const findVsExtras = async (mapId) => {
  const [oneShots, badges, flights] = await Promise.all([
    prisma.oneShot.count({ where: { mapId } }),
    prisma.badgeAward.findMany({ where: { mapId }, select: { badgeKey: true }, orderBy: { earnedAt: 'asc' } }),
    prisma.flight.count({ where: { mapId } }),
  ]);
  return { oneShots, badgeKeys: badges.map((b) => b.badgeKey), flights };
};

/** How many of `landmarkIds` are World Heritage Sites. */
export const countWorldHeritage = (landmarkIds) =>
  landmarkIds.length ? prisma.landmark.count({ where: { id: { in: landmarkIds }, isUnesco: true } }) : 0;
