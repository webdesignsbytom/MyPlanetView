// A place's rings as the drawing's path strings (27 Nov 2026, the user's report: Lesotho was
// South Africa's pink and couldn't be pressed). An enclave's hole (Lesotho in South Africa,
// Llívia in France, Madha in the UAE, the Fergana valley's enclaves) used to be a string of its
// own, so the map drew it as a filled shape of the country round it, over the enclave, taking
// its presses. Each hole now goes in the same string as the ring round it ("M outer … Z M hole …
// Z"): it winds the other way, so SVG and canvas fill (nonzero, their default) leave it empty.
// Used by country-outlines.mjs for every outline it writes, so a re-run keeps it; the GPS
// lookups (even-odd over every ring) read either form the same.

/** A ring's area by the shoelace formula: positive one way round, negative the other. */
export const signedArea = (pts) => pts.reduce((s, [x1, y1], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x1 * y2 - x2 * y1; }, 0) / 2;

/** 'M x y x y … Z', as the tool writes a ring. */
export const pathOf = (pts) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' ')} Z`;

const inside = (x, y, ring) => {
  let found = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) found = !found;
  }
  return found;
};

/**
 * `polys` (a place's rings, each [[x, y], …]) grouped for drawing: each ring that winds the
 * other way from a bigger ring of the place and lies inside it (most of its points: a hole's
 * border is simplified with the enclave's, so a point can sit on the line) joins the smallest
 * such ring as its hole. -> [[outer, hole, …], …], the outer rings in their own order
 */
export function ringGroups(polys) {
  const areas = polys.map(signedArea);
  const holeOf = polys.map((pts, i) => {
    let best = -1;
    for (let j = 0; j < polys.length; j++) {
      if (j === i || Math.sign(areas[j]) === Math.sign(areas[i]) || Math.abs(areas[j]) <= Math.abs(areas[i])) continue;
      if (best !== -1 && Math.abs(areas[j]) >= Math.abs(areas[best])) continue;
      const within = pts.filter(([x, y]) => inside(x, y, polys[j])).length;
      if (within * 2 > pts.length) best = j;
    }
    return best;
  });
  // A ring that's another's hole is never itself an outer ring with holes of its own here
  // (admin 0 units have no island in a lake in a country), so one level is enough
  return polys
    .map((pts, i) => (holeOf[i] === -1 ? [pts, ...polys.filter((_, k) => holeOf[k] === i)] : null))
    .filter(Boolean);
}

/** A place's rings as path strings, each hole in its outer ring's string. */
export const pathStrings = (polys) => ringGroups(polys).map((group) => group.map(pathOf).join(' '));
