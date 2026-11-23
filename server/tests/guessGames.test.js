// "Guess where I was": the rules (src/utils/guessGames.js), pure.
import { describe, expect, it } from 'vitest';
import {
  GUESS_LEADERBOARD_SIZE,
  ROUND_MAX_POINTS,
  guessMatches,
  leaderboardView,
  parseGamePhotoIds,
  rankOf,
  roundPoints,
  scoreGuess,
} from '../src/utils/guessGames.js';
import { redactUrl } from '../src/utils/redactUrl.js';

const PARIS = { latitude: 48.86, longitude: 2.35 };
const ROME = { latitude: 41.9, longitude: 12.5 };
const TOKYO = { latitude: 35.68, longitude: 139.69 };
const LONDON = { latitude: 51.5, longitude: -0.12 };
const positions = new Map([
  ['FR', PARIS],
  ['IT', ROME],
  ['JP', TOKYO],
  ['GB', LONDON],
  ['XE', LONDON],
  ['US', { latitude: 39, longitude: -98 }],
]);

describe('roundPoints', () => {
  it('gives every point for the right place', () => {
    expect(roundPoints({ correct: true, distanceKm: 0 })).toBe(ROUND_MAX_POINTS);
  });
  it('gives fewer the further the guess was', () => {
    expect(roundPoints({ correct: false, distanceKm: 0 })).toBe(800);
    expect(roundPoints({ correct: false, distanceKm: 1100 })).toBe(462);
    expect(roundPoints({ correct: false, distanceKm: 9700 })).toBe(6);
    expect(roundPoints({ correct: false, distanceKm: 20000 })).toBe(0);
  });
  it('gives nothing when the distance isn’t known', () => {
    expect(roundPoints({ correct: false, distanceKm: Number.NaN })).toBe(0);
    expect(roundPoints({ correct: false, distanceKm: -5 })).toBe(0);
  });
});

describe('guessMatches', () => {
  it('matches the same place, a region in its country, and a nation in an unsplit UK', () => {
    expect(guessMatches('FR', 'FR')).toBe(true);
    expect(guessMatches('XH', 'US')).toBe(true);
    expect(guessMatches('XE', 'GB')).toBe(true);
  });
  it('never matches another place, or a whole UK for one nation', () => {
    expect(guessMatches('IT', 'FR')).toBe(false);
    expect(guessMatches('GB', 'XE')).toBe(false);
    expect(guessMatches('XC', 'XE')).toBe(false);
    expect(guessMatches('', 'FR')).toBe(false);
    expect(guessMatches('FR', null)).toBe(false);
  });
});

describe('scoreGuess', () => {
  it('scores the right place in full', () => {
    expect(scoreGuess({ guess: 'FR', answer: 'FR', answerPoint: PARIS, positions })).toEqual({ correct: true, distanceKm: 0, points: 1000 });
  });
  it('scores a wrong guess by how far its place’s pin is from the photo’s point', () => {
    const scored = scoreGuess({ guess: 'IT', answer: 'FR', answerPoint: PARIS, positions });
    expect(scored.correct).toBe(false);
    expect(scored.distanceKm).toBeGreaterThan(1050);
    expect(scored.distanceKm).toBeLessThan(1150);
    expect(scored.points).toBe(roundPoints({ correct: false, distanceKm: scored.distanceKm }));
  });
  it('measures a region from its country, and gives nothing for a place with no pin', () => {
    expect(scoreGuess({ guess: 'XH', answer: 'JP', answerPoint: TOKYO, positions }).distanceKm).toBeGreaterThan(9000);
    expect(scoreGuess({ guess: 'AQ', answer: 'JP', answerPoint: TOKYO, positions })).toEqual({ correct: false, distanceKm: null, points: 0 });
  });
});

describe('parseGamePhotoIds', () => {
  const ids = (n) => Array.from({ length: n }, (_, i) => `photo-${i}`);
  it('takes 3 to 10 different ids, in order', () => {
    expect(parseGamePhotoIds(ids(3))).toEqual(ids(3));
    expect(parseGamePhotoIds(ids(10))).toEqual(ids(10));
  });
  it('refuses too few, too many, repeats and anything else', () => {
    expect(parseGamePhotoIds(ids(2))).toBeNull();
    expect(parseGamePhotoIds(ids(11))).toBeNull();
    expect(parseGamePhotoIds(['a', 'b', 'a'])).toBeNull();
    expect(parseGamePhotoIds(['a', 'b', 3])).toBeNull();
    expect(parseGamePhotoIds(['a', 'b', ''])).toBeNull();
    expect(parseGamePhotoIds('a,b,c')).toBeNull();
    expect(parseGamePhotoIds(undefined)).toBeNull();
  });
});

describe('the leaderboard', () => {
  it('lists named, finished plays, best first, the earlier first on a tie', () => {
    const at = (minute) => new Date(Date.UTC(2026, 10, 23, 12, minute));
    const board = leaderboardView([
      { name: 'Jo', score: 2400, finishedAt: at(5) },
      { name: 'Sam', score: 3100, finishedAt: at(9) },
      { name: 'Alex', score: 2400, finishedAt: at(1) },
      { name: null, score: 5000, finishedAt: at(2) },
      { name: 'Unfinished', score: 900, finishedAt: null },
    ]);
    expect(board.map((row) => row.name)).toEqual(['Sam', 'Alex', 'Jo']);
    expect(board[0]).toEqual({ name: 'Sam', score: 3100, at: '2026-11-23T12:09:00.000Z' });
  });
  it('shows the best few only', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ name: `P${i}`, score: i, finishedAt: new Date() }));
    expect(leaderboardView(many)).toHaveLength(GUESS_LEADERBOARD_SIZE);
  });
  it('ranks a score among the others (ties share a place)', () => {
    expect(rankOf(3000, [3100, 3000, 2900, 3000])).toBe(2);
    expect(rankOf(5000, [])).toBe(1);
  });
});

describe('the logs never keep a game’s code or a play’s id', () => {
  it('redacts both', () => {
    expect(redactUrl('/api/guess/GWHR-2WAS-7MAP')).toBe('/api/guess/:code');
    expect(redactUrl('/api/guess/GWHR2WAS7MAP/plays/0f3c-play/guesses')).toBe('/api/guess/:code/plays/:token/guesses');
  });
});
