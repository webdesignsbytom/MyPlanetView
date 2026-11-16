// The UK's four nations, for maps that split the UK (TravelMap.splitUk): England (XE),
// Scotland (XC), Wales (XW) and Northern Ireland (XI). From Natural Earth's 1:10m "admin 0
// map units" (public domain, naturalearthdata.com; the file is on GitHub,
// nvkelso/natural-earth-vector, geojson/ne_10m_admin_0_map_units.geojson):
//   node images/src/tools/uk-nations.mjs <ne_10m_admin_0_map_units.geojson>   (repo root)
//
// It writes:
// - client/src/utils/map/ukNationShapes.js: the four nations' map shapes. The map's own GB
//   shape (countryShapes.js) is cut along Natural Earth's real England–Scotland and
//   England–Wales land borders, so the coastline is exactly the UK's: Northern Ireland is
//   GB's shape on the island of Ireland, and each island goes to the nation it lies in.
//   Also each nation's label width and pin (Natural Earth's label point, projected);
// - server/src/data/ukNations.json and client/src/dev/mock/data/ukNations.js: the
//   nations' real outlines in degrees (simplified to about 150 m), which the GPS lookups
//   use once a position is in the UK (utils/ukNations.js on the server, the mock's
//   ukNations.js): more exact than the map's coarse coast, and with every island.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { projectToMap } = await import(pathToFileURL(path.join(ROOT, 'client/src/utils/map/projection.js')).href);

const NATIONS = [
  { code: 'XE', unit: 'ENG', name: 'England' },
  { code: 'XC', unit: 'SCT', name: 'Scotland' },
  { code: 'XW', unit: 'WLS', name: 'Wales' },
  { code: 'XI', unit: 'NIR', name: 'Northern Ireland' },
];
// Simplification: the lookups' outlines (degrees) and the land borders (map units)
const LOOKUP_TOLERANCE = 0.0015;
const BORDER_TOLERANCE = 0.25;
// How far past the drawn coast a border is carried before cutting (map units): just over
// it, or, if no nearby point is at sea, straight on
const STEP_OUT = 0.15;
const OVERSHOOT = 1.5;

const neFile = process.argv[2];
if (!neFile) throw new Error('Name the Natural Earth file: node images/src/tools/uk-nations.mjs <ne_10m_admin_0_map_units.geojson>');
const ne = JSON.parse(fs.readFileSync(neFile, 'utf8'));
const unit = (a3) => {
  const f = ne.features.find((x) => x.properties.GU_A3 === a3);
  if (!f) throw new Error(`${a3} isn't in ${neFile}`);
  return f;
};
const polygonsOf = (f) => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]);

// ── Geometry ─────────────────────────────────────────────────────────────────

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const toXY = ([lng, lat]) => {
  const p = projectToMap(lat, lng);
  return [p.x, p.y];
};

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// A polygon is [outer, ...holes]
const inPolygon = (p, polygon) => inRing(p, polygon[0]) && !polygon.slice(1).some((hole) => inRing(p, hole));

