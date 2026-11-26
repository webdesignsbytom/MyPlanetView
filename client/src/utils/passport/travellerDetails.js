// A traveller's passport page (25 Nov 2026, the user's wish: "improve passport page for user
// avatars and info"; docs/API.md "Passport"): their photo's crop, their drawn signature, the
// made-up passport number, and the server's rules copied (server/src/utils/travellerPassport.js;
// a test compares them), for the mock and the dialogs.

export const SIGNATURE_WIDTH = 300;
export const SIGNATURE_HEIGHT = 100;
export const SIGNATURE_MAX_LENGTH = 20000;
export const PORTRAIT_ZOOM_MIN = 1;
export const PORTRAIT_ZOOM_MAX = 4;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isNumber = (n) => typeof n === 'number' && Number.isFinite(n);
const round = (n, places) => Number(n.toFixed(places));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * How a passport photo sits in its box: covering it, its focus (0 to 1 across and down) at the
 * same place in the box, and zoomed about that point, so the box is always full. -> a style for
 * the <img> (object-fit cover)
 */
export function portraitStyle(photo) {
  const x = `${round(clamp(photo?.focusX ?? 0.5, 0, 1) * 100, 1)}%`;
  const y = `${round(clamp(photo?.focusY ?? 0.5, 0, 1) * 100, 1)}%`;
  const zoom = clamp(photo?.zoom ?? 1, PORTRAIT_ZOOM_MIN, PORTRAIT_ZOOM_MAX);
  return { objectPosition: `${x} ${y}`, transformOrigin: `${x} ${y}`, transform: `scale(${zoom})` };
}

/**
 * The crop moved by a drag of `dx`, `dy` pixels in a box `width` × `height`: the photo follows the
 * pointer, so its focus goes the other way, less far the more it's zoomed. -> `{ focusX, focusY }`
 */
export function dragFocus({ focusX, focusY, zoom }, { dx, dy, width, height }) {
  const scale = Math.max(PORTRAIT_ZOOM_MIN, zoom);
  return {
    focusX: round(clamp(focusX - dx / (Math.max(width, 1) * scale), 0, 1), 3),
    focusY: round(clamp(focusY - dy / (Math.max(height, 1) * scale), 0, 1), 3),
  };
}

/**
 * The made-up passport number on a traveller's page: two letters and seven digits, the same for
 * them every time (from their id), nothing to do with any real document or code.
 */
export function passportNumber(id) {
  let hash = 2166136261;
  for (const char of String(id)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `MP${String(hash % 10000000).padStart(7, '0')}`;
}

/**
 * Strokes drawn on the signature pad (each a list of `{ x, y }` in the 300 × 100 box) as the
 * path the server keeps: "M x y L x y …", to tenths, inside the box, points closer than a unit
 * left out; a tap is a dot (a line half a unit long). -> the path, or '' with nothing drawn
 */
export function strokesToPath(strokes) {
  const parts = [];
  for (const stroke of strokes) {
    const points = [];
    for (const point of stroke) {
      const x = round(clamp(point.x, 0, SIGNATURE_WIDTH), 1);
      const y = round(clamp(point.y, 0, SIGNATURE_HEIGHT), 1);
      const last = points[points.length - 1];
      if (!last || Math.hypot(x - last.x, y - last.y) >= 1) points.push({ x, y });
    }
    if (!points.length) continue;
    if (points.length === 1) points.push({ x: round(Math.min(points[0].x + 0.5, SIGNATURE_WIDTH), 1), y: points[0].y });
    parts.push(points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(''));
  }
  return parts.join('');
}

// The server's rules (server/src/utils/travellerPassport.js), for the mock

/**
 * The passport photo from a request -> `{ value }` (null, or the crop to thousandths), or
 * `{ error: true }`. `isId` checks the photo's id: a UUID, as the server's (the mock's seed
 * photos have names for ids, so it passes its own).
 */
export function parsePortrait(input, { isId = (id) => UUID.test(id) } = {}) {
  if (input === null) return { value: null };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: true };
  const { photoId, focusX = 0.5, focusY = 0.5, zoom = PORTRAIT_ZOOM_MIN } = input;
  if (typeof photoId !== 'string' || !isId(photoId)) return { error: true };
  if (![focusX, focusY, zoom].every(isNumber)) return { error: true };
  if (focusX < 0 || focusX > 1 || focusY < 0 || focusY > 1 || zoom < PORTRAIT_ZOOM_MIN || zoom > PORTRAIT_ZOOM_MAX) return { error: true };
  return { value: { photoId, focusX: round(focusX, 3), focusY: round(focusY, 3), zoom: round(zoom, 3) } };
}

const COMMAND = /^([ML])\s*(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)\s*$/;

/** A signature from a request -> `{ value }` (null, or the path to tenths), or `{ error: true }`. */
export function parseSignature(input) {
  if (input === null || input === '') return { value: null };
  if (typeof input !== 'string' || input.length > SIGNATURE_MAX_LENGTH || !/^[ML0-9.,\s-]+$/.test(input)) return { error: true };
  const commands = input.trim().match(/[ML][^ML]*/g) ?? [];
  if (!commands.length || commands.join('').length !== input.trim().length) return { error: true };
  const out = [];
  let lines = 0;
  for (const [i, chunk] of commands.entries()) {
    const match = COMMAND.exec(chunk);
    if (!match) return { error: true };
    const [, command, xText, yText] = match;
    const x = Number(xText);
    const y = Number(yText);
    if (x < 0 || x > SIGNATURE_WIDTH || y < 0 || y > SIGNATURE_HEIGHT) return { error: true };
    if (i === 0 && command !== 'M') return { error: true };
    if (command === 'L') lines += 1;
    out.push(`${command}${round(x, 1)} ${round(y, 1)}`);
  }
  if (!lines) return { error: true };
  const value = out.join('');
  return value.length > SIGNATURE_MAX_LENGTH ? { error: true } : { value };
}

/** When a traveller started travelling: the earliest start of their trips that aren't still planned. -> 'YYYY-MM-DD' or null */
export function travellingSince(trips) {
  let first = null;
  for (const trip of trips) {
    if (trip.status === 'PLANNED' || !trip.startDate) continue;
    const day = String(trip.startDate).slice(0, 10);
    if (!first || day < first) first = day;
  }
  return first;
}
