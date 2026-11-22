// The SVG world map's projection: Robinson, fitted on 14 Nov 2026 against known
// coastlines (within ~2 units on a map 2000 wide; see docs/SITE-DESIGN.md).
// 2000 wide; the extent is the pole lines, y -16.6 to 1020.6 with Antarctica (-16.6 to 857
// without). Equator at y = 502, prime meridian at x = 987.1.

const LATITUDES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
// Robinson's standard tables: parallel length (X) and distance from the equator (Y)
const X_TABLE = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322];
const Y_TABLE = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1];

export const MAP_CENTRE_X = 987.1;
export const MAP_X_SCALE = 5.681; // map units per degree of longitude at the equator
export const MAP_EQUATOR_Y = 502;
export const MAP_Y_SCALE = 518.6; // map units from the equator to a pole

const interpolate = (table, latitude) => {
  const abs = Math.min(Math.abs(latitude), 90);
  const i = Math.min(Math.floor(abs / 5), LATITUDES.length - 2);
  const t = (abs - LATITUDES[i]) / 5;
  return table[i] + (table[i + 1] - table[i]) * t;
};

export const isValidLatLng = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const round1 = (n) => Math.round(n * 10) / 10;

// Antarctica as a printed map draws it (16 Nov 2026): Robinson's sides curve in towards
// the poles, so Antarctica followed a curve. From 58°S the parallels widen, smoothly,
// until from 66°S they reach the map's sides (x 0 and 2000): Antarctica runs straight
// across the bottom. North of 58°S nothing changes.
const MAP_WIDTH = 2000;
const WIDEN_FROM = 58;
const WIDEN_FULL = 66;
const smoothstep = (t) => t * t * (3 - 2 * t);
function widened(latitude, longitude, x) {
  if (latitude > -WIDEN_FROM) return x;
  const t = smoothstep(Math.min(1, (-latitude - WIDEN_FROM) / (WIDEN_FULL - WIDEN_FROM)));
  // The meridian's place on a map whose parallels all reach its sides
  const full = MAP_CENTRE_X + (longitude / 180) * (longitude < 0 ? MAP_CENTRE_X : MAP_WIDTH - MAP_CENTRE_X);
  return x + (full - x) * t;
}

// The projection itself, unrounded (projectToMap rounds it; positionFromMap inverts it)
function projectExact(latitude, longitude) {
  const robinsonX = MAP_CENTRE_X + MAP_X_SCALE * interpolate(X_TABLE, latitude) * longitude;
  return {
    x: widened(latitude, longitude, robinsonX),
    y: MAP_EQUATOR_Y - MAP_Y_SCALE * Math.sign(latitude) * interpolate(Y_TABLE, latitude),
  };
}

/** Real position -> SVG map position ({ x, y }), or null for an invalid position. */
export function projectToMap(latitude, longitude) {
  if (!isValidLatLng(latitude, longitude)) return null;
  const { x, y } = projectExact(latitude, longitude);
  return { x: round1(x), y: round1(y) };
}

// The pole lines, projectToMap(90, 0).y and projectToMap(-90, 0).y
const MAP_TOP = -16.6;
const MAP_BOTTOM = 1020.6;

// The value in [lo, hi] where a rising function reaches `target` (48 halvings: far finer
// than a metre)
function solveRising(fn, lo, hi, target) {
  let low = lo;
  let high = hi;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    if (fn(mid) < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * SVG map position -> real position ({ latitude, longitude }), or null off the world: the
 * client's positionFromMap (client/src/utils/map/projection.js), the same maths. The travel
 * stats use it for the places' pins (utils/travelStats.js).
 */
export function positionFromMap(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || y < MAP_TOP || y > MAP_BOTTOM) return null;
  // y falls as the latitude rises
  const latitude = solveRising((lat) => -projectExact(lat, 0).y, -90, 90, -y);
  if (x < projectExact(latitude, -180).x || x > projectExact(latitude, 180).x) return null;
  const longitude = solveRising((lng) => projectExact(latitude, lng).x, -180, 180, x);
  return { latitude, longitude };
}
