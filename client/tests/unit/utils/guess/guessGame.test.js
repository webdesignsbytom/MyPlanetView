// "Guess where I was": which photos make a game, and its words (utils/guess/guessGame.js).
import { describe, expect, it } from 'vitest';
import { guessLink, playablePhotos, roundResultWords, scoreWords, shareScoreText, suggestGamePhotos } from '@/utils/guess/guessGame';

const photo = (id, countryCode, over = {}) => ({ id, countryCode, hidden: false, kind: 'PHOTO', ...over });

describe('the photos a game can use', () => {
  it('leaves out unplaced, hidden photos and videos', () => {
    const photos = [photo('a', 'FR'), photo('b', null), photo('c', 'IT', { hidden: true }), photo('d', 'JP', { kind: 'VIDEO' })];
    expect(playablePhotos(photos).map((p) => p.id)).toEqual(['a']);
    expect(playablePhotos(null)).toEqual([]);
  });

  it('suggests one from each country first, then more, five at most', () => {
    const photos = [photo('f1', 'FR'), photo('f2', 'FR'), photo('i1', 'IT'), photo('j1', 'JP'), photo('f3', 'FR'), photo('n1', 'NL'), photo('e1', 'ES')];
    expect(suggestGamePhotos(photos)).toEqual(['f1', 'i1', 'j1', 'n1', 'e1']);
    expect(suggestGamePhotos(photos, 6)).toEqual(['f1', 'i1', 'j1', 'n1', 'e1', 'f2']);
    expect(suggestGamePhotos(photos, 50)).toHaveLength(7);
  });
});

describe('the game’s words', () => {
  it('says the score out of the most there was', () => {
    expect(scoreWords(2450, 3)).toBe('2,450 of 3,000 points');
  });
  it('says what a round’s answer was', () => {
    expect(roundResultWords({ correct: true, distanceKm: 0, answer: { countryName: 'Italy', landmarkName: 'Colosseum' } })).toBe('Yes! Colosseum, Italy.');
    expect(roundResultWords({ correct: false, distanceKm: 1104, answer: { countryName: 'France', landmarkName: null } })).toBe(
      'It was France: about 1,104 km from your guess.',
    );
    expect(roundResultWords({ correct: false, distanceKm: null, answer: { countryName: 'Antarctica', landmarkName: null } })).toBe('It was Antarctica.');
  });
  it('makes the link and what a player shares', () => {
    expect(guessLink('https://myplanetview.com', 'GWHR-2WAS-7MAP')).toBe('https://myplanetview.com/guess/GWHR-2WAS-7MAP');
    expect(shareScoreText({ mapName: 'Our map', score: 2980, rounds: 4 })).toBe('I scored 2,980 of 4,000 points guessing where “Our map” has been. Can you beat me?');
  });
});
