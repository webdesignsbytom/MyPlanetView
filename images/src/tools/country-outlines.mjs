// The map's country outlines from Natural Earth's 1:10m "admin 0 map units" (public domain,
// naturalearthdata.com; the file is on GitHub, nvkelso/natural-earth-vector,
// geojson/ne_10m_admin_0_map_units.geojson), 18 Nov 2026, the user's wish: the old
// outlines, traced from another map, were rough. From the repo root:
//   node images/src/tools/country-outlines.mjs <ne_10m_admin_0_map_units.geojson>
//
// It writes:
// - client/src/utils/map/countryShapes.js: each place's outline, projected as the map
//   projects (utils/map/projection.js, unrounded), simplified to TOLERANCE map units with
//   every shared border simplified once (both neighbours keep the same line, so no gaps),
//   islets under MIN_SPAN dropped unless the whole place is small, rounded to 0.1.
//   Antarctica (AQ) is kept as it was (its own Natural Earth drawing, widened south of 58°S);
// - server/src/data/countryShapes.json: the same outlines as polygons, for the GPS lookups;
// - COUNTRY_LABEL_WIDTH in client/src/utils/map/countryStyle.js: each place's largest shape's
//   width (the colours are kept: a fresh colouring would reshuffle every country's);
// - UK_NATION_SHAPES and UK_NATION_LABEL_WIDTH in client/src/utils/map/ukNationShapes.js: the
//   UK's four nations (Natural Earth's own England, Scotland, Wales and Northern Ireland,
//   simplified with everything else, so their borders and coasts are GB's and Ireland's
//   exactly). Their pins are kept. (uk-nations.mjs still makes the lookups' nation outlines.)
//
// Natural Earth draws borders as they are on the ground; the map keeps the old answers
// where they differ (CLAUDE.md, "Shapes"): Crimea is Ukraine's, the four southern Kurils
// Japan's, Kinmen China's; every part of Cyprus is Cyprus; Somaliland is Somalia, the Golan
// Syria's (Israel's outline is cut along the 1967 line: GOLAN_LINE), Siachen Pakistan's, Bir
// Tawil Sudan's. Areas without a place of
// their own join their country (Hong Kong and Macau China, Svalbard and Bouvet Norway,
// Åland Finland, Jersey, Guernsey, the Isle of Man and the UK's far islands the UK...).
// The Canaries are cut out of Spain (IC). The micro-states stay dots (no shape).
// Regions (utils/map/regionPlaces.js) are cut out of their country: Bali (XB) from Indonesia,
// Tasmania (XT) from Australia, Hawaii's main islands (XH) from the US; New Caledonia is
// Natural Earth's own unit. Goa (XG) is a dot. In the server's lookup outlines each region is
// part of its country again (a photo in Bali is in Indonesia).
//
// It also writes the detailed outlines (18 Nov 2026, the user's wish: islands looked jagged
// zoomed in): client/src/utils/map/detailShapes/<code>.js, each place simplified to
// DETAIL_TOLERANCE (about 1 px at the closest zoom), rounded to 0.01, with islets down to
// DETAIL_MIN_SPAN, and their bounds in detailShapeBounds.js. The map loads them for the
// places in view once zoomed in (hooks/useDetailedShapes.js).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CLIENT_SHAPES = path.join(ROOT, 'client/src/utils/map/countryShapes.js');
const SERVER_SHAPES = path.join(ROOT, 'server/src/data/countryShapes.json');
const STYLE = path.join(ROOT, 'client/src/utils/map/countryStyle.js');
const NATIONS_FILE = path.join(ROOT, 'client/src/utils/map/ukNationShapes.js');
const DETAIL_DIR = path.join(ROOT, 'client/src/utils/map/detailShapes');
const DETAIL_BOUNDS = path.join(ROOT, 'client/src/utils/map/detailShapeBounds.js');
// Natural Earth's UK units → the map's nation codes (drawn on maps that split the UK)
const NATIONS = { ENG: 'XE', SCT: 'XC', WLS: 'XW', NIR: 'XI' };

