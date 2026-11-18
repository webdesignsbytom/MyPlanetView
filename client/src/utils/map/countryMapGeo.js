// Each country's own map (utils/map/countryMaps/, made by images/src/tools/country-maps.mjs;
// 18 Nov 2026, the user's wish): loading one, and placing a position on it. A map is drawn
// on a canvas 2000 wide; its `frames` are Lambert azimuthal equal-area projections, the
// first the main land's, the others the insets' (each with its `box` on the canvas and the
// `area` of latitude and longitude it covers). A frame maps a position to the canvas as
// x = frame.x + scale × X, y = frame.y − scale × Y, (X, Y) the projection on a sphere of 1.
import { COUNTRY_MAP_INFO } from './countryMapInfo';
import { regionParent } from './regionPlaces';

const LOADERS = Object.fromEntries(
  Object.entries(import.meta.glob('./countryMaps/*.js', { import: 'default' })).map(([file, load]) => [file.match(/([A-Z]{2})\.js$/)[1], load]),
);

/**
 * The country map a place opens: its own, or for a region its country's (Bali: Indonesia's);
 * null when it has none (Antarctica, the poles).
 */
export function countryMapCodeFor(code) {
  const map = regionParent(code) ?? code;
  return LOADERS[map] && COUNTRY_MAP_INFO[map] ? map : null;
}

/** How many states the map has and what they're called: `{ count, word: [one, many] }`. */
export const countryMapInfo = (code) => COUNTRY_MAP_INFO[code] ?? null;

const loading = new Map();
/** The map's data (a promise; one fetch per visit, a failed one tried again next time). */
export function loadCountryMap(code) {
  if (!LOADERS[code]) return Promise.reject(new Error(`No country map for ${code}`));
  if (!loading.has(code)) {
    loading.set(
      code,
      LOADERS[code]().catch((err) => {
        loading.delete(code);
        throw err;
      }),
    );
  }
  return loading.get(code);
}

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

/** A position on a frame: `{ x, y }` on the canvas. */
export function toFrame(frame, latitude, longitude) {
  const phi0 = rad(frame.lat);
  const phi = rad(latitude);
  const dl = rad(wrap(longitude - frame.lng));
  const k = Math.sqrt(2 / (1 + Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dl)));
  const X = k * Math.cos(phi) * Math.sin(dl);
  const Y = k * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dl));
  return { x: frame.x + frame.scale * X, y: frame.y - frame.scale * Y };
}

/** A point of a frame's canvas back to a position: `{ latitude, longitude }`. */
export function fromFrame(frame, x, y) {
  const X = (x - frame.x) / frame.scale;
  const Y = (frame.y - y) / frame.scale;
  const rho = Math.hypot(X, Y);
  if (rho < 1e-12) return { latitude: frame.lat, longitude: frame.lng };
  const c = 2 * Math.asin(Math.min(1, rho / 2));
  const phi0 = rad(frame.lat);
  const latitude = deg(Math.asin(Math.cos(c) * Math.sin(phi0) + (Y * Math.sin(c) * Math.cos(phi0)) / rho));
  const longitude = wrap(frame.lng + deg(Math.atan2(X * Math.sin(c), rho * Math.cos(phi0) * Math.cos(c) - Y * Math.sin(phi0) * Math.sin(c))));
  return { latitude, longitude };
}

const inArea = (frame, latitude, longitude) => {
  const [latMin, latMax, dMin, dMax] = frame.area;
  const d = wrap(longitude - frame.lng);
  return latitude >= latMin && latitude <= latMax && d >= dMin && d <= dMax;
};

/** Where a position goes on a country's map: an inset's when it's in one's area, else the main land's. */
export function placeOnCountryMap(geo, latitude, longitude) {
  const frame = geo.frames.slice(1).find((f) => inArea(f, latitude, longitude)) ?? geo.frames[0];
  return toFrame(frame, latitude, longitude);
}

/** The position under a point of the canvas: an inset's when it's in one's box. */
export function positionOnCountryMap(geo, x, y) {
  const frame =
    geo.frames.slice(1).find(({ box: [bx, by, bw, bh] }) => x >= bx && x <= bx + bw && y >= by && y <= by + bh) ?? geo.frames[0];
  return fromFrame(frame, x, y);
}