// Douglas–Peucker on an open line
function simplifyLine(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points.at(-1);
  const len = Math.hypot(bx - ax, by - ay) || 1e-12;
  let worst = 0;
  let at = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
    if (d > worst) [worst, at] = [d, i];
  }
  if (worst <= tolerance) return [points[0], points.at(-1)];
  return [...simplifyLine(points.slice(0, at + 1), tolerance).slice(0, -1), ...simplifyLine(points.slice(at), tolerance)];
}
// A closed ring: split at its farthest point from the first, so both halves simplify
function simplifyRing(ring, tolerance) {
  const open = ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  if (open.length < 8) return open;
  let far = 0;
  let best = -1;
  open.forEach(([x, y], i) => {
    const d = Math.hypot(x - open[0][0], y - open[0][1]);
    if (d > best) [best, far] = [d, i];
  });
  const a = simplifyLine(open.slice(0, far + 1), tolerance);
  const b = simplifyLine([...open.slice(far), open[0]], tolerance);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

function segmentHit([p1, p2], [q1, q2]) {
  const r = [p2[0] - p1[0], p2[1] - p1[1]];
  const s = [q2[0] - q1[0], q2[1] - q1[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((q1[0] - p1[0]) * s[1] - (q1[1] - p1[1]) * s[0]) / den;
  const u = ((q1[0] - p1[0]) * r[1] - (q1[1] - p1[1]) * r[0]) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u, point: [p1[0] + t * r[0], p1[1] + t * r[1]] };
}

function nearestOnRing(p, ring) {
  let best = null;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const q = [a[0] + t * dx, a[1] + t * dy];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (!best || d < best.d) best = { q, d };
  }
  return best;
}

// Carry a border's end out past the ring's coast, when it's inside: to the nearest point
// of the coast, then just over it into the sea, in the direction (of 72 tried) closest to
// the way it was going. A plain step onwards can cross a narrow inlet (the drawn Bristol
// Channel is under a unit wide) and land on the other shore.
function carryOut(end, ring) {
  if (!inRing(end, ring)) return end;
  const { q, d } = nearestOnRing(end, ring);
  const ux = (q[0] - end[0]) / (d || 1);
  const uy = (q[1] - end[1]) / (d || 1);
  let best = null;
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * 2 * Math.PI;
    const p = [q[0] + Math.cos(a) * STEP_OUT, q[1] + Math.sin(a) * STEP_OUT];
    if (inRing(p, ring)) continue;
    const along = Math.cos(a) * ux + Math.sin(a) * uy;
    if (!best || along > best.along) best = { p, along };
  }
  return best ? best.p : [q[0] + ux * OVERSHOOT, q[1] + uy * OVERSHOOT];
}

/**
 * Cut a ring in two along a line that crosses its edge: between the line's first and last
 * crossings, the ring's own coast on each side. -> [ringA, ringB]
 */
function cutRing(ring, line) {
  const hits = [];
  for (let k = 0; k < line.length - 1; k += 1) {
    for (let i = 0; i < ring.length; i += 1) {
      const hit = segmentHit([line[k], line[k + 1]], [ring[i], ring[(i + 1) % ring.length]]);
      if (hit) hits.push({ along: k + hit.t, k, edge: i, point: hit.point });
    }
  }
  if (hits.length < 2) throw new Error(`a border crosses the coast ${hits.length} times`);
  hits.sort((a, b) => a.along - b.along);
  const first = hits[0];
  const last = hits.at(-1);
  const inner = [first.point, ...line.slice(first.k + 1, last.k + 1), last.point];
  // Walk the coast from the vertex after `fromEdge` to the vertex of `toEdge`
  const coast = (fromEdge, toEdge) => {
    const out = [];
    for (let i = (fromEdge + 1) % ring.length; ; i = (i + 1) % ring.length) {
      out.push(ring[i]);
      if (i === toEdge) break;
    }
    return out;
  };
  return [
    [...inner, ...coast(last.edge, first.edge)],
    [...[...inner].reverse(), ...coast(first.edge, last.edge)],
  ];
}

// ── Data ─────────────────────────────────────────────────────────────────────

// The nations' outlines, projected (to say which nation a drawn piece lies in)
const projected = Object.fromEntries(
  NATIONS.map((n) => [n.code, polygonsOf(unit(n.unit)).map((poly) => poly.map((ring) => ring.map(toXY)))]),
);
// Which nation most of a piece lies in: a grid of points over it, each counted where it
// falls; a piece no point of which is in a nation goes to the nearest one
function nationOf(ring) {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const step = Math.max((x1 - x0) / 40, (y1 - y0) / 40, 0.02);
  const votes = {};
  for (let x = x0 + step / 2; x < x1; x += step) {
    for (let y = y0 + step / 2; y < y1; y += step) {
      if (!inRing([x, y], ring)) continue;
      const code = NATIONS.find((n) => projected[n.code].some((poly) => inPolygon([x, y], poly)))?.code;
      if (code) votes[code] = (votes[code] || 0) + 1;
    }
  }
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  if (ranked.length) return ranked[0][0];
  const centre = [(x0 + x1) / 2, (y0 + y1) / 2];
  return NATIONS.map((n) => ({ code: n.code, d: Math.min(...projected[n.code].map((poly) => nearestOnRing(centre, poly[0]).d)) })).sort(
    (a, b) => a.d - b.d,
  )[0].code;
}

