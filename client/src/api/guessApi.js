// "Guess where I was" (docs/API.md "Guess where I was"; 23 Nov 2026). Each returns the payload;
// errors keep the client's `friendlyMessage` (and `response.status`).
import client from './client';
import { GUESS_API, GUESS_GAMES_API, MAPS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** A map's games (its editors) -> `{ games: [{ id, code, title, rounds, plays, best, createdAt }] }` */
export const getMapGuessGames = (mapId) => data(client.get(`${MAPS_API}/${enc(mapId)}/guess-games`));
/** `{ title?, photoIds }` (3 to 10 of the map's placed, visible photos) -> `{ game }` */
export const createGuessGame = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/guess-games`, body));
export const deleteGuessGame = (gameId) => data(client.delete(`${GUESS_GAMES_API}/${enc(gameId)}`));

/** A game by its link (anyone) -> `{ game: { code, title, mapName, splitUk, rounds: [{ url }] }, leaderboard }` */
export const openGuessGame = (code) => data(client.get(`${GUESS_API}/${enc(code)}`));
/** -> `{ playId }` */
export const startGuessPlay = (code) => data(client.post(`${GUESS_API}/${enc(code)}/plays`));
/** `{ round, countryCode }` -> `{ correct, distanceKm, points, answer, score, done }` */
export const sendGuess = (code, playId, body) => data(client.post(`${GUESS_API}/${enc(code)}/plays/${enc(playId)}/guesses`, body));
/** A finished play on the board -> `{ rank, leaderboard }` */
export const nameGuessPlay = (code, playId, name) => data(client.patch(`${GUESS_API}/${enc(code)}/plays/${enc(playId)}`, { name }));
