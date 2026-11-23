// Strings between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread
// tied pin to pin, like a map on a corkboard. Where each string is drawn: from one place's pin
// to the other's, hanging in a gentle curve as thread does. Pure.
import { COUNTRY_BY_CODE, countryName } from './countries';

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

/**
 * The strings to draw: `[{ id, from, to, d, label }]`, leaving out any whose end has no pin or
 * is hidden (the far south without Antarctica).
 */
export function drawnStrings(strings, { showAntarctica = true } = {}) {
  const shown = (code) => showAntarctica || !SOUTHERN.has(code);
  return (strings || []).flatMap((string) => {
    const a = pinOf(string.from);
    const b = pinOf(string.to);
    if (!a || !b || !shown(string.from) || !shown(string.to)) return [];
    return [{ ...string, d: stringPath(a, b), label: stringLabel(string) }];
  });
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
