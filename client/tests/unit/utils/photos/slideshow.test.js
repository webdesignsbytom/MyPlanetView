import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SLIDE_SPEED,
  MOMENT_CARD_SECONDS,
  SLIDE_SPEEDS,
  buildSlides,
  newShuffleSeed,
  photoPlace,
} from '@/utils/photos/slideshow';

const photo = (id, countryCode, takenAt = null) => ({ id, countryCode, takenAt });
const moment = (id, happenedOn, countryCode) => ({ id, happenedOn, countryCode });
const shape = (slides) => slides.map((s) => (s.type === 'photo' ? s.id : s.type === 'card' ? `card:${s.countryCode}` : s.type === 'moment' ? `m:${s.moment.id}` : 'end'));

describe('the settings', () => {
  it('offers three speeds, five seconds by default, and longer for a moment', () => {
    expect(SLIDE_SPEEDS).toEqual([3, 5, 8]);
    expect(SLIDE_SPEEDS).toContain(DEFAULT_SLIDE_SPEED);
    expect(MOMENT_CARD_SECONDS).toBeGreaterThan(DEFAULT_SLIDE_SPEED);
  });
});

describe('newShuffleSeed', () => {
  it('gives a whole number from 1 to 2^31 − 1', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementationOnce((array) => {
      array[0] = 0;
      return array;
    });
    expect(newShuffleSeed()).toBe(1);
    vi.spyOn(crypto, 'getRandomValues').mockImplementationOnce((array) => {
      array[0] = 2 ** 32 - 1;
      return array;
    });
    const top = newShuffleSeed();
    expect(top).toBeGreaterThanOrEqual(1);
    expect(top).toBeLessThanOrEqual(2 ** 31 - 1);
  });

  it('falls back to Math.random without crypto', () => {
    vi.stubGlobal('crypto', undefined);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(newShuffleSeed()).toBe(Math.floor(0.5 * (2 ** 31 - 1)) + 1);
  });
});

describe('buildSlides', () => {
  it('lists the photos as they are without title cards', () => {
    expect(shape(buildSlides([photo('a', 'FR'), photo('b', 'IT')]))).toEqual(['a', 'b']);
  });

  it('puts a country’s card before each new stretch, not for photos with no country', () => {
    const photos = [photo('a', 'FR'), photo('b', 'FR'), photo('c', null), photo('d', 'FR'), photo('e', 'IT'), photo('f', 'FR')];
    const slides = buildSlides(photos, { titleCards: true });
    expect(shape(slides)).toEqual(['card:FR', 'a', 'b', 'c', 'd', 'card:IT', 'e', 'card:FR', 'f']);
    expect(slides[0].id).toBe('card-a');
  });

  it('ends with the end card only once every page is in, and never for no photos', () => {
    expect(shape(buildSlides([photo('a', 'FR')], { complete: true }))).toEqual(['a', 'end']);
    expect(buildSlides([], { complete: true })).toEqual([]);
  });

  it('puts each moment before the first photo taken on or after its day', () => {
    const photos = [photo('a', 'FR', '2025-01-01T10:00:00Z'), photo('b', 'FR', '2025-03-01T10:00:00Z'), photo('c', 'FR', null)];
    const moments = [moment('m1', '2025-01-01', 'FR'), moment('m2', '2025-02-01', 'FR'), moment('m3', '2026-01-01', 'FR')];
    expect(shape(buildSlides(photos, { moments }))).toEqual(['m:m1', 'a', 'm:m2', 'b', 'c']);
    expect(shape(buildSlides(photos, { moments, complete: true }))).toEqual(['m:m1', 'a', 'm:m2', 'b', 'c', 'm:m3', 'end']);
  });

  it('puts a moment in the next country after its card, and one elsewhere before it', () => {
    const photos = [photo('a', 'FR', '2025-01-01T00:00:00Z'), photo('b', 'IT', '2025-05-01T00:00:00Z')];
    const moments = [moment('home', '2025-03-01', 'GB'), moment('rome', '2025-04-01', 'IT')];
    expect(shape(buildSlides(photos, { titleCards: true, moments }))).toEqual(['card:FR', 'a', 'm:home', 'card:IT', 'm:rome', 'b']);
  });

  it('names a moment’s slide after the moment', () => {
    const [slide] = buildSlides([photo('a', 'FR', '2025-02-01')], { moments: [moment(7, '2025-01-01', 'FR')] });
    expect(slide).toEqual({ id: 'moment-7', type: 'moment', moment: moment(7, '2025-01-01', 'FR') });
  });
});

describe('photoPlace', () => {
  it('names the country and the confirmed landmarks', () => {
    const p = { countryCode: 'FR', landmarks: [{ name: 'Eiffel Tower', confirmed: true }, { name: 'Louvre', confirmed: false }] };
    expect(photoPlace(p)).toBe('France · Eiffel Tower');
    expect(photoPlace({ countryCode: null, landmarks: [{ name: 'Petra', confirmed: true }] })).toBe('Petra');
    expect(photoPlace({})).toBe('');
  });
});
