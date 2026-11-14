import { describe, it, expect } from 'vitest';
import { projectToMap, isValidLatLng } from '../src/utils/projection.js';

describe('projectToMap (Robinson, fitted to the SVG map)', () => {
  it('puts the equator at y = 502 and the prime meridian at x = 987.1', () => {
    expect(projectToMap(0, 0)).toEqual({ x: 987.1, y: 502 });
  });

  it('matches coastline points measured on the map', () => {
    // Brazil's eastern tip (Ponta do Seixas): the map's Brazil ends at x = 790.0
    expect(projectToMap(-7.15, -34.79).x).toBeCloseTo(790.0, 0);
    // Hokkaido's eastern tip: the map's Japan ends at x = 1736.2
    expect(projectToMap(43.38, 145.82).x).toBeCloseTo(1736.3, 0);
    // Cape Agulhas: the map's South Africa ends at y = 725.4
    expect(Math.abs(projectToMap(-34.83, 20.0).y - 725.4)).toBeLessThan(1.5);
  });

  it('is symmetric about the equator', () => {
    const north = projectToMap(40, 10);
    const south = projectToMap(-40, 10);
    expect(north.x).toBe(south.x);
    expect(502 - north.y).toBeCloseTo(south.y - 502, 1);
  });

  it('rejects positions that are not on Earth', () => {
    expect(projectToMap(91, 0)).toBeNull();
    expect(projectToMap(0, 181)).toBeNull();
    expect(projectToMap(Number.NaN, 0)).toBeNull();
    expect(isValidLatLng('51', 0)).toBe(false);
  });
});
