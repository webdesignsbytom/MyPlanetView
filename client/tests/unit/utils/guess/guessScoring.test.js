// "Guess where I was": the client's copy of the server's scoring (utils/guess/guessScoring.js).
import { describe, expect, it } from 'vitest';
import { distanceKm, guessMatches, leaderboardView, roundPoints, scoreGuess } from '@/utils/guess/guessScoring';

const PARIS = { latitude: 48.86, longitude: 2.35 };
const ROME = { latitude: 41.9, longitude: 12.5 };
const positions = new Map([
  ['FR', PARIS],
  ['IT', ROME],
  ['US', { latitude: 39, longitude: -98 }],
]);

describe('the scoring, as the server’s', () => {
  it('gives 1,000 for the right place and fewer the further off', () => {
    expect(roundPoints({ correct: true, distanceKm: 0 })).toBe(1000);
    expect(roundPoints({ correct: false, distanceKm: 1100 })).toBe(462);
    expect(roundPoints({ correct: false, distanceKm: Number.NaN })).toBe(0);
  });
  it('matches a place, a region in its country and a nation in an unsplit UK', () => {
    expect(guessMatches('IT', 'IT')).toBe(true);
    expect(guessMatches('XH', 'US')).toBe(true);
    expect(guessMatches('XC', 'GB')).toBe(true);
    expect(guessMatches('GB', 'XC')).toBe(false);
    expect(guessMatches('FR', 'IT')).toBe(false);
  });
  it('scores by the distance from the guess’s pin to the photo’s point', () => {
    expect(Math.round(distanceKm(PARIS, ROME))).toBeGreaterThan(1050);
    const scored = scoreGuess({ guess: 'IT', answer: 'FR', answerPoint: PARIS, positions });
    expect(scored.correct).toBe(false);
    expect(scored.points).toBe(roundPoints({ correct: false, distanceKm: scored.distanceKm }));
    expect(scoreGuess({ guess: 'FR', answer: 'FR', answerPoint: PARIS, positions })).toEqual({ correct: true, distanceKm: 0, points: 1000 });
    expect(scoreGuess({ guess: 'AQ', answer: 'FR', answerPoint: PARIS, positions }).points).toBe(0);
  });
  it('lists named, finished plays, best first', () => {
    const board = leaderboardView([
      { name: 'Jo', score: 10, finishedAt: '2026-01-02' },
      { name: 'Sam', score: 20, finishedAt: '2026-01-03' },
      { name: null, score: 99, finishedAt: '2026-01-01' },
    ]);
    expect(board.map((row) => row.name)).toEqual(['Sam', 'Jo']);
  });
});