// How far a simplified line may stray from Natural Earth's, in map units (2000 across): a
// coast, and (finer, as a photo by a border must land on the right side) a land border
const TOLERANCE = 0.35;
const BORDER_TOLERANCE = 0.12;
// Islands narrower than this (map units) are left out, unless their place is small, or the
// island lies within NEAR_OTHERS of another place's land (Symi and Leros off Turkey: left
// out, the nearest coast would answer for them)
const MIN_SPAN = 1;
// The detailed outlines: every line to this (coasts and borders alike), islets from this span
const DETAIL_TOLERANCE = 0.05;
const DETAIL_MIN_SPAN = 0.2;
const NEAR_SPAN = 0.25;
const NEAR_OTHERS = 6;
// A small place (its biggest piece under SMALL_PLACE across: the Caribbean islands, the
// Maldives, Tuvalu) is simplified to FINE_TOLERANCE and rounded to 0.01, so it keeps a
// shape; a border it shares uses the fine tolerance on both sides, so they still meet
const SMALL_PLACE = 4;
const FINE_TOLERANCE = 0.06;
const DUST = 0.03;
// Vertices closer than this are the same point (for shared borders)
const KEY_DIGITS = 2;

const geoFile = process.argv[2];
if (!geoFile) throw new Error('Usage: node images/src/tools/country-outlines.mjs <ne_10m_admin_0_map_units.geojson>');

// The map's projection, unrounded (projection.js exports only the rounded projectToMap)
const projectionSource = fs.readFileSync(path.join(ROOT, 'client/src/utils/map/projection.js'), 'utf8');
const tmp = path.join(os.tmpdir(), `projection-exact-${process.pid}.mjs`);
fs.writeFileSync(tmp, `${projectionSource}\nexport { projectExact };\n`);
const { projectExact } = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

const { COUNTRIES } = await import(pathToFileURL(path.join(ROOT, 'client/src/utils/map/countries.js')).href);
const { REGION_AREA, REGION_PARENT } = await import(pathToFileURL(path.join(ROOT, 'client/src/utils/map/regionPlaces.js')).href);
const { COUNTRY_SHAPES: OLD_SHAPES } = await import(pathToFileURL(CLIENT_SHAPES).href);

const PLACES = new Set(COUNTRIES.filter((c) => !c.kind || c.kind === 'REGION').map((c) => c.code));
// Drawn as dots, with no shape (MicroStateDot; Goa, a region inside India)
const DOTS = new Set(['AD', 'GI', 'LI', 'MC', 'SM', 'SG', 'VA', 'XG']);

// Natural Earth areas with no place of their own (by ADM0_A3 or GU_A3) → the map's place
const JOINS = {
  CYN: 'CY', CNM: 'CY', WSB: 'CY', ESB: 'CY', // N. Cyprus, the UN buffer zone, the UK's bases
  SOL: 'SO', KNX: 'KR', KNZ: 'KP', USG: 'CU', KAS: 'PK', BRT: 'SD', SPI: 'AR', SYU: 'SY',
  HKG: 'CN', MAC: 'CN', NSV: 'NO', BVT: 'NO', ALD: 'FI',
  JEY: 'GB', GGY: 'GB', IMN: 'GB', PCN: 'GB', SHN: 'GB', IOT: 'GB', SGS: 'GB',
  SPM: 'FR', ATF: 'FR', WLF: 'FR', HMD: 'AU', CCK: 'AU', CXR: 'AU', NFK: 'AU', COK: 'NZ', NIU: 'NZ', TKL: 'NZ',
};
// Left off the map (disputed reefs and banks; Antarctica keeps its own drawing)
const LEAVE_OUT = new Set(['PFA', 'PGA', 'BJN', 'SER', 'SCR', 'ATA']);

