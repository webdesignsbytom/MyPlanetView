// A traveller's passport page (25 Nov 2026, the user's wish: "improve passport page for user
// avatars and info"; docs/API.md "Passport"): a photo of them, one of the map's own photos
// cropped to the passport's photo box, and a signature drawn with a finger or a mouse. Pure,
// so tested on its own (tests/travellerPassport.test.js). The client's copy of the limits is
// client/src/utils/passport/travellerDetails.js.

// A signature is drawn in this box, and stored as an SVG path of straight strokes in it
export const SIGNATURE_WIDTH = 300;
export const SIGNATURE_HEIGHT = 100;
export const SIGNATURE_MAX_LENGTH = 20000;
// A photo's crop: its focus (0 to 1 across and down) stays put as it's zoomed in
export const PORTRAIT_ZOOM_MIN = 1;
export const PORTRAIT_ZOOM_MAX = 4;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isNumber = (n) => typeof n === 'number' && Number.isFinite(n);
const round = (n, places) => Number(n.toFixed(places));

/**
 * The passport photo from a request: null takes it off; else `{ photoId, focusX?, focusY?,
 * zoom? }` (the middle and no zoom when left out). -> `{ value }` (null, or the crop rounded
 * to thousandths), or `{ error: true }`
 */
export function parsePortrait(input) {
  if (input === null) return { value: null };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: true };
  const { photoId, focusX = 0.5, focusY = 0.5, zoom = PORTRAIT_ZOOM_MIN } = input;
  if (typeof photoId !== 'string' || !UUID.test(photoId)) return { error: true };
  if (![focusX, focusY, zoom].every(isNumber)) return { error: true };
  if (focusX < 0 || focusX > 1 || focusY < 0 || focusY > 1 || zoom < PORTRAIT_ZOOM_MIN || zoom > PORTRAIT_ZOOM_MAX) return { error: true };
  return { value: { photoId, focusX: round(focusX, 3), focusY: round(focusY, 3), zoom: round(zoom, 3) } };
}

const COMMAND = /^([ML])\s*(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)\s*$/;

/**
 * A signature from a request: null or '' takes it off; else an SVG path of straight strokes,
 * each starting with M and going on with L ("M10 50L12.5 48…"), every point inside the
 * 300 × 100 box, at most 20,000 characters, at least one line. -> `{ value }` (null, or the
 * path written the same way, to tenths), or `{ error: true }`
 */
export function parseSignature(input) {
  if (input === null || input === '') return { value: null };
  if (typeof input !== 'string' || input.length > SIGNATURE_MAX_LENGTH || !/^[ML0-9.,\s-]+$/.test(input)) return { error: true };
  const commands = input.trim().match(/[ML][^ML]*/g) ?? [];
  // Nothing may sit outside a command (text before the first M)
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

/**
 * When a traveller started travelling, as their passport says: the earliest start of the trips
 * they were on that aren't still being planned. `trips`: `[{ status, startDate }]`.
 * -> a Date, or null
 */
export function travellingSince(trips) {
  let first = null;
  for (const trip of trips) {
    if (trip.status === 'PLANNED' || !trip.startDate) continue;
    const at = new Date(trip.startDate);
    if (!first || at < first) first = at;
  }
  return first;
}
