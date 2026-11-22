// @vitest-environment node
// The world map's projection (src/utils/map/projection.js): Robinson fitted to the SVG map,
// with Antarctica widened to run straight across the bottom. The server has the same maths
// (server/src/utils/projection.js), so the known points are the server tests' own, and the
// two are compared point by point.
import { describe, expect, it } from 'vitest';
import {
  MAP_BOTTOM,
  MAP_BOTTOM_WITHOUT_ANTARCTICA,
  MAP_CENTRE_X,
  MAP_EQUATOR_Y,
  MAP_TOP,
  MAP_WIDTH,
  REFERENCE_PX_PER_UNIT,
  buildGridLines,
  insidePoleLines,
  isValidLatLng,
  latitudeLabel,
  longitudeLabel,
  mapExtent,
  positionFromMap,
  projectToMap,
} from '@/utils/map/projection';
import * as server from '../../../../../server/src/utils/projection.js';

describe('projectToMap (Robinson, fitted to the SVG map)', () => {
  it('puts the equator at y = 502 and the prime meridian at x = 987.1', () => {
    expect(projectToMap(0, 0)).toEqual({ x: 987.1, y: 502 });
    expect(MAP_CENTRE_X).toBe(987.1);
    expect(MAP_EQUATOR_Y).toBe(502);
  });

  it('matches coastline points measured on the map', () => {
    // Brazil's eastern tip (Ponta do Seixas): the map's Brazil ends at x = 790.0
    expect(projectToMap(-7.15, -34.79).x).toBeCloseTo(790.0, 0);
    // Hokkaido's eastern tip: the map's Japan ends at x = 1736.2
    expect(projectToMap(43.38, 145.82).x).toBeCloseTo(1736.3, 0);
    // Cape Agulhas: the map's South Africa ends at y = 725.4
    expect(Math.abs(projectToMap(-34.83, 20.0).y - 725.4)).toBeLessThan(1.5);
  });

  it('puts the poles on the pole lines, which are the map’s extent', () => {
    expect(projectToMap(90, 0).y).toBe(MAP_TOP);
    expect(projectToMap(-90, 0).y).toBe(MAP_BOTTOM);
    expect(MAP_TOP).toBe(-16.6);
    expect(MAP_BOTTOM).toBe(1020.6);
  });

  it('runs Antarctica straight across the bottom: from 66°S the parallels reach the sides', () => {
    for (const lat of [-66, -75, -90]) {
      expect(projectToMap(lat, -180).x).toBe(0);
      expect(projectToMap(lat, 180).x).toBe(MAP_WIDTH);
    }
    // North of 58°S it's plain Robinson; between, the parallels widen smoothly
    expect(projectToMap(-58, 180).x).toBeCloseTo(987.1 + 5.681 * (0.835 + (0.7986 - 0.835) * 0.6) * 180, 0);
    const between = projectToMap(-62, 180).x;
    expect(between).toBeGreaterThan(projectToMap(-58, 180).x);
    expect(between).toBeLessThan(2000);
  });

  it('leaves the north alone: the parallels there keep Robinson’s length', () => {
    // 66°N is plain Robinson (X(65) = 0.7597, X(70) = 0.7186, a fifth of the way)
    const robinson = 987.1 + 5.681 * (0.7597 + (0.7186 - 0.7597) * 0.2) * 180;
    expect(projectToMap(66, 180).x).toBeCloseTo(robinson, 0);
    expect(projectToMap(66, 180).x).toBeLessThan(2000);
  });

  it('keeps the prime meridian straight, widened south or not', () => {
    for (const lat of [-90, -70, -60, -30, 0, 45, 90]) expect(projectToMap(lat, 0).x).toBe(987.1);
  });

  it('is symmetric about the equator north of the widening', () => {
    const north = projectToMap(40, 10);
    const south = projectToMap(-40, 10);
    expect(north.x).toBe(south.x);
    expect(502 - north.y).toBeCloseTo(south.y - 502, 1);
  });

  it('grows x with the longitude and y towards the south', () => {
    expect(projectToMap(10, 20).x).toBeGreaterThan(projectToMap(10, 10).x);
    expect(projectToMap(-10, 10).y).toBeGreaterThan(projectToMap(10, 10).y);
  });

  it('rounds to a tenth of a map unit', () => {
    const { x, y } = projectToMap(51.5074, -0.1278);
    expect(Math.round(x * 10) / 10).toBe(x);
    expect(Math.round(y * 10) / 10).toBe(y);
  });

  it('rejects positions that are not on Earth', () => {
    expect(projectToMap(91, 0)).toBeNull();
    expect(projectToMap(-91, 0)).toBeNull();
    expect(projectToMap(0, 181)).toBeNull();
    expect(projectToMap(0, -181)).toBeNull();
    expect(projectToMap(Number.NaN, 0)).toBeNull();
    expect(projectToMap(0, Infinity)).toBeNull();
    expect(isValidLatLng('51', 0)).toBe(false);
    expect(isValidLatLng(90, -180)).toBe(true);
  });
});