const ringsOfGeometry = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const insideRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const lonLatBounds = (ring) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY };
};

// One polygon's place: the map's old answers where Natural Earth differs
function placeOfPolygon(code, polygon) {
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
const GOLAN_LINE = [[35.62, 33.4], [35.655, 33.27], [35.632, 33.18], [35.627, 33.007], [35.632, 32.91], [35.645, 32.82], [35.652, 32.72], [35.66, 32.68], [35.68, 32.62]];
const GOLAN_POINT = [35.75, 33.0];

// Where segment p→q crosses r→s: [t along p→q, u along r→s, point], or null
function crossing([px, py], [qx, qy], [rx, ry], [sx, sy]) {
  const d = (qx - px) * (sy - ry) - (qy - py) * (sx - rx);
  if (!d) return null;
  const t = ((rx - px) * (sy - ry) - (ry - py) * (sx - rx)) / d;
  const u = ((rx - px) * (qy - py) - (ry - py) * (qx - px)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u < 1 ? [t, u, [px + t * (qx - px), py + t * (qy - py)]] : null;
}
// A ring cut in two by a line that crosses it exactly twice: [piece, piece], or null
function cutRing(ring, line) {
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

const geo = JSON.parse(fs.readFileSync(geoFile, 'utf8'));
const report = { joined: {}, leftOut: [], unknown: [] };
const keyOf = (x, y) => `${x.toFixed(KEY_DIGITS)},${y.toFixed(KEY_DIGITS)}`;
const point = (key) => key.split(',').map(Number);

// Rings per place, each a list of vertex keys (projected, open: the first isn't repeated)
const ringsByPlace = new Map();
for (const feature of geo.features) {
  const p = feature.properties;
  const units = [p.ADM0_A3, p.GU_A3, p.SU_A3];
  if (units.some((u) => LEAVE_OUT.has(u))) { report.leftOut.push(p.NAME); continue; }
  let code = PLACES.has(p.ISO_A2_EH) ? p.ISO_A2_EH : units.map((u) => JOINS[u]).find(Boolean);
  if (!code) { report.unknown.push(`${p.NAME} (${p.ISO_A2_EH}, ${p.ADM0_A3})`); continue; }
  if (!PLACES.has(p.ISO_A2_EH)) report.joined[p.NAME] = code;
  for (const polygon of ringsOfGeometry(feature.geometry)) {
    // The Golan: Israel's outline cut along the 1967 line, its eastern piece Syria's
    if (code === 'IL' && insideRing(GOLAN_POINT[0], GOLAN_POINT[1], polygon[0])) {
      const pieces = cutRing(polygon[0], GOLAN_LINE);
      if (!pieces) throw new Error(`The Golan line should cross Israel's outline twice`);
      for (const piece of pieces) addPolygon(insideRing(GOLAN_POINT[0], GOLAN_POINT[1], piece) ? 'SY' : 'IL', [piece]);
      report.joined['the Golan (cut from Israel)'] = 'SY';
      continue;
    }
    const place = placeOfPolygon(code, polygon);
    if (DOTS.has(place)) continue;
    // A nation's piece is also the nation's own (GB dissolves them into one)
    for (const into of NATIONS[p.GU_A3] ? [place, NATIONS[p.GU_A3]] : [place]) addPolygon(into, polygon);
  }
}
function addPolygon(place, polygon) {
  {
    for (const ring of polygon) {
      const keys = [];
      for (const [lon, lat] of ring) {
        const { x, y } = projectExact(lat, lon);
        const k = keyOf(x, y);
        if (k !== keys[keys.length - 1]) keys.push(k);
      }
      if (keys.length > 1 && keys[0] === keys[keys.length - 1]) keys.pop();
      if (keys.length >= 3) {
        if (!ringsByPlace.has(place)) ringsByPlace.set(place, []);
        ringsByPlace.get(place).push(keys);
      }
    }
  }
}

// Dissolve: a border two pieces of one place share (England and Scotland, Crimea and the
// rest of Ukraine) cancels out, and what's left is walked into rings again
function dissolve(rings) {
  const edges = new Map(); // "a>b" → count
  const add = (a, b, n) => edges.set(`${a}>${b}`, (edges.get(`${a}>${b}`) || 0) + n);
  for (const ring of rings) for (let i = 0; i < ring.length; i++) add(ring[i], ring[(i + 1) % ring.length], 1);
  for (const [edge, n] of edges) {
    if (n <= 0) continue;
    const [a, b] = edge.split('>');
    const back = edges.get(`${b}>${a}`) || 0;
    const gone = Math.min(n, back);
    if (gone) { edges.set(edge, n - gone); edges.set(`${b}>${a}`, back - gone); }
  }
  const out = new Map(); // a → [b, ...]
  for (const [edge, n] of edges) {
    for (let i = 0; i < n; i++) {
      const [a, b] = edge.split('>');
      if (!out.has(a)) out.set(a, []);
      out.get(a).push(b);
    }
  }
  const result = [];
  for (const start of out.keys()) {
    while (out.get(start)?.length) {
      const ring = [start];
      let at = out.get(start).pop();
      while (at !== start) {
        ring.push(at);
        const next = out.get(at);
        if (!next?.length) break; // an open end (shouldn't happen): the ring closes here
        at = next.pop();
      }
      if (ring.length >= 3) result.push(ring);
    }
  }
  return result;
}
for (const [place, rings] of ringsByPlace) ringsByPlace.set(place, dissolve(rings));

// Topology: which rings use each edge; a vertex where that changes is a junction (where a
// border meets the coast, or three places meet), kept so each border is simplified once
const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const owners = new Map();
const allRings = [];
for (const [place, rings] of ringsByPlace) for (const ring of rings) allRings.push({ place, ring, id: allRings.length });
for (const { ring, id } of allRings) {
  for (let i = 0; i < ring.length; i++) {
    const k = edgeKey(ring[i], ring[(i + 1) % ring.length]);
    if (!owners.has(k)) owners.set(k, []);
    owners.get(k).push(id);
  }
}
const ownersOf = (a, b) => owners.get(edgeKey(a, b)).slice().sort((x, y) => x - y).join(',');

const spanOfKeys = (ring) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k of ring) { const [x, y] = point(k); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return Math.max(maxX - minX, maxY - minY);
};
const smallPlaces = new Set([...ringsByPlace].filter(([, rings]) => Math.max(...rings.map(spanOfKeys)) < SMALL_PLACE).map(([place]) => place));
// The two sets of outlines: the whole map's (BASE), and the detailed ones (DETAIL)
const BASE = { coast: TOLERANCE, border: BORDER_TOLERANCE, fine: FINE_TOLERANCE, minSpan: MIN_SPAN, nearSpan: NEAR_SPAN, digits: 1 };
const DETAIL = { coast: DETAIL_TOLERANCE, border: DETAIL_TOLERANCE, fine: DETAIL_TOLERANCE, minSpan: DETAIL_MIN_SPAN, nearSpan: DETAIL_MIN_SPAN, digits: 2 };
const toleranceOf = (a, b, level) => {
  const ids = owners.get(edgeKey(a, b));
  if (ids.some((id) => smallPlaces.has(allRings[id].place))) return Math.min(level.fine, level.coast);
  return new Set(ids.map((id) => allRings[id].place)).size > 1 ? level.border : level.coast;
};

// Each place's land, by grid cell (NEAR_OTHERS across), to find islands near another place
const landCells = new Map();
for (const { place, ring } of allRings) {
  for (const k of ring) {
    const [x, y] = point(k);
    const cell = `${Math.floor(x / NEAR_OTHERS)},${Math.floor(y / NEAR_OTHERS)}`;
    if (!landCells.has(cell)) landCells.set(cell, new Set());
    landCells.get(cell).add(place);
  }
}
const nearOtherPlace = (place, pts) => {
  const [x, y] = pts[0];
  const cx = Math.floor(x / NEAR_OTHERS), cy = Math.floor(y / NEAR_OTHERS);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    for (const other of landCells.get(`${cx + dx},${cy + dy}`) || []) if (other !== place && !nationOf(other, place)) return true;
  }
  return false;
};
// GB and its own nations, or a region and its country, aren't "another place" to each other
const nationOf = (a, b) =>
  (a === 'GB' && /^X[ECWI]$/.test(b)) || (b === 'GB' && /^X[ECWI]$/.test(a)) || REGION_PARENT[a] === b || REGION_PARENT[b] === a;

// Douglas-Peucker with both ends kept
function simplifyLine(pts, tolerance) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    let max = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const d = len ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len : Math.hypot(px - ax, py - ay);
      if (d > max) { max = d; at = i; }
    }
    if (max > tolerance) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// A line between two junctions, simplified once whichever ring asks (cached in one direction)
