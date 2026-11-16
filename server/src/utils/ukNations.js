// The UK's four nations (docs/API.md "The UK's nations"): England (XE), Scotland (XC),
// Wales (XW) and Northern Ireland (XI), rows of the Country table with kind NATION, used
// in place of the UK (GB) on a map that splits it (TravelMap.splitUk). Their codes are
// from ISO 3166's user-assigned range, like the poles' (XI is HMRC's own code for
// Northern Ireland). Pure, so it's unit-tested. The client's copy is
// client/src/utils/map/ukNations.js; keep the two in step.
import UK_NATION_OUTLINES from '../data/ukNations.json' with { type: 'json' };

export const UK = 'GB';
export const UK_NATION_CODES = Object.freeze(['XE', 'XC', 'XW', 'XI']);
export const UK_NATION_NAMES = Object.freeze({ XE: 'England', XC: 'Scotland', XW: 'Wales', XI: 'Northern Ireland' });

export const isUkNation = (code) => UK_NATION_CODES.includes(code);

/**
 * The place a map keeps for a code: on a map that doesn't split the UK, a nation is the
 * UK. (On one that does, GB stays GB: something in the UK whose nation isn't known yet.)
 */
export const placeOnMap = (code, splitUk) => (!splitUk && isUkNation(code) ? UK : code);

/**
 * The place a landmark (`{ countryCode, latitude, longitude }`) is in on a map: on a map
 * that splits the UK, a UK landmark is in its nation (from its position).
 */
export const landmarkPlace = (landmark, splitUk) =>
  splitUk && landmark.countryCode === UK ? (ukNationAt(landmark.latitude, landmark.longitude) ?? UK) : landmark.countryCode;

/**
 * The places a set of visited codes covers, for badges and goals: a nation is in the UK,
 * so a goal listing GB is met by any nation.
 */
export const withUk = (codes) => (codes.some(isUkNation) && !codes.includes(UK) ? [...codes, UK] : codes);

/**
 * The visited codes that count as countries on a map: on a map that splits the UK, the
 * nations count one each, and GB itself only while no nation is visited (the UK marked
 * from before the split, its nations not chosen yet). Other codes pass through.
 */
export function countedCountryCodes(codes, splitUk) {
  const list = [...new Set(codes)];
  if (!splitUk) return list.filter((code) => !isUkNation(code));
  return list.some(isUkNation) ? list.filter((code) => code !== UK) : list;
}

// ── Which nation a position is in ────────────────────────────────────────────

const inRing = (ring, x, y) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// Distance in degrees of latitude, with longitude scaled for the UK's latitudes
const distanceToRing = (ring, x, y, kx) => {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    const dx = (bx - ax) * kx;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq ? Math.max(0, Math.min(1, (((x - ax) * kx) * dx + (y - ay) * dy) / lengthSq)) : 0;
    best = Math.min(best, Math.hypot((x - ax) * kx - t * dx, y - ay - t * dy));
  }
  return best;
};

/**
 * The nation a position in the UK is in, from the nations' real outlines (Natural Earth
 * 1:10m, simplified to about 150 m: src/data/ukNations.json, made by
 * images/src/tools/uk-nations.mjs): the one it's inside, else the nearest (a photo from a
 * pier, or a coast the map draws further out). For a position already found in the UK
 * (countryAtPosition); null for an invalid one.
 */
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
