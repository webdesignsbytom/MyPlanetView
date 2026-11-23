// "Guess where I was" (23 Nov 2026, the user's wish: friends get one of your photos and pin where
// they think it was taken; they share their score, and the link brings new people in;
// docs/API.md "Guess where I was"). Pure, so tested on its own (tests/guessGames.test.js). The
// client's copy of the scoring is client/src/utils/guess/guessScoring.js (the mock's).
import { distanceKm } from './travelStats.js';
import { regionParent } from './regionPlaces.js';
import { UK, isUkNation } from './ukNations.js';

export const GUESS_ROUNDS_MIN = 3;
export const GUESS_ROUNDS_MAX = 10;
export const GUESS_GAMES_PER_MAP = 50;
export const GUESS_TITLE_MAX = 80;
export const GUESS_NAME_MAX = 30;
export const GUESS_LEADERBOARD_SIZE = 20;
export const GUESS_DEFAULT_TITLE = 'Guess where I was';
// A play never put on the leaderboard goes with the daily clean-up after this long
export const UNNAMED_PLAY_DAYS = 7;

// A round's points: all of them for the right place, else fewer the further the guess was
export const ROUND_MAX_POINTS = 1000;
const NEAR_MAX_POINTS = 800;
const FALL_OFF_KM = 2000;

/** Points for one round: 1,000 for the right place, else up to 800, halving about every 1,400 km. */
export function roundPoints({ correct, distanceKm: km }) {
  if (correct) return ROUND_MAX_POINTS;
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.round(NEAR_MAX_POINTS * Math.exp(-km / FALL_OFF_KM));
}

/**
 * Is a guessed place the photo's? The same code; a region (Bali) for its country (the photos'
 * places are countries); a UK nation for a UK photo whose nation isn't known.
 */
export function guessMatches(guess, answer) {
  if (!guess || !answer) return false;
  if (guess === answer) return true;
  if (regionParent(guess) === answer) return true;
  return answer === UK && isUkNation(guess);
}

/**
 * One round scored: the guess against the photo's place (`answer`, a code) and point (its
 * confirmed landmark, else its place's pin), the guess's point its place's pin.
 * `positions` is code -> { latitude, longitude }. -> `{ correct, distanceKm, points }`
 */
export function scoreGuess({ guess, answer, answerPoint, positions }) {
  const correct = guessMatches(guess, answer);
  const from = positions.get(guess) ?? positions.get(regionParent(guess));
  const km = correct ? 0 : from && answerPoint ? Math.round(distanceKm(from, answerPoint)) : null;
  return { correct, distanceKm: km, points: roundPoints({ correct, distanceKm: km ?? Number.NaN }) };
}

/** A game's photos from a request: 3 to 10 different ids, in order. -> the ids, or null */
export function parseGamePhotoIds(value) {
  if (!Array.isArray(value) || value.length < GUESS_ROUNDS_MIN || value.length > GUESS_ROUNDS_MAX) return null;
  if (!value.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 64)) return null;
  return new Set(value).size === value.length ? value : null;
}

/** The leaderboard: named, finished plays, best first (then first to get it). */
export function leaderboardView(plays) {
  return [...plays]
    .filter((play) => play.name && play.finishedAt)
    .sort((a, b) => b.score - a.score || new Date(a.finishedAt) - new Date(b.finishedAt))
    .slice(0, GUESS_LEADERBOARD_SIZE)
    .map((play) => ({ name: play.name, score: play.score, at: new Date(play.finishedAt).toISOString() }));
}

/** Where a score is among the finished, named plays (1 is the best). */
export const rankOf = (score, scores) => 1 + scores.filter((other) => other > score).length;