const lines = new Map();
function simplifiedChain(keys, level) {
  const tolerance = toleranceOf(keys[0], keys[1], level);
  const forward = keys[0] < keys[keys.length - 1] || (keys[0] === keys[keys.length - 1] && keys[1] < keys[keys.length - 2]);
  const canon = forward ? keys : [...keys].reverse();
  const id = `${canon[0]}~${canon[1]}~${canon[canon.length - 2]}~${canon[canon.length - 1]}~${canon.length}~${tolerance}`;
  if (!lines.has(id)) lines.set(id, simplifyLine(canon.map(point), tolerance));
  const done = lines.get(id);
  return forward ? done : [...done].reverse();
}

// A ring with no junction (an island, or an enclave and the hole round it): split at the
// vertex farthest from its smallest key, both halves simplified (the same for both sides)
function simplifiedLoop(ring, level) {
  let start = 0;
  for (let i = 1; i < ring.length; i++) if (ring[i] < ring[start]) start = i;
  const rotated = [...ring.slice(start), ...ring.slice(0, start)];
  const [sx, sy] = point(rotated[0]);
  let far = 1, best = -1;
  rotated.forEach((k, i) => { const [x, y] = point(k); const d = Math.hypot(x - sx, y - sy); if (d > best) { best = d; far = i; } });
  const first = simplifiedChain([...rotated.slice(0, far + 1)], level);
  const second = simplifiedChain([...rotated.slice(far), rotated[0]], level);
  return [...first.slice(0, -1), ...second.slice(0, -1)];
}

