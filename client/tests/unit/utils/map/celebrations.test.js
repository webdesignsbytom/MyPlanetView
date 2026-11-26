// @vitest-environment node
// The celebration screen's rules (src/utils/map/celebrations.js; 24 Nov 2026, the user's wish):
// when it shows, and its stars.
import { describe, expect, it } from 'vitest';
import {
  CELEBRATION_KICKERS,
  STAR_INKS,
  burstStars,
  celebratesStamp,
  celebratesVisit,
  countryCelebrationText,
  countryCelebrationTitle,
  todayDay,
} from '@/utils/map/celebrations';

describe('celebratesVisit', () => {
  it('is a country going to visited or lived in from neither', () => {
    expect(celebratesVisit(null, 'VISITED')).toBe(true);
    expect(celebratesVisit(undefined, 'LIVED')).toBe(true);
    expect(celebratesVisit('WANT_TO_GO', 'VISITED')).toBe(true);
  });

  it('is never a change between visited and lived, a wish, or a status taken off', () => {
    expect(celebratesVisit('VISITED', 'LIVED')).toBe(false);
    expect(celebratesVisit('LIVED', 'VISITED')).toBe(false);
    expect(celebratesVisit(null, 'WANT_TO_GO')).toBe(false);
    expect(celebratesVisit('VISITED', null)).toBe(false);
  });
});

describe('celebratesStamp', () => {
  it('is a landmark the passport hadn’t stamped yet', () => {
    const stamped = new Set(['a']);
    expect(celebratesStamp('b', stamped)).toBe(true);
    expect(celebratesStamp('a', stamped)).toBe(false);
    expect(celebratesStamp('', stamped)).toBe(false);
    expect(celebratesStamp('b', undefined)).toBe(true);
  });
});

describe('todayDay', () => {
  it('is the day in the viewer’s own time zone, as YYYY-MM-DD', () => {
    expect(todayDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(todayDay(new Date(2026, 10, 24, 0, 1))).toBe('2026-11-24');
  });
});

describe('the words over the name', () => {
  it('say been here, and seen it or done it (Life’s One Shots); a country’s heading says it itself', () => {
    expect(CELEBRATION_KICKERS).toEqual({ landmark: 'Been here!', seen: 'Seen it!', done: 'Done it!' });
  });
});

// 24 Nov 2026, the user's wishes: "You visited France!", and the words name the country
describe('a country’s heading and words', () => {
  it('say you visited it or lived in it, with “the” where a name takes it', () => {
    expect(countryCelebrationTitle('France', 'VISITED')).toBe('You visited France!');
    expect(countryCelebrationTitle('United Kingdom', 'LIVED')).toBe('You lived in the United Kingdom!');
    expect(countryCelebrationTitle('North Pole', 'VISITED')).toBe('You visited the North Pole!');
    expect(countryCelebrationTitle('Azores', 'VISITED')).toBe('You visited the Azores!');
    expect(countryCelebrationTitle('Antarctica', 'VISITED')).toBe('You visited Antarctica!');
  });

  it('name it at the start, with its stamp, and how to date it when it has no date', () => {
    expect(countryCelebrationText('Algeria', 'VISITED', true)).toBe('Algeria now has its own page in your passport, with its entry stamp.');
    expect(countryCelebrationText('Netherlands', 'LIVED', true)).toBe('The Netherlands now has its own page in your passport, with its residence stamp.');
    expect(countryCelebrationText('Algeria', 'VISITED', false)).toBe(
      'Algeria now has its own page in your passport, with its entry stamp. Add the day you first went on its ticket, and the stamp is dated.',
    );
  });
});

describe('burstStars', () => {
  it('bursts the same way each time for one place, and another way for another', () => {
    expect(burstStars('lm-eiffel')).toEqual(burstStars('lm-eiffel'));
    expect(burstStars('lm-eiffel')).not.toEqual(burstStars('FR'));
  });

  it('spreads them round the circle, each within its distance, size, spin and delay, in turn of ink', () => {
    const stars = burstStars('FR', 18);
    expect(stars).toHaveLength(18);
    const quarters = new Set();
    stars.forEach((star, index) => {
      const distance = Math.hypot(star.x, star.y);
      expect(distance).toBeGreaterThanOrEqual(6.9);
      expect(distance).toBeLessThanOrEqual(14.1);
      expect(star.size).toBeGreaterThanOrEqual(0.7);
      expect(star.size).toBeLessThanOrEqual(1.8);
      expect(Math.abs(star.spin)).toBeLessThanOrEqual(180);
      expect(star.delay).toBeGreaterThanOrEqual(0);
      expect(star.delay).toBeLessThanOrEqual(260);
      expect(star.ink).toBe(STAR_INKS[index % STAR_INKS.length]);
      quarters.add(`${Math.sign(star.x)}${Math.sign(star.y)}`);
    });
    // Every quarter of the circle has some
    expect(quarters.size).toBe(4);
  });
});
