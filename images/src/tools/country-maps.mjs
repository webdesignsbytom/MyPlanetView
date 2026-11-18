// Each country's own map (18 Nov 2026, the user's wish: "Open country" on a country's ticket
// shows that country alone, as big as it goes, with its states or provinces), from Natural
// Earth's 1:10m states and provinces (public domain, naturalearthdata.com; on GitHub,
// nvkelso/natural-earth-vector, geojson/ne_10m_admin_1_states_provinces.geojson) and its
// admin 0 map units (for which of the map's places each unit is). From the repo root:
//   node images/src/tools/country-maps.mjs <ne_10m_admin_1_states_provinces.geojson> <ne_10m_admin_0_map_units.geojson>
//
// Each map is drawn on its own projection, not the world map's: Lambert's azimuthal
// equal-area, centred on the country's main land, so nothing is bent by the world map's
// curve. Parts far from the main land (Alaska and Hawaii, France's islands) are insets, as
// an atlas draws them: up to MAX_INSETS, the biggest, each at its own scale in a box, in a
// column on the main land's left.
// The map's places follow the world map's (lib/mapPlaces.mjs, and the label of each state
// for the disputed ones: Crimea is Ukraine's, the Laâyoune regions Western Sahara's, Kinmen
// China's; the southern Kurils are Hokkaido's, the Golan Quneitra's). A region (Bali,
// Hawaii) is drawn on its country's map; the UK's nations have maps of their own too.
//
// It writes:
// - client/src/utils/map/countryMaps/<code>.js: a map's canvas (2000 wide, `height` tall),
//   the opening view, its frames (the main land's projection and each inset's), and each
//   state: code, name, label point and width, colour (one of the world map's seven pastels,
//   no two neighbours alike), outline. Loaded when a country is opened.
// - client/src/utils/map/countryMapInfo.js: per map, how many states and what they're
//   called ("state", "province"), for a country's ticket without loading its map.
// - server/src/data/subdivisions.json: every state's code → its map, and the region it is
//   (Hawaii is the region XH's visit) or is in (New Caledonia's provinces), and its nation;
//   and the same list for mock mode, client/src/dev/mock/data/subdivisions.js.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DOTS, GOLAN_LINE, GOLAN_POINT, JOINS, LEAVE_OUT, NATIONS, cutRing, insideRing, placeOfPolygon, ringsOfGeometry } from './lib/mapPlaces.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT_DIR = path.join(ROOT, 'client/src/utils/map/countryMaps');
const INFO_FILE = path.join(ROOT, 'client/src/utils/map/countryMapInfo.js');
const SERVER_FILE = path.join(ROOT, 'server/src/data/subdivisions.json');
const MOCK_FILE = path.join(ROOT, 'client/src/dev/mock/data/subdivisions.js');

// The canvas: 2000 wide like the world map (useMapViewport), the country and its insets
// fitted into CONTENT_W × CONTENT_H in the middle, and tall enough that the tallest screen
// (PORTRAIT: height / width) can still see the whole country at once
const CANVAS_W = 2000;
const CONTENT_W = 1600;
const CONTENT_H = 760;
const PORTRAIT = 2.3;
// Lines simplified to this (canvas units: about a pixel at the opening view); a small state
// (under SMALL across) to FINE; islets under MIN_SPAN left out unless their state is small
const TOLERANCE = 0.3;
const SMALL = 8;
const FINE = 0.08;
const MIN_SPAN = 1.2;
const DUST = 0.15;
const KEY_DIGITS = 2;
// Land within GAP km of the main land (or GAP_SHARE of its size, if more) is part of it;
// further off it's an inset
const GAP_KM = 500;
const GAP_SHARE = 0.08;
const MAX_INSETS = 4;
// Smaller far-off land (km²) is left off: the US's Wake and Johnston, France's Scattered Islands
const INSET_MIN_KM2 = 100;
// In an inset, islands under SPECK_KM2 further than SPECK_NEAR_KM from its biggest are left off
const SPECK_KM2 = 20;
const SPECK_NEAR_KM = 300;
// Where a state's label point decides its place, as the world map has (Crimea and Sevastopol
// are Ukraine's, Spain's two Canary provinces the Canaries', the Dutch Caribbean islands
// Caribbean Netherlands', Kinmen China's); a region (Bali, Hawaii) takes its country's state too.
// Only these: elsewhere a label by a border (Piran, Cavally) must stay where Natural Earth puts it
const LABEL_MOVES = { RU: ['UA'], ES: ['IC'], NL: ['BQ'], TW: ['CN'] };
// An inset's longer side, as a share of the main land's, and at most this many times its scale
const INSET_SHARE = 0.26;
const INSET_MAX_ZOOM = 4;
const EARTH_KM = 6371;