function simplifyRing(ring, level) {
  const n = ring.length;
  const junction = ring.map((_, i) => ownersOf(ring[(i - 1 + n) % n], ring[i]) !== ownersOf(ring[i], ring[(i + 1) % n]));
  const firstJunction = junction.indexOf(true);
  if (firstJunction === -1) return simplifiedLoop(ring, level);
  const out = [];
  let chain = [ring[firstJunction]];
  for (let s = 1; s <= n; s++) {
    const i = (firstJunction + s) % n;
    chain.push(ring[i]);
    if (junction[i]) {
      out.push(...simplifiedChain(chain, level).slice(0, -1));
      chain = [ring[i]];
    }
  }
  return out;
}

const round1 = (v) => Math.round(v * 10) / 10;
const round2 = (v) => Math.round(v * 100) / 100;
const signedArea = (pts) => pts.reduce((s, [x1, y1], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x1 * y2 - x2 * y1; }, 0) / 2;
const spanOf = (pts) => {
  const xs = pts.map(([x]) => x), ys = pts.map(([, y]) => y);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};
const widthOf = (pts) => { const xs = pts.map(([x]) => x); return Math.max(...xs) - Math.min(...xs); };

// Each place's simplified, rounded rings (islets and specks left out), at one level
function shapesFor(level) {
const shapes = {};
for (const [place, rings] of ringsByPlace) {
  const small = smallPlaces.has(place);
  const round = small || level.digits === 2 ? round2 : round1;
  let polys = rings
    .map((ring) => simplifyRing(ring, level).map(([x, y]) => [round(x), round(y)]))
    .map((pts) => pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]))
    .filter((pts) => pts.length >= 3 && Math.abs(signedArea(pts)) > 0);
  const biggest = Math.max(0, ...polys.map(spanOf));
  polys = polys.filter((pts) => {
    const span = spanOf(pts);
    if (small) return span >= DUST;
    return span >= level.minSpan || (span >= level.nearSpan && nearOtherPlace(place, pts));
  });
  // Never no shape: at least the biggest piece, as it is
  if (!polys.length) {
    const ring = rings.reduce((a, b) => (spanOfKeys(b) > spanOfKeys(a) ? b : a));
    polys = [ring.map(point).map(([x, y]) => [round2(x), round2(y)])];
  }
  shapes[place] = polys;
}
return shapes;
}
const shapes = shapesFor(BASE);
const detail = shapesFor(DETAIL);
// Antarctica keeps its drawing
const parseOld = (d) => d.replace(/[MZ]/g, ' ').trim().split(/\s+/).map(Number).reduce((pts, v, i, all) => (i % 2 ? pts : [...pts, [v, all[i + 1]]]), []);
shapes.AQ = OLD_SHAPES.AQ.map(parseOld);

