// @vitest-environment node
// What a distance is like (24 Nov 2026, the user's wish: "if they have gone 40000km we can say thats
// once round the world. if they have been 380000 km we can say thats the distance to the moon")
import { describe, expect, it } from 'vitest';
import { DISTANCE_COMPARISONS, distanceComparison, distanceLike, distanceSentence } from '@/utils/map/distanceComparisons';

const words = (km) => distanceComparison(km)?.words ?? null;

describe('distanceComparison', () => {
  it('says the user’s two: once round the world, and the Moon', () => {
    expect(words(40000)).toBe('about once round the world');
    expect(words(380000)).toBe('about as far as the Moon');
  });

  it('is "nearly" a little short, "about" close either side, "further than" past it', () => {
    expect(words(36000)).toBe('nearly once round the world');
    expect(words(27300)).toBe('nearly as far as the Pan-American Highway, from Alaska to Argentina');
    expect(words(17000)).toBe('about as far as London to Sydney');
    expect(words(18000)).toBe('further than London to Sydney');
    expect(words(19000)).toBe('nearly as far as every branch of the Great Wall of China');
    expect(words(46000)).toBe('more than once round the world');
    expect(words(350000)).toBe('nearly as far as the Moon');
    expect(words(300000)).toBe('about as far as light travels in a second');
  });

  it('counts the times round the world, and to the Moon and back past it', () => {
    expect(words(60000)).toBe('about one and a half times round the world');
    expect(words(80000)).toBe('about twice round the world');
    expect(words(100000)).toBe('about two and a half times round the world');
    expect(words(160000)).toBe('about 4 times round the world');
    expect(words(768800)).toBe('about as far as the Moon and back');
    expect(words(900000)).toBe('further than the Moon and back');
    expect(words(1600000)).toBe('about as far as the Moon and back twice');
    expect(words(4000000)).toBe('about as far as the Moon and back 5 times');
    expect(words(20000000)).toBe('about as far as the Moon and back 25 times');
  });

  it('says nothing of nothing, or of less than the edge of space', () => {
    expect(distanceComparison(0)).toBeNull();
    expect(distanceComparison(null)).toBeNull();
    expect(distanceComparison(50)).toBeNull();
    expect(words(95)).toBe('about as far as the edge of space, straight up');
  });

  it('has a sentence for every distance from the smallest up, its things in order', () => {
    const kms = DISTANCE_COMPARISONS.map((c) => c.km);
    expect([...kms].sort((a, b) => a - b)).toEqual(kms);
    for (const c of DISTANCE_COMPARISONS) {
      expect(distanceComparison(c.km).id).toBe(c.id);
      expect(distanceComparison(c.km).words).toMatch(/^about /);
    }
  });
});

describe('the words shown', () => {
  it('puts the distance first, in the map’s unit', () => {
    expect(distanceSentence(27281)).toBe('27,300 km is nearly as far as the Pan-American Highway, from Alaska to Argentina.');
    expect(distanceSentence(27281, 'miles')).toBe('17,000 miles is nearly as far as the Pan-American Highway, from Alaska to Argentina.');
    expect(distanceSentence(0)).toBeNull();
  });

  it('starts the words alone with a capital', () => {
    expect(distanceLike(80000)).toBe('About twice round the world');
    expect(distanceLike(0)).toBeNull();
  });
});
