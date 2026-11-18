// A country map's pins (docs/API.md "Country maps"): a place someone keeps going back to,
// with its visits (each with a date, a note and photos). Input rules; pure, so unit-tested.
import { isValidLatLng } from './projection.js';
import { sanitizeText } from './sanitize.js';
import { isUuid } from './travelValidation.js';
import { parseMomentDate } from './moments.js';

export const PIN_NAME_MAX = 80;
export const PIN_NOTES_MAX = 2000;
export const PINS_PER_MAP = 1000;
export const VISITS_PER_PIN = 100;
export const VISIT_PHOTOS_MAX = 50;

// Six decimals: about 10 cm
const rounded = (n) => Math.round(n * 1e6) / 1e6;
const isTextOrNull = (value) => value === null || typeof value === 'string';

/**
 * A pin from a request body; `partial` for PATCH (missing fields stay as they are).
 * -> `{ value: { name?, notes?, latitude?, longitude?, hidden? } }` or `{ error: key }`, the
 * key one of 'name', 'notes', 'position', 'hidden'.
 */
export function parsePin(body, { partial = false } = {}) {
  const value = {};
  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? sanitizeText(body.name, { maxLength: PIN_NAME_MAX }) : null;
    if (!name) return { error: 'name' };
    value.name = name;
  }
  if (body.notes !== undefined) {
    if (!isTextOrNull(body.notes)) return { error: 'notes' };
    value.notes = sanitizeText(body.notes, { maxLength: PIN_NOTES_MAX }) || null;
  }
  if (!partial || body.latitude !== undefined || body.longitude !== undefined) {
    if (!isValidLatLng(body.latitude, body.longitude)) return { error: 'position' };
    value.latitude = rounded(body.latitude);
    value.longitude = rounded(body.longitude);
  }
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') return { error: 'hidden' };
    value.hidden = body.hidden;
  }
  return { value };
}

/**
 * A pin's visit from a request body; `partial` for PATCH. `visitedOn` is "YYYY", "YYYY-MM"
 * or "YYYY-MM-DD" with an optional `datePrecision`, as a moment's date (empty for none);
 * `photoIds` the map's photos in order (checked against the map by the caller).
 * -> `{ value: { data, photoIds? } }` or `{ error: key }` ('date', 'notes', 'photos').
 */
export function parsePinVisit(body, { partial = false } = {}) {
  const data = {};
  const date = parseMomentDate(body.visitedOn, body.datePrecision);
  if (!date.ok) return { error: 'date' };
  if (date.value) {
    data.visitedOn = date.value.happenedOn;
    data.datePrecision = date.value.datePrecision;
  } else if (!partial) {
    data.visitedOn = null;
    data.datePrecision = null;
  }
  if (body.notes !== undefined) {
    if (!isTextOrNull(body.notes)) return { error: 'notes' };
    data.notes = sanitizeText(body.notes, { maxLength: PIN_NOTES_MAX }) || null;
  }
  const value = { data };
  if (body.photoIds !== undefined) {
    const ids = body.photoIds;
    if (!Array.isArray(ids) || ids.length > VISIT_PHOTOS_MAX || !ids.every(isUuid) || new Set(ids).size !== ids.length) return { error: 'photos' };
    value.photoIds = ids;
  }
  return { value };
}
