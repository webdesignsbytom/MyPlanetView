// @vitest-environment node
// Where the sun and the moon are overhead (src/utils/map/skyPositions.js), checked against
// moments whose answer is known: the equinox and solstice, local noon, and the 2026 eclipses
// (at an eclipse the sun and moon are lined up; low-precision formulas, so within a degree or so).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moonEcliptic, sunAndMoonAt, sunLongitude } from '@/utils/map/skyPositions';

const at = (iso) => {
  vi.setSystemTime(new Date(iso));
  return sunAndMoonAt(new Date());
};
// The difference between two longitudes, -180 to 180
const apart = (a, b) => ((((a - b + 180) % 360) + 360) % 360) - 180;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the sun', () => {
  it('is over the equator at the March equinox', () => {
    expect(Math.abs(at('2026-03-20T14:46:00Z').sun.latitude)).toBeLessThan(0.05);
  });

  it('is over the Tropic of Cancer at the June solstice, and of Capricorn in December', () => {
    expect(at('2026-06-21T08:24:00Z').sun.latitude).toBeCloseTo(23.44, 1);
    expect(at('2026-12-21T20:50:00Z').sun.latitude).toBeCloseTo(-23.44, 1);
  });

  it('is over Greenwich near midday UTC, and over the date line near midnight', () => {
    // The equation of time keeps it within about 4° of the meridian
    expect(Math.abs(at('2026-11-23T12:00:00Z').sun.longitude)).toBeLessThan(4.5);
    expect(Math.abs(apart(at('2026-11-23T00:00:00Z').sun.longitude, 180))).toBeLessThan(4.5);
  });

  it('moves west 15° an hour', () => {
    const noon = at('2026-05-01T12:00:00Z').sun.longitude;
    const one = at('2026-05-01T13:00:00Z').sun.longitude;
    expect(apart(one, noon)).toBeCloseTo(-15, 0);
  });

  it('has an ecliptic longitude near 280° at J2000', () => {
    expect(sunLongitude(0)).toBeCloseTo(280.37, 1);
  });
});

describe('the moon', () => {
  it('stays within about 5° of the ecliptic, and its point within the tropics and a bit', () => {
    for (let day = 0; day < 60; day += 3) {
      const { moon } = at(`2026-01-${String((day % 28) + 1).padStart(2, '0')}T06:00:00Z`);
      expect(Math.abs(moon.latitude)).toBeLessThan(29);
      expect(Math.abs(moon.longitude)).toBeLessThanOrEqual(180);
    }
    for (let d = 0; d < 30; d += 1.5) expect(Math.abs(moonEcliptic(9000 + d).latitude)).toBeLessThan(5.4);
  });

  it('is in front of the sun at the total solar eclipse of 12 August 2026', () => {
    const { sun, moon } = at('2026-08-12T17:46:00Z');
    expect(Math.abs(apart(moon.longitude, sun.longitude))).toBeLessThan(2);
    expect(Math.abs(moon.latitude - sun.latitude)).toBeLessThan(2);
  });

  it('is opposite the sun at the total lunar eclipse of 3 March 2026', () => {
    const { sun, moon } = at('2026-03-03T11:33:00Z');
    expect(Math.abs(apart(moon.longitude, sun.longitude + 180))).toBeLessThan(2);
    expect(Math.abs(moon.latitude + sun.latitude)).toBeLessThan(2);
  });
});

describe('sunAndMoonAt', () => {
  it('gives longitudes from -180 to 180 and latitudes from -90 to 90 at any hour', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const { sun, moon } = at(`2026-07-04T${String(hour).padStart(2, '0')}:30:00Z`);
      for (const point of [sun, moon]) {
        expect(point.longitude).toBeGreaterThanOrEqual(-180);
        expect(point.longitude).toBeLessThan(180);
        expect(Math.abs(point.latitude)).toBeLessThanOrEqual(90);
      }
    }
  });
});
