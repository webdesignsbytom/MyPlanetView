// Mock mode only. Which country a GPS position is in, worked out as the server does
// (server/src/utils/countryLookup.js): a geographic pole by latitude alone, then circles
// for the micro-states and the islands the map doesn't draw, then project onto the map
// and point-in-polygon against the map's own shapes (Antarctica's too), the smallest
// containing shape winning
// enclaves, then the nearest coast within a tolerance. The magnetic poles are never found
// from GPS (they drift). The polygons are parsed from the client's path strings exactly
// as server/src/data/countryShapes.json was made from them, so both give the same
// answers. Loaded only when a photo first needs it.
import { projectToMap } from '@/utils/map/projection';
import { poleAt } from '@/utils/map/specialPlaces';

export const COASTLINE_TOLERANCE = 6;
const EARTH_RADIUS_M = 6371000;

// Countries too small to have a shape, and islands the map doesn't draw (Bioko, and Greek
// islands off Turkey too small for Natural Earth's 1:50m data)
const SMALL_COUNTRIES = [
  { code: 'VA', latitude: 41.9029, longitude: 12.4534, radiusM: 600 },
  { code: 'MC', latitude: 43.7384, longitude: 7.4246, radiusM: 1800 },
  { code: 'SM', latitude: 43.9424, longitude: 12.4578, radiusM: 6000 },
  { code: 'LI', latitude: 47.166, longitude: 9.555, radiusM: 9000 },
  { code: 'SG', latitude: 1.3521, longitude: 103.8198, radiusM: 13000 },
  { code: 'AD', latitude: 42.546, longitude: 1.592, radiusM: 13500 },
  { code: 'GI', latitude: 36.1315, longitude: -5.349, radiusM: 2700 },
];
// As the server's DECIDED_PLACES: the Old City of Jerusalem is Palestine's
const DECIDED_PLACES = [{ code: 'PS', latitude: 31.7767, longitude: 35.2345, radiusM: 1000 }];
const UNDRAWN_ISLANDS = [
  { code: 'GQ', latitude: 3.53, longitude: 8.7, radiusM: 40000 },
  { code: 'GR', latitude: 36.145, longitude: 29.585, radiusM: 2200 },
  { code: 'GR', latitude: 36.43, longitude: 27.37, radiusM: 6000 },
  { code: 'GR', latitude: 37.3, longitude: 26.765, radiusM: 3000 },
  { code: 'GR', latitude: 37.378, longitude: 26.735, radiusM: 3000 },
  { code: 'GR', latitude: 37.46, longitude: 26.97, radiusM: 3500 },
  { code: 'GR', latitude: 37.293, longitude: 27.088, radiusM: 1500 },
];

const toRadians = (d) => (d * Math.PI) / 180;
function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

// SVG path data (M, L, H, V and Z, absolute or relative) -> polygons, points to 0.1
function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  const polygons = [];
  let polygon = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let command = null;
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) command = tokens[i++];
    switch (command) {
      case 'M':
      case 'm':
        x = command === 'M' ? num() : x + num();
        y = command === 'M' ? num() : y + num();
        polygon = [[x, y]];
        polygons.push(polygon);
        startX = x;
        startY = y;
        command = command === 'M' ? 'L' : 'l';
        break;
      case 'L':
        x = num();
        y = num();
        polygon.push([x, y]);
        break;
      case 'l':
        x += num();
        y += num();
        polygon.push([x, y]);
        break;
      case 'H':
        x = num();
        polygon.push([x, y]);
        break;
      case 'h':
        x += num();
        polygon.push([x, y]);
        break;
      case 'V':
        y = num();
        polygon.push([x, y]);
        break;
      case 'v':
        y += num();
        polygon.push([x, y]);
        break;
      case 'Z':
      case 'z':
        x = startX;
        y = startY;
        break;
      default:
        throw new Error(`Unsupported path command ${command}`);
    }
  }
  return polygons
    .filter((p) => p.length >= 3)
    .map((p) => p.map(([px, py]) => [Math.round(px * 10) / 10, Math.round(py * 10) / 10]));
}

const polygonArea = (poly) => {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  return Math.abs(a / 2);
};

const boundsOf = (poly) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
};

const inBounds = (b, x, y, pad = 0) => x >= b.minX - pad && x <= b.maxX + pad && y >= b.minY - pad && y <= b.maxY + pad;

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
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) best = Math.min(best, distanceToSegment(x, y, poly[j], poly[i]));
  return best;
};

// Built on first use: every country's polygons with their bounds and areas
let index = null;
async function loadIndex() {
  if (!index) {
    const { COUNTRY_SHAPES } = await import('@/utils/map/countryShapes');
    index = Object.entries(COUNTRY_SHAPES).map(([code, paths]) => ({
      code,
      polygons: paths.flatMap(parsePath).map((points) => ({ points, bounds: boundsOf(points), area: polygonArea(points) })),
    }));
  }
  return index;
}

function countryAtMapPoint(countries, x, y) {
  let found = null;
  for (const country of countries) {
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

  let nearest = null;
  for (const country of countries) {
    for (const polygon of country.polygons) {
      if (!inBounds(polygon.bounds, x, y, COASTLINE_TOLERANCE)) continue;
      const distance = distanceToPolygon(polygon.points, x, y);
      if (distance <= COASTLINE_TOLERANCE && (!nearest || distance < nearest.distance)) nearest = { code: country.code, distance };
    }
  }
  return nearest?.code ?? null;
}

/**
 * How far (in map units) a real position is from a country's shapes: 0 inside, null when
 * that country has no shape (as the server's distanceToCountry; a moment's pin leeway).
 */
export async function distanceToCountry(code, latitude, longitude) {
  const point = projectToMap(latitude, longitude);
  const country = (await loadIndex()).find((c) => c.code === code);
  if (!country || !point) return null;
  let best = Infinity;
  for (const polygon of country.polygons) {
    if (pointInPolygon(polygon.points, point.x, point.y)) return 0;
    best = Math.min(best, distanceToPolygon(polygon.points, point.x, point.y));
  }
  return best;
}

/** Country (or special place) code for a real position, or null (open sea). */
export async function countryAtPosition(latitude, longitude) {
  const point = projectToMap(latitude, longitude);
  if (!point) return null;
  const pole = poleAt(latitude);
  if (pole) return pole;
  const countries = await loadIndex();
  const shaped = new Set(countries.map((c) => c.code));
  const small = [...DECIDED_PLACES, ...SMALL_COUNTRIES.filter((c) => !shaped.has(c.code)), ...UNDRAWN_ISLANDS].find(
    (c) => haversineMeters(latitude, longitude, c.latitude, c.longitude) <= c.radiusM,
  );
  return small?.code ?? countryAtMapPoint(countries, point.x, point.y);
}