const missing = [...PLACES].filter((c) => !DOTS.has(c) && !shapes[c]);
const pathOf = (pts) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' ')} Z`;
const nationCodes = Object.values(NATIONS);
const codes = Object.keys(shapes).filter((code) => !nationCodes.includes(code)).sort();

// client/src/utils/map/countryShapes.js
const header = `// Country shapes for the SVG world map (Robinson projection; the countries span y 0 to 857,
// Antarctica runs to the South Pole line at 1020.6), keyed by ISO 3166-1 alpha-2 code
// (plus IC Canary Islands, XK Kosovo). Generated by images/src/tools/country-outlines.mjs
// from Natural Earth's 1:10m admin 0 map units (public domain, naturalearthdata.com),
// projected with utils/map/projection.js and simplified to ${TOLERANCE} map units, each shared
// border once (18 Nov 2026). Antarctica (AQ) is Natural Earth's 1:50m drawing, widened south
// of 58°S (15–16 Nov 2026). Micro-states have no shape: they're drawn as dots. Don't edit
// by hand: re-run the tool.
export const COUNTRY_SHAPES = {
${codes.map((code) => `  ${code}: [${shapes[code].map((pts) => `'${pathOf(pts)}'`).join(',')}],`).join('\n')}
};
`;
fs.writeFileSync(CLIENT_SHAPES, header);

// server/src/data/countryShapes.json: a region is part of its country there
const serverShapes = {};
for (const code of codes) {
  const into = REGION_PARENT[code] ?? code;
  serverShapes[into] = [...(serverShapes[into] ?? []), ...shapes[code]];
}
fs.writeFileSync(SERVER_SHAPES, JSON.stringify(Object.fromEntries(Object.keys(serverShapes).sort().map((code) => [code, serverShapes[code]]))));

// client/src/utils/map/detailShapes/<code>.js (the nations' too), and their bounds
fs.rmSync(DETAIL_DIR, { recursive: true, force: true });
fs.mkdirSync(DETAIL_DIR);
const detailCodes = Object.keys(detail).sort();
for (const code of detailCodes) {
  fs.writeFileSync(
    path.join(DETAIL_DIR, `${code}.js`),
    `// Generated by images/src/tools/country-outlines.mjs: ${code}'s detailed outline. Don't edit by hand.
