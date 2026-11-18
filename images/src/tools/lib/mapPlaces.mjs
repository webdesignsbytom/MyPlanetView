// The rules both map generators share (country-outlines.mjs, the world map's outlines, and
// country-maps.mjs, each country's own map with its states): which of the map's places a
// piece of Natural Earth's land is, as the map has decided (CLAUDE.md, "Shapes"), and the
// geometry they need. Moved here from country-outlines.mjs on 18 Nov 2026.
import { REGION_AREA, REGION_PARENT } from '../../../../client/src/utils/map/regionPlaces.js';

// Natural Earth's UK units → the map's nation codes (drawn on maps that split the UK)
export const NATIONS = { ENG: 'XE', SCT: 'XC', WLS: 'XW', NIR: 'XI' };
// Drawn as dots, with no shape (MicroStateDot; Goa, a region inside India)
export const DOTS = new Set(['AD', 'GI', 'LI', 'MC', 'SM', 'SG', 'VA', 'XG']);

// Natural Earth areas with no place of their own (by ADM0_A3 or GU_A3) → the map's place
export const JOINS = {
  CYN: 'CY', CNM: 'CY', WSB: 'CY', ESB: 'CY', // N. Cyprus, the UN buffer zone, the UK's bases
  SOL: 'SO', KNX: 'KR', KNZ: 'KP', USG: 'CU', KAS: 'PK', BRT: 'SD', SPI: 'AR', SYU: 'SY',
  HKG: 'CN', MAC: 'CN', NSV: 'NO', BVT: 'NO', ALD: 'FI',
  JEY: 'GB', GGY: 'GB', IMN: 'GB', PCN: 'GB', SHN: 'GB', IOT: 'GB', SGS: 'GB',
  SPM: 'FR', ATF: 'FR', WLF: 'FR', HMD: 'AU', CCK: 'AU', CXR: 'AU', NFK: 'AU', COK: 'NZ', NIU: 'NZ', TKL: 'NZ',
};
// Left off the map (disputed reefs and banks; Antarctica keeps its own drawing)
export const LEAVE_OUT = new Set(['PFA', 'PGA', 'BJN', 'SER', 'SCR', 'ATA']);

export const ringsOfGeometry = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
export const insideRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
export const lonLatBounds = (ring) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY };
};

// One polygon's place: the map's old answers where Natural Earth differs
export function placeOfPolygon(code, polygon) {
  const outer = polygon[0];
  const b = lonLatBounds(outer);
  if (code === 'RU' && insideRing(34.1, 44.95, outer)) return 'UA'; // Crimea
  if (code === 'RU' && b.maxY < 45.7 && b.minX > 145.2 && b.maxX < 149.2) return 'JP'; // the southern Kurils
  if (code === 'TW' && b.minX > 118.1 && b.maxX < 118.6 && b.minY > 24.3 && b.maxY < 24.6) return 'CN'; // Kinmen
  if (code === 'ES' && b.maxY < 30) return 'IC'; // the Canaries
  // A region (utils/map/regionPlaces.js): a piece of its country inside the region's box
  // (Bali, Tasmania, Hawaii's main islands, the Galápagos)
  for (const [region, parent] of Object.entries(REGION_PARENT)) {
    const a = REGION_AREA[region];
    if (code === parent && b.minX > a.west && b.maxX < a.east && b.minY > a.south && b.maxY < a.north) return region;
  }
  return code;
}

// The Golan's western edge, the 1967 line (lon, lat), from Lebanon past Banias, down the
// Jordan and the Sea of Galilee's east shore to the Yarmouk, ending in Jordan: Israel's
// outline is cut along it, and the piece holding GOLAN_POINT goes to Syria
export const GOLAN_LINE = [[35.62, 33.4], [35.655, 33.27], [35.632, 33.18], [35.627, 33.007], [35.632, 32.91], [35.645, 32.82], [35.652, 32.72], [35.66, 32.68], [35.68, 32.62]];
export const GOLAN_POINT = [35.75, 33.0];

// Where segment p→q crosses r→s: [t along p→q, u along r→s, point], or null
export function crossing([px, py], [qx, qy], [rx, ry], [sx, sy]) {
  const d = (qx - px) * (sy - ry) - (qy - py) * (sx - rx);
  if (!d) return null;
  const t = ((rx - px) * (sy - ry) - (ry - py) * (sx - rx)) / d;
  const u = ((rx - px) * (qy - py) - (ry - py) * (qx - px)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u < 1 ? [t, u, [px + t * (qx - px), py + t * (qy - py)]] : null;
}
// A ring cut in two by a line that crosses it exactly twice: [piece, piece], or null
export function cutRing(ring, line) {
  const open = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring;
  const hits = [];
  for (let l = 0; l < line.length - 1; l++) {
    for (let e = 0; e < open.length; e++) {
      const hit = crossing(line[l], line[l + 1], open[e], open[(e + 1) % open.length]);
      if (hit) hits.push({ along: l + hit[0], seg: l, edge: e, at: hit[2] });
    }
  }
  if (hits.length !== 2) return null;
  hits.sort((a, b) => a.along - b.along);
  const [a, b] = hits;
  const inner = line.slice(a.seg + 1, b.seg + 1); // the line's vertices between the two crossings
  const walk = (from, to) => { const out = []; for (let i = (from + 1) % open.length; ; i = (i + 1) % open.length) { out.push(open[i]); if (i === to) break; } return out; };
  const one = [a.at, ...walk(a.edge, b.edge), b.at, ...[...inner].reverse()];
  const two = [b.at, ...walk(b.edge, a.edge), a.at, ...inner];
  return [one, two];
}
