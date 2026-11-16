// Mock mode only: a copy of server/src/utils/shuffle.js (change both together). The
// shuffled slideshow's order (docs/API.md, "Slideshows"): a list of ids shuffled by a
// seed the client picks, so every page of one show comes from the same order. Pure.

const SEED_MAX = 2 ** 31 - 1;

/** The `seed` query value: a whole number from 1 to 2^31 − 1, or null. */
export function parseShuffleSeed(value) {
  if (typeof value !== 'string' || !/^\d{1,10}$/.test(value)) return null;
  const seed = Number(value);
  return seed >= 1 && seed <= SEED_MAX ? seed : null;
}

// mulberry32: a small, fast generator; the same seed gives the same numbers
function generator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The ids in a shuffled order fixed by the seed. They're sorted first, so the order
 * doesn't depend on how the database returned them.
 */
export function shuffled(ids, seed) {
  const list = [...ids].sort();
  const random = generator(seed);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * The page after `cursor` (the previous page's last id; none for the first page).
 * -> `{ ids, more }`, or null when the cursor isn't in the list (a photo deleted or
 * hidden meanwhile: the client starts the show again).
 */
export function pageAfter(list, cursor, limit) {
  let start = 0;
  if (cursor) {
    const at = list.indexOf(cursor);
    if (at < 0) return null;
    start = at + 1;
  }
  return { ids: list.slice(start, start + limit), more: start + limit < list.length };
}
