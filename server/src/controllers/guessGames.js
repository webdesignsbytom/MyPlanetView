// "Guess where I was" (23 Nov 2026, the user's wish; docs/API.md "Guess where I was"): a map's
// editors make a game from its photos; anyone with the game's link plays it, no sign-in, and
// the server scores each guess (the answers never leave it before they're guessed).
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createGuessGameEvent } from '../event/travelUtils.js';
import { sanitizeText } from '../utils/sanitize.js';
import { canEdit, canView } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { formatShareCode, normaliseShareCode } from '../utils/shareCodes.js';
import {
  GUESS_DEFAULT_TITLE,
  GUESS_GAMES_PER_MAP,
  GUESS_NAME_MAX,
  GUESS_TITLE_MAX,
  leaderboardView,
  parseGamePhotoIds,
  rankOf,
  scoreGuess,
} from '../utils/guessGames.js';
import {
  countPlayablePhotos,
  createGuessGameInDB,
  createGuessPlayInDB,
  deleteGuessGameInDB,
  findGuessGameByCode,
  findGuessGameById,
  findGuessGamesForMap,
  findGuessPhotos,
  findGuessPlay,
  findLeaderboardPlays,
  nameGuessPlayInDB,
  recordGuessInDB,
} from '../domain/guessGames.js';
import { signPhotoUrl } from '../services/s3/mediaService.js';
import { badRequest, conflict, denyUnless, handler, loadMap, notFound } from './helpers/travel.js';
import { countryNameOf, isKnownCountry, placePositions } from './helpers/countries.js';

const D = DOMAINS.guessGames;

/** A game for its map's editors: its link's code, rounds, finished plays and best score. */
const gameView = (game) => ({
  id: game.id,
  code: formatShareCode(game.code),
  title: game.title,
  rounds: game.photoIds.length,
  plays: game.plays ?? 0,
  best: game.best ?? null,
  createdAt: game.createdAt.toISOString(),
});

// The game's rounds as they are now: its photos still playable, in its order
async function roundsOf(game) {
  const photos = await findGuessPhotos(game.mapId, game.photoIds);
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  return game.photoIds.map((id) => byId.get(id)).filter((photo) => photo?.variants?.[0]?.media?.key);
}

// The game by its link's code, or null (any code that can't be one finds nothing)
const gameByCode = (code) => {
  const normal = normaliseShareCode(code);
  return normal ? findGuessGameByCode(normal) : null;
};

async function leaderboardOf(gameId) {
  const { top } = await findLeaderboardPlays(gameId);
  return leaderboardView(top);
}

// GET /api/maps/:mapId/guess-games (editors) -> { games }
export const getMapGuessGamesHandler = handler(D, 'Get guess games', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  return sendDataResponse(res, 200, { games: (await findGuessGamesForMap(map.id)).map(gameView) });
});

// POST /api/maps/:mapId/guess-games { title?, photoIds } (editors, verified) -> 201 { game }
export const createGuessGameHandler = handler(D, 'Create guess game', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const body = req.body || {};
  const photoIds = parseGamePhotoIds(body.photoIds);
  if (!photoIds || !photoIds.every(isUuid)) return badRequest(req, res, D, EVENT_MESSAGES.guessPhotosInvalid);
  if ((await countPlayablePhotos(map.id, photoIds)) !== photoIds.length) return badRequest(req, res, D, EVENT_MESSAGES.guessPhotosInvalid);
  const title = (typeof body.title === 'string' ? sanitizeText(body.title, { maxLength: GUESS_TITLE_MAX }) : '') || GUESS_DEFAULT_TITLE;

  const made = await createGuessGameInDB({ mapId: map.id, title, photoIds, createdById: req.user.id, cap: GUESS_GAMES_PER_MAP });
  if (made.tooMany) return conflict(req, res, D, EVENT_MESSAGES.guessTooManyGames);
  logEvent(createGuessGameEvent({ user: req.user, action: 'Create Success', id: made.game.id, statusCode: 201 }));
  return sendDataResponse(res, 201, { game: gameView(made.game) });
});

// DELETE /api/guess-games/:gameId (editors of its map, verified)
export const deleteGuessGameHandler = handler(D, 'Delete guess game', async (req, res) => {
  const game = isUuid(req.params.gameId) ? await findGuessGameById(req.params.gameId) : null;
  const { role } = game ? await loadMap(req, game.mapId) : { role: null };
  if (!game || !canView(role)) return notFound(req, res, D, EVENT_MESSAGES.guessGameNotFound);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.guessGameNotFound)) return undefined;
  await deleteGuessGameInDB(game.id);
  logEvent(createGuessGameEvent({ user: req.user, action: 'Delete Success', id: game.id }));
  return sendDataResponse(res, 200, { deleted: true });
});

