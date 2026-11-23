// "Guess where I was" (23 Nov 2026, the user's wish; docs/API.md "Guess where I was"): which of a
// map's photos make a game, and the game's words. Pure.
import { GUESS_ROUNDS_MAX, ROUND_MAX_POINTS } from './guessScoring';
import { guessPath } from '@/utils/constants/routes';

/** The photos a game can use: placed in a country, not hidden, not videos. */
export const playablePhotos = (photos) => (photos || []).filter((photo) => photo.countryCode && !photo.hidden && photo.kind !== 'VIDEO');

/**
 * A first choice of photos for a new game: one from each country first (in the list's order,
 * newest first), then more, `count` at most.
 */
export function suggestGamePhotos(photos, count = 5) {
  const playable = playablePhotos(photos);
  const seen = new Set();
  const firsts = [];
  const rest = [];
  for (const photo of playable) {
    if (seen.has(photo.countryCode)) rest.push(photo);
    else {
      seen.add(photo.countryCode);
      firsts.push(photo);
    }
  }
  return [...firsts, ...rest].slice(0, Math.min(count, GUESS_ROUNDS_MAX)).map((photo) => photo.id);
}

const km = (n) => Math.round(n).toLocaleString('en-GB');
export const points = (n) => n.toLocaleString('en-GB');

/** "2,450 of 3,000 points" */
export const scoreWords = (score, rounds) => `${points(score)} of ${points(rounds * ROUND_MAX_POINTS)} points`;

/** What a round's answer says: "Yes! The Colosseum, Italy." or "It was France: about 1,100 km from your guess." */
export function roundResultWords({ correct, distanceKm, answer }) {
  const place = answer.landmarkName ? `${answer.landmarkName}, ${answer.countryName}` : answer.countryName;
  if (correct) return `Yes! ${place}.`;
  return distanceKm === null || distanceKm === undefined ? `It was ${place}.` : `It was ${place}: about ${km(distanceKm)} km from your guess.`;
}

/** The game's link on this site. */
export const guessLink = (origin, code) => `${origin}${guessPath(code)}`;

/** What a player shares: their score and the game's link. */
export const shareScoreText = ({ mapName, score, rounds }) => `I scored ${scoreWords(score, rounds)} guessing where “${mapName}” has been. Can you beat me?`;