export default [${detail[code].map((pts) => `'${pathOf(pts)}'`).join(',')}];
`
  );
}
const boundsOf = (polys) => {
  const xs = polys.flatMap((pts) => pts.map(([x]) => x)), ys = polys.flatMap((pts) => pts.map(([, y]) => y));
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round1);
};
fs.writeFileSync(
  DETAIL_BOUNDS,
  `// Generated by images/src/tools/country-outlines.mjs. Don't edit by hand.

// Each place's detailed outline's bounds, [minX, minY, maxX, maxY] in map units: which to
// load for the view (hooks/useDetailedShapes.js; the outlines are in detailShapes/)
export const DETAIL_SHAPE_BOUNDS = {
${detailCodes.map((code) => `  ${code}: [${boundsOf(detail[code]).join(', ')}],`).join('\n')}
};
`
);

// COUNTRY_LABEL_WIDTH in countryStyle.js: each place's largest shape's width
const widths = Object.fromEntries(
  codes.map((code) => {
    const main = shapes[code].reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a));
    return [code, code === 'AQ' ? 2000 : round1(widthOf(main))];
  })
);
const style = fs.readFileSync(STYLE, 'utf8');
const line = `export const COUNTRY_LABEL_WIDTH = { ${codes.map((code) => `${code}: ${widths[code]}`).join(', ')} };`;
if (!/^export const COUNTRY_LABEL_WIDTH = \{.*\};$/m.test(style)) throw new Error('countryStyle.js has no COUNTRY_LABEL_WIDTH line');
fs.writeFileSync(STYLE, style.replace(/^export const COUNTRY_LABEL_WIDTH = \{.*\};$/m, line));

// ukNationShapes.js: the nations' shapes and label widths (their pins stay)
const nations = fs.readFileSync(NATIONS_FILE, 'utf8');
const pins = nations.match(/^export const UK_NATION_PINS = .*;$/m);
if (!pins) throw new Error('ukNationShapes.js has no UK_NATION_PINS line');
const mainWidth = (polys) => round1(widthOf(polys.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a))));
fs.writeFileSync(
  NATIONS_FILE,
  `// Generated by images/src/tools/country-outlines.mjs (from Natural Earth's 1:10m admin 0 map
// units, public domain), with the rest of the map's outlines. Don't edit by hand.

// The UK's four nations as the map draws them on a map that splits the UK (splitUk):
// Natural Earth's England, Scotland, Wales and Northern Ireland, simplified with GB and
// Ireland, so the coast is GB's and each border meets its neighbour's exactly. Each
// nation's paths, its largest shape's width (for its label) and its pin.
export const UK_NATION_SHAPES = {
${nationCodes.map((code) => `  ${code}: [${shapes[code].map((pts) => `'${pathOf(pts)}'`).join(',')}],`).join('\n')}
};

export const UK_NATION_LABEL_WIDTH = { ${nationCodes.map((code) => `${code}: ${mainWidth(shapes[code])}`).join(', ')} };

${pins[0]}
`
);

const chars = codes.reduce((n, code) => n + shapes[code].reduce((m, pts) => m + pathOf(pts).length, 0), 0);
const points = codes.reduce((n, code) => n + shapes[code].reduce((m, pts) => m + pts.length, 0), 0);
console.log(`Wrote ${codes.length} places: ${points} points, ${Math.round(chars / 1000)}k characters of outline`);
const detailPoints = detailCodes.reduce((n, code) => n + detail[code].reduce((m, pts) => m + pts.length, 0), 0);
const detailChars = detailCodes.reduce((n, code) => n + detail[code].reduce((m, pts) => m + pathOf(pts).length, 0), 0);
console.log(`Detailed: ${detailCodes.length} places, ${detailPoints} points, ${Math.round(detailChars / 1000)}k characters`);
console.log('Joined to a place:', Object.entries(report.joined).map(([name, code]) => `${name} → ${code}`).join(', '));
console.log('Left out:', report.leftOut.join(', '));
if (report.unknown.length) console.log('No place for:', report.unknown.join(', '));
if (missing.length) console.log('Places with no shape:', missing.join(', '));
