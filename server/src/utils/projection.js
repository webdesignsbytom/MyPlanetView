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

/** Real position -> SVG map position ({ x, y }), or null for an invalid position. */
export function projectToMap(latitude, longitude) {
  if (!isValidLatLng(latitude, longitude)) return null;
  const x = MAP_CENTRE_X + MAP_X_SCALE * interpolate(X_TABLE, latitude) * longitude;
  const y = MAP_EQUATOR_Y - MAP_Y_SCALE * Math.sign(latitude) * interpolate(Y_TABLE, latitude);
  return { x: round1(x), y: round1(y) };
}
