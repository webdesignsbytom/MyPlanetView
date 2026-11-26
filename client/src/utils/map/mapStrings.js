// Strings between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread
// tied pin to pin, like a map on a corkboard. Where each string is drawn: from one place's pin
// to the other's, hanging in a gentle curve as thread does. Pure.
import { COUNTRY_BY_CODE, countryName } from './countries';
import { REFERENCE_PX_PER_UNIT } from './projection';
import { PARENT_PLACE } from './specialPlaces';
import { countsAsVisited } from './visitStatus';
import { passportPageOrder } from '@/utils/passport/passportOrder';

// How far a string hangs below the straight line, as a share of its length, and at most
const SAG = 0.12;
const MAX_SAG = 60;
// The places drawn only with Antarctica on (projection.js mapExtent)
const SOUTHERN = new Set(['AQ', 'XS', 'QS']);

const round = (n) => Math.round(n * 10) / 10;

/** A place's pin on the world map, `{ x, y }`, or null. */
export function pinOf(code) {
  const place = COUNTRY_BY_CODE[code];
  return place && Number.isFinite(place.pinX) && Number.isFinite(place.pinY) ? { x: place.pinX, y: place.pinY } : null;
}

/** A string from `a` to `b` (pins), hanging below the straight line: an SVG path. */
export function stringPath(a, b) {
  const sag = Math.min(Math.hypot(b.x - a.x, b.y - a.y) * SAG, MAX_SAG);
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2 + sag;
  return `M${round(a.x)} ${round(a.y)}Q${round(midX)} ${round(midY)} ${round(b.x)} ${round(b.y)}`;
}

/** The unit vector across the straight line from `a` to `b`, `{ x, y }` (none for one point). */
export function acrossOf(a, b) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  return length ? { x: -(b.y - a.y) / length, y: (b.x - a.x) / length } : { x: 0, y: 0 };
}

/**
 * The strings to draw: `[{ id, from, to, d, label, across }]`, leaving out any whose end has
 * no pin or is hidden (the far south without Antarctica). `across`: acrossOf its pins, for the
 * strands of a twined string (twistStrands).
 */
export function drawnStrings(strings, { showAntarctica = true } = {}) {
  const shown = (code) => showAntarctica || !SOUTHERN.has(code);
  return (strings || []).flatMap((string) => {
    const a = pinOf(string.from);
    const b = pinOf(string.to);
    if (!a || !b || !shown(string.from) || !shown(string.to)) return [];
    return [{ ...string, d: stringPath(a, b), label: stringLabel(string), across: acrossOf(a, b) }];
  });
}

// Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish: "spiralled
// together", never blocks of one colour then the other). The string is drawn in its first
// colour, then the second over it as four thin strands side by side across it (these screen
// pixels from its middle), each dashed (bands TWIST_DASH_PX long, as far apart) and each a
// little further along than the one beside it (TWIST_SHIFT_PX per pixel across): the second
// colour's bands lie slanted across the string, as twisted plies do. Each strand is the
// string's own path moved sideways, so all four are exactly as long and stay in step.
// Sized for a 3.6px twine (mapDesign.js TWINED_STRING_PX; 10% thinner than at first, 25 Nov
// 2026, the user's wish), the slant kept
export const TWIST_STRAND_OFFSETS_PX = Object.freeze([-1.35, -0.45, 0.45, 1.35]);
export const TWIST_STRAND_PX = 1.125;
export const TWIST_DASH_PX = 3;
export const TWIST_SHIFT_PX = 0.9;

/**
 * A twined string's strands at a zoom (pixels on screen over REFERENCE_PX_PER_UNIT, as
 * useMapViewport's): `[{ dx, dy, dashOffset }]`, each strand's move across the string in map
 * units (so it's the same few pixels at any zoom) and its dashes' start in pixels (the map's
 * strokes are non-scaling, so their dashes are in pixels too).
 */
export function twistStrands(across, zoom) {
  const unitsPerPx = 1 / (Math.max(zoom, 1e-3) * REFERENCE_PX_PER_UNIT);
  return TWIST_STRAND_OFFSETS_PX.map((px) => ({
    dx: Math.round(across.x * px * unitsPerPx * 1e4) / 1e4,
    dy: Math.round(across.y * px * unitsPerPx * 1e4) / 1e4,
    dashOffset: Math.round(px * TWIST_SHIFT_PX * 1000) / 1000,
  }));
}