// GET /api/guess/:code (anyone) -> { game: { title, mapName, splitUk, rounds: [{ url }] }, leaderboard }
export const getGuessGameHandler = handler(D, 'Open guess game', async (req, res) => {
  const game = await gameByCode(req.params.code);
  if (!game) return notFound(req, res, D, EVENT_MESSAGES.guessGameNotFound);
  const [rounds, leaderboard] = await Promise.all([roundsOf(game), leaderboardOf(game.id)]);
  if (!rounds.length) return notFound(req, res, D, EVENT_MESSAGES.guessGameNotFound);
  // Only the pictures: never the photo's place, caption or position before it's guessed
  const urls = await Promise.all(rounds.map((photo) => signPhotoUrl(photo.variants[0].media.key)));
  return sendDataResponse(res, 200, {
    game: { code: formatShareCode(game.code), title: game.title, mapName: game.map.name, splitUk: Boolean(game.map.splitUk), rounds: urls.map((url) => ({ url })) },
    leaderboard,
  });
});

// POST /api/guess/:code/plays (anyone) -> 201 { playId }
export const startGuessPlayHandler = handler(D, 'Start guess play', async (req, res) => {
  const game = await gameByCode(req.params.code);
  if (!game) return notFound(req, res, D, EVENT_MESSAGES.guessGameNotFound);
  const play = await createGuessPlayInDB(game.id);
  return sendDataResponse(res, 201, { playId: play.id });
});

// POST /api/guess/:code/plays/:playId/guesses { round, countryCode } (anyone with the play)
// -> { points, correct, distanceKm, answer: { countryCode, countryName, landmarkName }, score, done }
export const guessHandler = handler(D, 'Guess', async (req, res) => {
  const game = await gameByCode(req.params.code);
  const play = game && isUuid(req.params.playId) ? await findGuessPlay(req.params.playId, game.id) : null;
  if (!play) return notFound(req, res, D, EVENT_MESSAGES.guessGameNotFound);
  const { round, countryCode } = req.body || {};
  if (typeof countryCode !== 'string' || !(await isKnownCountry(countryCode))) return badRequest(req, res, D, EVENT_MESSAGES.guessPlaceInvalid);
  const rounds = await roundsOf(game);
  if (!Number.isInteger(round) || round !== play.points.length || round >= rounds.length || play.finishedAt) {
    return conflict(req, res, D, EVENT_MESSAGES.guessRoundInvalid);
  }

  const photo = rounds[round];
  const landmark = photo.landmarks[0]?.landmark ?? null;
  const positions = await placePositions();
  const answerPoint = landmark ? { latitude: landmark.latitude, longitude: landmark.longitude } : positions.get(photo.countryCode) ?? null;
  const scored = scoreGuess({ guess: countryCode, answer: photo.countryCode, answerPoint, positions });
  if (!(await recordGuessInDB({ playId: play.id, round, points: scored.points, rounds: rounds.length }))) {
    return conflict(req, res, D, EVENT_MESSAGES.guessRoundInvalid);
  }
  return sendDataResponse(res, 200, {
    ...scored,
    answer: { countryCode: photo.countryCode, countryName: await countryNameOf(photo.countryCode), landmarkName: landmark?.name ?? null },
    score: play.score + scored.points,
    done: round + 1 >= rounds.length,
  });
});

// PATCH /api/guess/:code/plays/:playId { name } (a finished play, once) -> { rank, leaderboard }
export const nameGuessPlayHandler = handler(D, 'Name guess play', async (req, res) => {
  const game = await gameByCode(req.params.code);
  const play = game && isUuid(req.params.playId) ? await findGuessPlay(req.params.playId, game.id) : null;
  if (!play) return notFound(req, res, D, EVENT_MESSAGES.guessGameNotFound);
  const name = typeof req.body?.name === 'string' ? sanitizeText(req.body.name, { maxLength: GUESS_NAME_MAX }) : '';
  if (!name) return badRequest(req, res, D, EVENT_MESSAGES.guessNameInvalid);
  if (!(await nameGuessPlayInDB(play.id, name))) return conflict(req, res, D, EVENT_MESSAGES.guessNotFinished);
  const { top, scores } = await findLeaderboardPlays(game.id);
  return sendDataResponse(res, 200, { rank: rankOf(play.score, scores), leaderboard: leaderboardView(top) });
});
