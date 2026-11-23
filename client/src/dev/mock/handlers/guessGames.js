// Mock mode only: "Guess where I was" (docs/API.md "Guess where I was"), as the server's
// controllers/guessGames.js: a map's editors make and delete games; anyone with a game's code
// plays it, scored here with the server's rules (utils/guess/guessScoring.js). The store keeps
// `db.guessGames` ({ id, mapId, code, title, photoIds, createdById, createdAt }) and
// `db.guessPlays` ({ id, gameId, points, score, name, finishedAt, createdAt }).
import { deny, fail, ok, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, session } from '../store';
import { landmarkById, mapRole, photoUrls } from '../views';
import { COUNTRY_BY_CODE, countryName } from '@/utils/map/countries';
import { positionFromMap } from '@/utils/map/projection';
import {
  GUESS_DEFAULT_TITLE,
  GUESS_GAMES_PER_MAP,
  GUESS_NAME_MAX,
  GUESS_ROUNDS_MAX,
  GUESS_ROUNDS_MIN,
  GUESS_TITLE_MAX,
  leaderboardView,
  scoreGuess,
} from '@/utils/guess/guessScoring';

const NOT_FOUND = 'That game doesn’t exist any more.';
const MAP_NOT_FOUND = 'This map could not be found.';
const PHOTOS_INVALID = 'Choose 3 to 10 of this map’s photos, each one placed in a country and not hidden.';
const ROUND_INVALID = 'That isn’t this game’s next photo.';
const clean = (text, max) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const normal = (code) => String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

const playable = (photo, mapId) => photo && photo.mapId === mapId && photo.kind !== 'VIDEO' && !photo.hidden && photo.countryCode;
const gameView = (game) => {
  const plays = getDb().guessPlays.filter((p) => p.gameId === game.id);
  const [best] = leaderboardView(plays);
  return {
    id: game.id,
    code: formatShareCode(game.code),
    title: game.title,
    rounds: game.photoIds.length,
    plays: plays.filter((p) => p.finishedAt).length,
    best: best ? { name: best.name, score: best.score } : null,
    createdAt: game.createdAt,
  };
};
const roundsOf = (game) => {
  const photos = getDb().photos;
  return game.photoIds.map((id) => photos.find((p) => p.id === id)).filter((photo) => playable(photo, game.mapId));
};
const gameByCode = (code) => getDb().guessGames.find((g) => g.code === normal(code)) || null;
const positionOf = (code) => {
  const country = COUNTRY_BY_CODE[code];
  return country?.pinX !== undefined && country?.pinY !== undefined ? positionFromMap(country.pinX, country.pinY) : null;
};
const confirmedLandmarkOf = (photo) => {
  const match = getDb().photoLandmarks.find((m) => m.photoId === photo.id && m.confirmed);
  return match ? landmarkById(match.landmarkId) : null;
};

