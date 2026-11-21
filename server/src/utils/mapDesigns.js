// A map's own design (docs/API.md "Map designs"; 21 Nov 2026, the user's wish): the rules
// for its colours and its sea picture. Pure, so tested on its own (tests/mapDesigns.test.js);
// the client copies the colour rules (utils/map/mapDesign.js).
import { POLE_CODES } from './specialPlaces.js';

const MB = 1024 * 1024;

/** A colour as stored: "#rrggbb", lower case. */
export const DESIGN_COLOUR = /^#[0-9a-f]{6}$/;
/** More than there are places on the map, so a full design always fits. */
export const DESIGN_MAX_COLOURS = 400;

// The sea's picture: made in the browser (at most 2,560 px wide), a plain web image
export const DESIGN_PICTURE_TYPES = Object.freeze(['image/jpeg', 'image/webp', 'image/png']);
export const DESIGN_PICTURE_MAX_BYTES = 8 * MB;
// Saved within this time of its presign, as a photo is (the clean-up waits a day for these)
export const DESIGN_PICTURE_SAVE_WINDOW_MINUTES = 50;
// Pictures presigned and never saved, per user over the last day (429 above)
export const DESIGN_PICTURE_UNSAVED_LIMIT = 10;

// Place kinds a colour can go on: the drawn ones. The poles are compass roses, never filled.
const COLOURED_KINDS = new Set(['COUNTRY', 'SPECIAL', 'NATION', 'REGION']);

/** A colour from a request: `{ ok, value }` ("#rrggbb" or null), or `{ ok: false }`. */
export function cleanColour(value) {
  if (value === null) return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const colour = value.trim().toLowerCase();
  return DESIGN_COLOUR.test(colour) ? { ok: true, value: colour } : { ok: false };
}

/**
 * The change a PATCH asks for: `{ data, codes }` (the columns to write, and the place codes
 * the caller checks are on the map), or `{ error }` (a responses.js message key).
 * `countries` replaces the whole set; a code with null (or left out) keeps its usual colour.
 */
export function parseDesignChange(body) {
  const input = body && typeof body === 'object' ? body : {};
  const data = {};
  if (input.shown !== undefined) {
    if (typeof input.shown !== 'boolean') return { error: 'invalidDesign' };
    data.shown = input.shown;
  }
  for (const [field, column] of [
    ['names', 'namesColour'],
    ['grid', 'gridColour'],
  ]) {
    if (input[field] === undefined) continue;
    const colour = cleanColour(input[field]);
    if (!colour.ok) return { error: 'invalidDesignColour' };
    data[column] = colour.value;
  }
  let codes = [];
  if (input.countries !== undefined) {
    const raw = input.countries;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'invalidDesign' };
    const entries = Object.entries(raw);
    if (entries.length > DESIGN_MAX_COLOURS) return { error: 'invalidDesign' };
    const colours = {};
    for (const [code, value] of entries) {
      if (!/^[A-Z]{2}$/.test(code)) return { error: 'invalidDesignPlace' };
      if (value === null) continue;
      const colour = cleanColour(value);
      if (!colour.ok) return { error: 'invalidDesignColour' };
      colours[code] = colour.value;
    }
    data.countryColours = colours;
    codes = Object.keys(colours);
  }
  if (!Object.keys(data).length) return { error: 'invalidDesign' };
  return { data, codes };
}

/** Whether a place (`{ code, kind }` from the Country table) can take a colour. */
export const isColourablePlace = (place) => Boolean(place) && COLOURED_KINDS.has(place.kind) && !POLE_CODES.includes(place.code);

/** A stored colour set as the reply gives it: only well-formed entries (never trusts the JSON). */
export function storedColours(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {};
  const colours = {};
  for (const [code, value] of Object.entries(json)) {
    if (/^[A-Z]{2}$/.test(code) && typeof value === 'string' && DESIGN_COLOUR.test(value)) colours[code] = value;
  }
  return colours;
}

/** A picture upload's declared type and size: null when fine, else a responses.js message key. */
export function checkDesignPicture({ contentType, bytes }) {
  if (!DESIGN_PICTURE_TYPES.includes(contentType)) return 'designPictureType';
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return 'designPictureInvalid';
  if (bytes > DESIGN_PICTURE_MAX_BYTES) return 'designPictureTooLarge';
  return null;
}