describe('positionFromMap', () => {
  it('turns a pin back into the position it was projected from', () => {
    for (const [lat, lng] of [
      [51.5, -0.13],
      [-33.87, 151.21],
      [0, 0],
      [-75, 100],
      [89.95, 10],
      [-62, -170],
      [-89, 179],
      [64.1, -21.9],
    ]) {
      const { x, y } = projectToMap(lat, lng);
      const back = positionFromMap(x, y);
      expect(back.latitude).toBeCloseTo(lat, 1);
      expect(back.longitude).toBeCloseTo(lng, 1);
    }
  });

  it('gives nothing beyond a pole line', () => {
    expect(positionFromMap(1000, -40)).toBeNull();
    expect(positionFromMap(0, -40)).toBeNull();
    expect(positionFromMap(1000, MAP_BOTTOM + 1)).toBeNull();
  });

  it('gives nothing past the world’s edge at that latitude', () => {
    const sixty = projectToMap(60, 0).y;
    // At 60°N the world reaches only about x 170 to 1804
    expect(positionFromMap(100, sixty)).toBeNull();
    expect(positionFromMap(1900, sixty)).toBeNull();
    expect(positionFromMap(1000, sixty)).not.toBeNull();
  });

  it('reaches the map’s sides in the widened south', () => {
    const y = projectToMap(-75, 0).y;
    expect(positionFromMap(0, y).longitude).toBeCloseTo(-180, 3);
    expect(positionFromMap(2000, y).longitude).toBeCloseTo(180, 3);
  });

  it('gives nothing for a point that isn’t a number', () => {
    expect(positionFromMap(Number.NaN, 500)).toBeNull();
    expect(positionFromMap(500, undefined)).toBeNull();
  });
});

describe('the same maths as the server', () => {
  it('projects every point exactly as the server does', () => {
    for (let lat = -90; lat <= 90; lat += 7.5) {
      for (let lng = -180; lng <= 180; lng += 15) {
        expect(projectToMap(lat, lng), `${lat}, ${lng}`).toEqual(server.projectToMap(lat, lng));
      }
    }
    expect(projectToMap(91, 0)).toEqual(server.projectToMap(91, 0));
  });

  it('inverts every point exactly as the server does', () => {
    for (const [x, y] of [
      [987.1, 502],
      [1736.3, 260],
      [12, 990],
      [1990, 1000],
      [100, 150],
      [0, -40],
    ]) {
      expect(positionFromMap(x, y), `${x}, ${y}`).toEqual(server.positionFromMap(x, y));
    }
  });
});

describe('the map’s extent', () => {
  it('runs pole line to pole line with Antarctica, and ends with the countries without', () => {
    expect(mapExtent()).toEqual({ top: -16.6, bottom: 1020.6 });
    expect(mapExtent(true)).toEqual({ top: -16.6, bottom: 1020.6 });
    expect(mapExtent(false)).toEqual({ top: -16.6, bottom: MAP_BOTTOM_WITHOUT_ANTARCTICA });
    expect(MAP_BOTTOM_WITHOUT_ANTARCTICA).toBe(857);
  });

  it('makes zoom 1 the whole map across a 1920-pixel screen', () => {
    expect(REFERENCE_PX_PER_UNIT * MAP_WIDTH).toBe(1920);
  });

  it('moves a mark just inside the pole lines, and leaves one inside them alone', () => {
    expect(insidePoleLines(-20, 5)).toBeCloseTo(-11.6, 6);
    expect(insidePoleLines(1020.6, 5)).toBeCloseTo(1015.6, 6);
    expect(insidePoleLines(500, 5)).toBe(500);
  });
});

describe('buildGridLines', () => {
  const points = (text) => text.split(' ').map((pair) => pair.split(',').map(Number));

  it('draws every parallel and meridian, and both pole lines, with Antarctica', () => {
    const { parallels, meridians, poleLines } = buildGridLines(30);
    expect(parallels.map((p) => p.lat)).toEqual([-60, -30, 0, 30, 60]);
    expect(meridians.map((m) => m.lng)).toEqual([-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180]);
    expect(poleLines.map((p) => p.lat)).toEqual([90, -90]);
    // A meridian runs from the South Pole to the North Pole, a point every 5°
    expect(points(meridians[6].points)).toHaveLength(37);
    expect(points(meridians[6].points)[0]).toEqual([987.1, 1020.6]);
  });

  it('draws a parallel straight from the world’s west edge to its east edge, labelled at the west', () => {
    const equator = buildGridLines(30).parallels.find((p) => p.lat === 0);
    const [west, east] = points(equator.points);
    expect(west).toEqual([projectToMap(0, -180).x, 502]);
    expect(east).toEqual([projectToMap(0, 180).x, 502]);
    expect(equator.labelAt).toEqual(projectToMap(0, -180));
  });

  it('stops at the meridians’ labels without Antarctica, with only the North Pole line', () => {
    const { parallels, meridians, poleLines } = buildGridLines(30, { south: false });
    expect(parallels.map((p) => p.lat)).toEqual([-30, 0, 30, 60]);
    expect(points(meridians[0].points)).toHaveLength(30);
    expect(points(meridians[0].points)[0]).toEqual(Object.values(projectToMap(-55, -180)));
    expect(poleLines.map((p) => p.lat)).toEqual([90]);
  });

  it('labels each meridian in the Southern Ocean', () => {
    for (const meridian of buildGridLines(60).meridians) expect(meridian.labelAt).toEqual(projectToMap(-55, meridian.lng));
  });
});

describe('the grid’s labels', () => {
  it('names the latitudes', () => {
    expect(latitudeLabel(0)).toBe('Equator');
    expect(latitudeLabel(30)).toBe('30°N');
    expect(latitudeLabel(-60)).toBe('60°S');
  });

  it('names the longitudes', () => {
    expect(longitudeLabel(0)).toBe('0°');
    expect(longitudeLabel(90)).toBe('90°E');
    expect(longitudeLabel(-120)).toBe('120°W');
  });
});