export function registerGuessGameRoutes() {
  route('GET', '/api/maps/:mapId/guess-games', ({ params }) => {
    const map = getDb().maps.find((m) => m.id === params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    const games = getDb()
      .guessGames.filter((g) => g.mapId === map.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return ok({ games: games.map(gameView) });
  });

  route('POST', '/api/maps/:mapId/guess-games', ({ params, body }) => {
    const db = getDb();
    const map = db.maps.find((m) => m.id === params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    const ids = body?.photoIds;
    const shaped = Array.isArray(ids) && ids.length >= GUESS_ROUNDS_MIN && ids.length <= GUESS_ROUNDS_MAX && new Set(ids).size === ids.length;
    if (!shaped || !ids.every((id) => playable(db.photos.find((p) => p.id === id), map.id))) return fail(400, PHOTOS_INVALID);
    if (db.guessGames.filter((g) => g.mapId === map.id).length >= GUESS_GAMES_PER_MAP) {
      return fail(409, 'A map can have 50 games. Delete one to make another.');
    }
    const game = {
      id: newId(),
      mapId: map.id,
      code: newShareCode(),
      title: clean(body.title, GUESS_TITLE_MAX) || GUESS_DEFAULT_TITLE,
      photoIds: [...ids],
      createdById: me().id,
      createdAt: new Date().toISOString(),
    };
    db.guessGames.push(game);
    return ok({ game: gameView(game) }, 201);
  });

  route('DELETE', '/api/guess-games/:gameId', ({ params }) => {
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const db = getDb();
    const game = db.guessGames.find((g) => g.id === params.gameId);
    const denied = deny(game ? mapRole(db.maps.find((m) => m.id === game.mapId)) : null, 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    db.guessGames = db.guessGames.filter((g) => g.id !== game.id);
    db.guessPlays = db.guessPlays.filter((p) => p.gameId !== game.id);
    return ok({ deleted: true });
  });

  route('GET', '/api/guess/:code', ({ params }) => {
    const game = gameByCode(params.code);
    const rounds = game ? roundsOf(game) : [];
    if (!rounds.length) return fail(404, NOT_FOUND);
    const map = getDb().maps.find((m) => m.id === game.mapId);
    return ok({
      game: {
        code: formatShareCode(game.code),
        title: game.title,
        mapName: map?.name ?? '',
        splitUk: Boolean(map?.splitUk),
        rounds: rounds.map((photo) => ({ url: photoUrls(photo).display })),
      },
      leaderboard: leaderboardView(getDb().guessPlays.filter((p) => p.gameId === game.id)),
    });
  });

  route('POST', '/api/guess/:code/plays', ({ params }) => {
    const game = gameByCode(params.code);
    if (!game) return fail(404, NOT_FOUND);
    const play = { id: newId(), gameId: game.id, points: [], score: 0, name: null, finishedAt: null, createdAt: new Date().toISOString() };
    getDb().guessPlays.push(play);
    return ok({ playId: play.id }, 201);
  });

  route('POST', '/api/guess/:code/plays/:playId/guesses', ({ params, body }) => {
    const game = gameByCode(params.code);
    const play = game && getDb().guessPlays.find((p) => p.id === params.playId && p.gameId === game.id);
    if (!play) return fail(404, NOT_FOUND);
    const { round, countryCode } = body || {};
    if (typeof countryCode !== 'string' || !COUNTRY_BY_CODE[countryCode]) return fail(400, 'Choose a country on the map.');
    const rounds = roundsOf(game);
    if (!Number.isInteger(round) || round !== play.points.length || round >= rounds.length || play.finishedAt) return fail(409, ROUND_INVALID);
    const photo = rounds[round];
    const landmark = confirmedLandmarkOf(photo);
    const answerPoint = landmark ? { latitude: landmark.latitude, longitude: landmark.longitude } : positionOf(photo.countryCode);
    const positions = { get: (code) => positionOf(code) };
    const scored = scoreGuess({ guess: countryCode, answer: photo.countryCode, answerPoint, positions });
    play.points.push(scored.points);
    play.score += scored.points;
    const done = round + 1 >= rounds.length;
    if (done) play.finishedAt = new Date().toISOString();
    return ok({
      ...scored,
      answer: { countryCode: photo.countryCode, countryName: countryName(photo.countryCode), landmarkName: landmark?.name ?? null },
      score: play.score,
      done,
    });
  });

  route('PATCH', '/api/guess/:code/plays/:playId', ({ params, body }) => {
    const game = gameByCode(params.code);
    const play = game && getDb().guessPlays.find((p) => p.id === params.playId && p.gameId === game.id);
    if (!play) return fail(404, NOT_FOUND);
    const name = clean(body?.name, GUESS_NAME_MAX);
    if (!name) return fail(400, 'Give a name of 1 to 30 characters.');
    if (play.name || !play.finishedAt) return fail(409, 'Only a finished game goes on the leaderboard, and only once.');
    play.name = name;
    const named = getDb().guessPlays.filter((p) => p.gameId === game.id && p.name && p.finishedAt);
    return ok({ rank: 1 + named.filter((p) => p.score > play.score).length, leaderboard: leaderboardView(named) });
  });
}
