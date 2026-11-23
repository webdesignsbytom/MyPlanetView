// Strings between places (src/utils/map/mapStrings.js): where each is drawn
import { describe, expect, it } from 'vitest';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { drawnStrings, pinOf, stringEnds, stringLabel, stringPath, stringPins } from '@/utils/map/mapStrings';

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
