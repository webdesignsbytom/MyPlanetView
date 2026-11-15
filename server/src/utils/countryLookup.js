// Which country a real position falls in, using the map's own country shapes
// (src/data/countryShapes.json: polygons in SVG map units, keyed by ISO code).
// No external service: project the point onto the map, then point-in-polygon.
import { poleAt } from './specialPlaces.js';
import COUNTRY_SHAPES from '../data/countryShapes.json' with { type: 'json' };
import { projectToMap } from './projection.js';
import { haversineMeters } from './landmarkMatch.js';

// A photo taken on a beach or a pier can land just outside a coastline drawn at
// this resolution; within this many map units the nearest country wins.
export const COASTLINE_TOLERANCE = 6;

// Countries too small to have a shape on the map: a circle around each instead,
// checked first because each sits inside or against a bigger neighbour.
// Only used for codes the shapes file lacks. Accuracy is rough (a circle).
const SMALL_COUNTRIES = [
  { code: 'VA', latitude: 41.9029, longitude: 12.4534, radiusM: 600 },
  { code: 'MC', latitude: 43.7384, longitude: 7.4246, radiusM: 1800 },
  { code: 'SM', latitude: 43.9424, longitude: 12.4578, radiusM: 6000 },
  { code: 'LI', latitude: 47.166, longitude: 9.555, radiusM: 9000 },
  { code: 'SG', latitude: 1.3521, longitude: 103.8198, radiusM: 13000 },
].filter((c) => !COUNTRY_SHAPES[c.code]);

// Islands the old map data leaves out of their country's shape (it draws only
// mainland Equatorial Guinea), so the nearest coast would otherwise win
const UNDRAWN_ISLANDS = [{ code: 'GQ', name: 'Bioko', latitude: 3.53, longitude: 8.7, radiusM: 40000 }];

const smallCountryAt = (latitude, longitude) =>
  [...SMALL_COUNTRIES, ...UNDRAWN_ISLANDS].find(
    (c) => haversineMeters(latitude, longitude, c.latitude, c.longitude) <= c.radiusM
  )?.code ?? null;

const polygonArea = (poly) => {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  }
  return Math.abs(a / 2);
};

const boundsOf = (poly) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
};

// Built once: every polygon with its bounds and area
const INDEX = Object.entries(COUNTRY_SHAPES).map(([code, polygons]) => ({
  code,
  polygons: polygons.map((points) => ({ points, bounds: boundsOf(points), area: polygonArea(points) })),
}));

const inBounds = (b, x, y, pad = 0) =>
  x >= b.minX - pad && x <= b.maxX + pad && y >= b.minY - pad && y <= b.maxY + pad;

const pointInPolygon = (poly, x, y) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const distanceToSegment = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const distanceToPolygon = (poly, x, y) => {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    best = Math.min(best, distanceToSegment(x, y, poly[j], poly[i]));
  }
  return best;
};

/** Country code at a point in map units, or null (open sea, Antarctica). */
export function countryAtMapPoint(x, y) {
  // Inside: even-odd across a country's own shapes, so a hole (Lesotho inside
  // South Africa) doesn't count; the smallest containing shape wins enclaves.
  let found = null;
  for (const country of INDEX) {
    let crossings = 0;
    let smallest = Infinity;
    for (const polygon of country.polygons) {
      if (!inBounds(polygon.bounds, x, y)) continue;
      if (pointInPolygon(polygon.points, x, y)) {
        crossings++;
        smallest = Math.min(smallest, polygon.area);
      }
    }
    if (crossings % 2 === 1 && (!found || smallest < found.area)) found = { code: country.code, area: smallest };
  }
  if (found) return found.code;

  // Coastline fallback: the nearest shape within the tolerance
  let nearest = null;
  for (const country of INDEX) {
    for (const polygon of country.polygons) {
      if (!inBounds(polygon.bounds, x, y, COASTLINE_TOLERANCE)) continue;
      const distance = distanceToPolygon(polygon.points, x, y);
      if (distance <= COASTLINE_TOLERANCE && (!nearest || distance < nearest.distance)) {
        nearest = { code: country.code, distance };
      }
    }
  }
  return nearest?.code ?? null;
}

/**
 * Country (or special place) code for a real position, or null: a geographic pole
 * (utils/specialPlaces.js), then the small countries' circles, then the shapes (which
 * include Antarctica). Accurate to the map's resolution
 * (roughly 20–35 km): right by a border it can pick the neighbour, so users
 * can correct a photo's country.
 */
export function countryAtPosition(latitude, longitude) {
  const point = projectToMap(latitude, longitude);
  if (!point) return null;
  return poleAt(latitude) ?? smallCountryAt(latitude, longitude) ?? countryAtMapPoint(point.x, point.y);
}

/**
 * How far (in map units) a real position is from a country's shapes: 0 inside,
 * null when that country has no shape. Used to sanity-check seeded landmarks.
 */
export function distanceToCountry(code, latitude, longitude) {
  const country = INDEX.find((c) => c.code === code);
  const point = projectToMap(latitude, longitude);
  if (!country || !point) return null;
  let best = Infinity;
  for (const polygon of country.polygons) {
    if (pointInPolygon(polygon.points, point.x, point.y)) return 0;
    best = Math.min(best, distanceToPolygon(polygon.points, point.x, point.y));
  }
  return best;
}
