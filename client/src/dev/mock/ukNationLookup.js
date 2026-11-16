// Which of the UK's nations a position is in, for the mock (a copy of
// server/src/utils/ukNations.js ukNationAt, over the same outlines: data/ukNations.js, made
// with server/src/data/ukNations.json by images/src/tools/uk-nations.mjs). For a position
// already found in the UK: inside a nation, else the nearest.
import { UK_NATION_OUTLINES } from './data/ukNations';
import { UK_NATION_CODES } from '@/utils/map/ukNations';

const inRing = (ring, x, y) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const distanceToRing = (ring, x, y, kx) => {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    const dx = (bx - ax) * kx;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq ? Math.max(0, Math.min(1, ((x - ax) * kx * dx + (y - ay) * dy) / lengthSq)) : 0;
    best = Math.min(best, Math.hypot((x - ax) * kx - t * dx, y - ay - t * dy));
  }
  return best;
};

export function ukNationAt(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const kx = Math.cos((latitude * Math.PI) / 180);
  let nearest = null;
  for (const code of UK_NATION_CODES) {
    for (const [outer, ...holes] of UK_NATION_OUTLINES[code]) {
      if (inRing(outer, longitude, latitude) && !holes.some((hole) => inRing(hole, longitude, latitude))) return code;
      const distance = distanceToRing(outer, longitude, latitude, kx);
      if (!nearest || distance < nearest.distance) nearest = { code, distance };
    }
  }
  return nearest?.code ?? null;
}