const [admin1File, unitsFile] = process.argv.slice(2);
if (!admin1File || !unitsFile) {
  throw new Error('Usage: node images/src/tools/country-maps.mjs <ne_10m_admin_1_states_provinces.geojson> <ne_10m_admin_0_map_units.geojson>');
}

// The world map's projection, unrounded, for the label rule below
const projectionSource = fs.readFileSync(path.join(ROOT, 'client/src/utils/map/projection.js'), 'utf8');
const tmp = path.join(os.tmpdir(), `projection-exact-${process.pid}.mjs`);
fs.writeFileSync(tmp, `${projectionSource}\nexport { projectExact };\n`);
const { projectExact } = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

const { COUNTRIES } = await import(pathToFileURL(path.join(ROOT, 'client/src/utils/map/countries.js')).href);
const { REGION_AREA, REGION_PARENT } = await import(pathToFileURL(path.join(ROOT, 'client/src/utils/map/regionPlaces.js')).href);
const { COUNTRY_SHAPES } = await import(pathToFileURL(path.join(ROOT, 'client/src/utils/map/countryShapes.js')).href);

const PLACES = new Set(COUNTRIES.filter((c) => !c.kind || c.kind === 'REGION').map((c) => c.code));
const NAME_OF = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
const NATION_CODES = new Set(Object.values(NATIONS));

// ── The world map's shapes, for which place a state's label point is in ─────────────────
const parsePath = (d) => d.replace(/[MZ]/g, ' ').trim().split(/\s+/).map(Number).reduce((pts, v, i, all) => (i % 2 ? pts : [...pts, [v, all[i + 1]]]), []);
const boundsOf = (pts) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY };
};
const WORLD = Object.entries(COUNTRY_SHAPES).map(([code, paths]) => ({
  code,
  rings: paths.map(parsePath).map((pts) => ({ pts, b: boundsOf(pts) })),
}));
const inWorldShape = (code, x, y) =>
  WORLD.find((p) => p.code === code)?.rings.some(({ pts, b }) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY && insideRing(x, y, pts)) ?? false;
const worldPlaceAt = (x, y) =>
  WORLD.find((p) => p.rings.some(({ pts, b }) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY && insideRing(x, y, pts)))?.code ?? null;
const inBox = (box, lat, lon) => lat > box.south && lat < box.north && lon > box.west && lon < box.east;

// ── Which place each Natural Earth unit is ───────────────────────────────────────────────
const units = JSON.parse(fs.readFileSync(unitsFile, 'utf8'));
const unitPlace = new Map();
const adm0Places = new Map();
for (const f of units.features) {
  const p = f.properties;
  const ids = [p.ADM0_A3, p.GU_A3, p.SU_A3];
  if (ids.some((u) => LEAVE_OUT.has(u))) continue;
  const code = PLACES.has(p.ISO_A2_EH) ? p.ISO_A2_EH : ids.map((u) => JOINS[u]).find(Boolean);
  if (!code) continue;
  unitPlace.set(p.GU_A3, code);
  unitPlace.set(p.SU_A3, code);
  if (!adm0Places.has(p.ADM0_A3)) adm0Places.set(p.ADM0_A3, new Set());
  adm0Places.get(p.ADM0_A3).add(code);
}
const placeOfUnit = (p) => {
  if (unitPlace.has(p.gu_a3)) return unitPlace.get(p.gu_a3);
  const one = adm0Places.get(p.adm0_a3);
  if (one?.size === 1) return [...one][0];
  return PLACES.has(p.iso_a2) ? p.iso_a2 : null;
};

// ── The states, as pieces: one polygon each, with its map, code, name and kind ─────────────
const admin1 = JSON.parse(fs.readFileSync(admin1File, 'utf8'));
const report = { unknown: [], movedByLabel: [], insetsDropped: [] };
const cleanIso = (iso) => (iso || '').replace(/~$/, '');
const isoCount = new Map();
for (const f of admin1.features) {
  const iso = cleanIso(f.properties.iso_3166_2);
  isoCount.set(iso, (isoCount.get(iso) || 0) + 1);
}
const codeOf = (p) => {
  if (p.adm1_code === 'SYR-5261') return 'SY-QU'; // the UN zone on the Golan's edge: Quneitra's
  const iso = cleanIso(p.iso_3166_2);
  return /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(iso) && isoCount.get(iso) === 1 ? iso : p.adm1_code;
};
const kindOf = (p) => (p.type_en || '').replace(/\(.*?\)/g, '').trim().split(/\s+/).pop()?.toLowerCase() || null;