// The longest run of the first unit's outer-ring vertices that are also the second's: the
// land border between them
function landBorder(a3, b3) {
  const inB = new Set(polygonsOf(unit(b3)).flatMap((poly) => poly.flatMap((ring) => ring.map((c) => c.join(',')))));
  let best = [];
  for (const poly of polygonsOf(unit(a3))) {
    const ring = poly[0];
    const start = ring.findIndex((c) => !inB.has(c.join(',')));
    let run = [];
    for (let k = 0; k <= ring.length; k += 1) {
      const c = ring[(start + k) % ring.length];
      if (inB.has(c.join(','))) run.push(c);
      else {
        if (run.length > best.length) best = run;
        run = [];
      }
    }
  }
  if (best.length < 10) throw new Error(`no land border found between ${a3} and ${b3}`);
  return simplifyLine(best.map(toXY), BORDER_TOLERANCE);
}

// The map's GB shape: every ring of its paths (absolute "M x y x y … Z" paths)
const shapesFile = path.join(ROOT, 'client/src/utils/map/countryShapes.js');
const shapesSrc = fs.readFileSync(shapesFile, 'utf8');
const gbStart = shapesSrc.indexOf('  GB: [');
const gbBlock = shapesSrc.slice(gbStart, shapesSrc.indexOf('  ],', gbStart));
const gbRings = [...gbBlock.matchAll(/'([^']+)'/g)].flatMap(([, d]) => {
  if (/[a-ln-yA-LN-Y]/.test(d.replace(/[zZ]/g, ''))) throw new Error('GB has a path this tool doesn’t read (only M … Z)');
  return d
    .split(/[Mm]/)
    .map((part) => part.replace(/[zZ]/g, ' ').trim())
    .filter(Boolean)
    .map((part) => {
      const nums = part.split(/[\s,]+/).map(Number);
      const ring = [];
      for (let i = 0; i + 1 < nums.length; i += 2) ring.push([nums[i], nums[i + 1]]);
      if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
      return ring;
    });
});

// Great Britain is GB's biggest ring: cut off Scotland, then Wales
const ringsBySize = [...gbRings].sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
const britain = ringsBySize[0];
const cutAlong = (ring, border) => {
  const line = [carryOut(border[0], ring), ...border, carryOut(border.at(-1), ring)];
  return cutRing(ring, line);
};
const [sctA, sctB] = cutAlong(britain, landBorder('ENG', 'SCT'));
const [scotland, south] = nationOf(sctA) === 'XC' ? [sctA, sctB] : [sctB, sctA];
const [wlsA, wlsB] = cutAlong(south, landBorder('ENG', 'WLS'));
const [wales, england] = nationOf(wlsA) === 'XW' ? [wlsA, wlsB] : [wlsB, wlsA];
const pieces = [
  { ring: scotland, code: 'XC' },
  { ring: wales, code: 'XW' },
  { ring: england, code: 'XE' },
  ...ringsBySize.slice(1).map((ring) => ({ ring, code: nationOf(ring) })),
];
for (const p of pieces.slice(0, 3)) {
  if (nationOf(p.ring) !== p.code) throw new Error(`the cut piece meant for ${p.code} lies mostly in ${nationOf(p.ring)}`);
}
// The pieces must cover GB exactly
const gbArea = gbRings.reduce((s, r) => s + Math.abs(ringArea(r)), 0);
const pieceArea = pieces.reduce((s, p) => s + Math.abs(ringArea(p.ring)), 0);
if (Math.abs(gbArea - pieceArea) > 0.01 * gbArea) throw new Error(`the nations' area ${pieceArea.toFixed(1)} isn't GB's ${gbArea.toFixed(1)}`);

