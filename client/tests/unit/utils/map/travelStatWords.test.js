// @vitest-environment node
// The richer travel stats' words (src/utils/map/travelStatWords.js).
import { describe, expect, it } from 'vitest';
import { aboutKm, aboutMiles, withThe, worldShare } from '@/utils/map/travelStatWords';

describe('worldShare', () => {
  it('gives one decimal under 10% and whole numbers above', () => {
    expect(worldShare(10, 226)).toBe('4.4%');
    expect(worldShare(27, 226)).toBe('12%');
    expect(worldShare(226, 226)).toBe('100%');
  });

  it('is 0% with no countries', () => {
    expect(worldShare(0, 226)).toBe('0%');
    expect(worldShare(undefined, 226)).toBe('0%');
  });

  it('is null when the world’s total isn’t known', () => {
    expect(worldShare(10, 0)).toBeNull();
    expect(worldShare(10, undefined)).toBeNull();
  });
});

describe('aboutKm and aboutMiles', () => {
  it('round to the nearest 10 below 1,000 and the nearest 100 above', () => {
    expect(aboutKm(344)).toBe('340');
    expect(aboutKm(995)).toBe('1,000');
    expect(aboutKm(33_437)).toBe('33,400');
    expect(aboutKm(16_990)).toBe('17,000');
  });

  it('give 0 for no distance', () => {
    expect(aboutKm(0)).toBe('0');
    expect(aboutKm(null)).toBe('0');
    expect(aboutMiles(undefined)).toBe('0 miles');
  });

  it('turn kilometres into miles, rounded the same way', () => {
    expect(aboutMiles(33_437)).toBe('20,800 miles');
    expect(aboutMiles(344)).toBe('210 miles');
  });
});

describe('withThe', () => {
  it('puts “the” before the names that take it', () => {
    for (const name of ['United Kingdom', 'United States', 'Netherlands', 'Philippines', 'Czech Republic', 'Cayman Islands', 'Maldives', 'Vatican City']) {
      expect(withThe(name)).toBe(`the ${name}`);
    }
  });

  it('leaves every other name alone', () => {
    for (const name of ['France', 'Japan', 'Iceland', 'Netherlands Antilles Bay', 'Czechia']) expect(withThe(name)).toBe(name);
  });
});