const pieces = []; // { map, code, name, kind, label: [lat, lon], polygon, place }
const named = new Map(); // code → { name, kind, label, place, map, nation }
for (const f of admin1.features) {
  const p = f.properties;
  if ([p.adm0_a3, p.gu_a3].some((u) => LEAVE_OUT.has(u))) continue;
  let place = placeOfUnit(p);
  if (!place) { report.unknown.push(`${p.name} (${p.adm0_a3})`); continue; }
  const label = [p.latitude, p.longitude];
  // The world map's answer where Natural Earth's differs: a state whose label is in another
  // place's shape and not its own (LABEL_MOVES; a region: Bali, Hawaii)
  const at = projectExact(label[0], label[1]);
  if (!DOTS.has(place) && !inWorldShape(place, at.x, at.y)) {
    const other = worldPlaceAt(at.x, at.y);
    if (other && (LABEL_MOVES[place]?.includes(other) || REGION_PARENT[other] === place)) {
      report.movedByLabel.push(`${p.name} ${place}→${other}`);
      place = other;
    }
  }
  // A region too small for a shape (Goa): by its box
  for (const [region, parent] of Object.entries(REGION_PARENT)) {
    if (parent === place && inBox(REGION_AREA[region], label[0], label[1])) place = region;
  }
  const nation = place === 'GB' ? (NATIONS[p.gu_a3] ?? null) : null;
  const code = codeOf(p);
  const info = { name: p.name, kind: kindOf(p), label, place, nation };
  for (const polygon of ringsOfGeometry(f.geometry)) {
    // The Golan: Israel's district cut along the 1967 line, its eastern piece Quneitra's
    if (place === 'IL' && insideRing(GOLAN_POINT[0], GOLAN_POINT[1], polygon[0])) {
      const cut = cutRing(polygon[0], GOLAN_LINE);
      if (!cut) throw new Error('The Golan line should cross Israel\'s northern district twice');
      for (const ring of cut) {
        const golan = insideRing(GOLAN_POINT[0], GOLAN_POINT[1], ring);
        pieces.push({ ...info, code: golan ? 'SY-QU' : code, place: golan ? 'SY' : place, nation: null, polygon: [ring] });
      }
      continue;
    }
    // A piece the world map gives another place: the southern Kurils are Hokkaido's
    const piecePlace = placeOfPolygon(place, polygon);
    if (piecePlace === 'JP' && place === 'RU') {
      pieces.push({ ...info, code: 'JP-01', place: 'JP', nation: null, polygon });
      continue;
    }
    pieces.push({ ...info, code, place: piecePlace, polygon });
  }
  if (!named.has(code)) named.set(code, info);
}

// Which map each piece is on: a region's is its country's; a UK nation's piece is on the
// UK's map and its nation's
const byMap = new Map();
const addTo = (map, piece) => {
  if (!byMap.has(map)) byMap.set(map, []);
  byMap.get(map).push(piece);
};
for (const piece of pieces) {
  addTo(REGION_PARENT[piece.place] ?? piece.place, piece);
  if (piece.nation) addTo(piece.nation, piece);
}
// A place with no states in the data: its own outline, as one unnamed area
for (const f of units.features) {
  const p = f.properties;
  const ids = [p.ADM0_A3, p.GU_A3, p.SU_A3];
  if (ids.some((u) => LEAVE_OUT.has(u))) continue;
  const place = PLACES.has(p.ISO_A2_EH) ? p.ISO_A2_EH : ids.map((u) => JOINS[u]).find(Boolean);
  if (!place || byMap.has(REGION_PARENT[place] ?? place) || pieces.some((x) => x.place === place)) continue;
  for (const polygon of ringsOfGeometry(f.geometry)) {
    const piecePlace = placeOfPolygon(place, polygon);
    addTo(`fallback:${REGION_PARENT[piecePlace] ?? piecePlace}`, { code: null, name: NAME_OF[piecePlace], kind: null, label: null, place: piecePlace, nation: null, polygon });
  }
}
for (const [key, list] of [...byMap]) {
  if (!key.startsWith('fallback:')) continue;
  byMap.delete(key);
  const map = key.slice('fallback:'.length);
  if (!byMap.has(map)) byMap.set(map, list);
}

// ── Lambert azimuthal equal-area (radius 1), forward and inverse ─────────────────────────
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
function laea(lat0, lon0) {
  const s0 = Math.sin(rad(lat0));
  const c0 = Math.cos(rad(lat0));
  const forward = (lat, lon) => {
    const phi = rad(lat);
    const dl = rad(wrap(lon - lon0));
    const k = Math.sqrt(2 / (1 + s0 * Math.sin(phi) + c0 * Math.cos(phi) * Math.cos(dl)));
    return [k * Math.cos(phi) * Math.sin(dl), k * (c0 * Math.sin(phi) - s0 * Math.cos(phi) * Math.cos(dl))];
  };
  const inverse = (x, y) => {
    const rho = Math.hypot(x, y);
    if (rho < 1e-12) return [lat0, lon0];
    const c = 2 * Math.asin(Math.min(1, rho / 2));
    const lat = deg(Math.asin(Math.cos(c) * s0 + (y * Math.sin(c) * c0) / rho));
    const lon = lon0 + deg(Math.atan2(x * Math.sin(c), rho * c0 * Math.cos(c) - y * s0 * Math.sin(c)));
    return [lat, wrap(lon)];
  };
  return { forward, inverse };
}

