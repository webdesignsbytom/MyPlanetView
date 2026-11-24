// A place's outline on its own (24 Nov 2026, the user's wish: the celebration shows the country's
// outline above its models): the world map's shapes (countryShapes.js, ukNationShapes.js), in
// the map's own projection, with the box round them for an SVG's viewBox. Only the main country
// (24 Nov 2026, the user's wish: "just the main country outline, not the little outlying
// areas"): its largest piece, and the big pieces near it that are the country itself (Northern
// Ireland, Sicily and Sardinia, New Zealand's two islands, Japan's four, Indonesia's big ones,
// Alaska), never the little islands (the Hebrides, Corsica, Okinawa) or far-flung ones (France's
// Saint Pierre and Miquelon and Kerguelen Islands, Chile's Easter Island), and never a piece
// past the 180° line, which lands elsewhere on the Robinson map (Russia's Chukotka tip).
import { COUNTRY_SHAPES } from './countryShapes.js';
import { UK_NATION_SHAPES } from './ukNationShapes.js';

const NUMBERS = /-?\d+(?:\.\d+)?/g;
// How near a piece must be to what's kept so far, as a share of that box's longer side
const NEAR = 0.5;
// How big a piece must be to be kept, as a share of the largest piece's box (Northern Ireland's
// is 4.8% of Great Britain's, Sardinia's 3.7% of Italy's mainland, Corsica's 1.6% of France's)
const BIG = 0.03;

// A piece's box: its paths are only absolute moves and lines ("M x y x y … Z"), so its numbers
// come in x, y pairs
function pieceBox(path) {
  const n = path.match(NUMBERS)?.map(Number) ?? [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    minX = Math.min(minX, n[i]);
    maxX = Math.max(maxX, n[i]);
    minY = Math.min(minY, n[i + 1]);
    maxY = Math.max(maxY, n[i + 1]);
  }
  return { minX, minY, maxX, maxY };
}

const union = (a, b) => ({ minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY), maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY) });
// The gap between two boxes, the wider of across and up (0 when they overlap)
const gap = (a, b) => Math.max(0, a.minX - b.maxX, b.minX - a.maxX, a.minY - b.maxY, b.minY - a.maxY);

/**
 * `{ paths, viewBox }` for a place's outline: its largest piece, and every big piece within reach
 * of what's kept (growing as islands join, so Japan or Indonesia comes whole), the box padded a
 * little. Null for a place with no shape (a micro-state's dot, a pole, Goa).
 */
export function countryOutline(code, { pad = 0.04 } = {}) {
  const all = COUNTRY_SHAPES[code] ?? UK_NATION_SHAPES[code];
  if (!all?.length) return null;
  const pieces = all.map((d) => ({ d, box: pieceBox(d) }));
  const area = ({ box }) => (box.maxX - box.minX) * (box.maxY - box.minY);
  const main = pieces.reduce((best, piece) => (area(piece) > area(best) ? piece : best));
  const big = pieces.filter((piece) => area(piece) >= area(main) * BIG);
  const kept = new Set([main]);
  let box = main.box;
  for (let added = true; added; ) {
    added = false;
    const reach = Math.max(box.maxX - box.minX, box.maxY - box.minY) * NEAR;
    for (const piece of big) {
      if (kept.has(piece) || gap(box, piece.box) > reach) continue;
      kept.add(piece);
      box = union(box, piece.box);
      added = true;
    }
  }
  const margin = Math.max(box.maxX - box.minX, box.maxY - box.minY) * pad;
  const round = (v) => Math.round(v * 100) / 100;
  return {
    // In the map's own order
    paths: pieces.filter((piece) => kept.has(piece)).map((piece) => piece.d),
    viewBox: [box.minX - margin, box.minY - margin, box.maxX - box.minX + 2 * margin, box.maxY - box.minY + 2 * margin].map(round).join(' '),
  };
}