/** The pins strings are tied to, once each: `[{ code, x, y }]`. */
export function stringPins(drawn) {
  const codes = [...new Set(drawn.flatMap((s) => [s.from, s.to]))];
  return codes.map((code) => ({ code, ...pinOf(code) }));
}

/** "France to Japan" */
export const stringLabel = (string) => `${countryName(string.from)} to ${countryName(string.to)}`;

/** Two places as one string's ends, in code order as the server keeps them; null for one place twice. */
export function stringEnds(a, b) {
  if (!a || !b || a === b) return null;
  return a < b ? [a, b] : [b, a];
}

/**
 * The place visited just before `code` (24 Nov 2026, the user's wish: a string from the last
 * place to each newly visited one, "always from country to country in order of visit"): the
 * map's visited and lived-in places in the order visited (the passport's: the first visit, else
 * the day it was marked; on one day, the order marked), `code` among them, and the one before
 * it; null when it's the first. The place it's part of (the US for Hawaii, Antarctica for the
 * South Pole), marked with it, is never its previous.
 * @param {{ countryCode, status, firstVisitedOn, markedAt }[]} visits the map's, the new one included
 */
export function previousVisitedPlace(visits, code) {
  const parent = PARENT_PLACE[code];
  const rows = new Map(visits.filter((v) => countsAsVisited(v.status) && v.countryCode !== parent).map((v) => [v.countryCode, v]));
  if (!rows.has(code)) return null;
  // A place already on the map with no time known was marked before any that has one (the mock's
  // seeded visits; the server's all have one)
  const order = passportPageOrder(rows.keys(), {
    enteredOn: (place) => rows.get(place)?.firstVisitedOn ?? null,
    markedAt: (place) => rows.get(place)?.markedAt ?? (place === code ? null : '1970-01-01T00:00:00Z'),
  });
  const index = order.indexOf(code);
  return index > 0 ? order[index - 1] : null;
}

/** Whether a string of a kind already joins these two places, whichever way round. */
export const hasString = (strings, a, b, kind = 'VISITED') => {
  const ends = stringEnds(a, b);
  return Boolean(ends && (strings || []).some((s) => stringKindOf(s) === kind && s.from === ends[0] && s.to === ends[1]));
};

/**
 * A string's kind (25 Nov 2026, the user's wish): VISITED, between places been to, or PLANNED,
 * between places planned, each in its own colour. Strings from before kinds are VISITED.
 */
export const STRING_KINDS = Object.freeze(['VISITED', 'PLANNED']);
export const stringKindOf = (string) => (string?.kind === 'PLANNED' ? 'PLANNED' : 'VISITED');

/** A map's strings of one kind. */
export const stringsOfKind = (strings, kind) => (strings || []).filter((s) => stringKindOf(s) === kind);

/**
 * The place marked "want to go" just before `code` (25 Nov 2026, the user's wish: a planned
 * string "in the order of when you select a place you want to visit"): the map's wanted places
 * in the order they were marked (`markedAt`; one with none, as the mock's seeded visits, was
 * marked before any that has one), `code` among them, and the one before it; null when it's the
 * first. The place it's part of is never its previous.
 * @param {{ countryCode, status, markedAt }[]} visits the map's, the new one included
 */
export function previousPlannedPlace(visits, code) {
  const parent = PARENT_PLACE[code];
  const wanted = visits.filter((v) => v.status === 'WANT_TO_GO' && v.countryCode !== parent);
  if (!wanted.some((v) => v.countryCode === code)) return null;
  const time = (v) => (v.markedAt ? Date.parse(v.markedAt) || 0 : v.countryCode === code ? Number.POSITIVE_INFINITY : 0);
  const order = [...wanted].sort((a, b) => time(a) - time(b) || (a.countryCode === code) - (b.countryCode === code));
  const index = order.findIndex((v) => v.countryCode === code);
  return index > 0 ? order[index - 1].countryCode : null;
}
