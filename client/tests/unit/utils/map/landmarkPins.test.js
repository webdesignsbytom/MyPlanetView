// @vitest-environment node
// Which landmark pins the map draws at each zoom (src/utils/map/landmarkPins.js).
import { describe, expect, it } from 'vitest';
import { ALL_PINS_ZOOM, PIN_SPACING, pinRadius, pinZoomStep, pinsShownAt, placePins } from '@/utils/map/landmarkPins';

let next = 0;
const landmark = (fields) => ({ id: `l${next++}`, name: 'Somewhere', countryCode: 'FR', isUnesco: false, matchRadiusM: 500, pinX: 100, pinY: 100, ...fields });
const zoomOf = (pins, name) => pins.find((pin) => pin.landmark.name === name).minZoom;

describe('pinZoomStep', () => {
  it('rounds the zoom down to a quarter of a doubling', () => {
    expect(pinZoomStep(1)).toBe(1);
    expect(pinZoomStep(2)).toBe(2);
    expect(pinZoomStep(1.1)).toBe(1);
    expect(pinZoomStep(1.2)).toBeCloseTo(2 ** 0.25, 10);
    expect(pinZoomStep(3)).toBeCloseTo(2 ** 1.5, 10);
  });

  it('never takes the log of nothing', () => {
    expect(Number.isFinite(pinZoomStep(0))).toBe(true);
  });
});

describe('pinRadius', () => {
  it('is a 5 px-ish dot, never above 3 map units', () => {
    expect(pinRadius(1)).toBe(3);
    expect(pinRadius(5)).toBe(1);
    expect(pinRadius(10)).toBe(0.5);
  });
});

describe('placePins', () => {
  it('leaves out landmarks with no position', () => {
    const pins = placePins([landmark({ name: 'A' }), landmark({ name: 'B', pinX: null }), landmark({ name: 'C', pinY: undefined })]);
    expect(pins.map((pin) => pin.landmark.name)).toEqual(['A']);
    expect(pins[0]).toMatchObject({ x: 100, y: 100, minZoom: 1 });
  });

  it('shows pins far apart from the start', () => {
    const pins = placePins([landmark({ name: 'A' }), landmark({ name: 'B', pinX: 100 + PIN_SPACING * 2 })]);
    expect(pins.map((pin) => pin.minZoom)).toEqual([1, 1]);
  });

  it('shows a close pin once the zoom spreads it PIN_SPACING / zoom from the other', () => {
    const pins = placePins([landmark({ name: 'A' }), landmark({ name: 'B', pinX: 110 })]);
    expect(zoomOf(pins, 'A')).toBe(1);
    expect(zoomOf(pins, 'B')).toBeCloseTo(PIN_SPACING / 10, 10);
  });

  it('shows two pins in the same spot only from ALL_PINS_ZOOM', () => {
    const pins = placePins([landmark({ name: 'A' }), landmark({ name: 'B' })]);
    expect(zoomOf(pins, 'B')).toBe(ALL_PINS_ZOOM);
  });

  it('never makes a pin wait past ALL_PINS_ZOOM', () => {
    const pins = placePins([landmark({ name: 'A' }), landmark({ name: 'B', pinX: 100.5 })]);
    expect(zoomOf(pins, 'B')).toBe(ALL_PINS_ZOOM);
  });

  it('puts every country’s first landmark before any country’s second', () => {
    // France's two (A to Z: Aa first) far apart; Belgium's one right beside France's second
    const pins = placePins([
      landmark({ name: 'Ab', countryCode: 'FR', pinX: 100 }),
      landmark({ name: 'Aa', countryCode: 'FR', pinX: 500 }),
      landmark({ name: 'Ba', countryCode: 'BE', pinX: 105 }),
    ]);
    expect(zoomOf(pins, 'Aa')).toBe(1);
    // Belgium's first comes before France's second, so it shows first and France's waits
    expect(zoomOf(pins, 'Ba')).toBe(1);
    expect(zoomOf(pins, 'Ab')).toBeCloseTo(PIN_SPACING / 5, 10);
  });

  it('puts a country’s well-known landmarks before its World Heritage Sites, then the smaller places, then A to Z', () => {
    const near = (name, fields) => landmark({ name, countryCode: 'IT', ...fields });
    expect(zoomOf(placePins([near('Unesco', { isUnesco: true }), near('Colosseum', { pinX: 105 })]), 'Colosseum')).toBe(1);
    expect(zoomOf(placePins([near('Park', { matchRadiusM: 5000 }), near('Tower', { matchRadiusM: 200, pinX: 105 })]), 'Tower')).toBe(1);
    expect(zoomOf(placePins([near('Bravo'), near('Alpha', { pinX: 105 })]), 'Alpha')).toBe(1);
  });

  it('sorts the pins by the zoom they appear from', () => {
    const pins = placePins([landmark({ name: 'A' }), landmark({ name: 'B', pinX: 110 }), landmark({ name: 'C', pinX: 500 })]);
    const zooms = pins.map((pin) => pin.minZoom);
    expect(zooms).toEqual([...zooms].sort((a, b) => a - b));
  });

  it('places nothing for no landmarks', () => {
    expect(placePins([])).toEqual([]);
  });
});

describe('pinsShownAt', () => {
  const pins = [{ minZoom: 1 }, { minZoom: 1 }, { minZoom: 2.5 }, { minZoom: 4 }, { minZoom: 12 }];

  it('counts the pins that show at a zoom', () => {
    expect(pinsShownAt(pins, 1)).toBe(2);
    expect(pinsShownAt(pins, 2.5)).toBe(3);
    expect(pinsShownAt(pins, 3)).toBe(3);
    expect(pinsShownAt(pins, 12)).toBe(5);
    expect(pinsShownAt(pins, 0.5)).toBe(0);
  });

  it('counts none in an empty list', () => {
    expect(pinsShownAt([], 5)).toBe(0);
  });
});