// ── Output ───────────────────────────────────────────────────────────────────

const pathOf = (ring) => `M ${ring.map(([x, y]) => `${round(x, 1)} ${round(y, 1)}`).join(' ')} Z`;
const shapes = {};
const widths = {};
for (const n of NATIONS) {
  const mine = pieces.filter((p) => p.code === n.code).sort((a, b) => Math.abs(ringArea(b.ring)) - Math.abs(ringArea(a.ring)));
  shapes[n.code] = mine.map((p) => pathOf(p.ring));
  const xs = mine[0].ring.map((p) => p[0]);
  widths[n.code] = round(Math.max(...xs) - Math.min(...xs), 1);
}
const pins = Object.fromEntries(
  NATIONS.map((n) => {
    const { LABEL_X, LABEL_Y } = unit(n.unit).properties;
    const [x, y] = toXY([LABEL_X, LABEL_Y]);
    return [n.code, { pinX: round(x, 1), pinY: round(y, 1) }];
  }),
);

const header = `// Generated by images/src/tools/uk-nations.mjs (from Natural Earth's 1:10m admin 0 map
// units, public domain, and the map's own GB shape). Don't edit by hand.
`;
const clientShapes = `${header}
// The UK's four nations as the map draws them on a map that splits the UK (splitUk):
// countryShapes.js's GB shape cut along the real England–Scotland and England–Wales land
// borders, Northern Ireland being GB's shape on the island of Ireland. Same coast, same
// projection; each nation's paths, its largest shape's width (for its label) and its pin.
export const UK_NATION_SHAPES = ${JSON.stringify(shapes, null, 2).replace(/"([A-Z]{2})":/g, '$1:')};

export const UK_NATION_LABEL_WIDTH = ${JSON.stringify(widths).replace(/"([A-Z]{2})":/g, '$1: ').replace(/,/g, ', ')};

export const UK_NATION_PINS = ${JSON.stringify(pins).replace(/"([A-Za-z]+)":/g, '$1: ').replace(/,/g, ', ')};
`;
fs.writeFileSync(path.join(ROOT, 'client/src/utils/map/ukNationShapes.js'), clientShapes);

// The lookups' outlines: [lng, lat] rings, outer then holes, per polygon
const lookup = Object.fromEntries(
  NATIONS.map((n) => [
    n.code,
    polygonsOf(unit(n.unit))
      .map((poly) => poly.map((ring) => simplifyRing(ring, LOOKUP_TOLERANCE).map(([lng, lat]) => [round(lng, 4), round(lat, 4)])))
      .filter((poly) => poly[0].length >= 3),
  ]),
);
const lookupJson = JSON.stringify(lookup);
fs.writeFileSync(path.join(ROOT, 'server/src/data/ukNations.json'), `${lookupJson}\n`);
fs.writeFileSync(
  path.join(ROOT, 'client/src/dev/mock/data/ukNations.js'),
  `${header}// The nations' real outlines ([lng, lat] rings) for the mock's GPS lookups: a copy of
// server/src/data/ukNations.json.
export const UK_NATION_OUTLINES = ${lookupJson};
`,
);

const count = (rings) => rings.reduce((s, r) => s + r.length, 0);
for (const n of NATIONS) {
  console.log(
    `${n.code} ${n.name}: ${shapes[n.code].length} drawn shapes, label width ${widths[n.code]}, pin ${pins[n.code].pinX},${pins[n.code].pinY}; lookup ${lookup[n.code].length} polygons, ${count(lookup[n.code].flat())} points`,
  );
}
console.log(`GB area ${gbArea.toFixed(1)}, the nations' ${pieceArea.toFixed(1)}; lookup data ${(lookupJson.length / 1024).toFixed(0)} KB`);
