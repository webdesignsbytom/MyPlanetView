// "Guess where I was" (docs/API.md "Guess where I was"): games, their photos and plays. Thin
// Prisma queries; the rules are utils/guessGames.js.
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { generateShareCode } from '../utils/shareCodes.js';
import { GUESS_LEADERBOARD_SIZE } from '../utils/guessGames.js';

const GAME_SELECT = { id: true, mapId: true, code: true, title: true, photoIds: true, createdById: true, createdAt: true };

// A new code, tried again on the (unlikely) clash with another game's
async function withFreshCode(write) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await write(generateShareCode());
    } catch (err) {
      const clash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && String(err.meta?.target).includes('code');
      if (!clash) throw err;
    }
  }
  throw new Error('Could not make a unique game code');
}

// What a game's round can show: one of the map's photos, not a video, not hidden, placed
const playableWhere = (mapId, photoIds) => ({ id: { in: photoIds }, mapId, kind: 'PHOTO', hidden: false, countryCode: { not: null } });

/** How many of `photoIds` a game on this map can use. */
export const countPlayablePhotos = (mapId, photoIds) => prisma.photo.count({ where: playableWhere(mapId, photoIds) });

/**
 * A game made, unless the map has `cap` already (counted with the map's row locked, as every
 * cap is). -> `{ game }`, or `{ tooMany: true }`
 */
export const createGuessGameInDB = ({ mapId, title, photoIds, createdById, cap }) =>
  withFreshCode((code) =>
    prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "travel_map" WHERE "id" = ${mapId} FOR NO KEY UPDATE`;
      if ((await tx.guessGame.count({ where: { mapId } })) >= cap) return { tooMany: true };
      return { game: await tx.guessGame.create({ data: { mapId, code, title, photoIds, createdById }, select: GAME_SELECT }) };
    }),
  );

export const findGuessGameById = (id) => prisma.guessGame.findUnique({ where: { id }, select: GAME_SELECT });

/** By its link's code, with its map's name and how it shows the UK. */
export const findGuessGameByCode = (code) =>
  prisma.guessGame.findUnique({ where: { code }, select: { ...GAME_SELECT, map: { select: { name: true, splitUk: true } } } });

export const deleteGuessGameInDB = (id) => prisma.guessGame.delete({ where: { id } });

/**
 * A map's games, newest first, each with how many plays finished and its best named one
 * (counted with groupBy over the games loaded, never a _count in a select).
 */
export async function findGuessGamesForMap(mapId) {
  const games = await prisma.guessGame.findMany({ where: { mapId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: GAME_SELECT });
  if (!games.length) return [];
  const ids = games.map((g) => g.id);
  const [finished, named] = await Promise.all([
    prisma.guessPlay.groupBy({ by: ['gameId'], where: { gameId: { in: ids }, finishedAt: { not: null } }, _count: { _all: true } }),
    prisma.guessPlay.findMany({
      where: { gameId: { in: ids }, name: { not: null }, finishedAt: { not: null } },
      orderBy: [{ score: 'desc' }, { finishedAt: 'asc' }],
      select: { gameId: true, name: true, score: true },
    }),
  ]);
  const plays = new Map(finished.map((row) => [row.gameId, row._count._all]));
  const best = new Map();
  for (const play of named) if (!best.has(play.gameId)) best.set(play.gameId, { name: play.name, score: play.score });
  return games.map((game) => ({ ...game, plays: plays.get(game.id) ?? 0, best: best.get(game.id) ?? null }));
}

/**
 * The rounds' photos, as a play shows and scores them: the playable ones of `photoIds`, each
 * with its DISPLAY file's key, its place and its first confirmed landmark (name and position).
 */
export const findGuessPhotos = (mapId, photoIds) =>
  prisma.photo.findMany({
    where: playableWhere(mapId, photoIds),
    select: {
      id: true,
      countryCode: true,
      variants: { where: { size: 'DISPLAY' }, select: { media: { select: { key: true } } } },
      landmarks: {
        where: { confirmed: true },
        orderBy: { confirmedAt: 'asc' },
        take: 1,
        select: { landmark: { select: { name: true, latitude: true, longitude: true } } },
      },
    },
  });

/** A game's best named plays, and every named play's score (for a rank). */
export async function findLeaderboardPlays(gameId) {
  const [top, scores] = await Promise.all([
    prisma.guessPlay.findMany({
      where: { gameId, name: { not: null }, finishedAt: { not: null } },
      orderBy: [{ score: 'desc' }, { finishedAt: 'asc' }],
      take: GUESS_LEADERBOARD_SIZE,
      select: { name: true, score: true, finishedAt: true },
    }),
    prisma.guessPlay.findMany({ where: { gameId, name: { not: null }, finishedAt: { not: null } }, select: { score: true } }),
  ]);
  return { top, scores: scores.map((row) => row.score) };
}

export const createGuessPlayInDB = (gameId) => prisma.guessPlay.create({ data: { gameId, points: [] }, select: { id: true } });

export const findGuessPlay = (id, gameId) =>
  prisma.guessPlay.findFirst({ where: { id, gameId }, select: { id: true, points: true, score: true, name: true, finishedAt: true } });

/**
 * A round's points added, only if it's the next round (`round` answered so far), in one
 * statement, so the same round sent twice counts once; the play is finished with its last.
 * -> whether it was recorded
 */
export async function recordGuessInDB({ playId, round, points, rounds }) {
  const finishes = round + 1 >= rounds;
  const count = await prisma.$executeRaw`
    UPDATE "guess_play"
    SET "points" = array_append("points", ${points}::int), "score" = "score" + ${points}::int,
      "finishedAt" = CASE WHEN ${finishes} THEN now() ELSE NULL END
    WHERE "id" = ${playId} AND cardinality("points") = ${round}::int AND "finishedAt" IS NULL`;
  return count === 1;
}

/** A finished play put on the leaderboard under `name`, once. -> whether it was */
export async function nameGuessPlayInDB(playId, name) {
  const { count } = await prisma.guessPlay.updateMany({ where: { id: playId, name: null, finishedAt: { not: null } }, data: { name } });
  return count === 1;
}

/** The daily clean-up: plays never put on a leaderboard, older than `before`. -> how many went */
export const deleteUnnamedGuessPlays = async (before) =>
  (await prisma.guessPlay.deleteMany({ where: { name: null, createdAt: { lt: before } } })).count;