const areaOf = (pts) => Math.abs(pts.reduce((s, [x1, y1], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x1 * y2 - x2 * y1; }, 0) / 2);
const spanOf = (pts) => { const b = boundsOf(pts); return Math.max(b.maxX - b.minX, b.maxY - b.minY); };
const widthOf = (pts) => { const b = boundsOf(pts); return b.maxX - b.minX; };

// Pieces near each other (within `gap` km, on a projection centred on the map) are one land
function cluster(projected, gap) {
  const parent = projected.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const join = (a, b) => { parent[find(a)] = find(b); };
  const cell = gap / Math.SQRT2; // two points in one cell are within `gap`
  const cells = new Map();
  projected.forEach((pts, i) => {
    const step = Math.max(1, Math.floor(pts.length / 400));
    for (let k = 0; k < pts.length; k += step) {
      const key = `${Math.floor(pts[k][0] / cell)},${Math.floor(pts[k][1] / cell)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push([i, pts[k]]);
    }
  });
  for (const list of cells.values()) for (let k = 1; k < list.length; k++) join(list[0][0], list[k][0]);
  for (const [key, list] of cells) {
    const [cx, cy] = key.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (dx < 0 || (dx === 0 && dy <= 0)) continue;
      const other = cells.get(`${cx + dx},${cy + dy}`);
      if (!other || find(list[0][0]) === find(other[0][0])) continue;
      outer: for (const [, a] of list) {
        for (const [j, b] of other) {
          if (Math.hypot(a[0] - b[0], a[1] - b[1]) < gap) { join(list[0][0], j); break outer; }
        }
      }
    }
  }
  return projected.map((_, i) => find(i));
}

// ── Simplifying, with every shared border simplified once ────────────────────────────────
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

function dissolve(rings) {
  const edges = new Map();
  const add = (a, b) => edges.set(`${a}>${b}`, (edges.get(`${a}>${b}`) || 0) + 1);
  for (const ring of rings) for (let i = 0; i < ring.length; i++) add(ring[i], ring[(i + 1) % ring.length]);
  for (const [edge, n] of edges) {
    if (n <= 0) continue;
    const [a, b] = edge.split('>');
    const back = edges.get(`${b}>${a}`) || 0;
    const gone = Math.min(n, back);
    if (gone) { edges.set(edge, n - gone); edges.set(`${b}>${a}`, back - gone); }
  }
  const out = new Map();
  for (const [edge, n] of edges) for (let i = 0; i < n; i++) {
    const [a, b] = edge.split('>');
    if (!out.has(a)) out.set(a, []);
    out.get(a).push(b);
  }
  const result = [];
  for (const start of out.keys()) {
    while (out.get(start)?.length) {
      const ring = [start];
      let at = out.get(start).pop();
      while (at !== start) {
        ring.push(at);
        const next = out.get(at);
        if (!next?.length) break;
        at = next.pop();
      }
      if (ring.length >= 3) result.push(ring);
    }
  }
  return result;
}

const keyOf = (x, y) => `${x.toFixed(KEY_DIGITS)},${y.toFixed(KEY_DIGITS)}`;
const pointOf = (key) => key.split(',').map(Number);
const round1 = (v) => Math.round(v * 10) / 10;
const round2 = (v) => Math.round(v * 100) / 100;
const pathOf = (pts) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' ')} Z`;

/**
 * Each state's rings (canvas units), simplified so neighbours still meet, and which states
 * touch (`neighbours`: code → Set of codes), for their colours. -> `{ shapes, neighbours }`
 */
function simplifyStates(ringsByState) {
  for (const [code, rings] of ringsByState) ringsByState.set(code, dissolve(rings));
  const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const owners = new Map();
  const all = [];
  for (const [code, rings] of ringsByState) for (const ring of rings) all.push({ code, ring, id: all.length });
  for (const { ring, id } of all) for (let i = 0; i < ring.length; i++) {
    const k = edgeKey(ring[i], ring[(i + 1) % ring.length]);
    if (!owners.has(k)) owners.set(k, []);
    owners.get(k).push(id);
  }
  const ownersOf = (a, b) => owners.get(edgeKey(a, b)).slice().sort((x, y) => x - y).join(',');
  const neighbours = new Map([...ringsByState.keys()].map((code) => [code, new Set()]));
  for (const ids of owners.values()) {
    const codes = [...new Set(ids.map((id) => all[id].code))];
    for (const a of codes) for (const b of codes) if (a !== b) neighbours.get(a).add(b);
  }
  const small = new Set([...ringsByState].filter(([, rings]) => Math.max(...rings.map((r) => spanOf(r.map(pointOf)))) < SMALL).map(([c]) => c));
  const toleranceOf = (a, b) => (owners.get(edgeKey(a, b)).some((id) => small.has(all[id].code)) ? FINE : TOLERANCE);
  const lines = new Map();
  const chain = (keys) => {
    const tolerance = toleranceOf(keys[0], keys[1]);
    const forward = keys[0] < keys[keys.length - 1] || (keys[0] === keys[keys.length - 1] && keys[1] < keys[keys.length - 2]);
    const canon = forward ? keys : [...keys].reverse();
    const id = `${canon[0]}~${canon[1]}~${canon[canon.length - 2]}~${canon[canon.length - 1]}~${canon.length}`;
    if (!lines.has(id)) lines.set(id, simplifyLine(canon.map(pointOf), tolerance));
    const done = lines.get(id);
    return forward ? done : [...done].reverse();
  };
  const loop = (ring) => {
    let start = 0;
    for (let i = 1; i < ring.length; i++) if (ring[i] < ring[start]) start = i;
    const rotated = [...ring.slice(start), ...ring.slice(0, start)];
    const [sx, sy] = pointOf(rotated[0]);
    let far = 1, best = -1;
    rotated.forEach((k, i) => { const [x, y] = pointOf(k); const d = Math.hypot(x - sx, y - sy); if (d > best) { best = d; far = i; } });
    return [...chain(rotated.slice(0, far + 1)).slice(0, -1), ...chain([...rotated.slice(far), rotated[0]]).slice(0, -1)];
  };
  const simplifyRing = (ring) => {
    const n = ring.length;
    const junction = ring.map((_, i) => ownersOf(ring[(i - 1 + n) % n], ring[i]) !== ownersOf(ring[i], ring[(i + 1) % n]));
    const first = junction.indexOf(true);
    if (first === -1) return loop(ring);
    const out = [];
    let keys = [ring[first]];
    for (let s = 1; s <= n; s++) {
      const i = (first + s) % n;
      keys.push(ring[i]);
      if (junction[i]) { out.push(...chain(keys).slice(0, -1)); keys = [ring[i]]; }
    }
    return out;
  };
  const shapes = new Map();
  for (const [code, rings] of ringsByState) {
    const fine = small.has(code);
    const round = fine ? round2 : round1;
    let polys = rings
      .map((ring) => simplifyRing(ring).map(([x, y]) => [round(x), round(y)]))
      .map((pts) => pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]))
      .filter((pts) => pts.length >= 3 && areaOf(pts) > 0)
      .filter((pts) => spanOf(pts) >= (fine ? DUST : MIN_SPAN));
    if (!polys.length) {
      const ring = rings.reduce((a, b) => (spanOf(b.map(pointOf)) > spanOf(a.map(pointOf)) ? b : a));
      polys = [ring.map(pointOf).map(([x, y]) => [round2(x), round2(y)])];
    }
    shapes.set(code, polys);
  }
  return { shapes, neighbours };
}

// The world map's seven pastels (--map-visit-1 … 7), given so no two states that touch share
// one: the states with most neighbours first, each the least used colour its neighbours left
// (so all seven show, as on the world map)
function colourStates(codes, neighbours) {
  const order = [...codes].sort((a, b) => neighbours.get(b).size - neighbours.get(a).size || a.localeCompare(b));
  const colour = new Map();
  const used = new Array(8).fill(0);
  for (const code of order) {
    const taken = new Set([...neighbours.get(code)].map((n) => colour.get(n)));
    const free = [1, 2, 3, 4, 5, 6, 7].filter((c) => !taken.has(c));
    const c = free.length ? free.reduce((a, b) => (used[b] < used[a] ? b : a)) : 1;
    used[c]++;
    colour.set(code, c);
  }
  return colour;
}

// ── Each map ─────────────────────────────────────────────────────────────────────────────
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR);
const info = {};
const server = {};
let totalPoints = 0;
const sizes = [];

for (const [map, mapPieces] of [...byMap].sort(([a], [b]) => a.localeCompare(b))) {
  const outers = mapPieces.map((piece) => piece.polygon[0]);
  // A first projection, centred on the biggest piece (each measured on a projection of its
  // own, so a piece across the 180° line, the Aleutians, is measured right), in km
  const own = outers.map((ring) => {
    const p = laea(ring[0][1], ring[0][0]);
    const pts = ring.map(([lon, lat]) => p.forward(lat, lon));
    const b = boundsOf(pts);
    return { area: areaOf(pts) * EARTH_KM * EARTH_KM, centre: p.inverse((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2) };
  });
  const biggest = own.reduce((best, piece, i) => (piece.area > own[best].area ? i : best), 0);
  const first = laea(...own[biggest].centre);
  const km = outers.map((ring) => ring.map(([lon, lat]) => first.forward(lat, lon).map((v) => v * EARTH_KM)));
  // The main land is the land with the most area in all (the US's 48 states, not Alaska, its
  // biggest piece)
  const mainOf = (g) => {
    const total = new Map();
    g.forEach((root, i) => total.set(root, (total.get(root) || 0) + own[i].area));
    return [...total].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  };
  let groups = cluster(km, GAP_KM);
  const mainBounds = boundsOf(km.filter((_, i) => groups[i] === mainOf(groups)).flat());
  const gap = Math.max(GAP_KM, GAP_SHARE * Math.hypot(mainBounds.maxX - mainBounds.minX, mainBounds.maxY - mainBounds.minY));
  if (gap > GAP_KM) groups = cluster(km, gap);
  const main = mainOf(groups);

  // The lands: the main one, then the others by area (the biggest MAX_INSETS become insets)
  const lands = new Map();
  groups.forEach((g, i) => {
    if (!lands.has(g)) lands.set(g, { pieces: [], area: 0 });
    lands.get(g).pieces.push(i);
    lands.get(g).area += own[i].area;
  });
  const others = [...lands].filter(([g, land]) => g !== main && land.area >= INSET_MIN_KM2).sort(([, a], [, b]) => b.area - a.area);
  const kept = [main, ...others.slice(0, MAX_INSETS).map(([g]) => g)];
  for (const [g, land] of others.slice(MAX_INSETS)) report.insetsDropped.push(`${map}: ${land.pieces.map((i) => mapPieces[i].name).filter((n, k, all) => all.indexOf(n) === k).join(', ')} (${g})`);

  // An inset leaves out specks far from its biggest island (the Northwestern Hawaiian
  // Islands, 2,000 km of reefs, would make Hawaii's main islands tiny in its box)
  const centreOf = (i) => { const b = boundsOf(km[i]); return [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2]; };
  for (const g of kept.slice(1)) {
    const land = lands.get(g);
    const anchor = centreOf(land.pieces.reduce((a, b) => (own[b].area > own[a].area ? b : a)));
    land.pieces = land.pieces.filter((i) => {
      const [x, y] = centreOf(i);
      return own[i].area >= SPECK_KM2 || Math.hypot(x - anchor[0], y - anchor[1]) <= SPECK_NEAR_KM;
    });
  }

  // Each land's own projection, centred on it
  const frames = kept.map((g) => {
    const land = lands.get(g);
    const b = boundsOf(land.pieces.flatMap((i) => km[i]));
    const [lat0, lon0] = first.inverse((b.minX + b.maxX) / 2 / EARTH_KM, (b.minY + b.maxY) / 2 / EARTH_KM);
    const proj = laea(lat0, lon0);
    // y down, like the canvas
    const projected = land.pieces.map((i) => mapPieces[i].polygon.map((ring) => ring.map(([lon, lat]) => { const [x, y] = proj.forward(lat, lon); return [x, -y]; })));
    // Where the land is, in latitude and longitude from its centre (a pin finds its frame)
    let latMin = Infinity, latMax = -Infinity, dMin = Infinity, dMax = -Infinity;
    for (const i of land.pieces) for (const [lon, lat] of mapPieces[i].polygon[0]) {
      const d = wrap(lon - lon0);
      latMin = Math.min(latMin, lat); latMax = Math.max(latMax, lat); dMin = Math.min(dMin, d); dMax = Math.max(dMax, d);
    }
    return {
      g, lat0, lon0, proj, pieces: land.pieces, projected,
      bounds: boundsOf(projected.flatMap((rings) => rings[0])),
      area: [latMin - 1, latMax + 1, dMin - 1, dMax + 1],
    };
  });

  // Lay the insets out in columns on the main land's left (18 Nov 2026, the user's wish: a
  // strip below wasted the screen's height), the biggest first, from the main land's top
  // down; a column that would run past the main land's height starts another further left.
  // A column's boxes share its width, each inset centred in its box.
  const [mainFrame, ...insetFrames] = frames;
  const mb = mainFrame.bounds;
  const mw = mb.maxX - mb.minX;
  const mh = mb.maxY - mb.minY;
  const target = INSET_SHARE * Math.max(mw, mh);
  const pad = 0.04 * target;
  const boxes = insetFrames.map((f) => {
    const w = f.bounds.maxX - f.bounds.minX;
    const h = f.bounds.maxY - f.bounds.minY;
    const s = Math.min(INSET_MAX_ZOOM, target / Math.max(w, h, 1e-9));
    return { f, s, iw: w * s, w: w * s + 2 * pad, h: h * s + 2 * pad };
  });
  const columns = [];
  for (const box of boxes) {
    const column = columns[columns.length - 1];
    if (column && column.h + pad + box.h <= Math.max(mh, box.h)) {
      column.items.push(box);
      column.h += pad + box.h;
      column.w = Math.max(column.w, box.w);
    } else columns.push({ items: [box], h: box.h, w: box.w });
  }

  // Every frame as offsets on the main land's units, then all of it fitted onto the canvas
  const placed = [{ frame: mainFrame, ax: 0, ay: 0, b: 1, box: null }];
  let right = mb.minX - 2 * pad;
  for (const column of columns) {
    const bx = right - column.w;
    let by = mb.minY;
    for (const box of column.items) {
      const ax = bx + (column.w - box.iw) / 2 - box.s * box.f.bounds.minX;
      placed.push({ frame: box.f, ax, ay: by + pad - box.s * box.f.bounds.minY, b: box.s, box: [bx, by, column.w, box.h] });
      by += box.h + pad;
    }
    right = bx - pad;
  }
  const extent = boundsOf([[mb.minX, mb.minY], [mb.maxX, mb.maxY], ...placed.filter((p) => p.box).flatMap((p) => [[p.box[0], p.box[1]], [p.box[0] + p.box[2], p.box[1] + p.box[3]]])]);
  const cw = extent.maxX - extent.minX;
  const ch = extent.maxY - extent.minY;
  const k = Math.min(CONTENT_W / cw, CONTENT_H / ch);
  const height = Math.round(Math.max(ch * k + 200, PORTRAIT * (cw * k + 100)));
  const tx = CANVAS_W / 2 - k * (extent.minX + cw / 2);
  const ty = height / 2 - k * (extent.minY + ch / 2);
  const toCanvas = (p, [x, y]) => [tx + k * (p.ax + p.b * x), ty + k * (p.ay + p.b * y)];

  // The states' rings on the canvas
  const ringsByState = new Map();
  const labelOf = new Map();
  for (const p of placed) {
    p.frame.pieces.forEach((pieceIndex, n) => {
      const piece = mapPieces[pieceIndex];
      const code = piece.code ?? `_${piece.place}`;
      for (const ring of p.frame.projected[n]) {
        const keys = [];
        for (const pt of ring) {
          const [x, y] = toCanvas(p, pt);
          const key = keyOf(x, y);
          if (key !== keys[keys.length - 1]) keys.push(key);
        }
        if (keys.length > 1 && keys[0] === keys[keys.length - 1]) keys.pop();
        if (keys.length < 3) continue;
        if (!ringsByState.has(code)) ringsByState.set(code, []);
        ringsByState.get(code).push(keys);
      }
      // The label, on the frame its point is in (the main land's for a state split across)
      if (!labelOf.has(code) && piece.label) {
        const [lat, lon] = piece.label;
        const home = placed.find((q) => q.box && lat > q.frame.area[0] && lat < q.frame.area[1] && wrap(lon - q.frame.lon0) > q.frame.area[2] && wrap(lon - q.frame.lon0) < q.frame.area[3]) ?? placed[0];
        const [x, y] = home.frame.proj.forward(lat, lon);
        labelOf.set(code, toCanvas(home, [x, -y]).map(round1));
      }
    });
  }
  const { shapes, neighbours } = simplifyStates(ringsByState);
  const colours = colourStates([...shapes.keys()], neighbours);

  // What they're called: the commonest kind, if at least half are ("state"), else "area"
  const codes = [...shapes.keys()].filter((c) => !c.startsWith('_'));
  const kinds = new Map();
  for (const code of codes) { const kind = named.get(code)?.kind; if (kind) kinds.set(kind, (kinds.get(kind) || 0) + 1); }
  const [topKind, topCount] = [...kinds].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const singular = topKind && topCount >= codes.length / 2 ? topKind : 'area';
  const plural = /[^aeiou]y$/.test(singular) ? `${singular.slice(0, -1)}ies` : /(s|x|ch|sh)$/.test(singular) ? `${singular}es` : `${singular}s`;

  const areas = [...shapes].map(([code, polys]) => {
    const real = !code.startsWith('_');
    const main = polys.reduce((a, b) => (areaOf(b) > areaOf(a) ? b : a));
    const at = labelOf.get(code) ?? (() => { const b = boundsOf(main); return [round1((b.minX + b.maxX) / 2), round1((b.minY + b.maxY) / 2)]; })();
    return { code: real ? code : null, name: real ? named.get(code).name : NAME_OF[code.slice(1)] ?? null, at, width: round1(widthOf(main)), colour: colours.get(code) ?? 1, polys };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const view = boundsOf(areas.flatMap((a) => a.polys.flat()).concat(placed.filter((p) => p.box).flatMap((p) => [toCanvas({ ax: 0, ay: 0, b: 1 }, [p.box[0], p.box[1]]), toCanvas({ ax: 0, ay: 0, b: 1 }, [p.box[0] + p.box[2], p.box[1] + p.box[3]])])));
  const frameOut = placed.map((p, i) => ({
    // Unrounded enough that a pin lands where the outlines are, on the smallest country too
    lat: Number(p.frame.lat0.toFixed(7)),
    lng: Number(p.frame.lon0.toFixed(7)),
    scale: Number((k * p.b).toPrecision(9)),
    x: Number((tx + k * p.ax).toFixed(3)),
    y: Number((ty + k * p.ay).toFixed(3)),
    ...(i ? { box: [tx + k * p.box[0], ty + k * p.box[1], k * p.box[2], k * p.box[3]].map(round1), area: p.frame.area.map(round2) } : {}),
  }));
  const points = areas.reduce((n, a) => n + a.polys.reduce((m, pts) => m + pts.length, 0), 0);
  totalPoints += points;

  const source = `// Generated by images/src/tools/country-maps.mjs from Natural Earth's 1:10m states and
// provinces (public domain). ${NAME_OF[map] ?? map}'s own map. Don't edit by hand.
export default {
  height: ${height},
  view: [${[view.minX, view.minY, view.maxX - view.minX, view.maxY - view.minY].map(round1).join(', ')}],
  word: ${codes.length ? `['${singular}', '${plural}']` : 'null'},
  frames: ${JSON.stringify(frameOut)},
  areas: [
${areas.map((a) => `    { code: ${a.code ? `'${a.code}'` : 'null'}, name: ${JSON.stringify(a.name)}, at: [${a.at.join(', ')}], width: ${a.width}, colour: ${a.colour}, paths: [${a.polys.map((pts) => `'${pathOf(pts)}'`).join(',')}] },`).join('\n')}
  ],
};
`;
  fs.writeFileSync(path.join(OUT_DIR, `${map}.js`), source);
  sizes.push([map, source.length, codes.length, insetFrames.length]);
  info[map] = codes.length ? { count: codes.length, word: [singular, plural] } : { count: 0, word: null };

  // The server's list (the UK's nations' maps repeat the UK's states: listed once, as the UK's)
  if (!NATION_CODES.has(map)) {
    for (const code of codes) {
      const state = named.get(code);
      const piecesOf = mapPieces.filter((p) => p.code === code);
      const place = piecesOf[0]?.place ?? map;
      const region = REGION_PARENT[place] ? place : null;
      server[code] = { m: map, ...(region ? { r: region } : {}), ...(state?.nation ? { n: state.nation } : {}) };
    }
  }
}

// A region with exactly one state (Hawaii is US-HI): that state's visit is the region's own
for (const region of Object.keys(REGION_PARENT)) {
  const states = Object.entries(server).filter(([, s]) => s.r === region);
  if (states.length === 1) states[0][1].same = 1;
}

fs.writeFileSync(
  INFO_FILE,
  `// Generated by images/src/tools/country-maps.mjs. Don't edit by hand.

// Each country map's states (utils/map/countryMaps/): how many, and what they're called
// ("state", "province"; "area" when the kinds are mixed), for a ticket's "12 of 50 states"
// without loading the map. A place not listed has no map of its own.
export const COUNTRY_MAP_INFO = {
${Object.entries(info).map(([code, i]) => `  ${code}: { count: ${i.count}, word: ${i.word ? `['${i.word[0]}', '${i.word[1]}']` : 'null'} },`).join('\n')}
};
`
);
fs.writeFileSync(SERVER_FILE, JSON.stringify(server));
fs.writeFileSync(
  MOCK_FILE,
  `// Generated by images/src/tools/country-maps.mjs: server/src/data/subdivisions.json for mock
// mode (dev/mock/countryMaps.js). Don't edit by hand.
export default ${JSON.stringify(server)};
`
);

console.log(`Wrote ${byMap.size} country maps, ${Object.keys(server).length} states, ${totalPoints} points, ${Math.round(sizes.reduce((n, [, s]) => n + s, 0) / 1000)}k characters`);
console.log('Biggest:', sizes.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([m, s, n, i]) => `${m} ${Math.round(s / 1000)}k (${n} states, ${i} insets)`).join(', '));
console.log('Moved by their label:', report.movedByLabel.join(', '));
if (report.unknown.length) console.log('No place for:', report.unknown.join(', '));
if (report.insetsDropped.length) console.log('Far parts left out:', report.insetsDropped.join('; '));
