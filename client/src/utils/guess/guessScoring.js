// "Guess where I was": the server's scoring (server/src/utils/guessGames.js), copied for the mock
// (dev/mock/handlers/guessGames.js), and its limits for the forms. Change both together. Pure.
import { REGION_PARENT } from '@/utils/map/regionPlaces';
import { UK, isUkNation } from '@/utils/map/ukNations';

export const GUESS_ROUNDS_MIN = 3;
export const GUESS_ROUNDS_MAX = 10;
export const GUESS_GAMES_PER_MAP = 50;
export const GUESS_TITLE_MAX = 80;
export const GUESS_NAME_MAX = 30;
export const GUESS_LEADERBOARD_SIZE = 20;
export const GUESS_DEFAULT_TITLE = 'Guess where I was';
export const ROUND_MAX_POINTS = 1000;

const EARTH_RADIUS_KM = 6371.0088;
const rad = (deg) => (deg * Math.PI) / 180;

/** The great-circle distance between two `{ latitude, longitude }`, in km. */
export function distanceKm(a, b) {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 1,000 for the right place, else up to 800, fewer the further the guess was. */
export function roundPoints({ correct, distanceKm: km }) {
  if (correct) return ROUND_MAX_POINTS;
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.round(800 * Math.exp(-km / 2000));
}

const parentOf = (code) => REGION_PARENT[code] ?? null;

/** The same place; a region for its country; a UK nation for a UK photo with no nation. */
export function guessMatches(guess, answer) {
  if (!guess || !answer) return false;
  if (guess === answer || parentOf(guess) === answer) return true;
  return answer === UK && isUkNation(guess);
}

/** One round scored; `positions` is code -> { latitude, longitude }. */
export function scoreGuess({ guess, answer, answerPoint, positions }) {
  const correct = guessMatches(guess, answer);
  const from = positions.get(guess) ?? positions.get(parentOf(guess));
  const km = correct ? 0 : from && answerPoint ? Math.round(distanceKm(from, answerPoint)) : null;
  return { correct, distanceKm: km, points: roundPoints({ correct, distanceKm: km ?? Number.NaN }) };
}

/** Named, finished plays, best first (the earlier first on a tie), the best few. */
export function leaderboardView(plays) {
  return [...plays]
    .filter((play) => play.name && play.finishedAt)
    .sort((a, b) => b.score - a.score || new Date(a.finishedAt) - new Date(b.finishedAt))
    .slice(0, GUESS_LEADERBOARD_SIZE)
    .map((play) => ({ name: play.name, score: play.score, at: new Date(play.finishedAt).toISOString() }));
}
