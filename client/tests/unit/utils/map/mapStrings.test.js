// Strings between places (src/utils/map/mapStrings.js): where each is drawn
import { describe, expect, it } from 'vitest';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import {
  TWIST_SHIFT_PX,
  TWIST_STRAND_OFFSETS_PX,
  acrossOf,
  drawnStrings,
  hasString,
  pinOf,
  previousVisitedPlace,
  stringEnds,
  stringLabel,
  stringPath,
  stringPins,
  twistStrands,
} from '@/utils/map/mapStrings';
import { REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';

// Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish)
describe('a twined string’s strands', () => {
  it('lie across the straight line between the pins', () => {
    expect(acrossOf({ x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: -0, y: 1 });
    expect(acrossOf({ x: 0, y: 0 }, { x: 0, y: 5 })).toEqual({ x: -1, y: 0 });
    expect(acrossOf({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual({ x: 0, y: 0 });
  });

  it('are four, the same pixels apart at any zoom, each further along than the one before', () => {
    const across = { x: 0, y: 1 };
    const strands = twistStrands(across, 1);
    expect(strands).toHaveLength(TWIST_STRAND_OFFSETS_PX.length);
    // In map units: pixels over the zoom's pixels per unit
    expect(strands.map((s) => s.dy)).toEqual(TWIST_STRAND_OFFSETS_PX.map((px) => Math.round((px / REFERENCE_PX_PER_UNIT) * 1e4) / 1e4));
    expect(strands.every((s) => s.dx === 0)).toBe(true);
    expect(twistStrands(across, 4)[3].dy).toBeCloseTo(strands[3].dy / 4, 3);
    // Their dashes start a little further on across the string: the slant of the twist
    expect(strands.map((s) => s.dashOffset)).toEqual(TWIST_STRAND_OFFSETS_PX.map((px) => Math.round(px * TWIST_SHIFT_PX * 100) / 100));
  });

  it('come with each drawn string', () => {
    const [drawn] = drawnStrings([{ id: 's1', from: 'FR', to: 'IT' }]);
    expect(drawn.across).toEqual(acrossOf(pinOf('FR'), pinOf('IT')));
    expect(Math.hypot(drawn.across.x, drawn.across.y)).toBeCloseTo(1);
  });
});

describe('pinOf', () => {
  it('is a place’s pin on the world map', () => {
    expect(pinOf('FR')).toEqual({ x: COUNTRY_BY_CODE.FR.pinX, y: COUNTRY_BY_CODE.FR.pinY });
    // A UK nation has its own pin
    expect(pinOf('XC')).toEqual({ x: COUNTRY_BY_CODE.XC.pinX, y: COUNTRY_BY_CODE.XC.pinY });
  });

  it('is nothing for a code that isn’t a place', () => {
    expect(pinOf('ZZ')).toBeNull();
    expect(pinOf(undefined)).toBeNull();
  });
});

describe('stringPath', () => {
  const numbers = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number);

  it('runs from one pin to the other, hanging below the straight line', () => {
    const [x1, y1, cx, cy, x2, y2] = numbers(stringPath({ x: 100, y: 200 }, { x: 300, y: 200 }));
    expect([x1, y1, x2, y2]).toEqual([100, 200, 300, 200]);
    expect(cx).toBe(200);
    // 12% of its length, below (y grows downwards)
    expect(cy).toBe(224);
  });

  it('hangs at most 60 map units, however long', () => {
    const [, , , cy] = numbers(stringPath({ x: 0, y: 500 }, { x: 2000, y: 500 }));
    expect(cy).toBe(560);
  });

  it('is a quadratic curve, rounded to a tenth', () => {
    expect(stringPath({ x: 1.234, y: 2.345 }, { x: 11.234, y: 2.345 })).toBe('M1.2 2.3Q6.2 3.5 11.2 2.3');
  });
});

describe('drawnStrings', () => {
  const strings = [
    { id: 's1', from: 'FR', to: 'JP' },
    { id: 's2', from: 'AQ', to: 'AR' },
    { id: 's3', from: 'FR', to: 'ZZ' },
  ];

  it('draws each string with a path and a label, leaving out one with no pin', () => {
    const drawn = drawnStrings(strings);
    expect(drawn.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(drawn[0]).toMatchObject({ id: 's1', from: 'FR', to: 'JP', label: 'France to Japan' });
    expect(drawn[0].d).toMatch(/^M[\d.]+ [\d.]+Q/);
  });

  it('leaves out the far south while Antarctica is hidden', () => {
    expect(drawnStrings(strings, { showAntarctica: false }).map((s) => s.id)).toEqual(['s1']);
  });

  it('is nothing for no strings', () => {
    expect(drawnStrings(null)).toEqual([]);
  });
});

describe('stringPins', () => {
  it('gives each end once', () => {
    const drawn = drawnStrings([
      { id: 'a', from: 'FR', to: 'JP' },
      { id: 'b', from: 'FR', to: 'IT' },
    ]);
    expect(stringPins(drawn).map((pin) => pin.code)).toEqual(['FR', 'JP', 'IT']);
    expect(stringPins(drawn)[0]).toEqual({ code: 'FR', ...pinOf('FR') });
  });
});

describe('words and ends', () => {
  it('names a string by its places', () => {
    expect(stringLabel({ from: 'GB', to: 'IE' })).toBe('United Kingdom to Ireland');
  });

  it('puts two places in code order, as the server keeps them, and refuses one place twice', () => {
    expect(stringEnds('JP', 'FR')).toEqual(['FR', 'JP']);
    expect(stringEnds('FR', 'FR')).toBeNull();
    expect(stringEnds('FR', '')).toBeNull();
  });
});

// 24 Nov 2026, the user's wish: a newly visited place is tied to the one visited just before it
describe('previousVisitedPlace', () => {
  const visit = (countryCode, firstVisitedOn = null, markedAt = null, status = 'VISITED') => ({ countryCode, status, firstVisitedOn, markedAt });
  const VISITS = [
    visit('GB', '1990-05-01', null, 'LIVED'),
    visit('FR', '2019-04-12'),
    visit('IT', '2025-07-02'),
    visit('JP', null, null, 'WANT_TO_GO'),
  ];

  it('is the place visited just before it, in order of visit', () => {
    expect(previousVisitedPlace([...VISITS, visit('DE', '2026-11-24', '2026-11-24T19:00:00Z')], 'DE')).toBe('IT');
    expect(previousVisitedPlace(VISITS, 'FR')).toBe('GB');
    // A place dated before others still goes in its place
    expect(previousVisitedPlace([...VISITS, visit('ES', '2018-08-03', '2026-11-24T19:00:00Z')], 'ES')).toBe('GB');
  });

  it('puts places marked the same day in the order marked, undated ones by when they were marked', () => {
    const today = [visit('DO', null, '2026-11-24T19:40:00Z'), visit('DZ', null, '2026-11-24T19:45:00Z'), visit('CN', '2026-11-24', '2026-11-24T19:55:00Z')];
    expect(previousVisitedPlace([...VISITS, ...today], 'CN')).toBe('DZ');
    expect(previousVisitedPlace([...VISITS, ...today], 'DO')).toBe('IT');
  });

  it('counts a place already on the map with no time known as before one marked now', () => {
    expect(previousVisitedPlace([visit('GB', null, null, 'LIVED'), visit('DE', '2026-11-24', '2026-11-24T19:00:00Z')], 'DE')).toBe('GB');
  });

  it('is nothing for the first place, a wish, a place not on the map, or the place it’s part of', () => {
    expect(previousVisitedPlace(VISITS, 'GB')).toBeNull();
    expect(previousVisitedPlace(VISITS, 'JP')).toBeNull();
    expect(previousVisitedPlace(VISITS, 'BR')).toBeNull();
    // Hawaii brought the US with it: never Hawaii's previous
    const hawaii = [...VISITS, visit('US', null, '2026-11-24T19:00:00Z'), visit('XH', '2026-11-24', '2026-11-24T19:00:01Z')];
    expect(previousVisitedPlace(hawaii, 'XH')).toBe('IT');
  });
});

describe('hasString', () => {
  it('finds a string between two places, either way round', () => {
    const strings = [{ id: 's1', from: 'FR', to: 'IT' }];
    expect(hasString(strings, 'IT', 'FR')).toBe(true);
    expect(hasString(strings, 'FR', 'IT')).toBe(true);
    expect(hasString(strings, 'FR', 'DE')).toBe(false);
    expect(hasString(null, 'FR', 'IT')).toBe(false);
    expect(hasString(strings, 'FR', 'FR')).toBe(false);
  });
});
