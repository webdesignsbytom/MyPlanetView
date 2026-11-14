// Input checks for the travel routes. Pure, so they're unit-tested.

export const GROUP_TYPES = Object.freeze(['SOLO', 'COUPLE', 'FAMILY']);
export const VISIT_STATUSES = Object.freeze(['VISITED', 'LIVED', 'WANT_TO_GO']);
export const TRIP_STATUSES = Object.freeze(['PLANNED', 'ACTIVE', 'COMPLETED']);
export const PHOTO_SIZES = Object.freeze(['THUMB', 'DISPLAY', 'ORIGINAL']);
export const LINK_ACCESS_VALUES = Object.freeze(['RESTRICTED', 'ANYONE_WITH_LINK']);

// Visits that count as "been there" in stats
export const COUNTED_VISIT_STATUSES = Object.freeze(['VISITED', 'LIVED']);

export const NAME_MAX = 80;
export const TITLE_MAX = 120;
export const NOTES_MAX = 1000;
export const DESCRIPTION_MAX = 2000;
export const CAPTION_MAX = 500;
export const MAX_TRAVELLERS = 20;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
// Deliberately loose: one @, something either side, a dot in the domain
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isUuid = (value) => typeof value === 'string' && UUID.test(value);
export const isCountryCode = (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value);
export const isEmail = (value) => typeof value === 'string' && value.length <= 320 && EMAIL.test(value);
export const isOneOf = (value, allowed) => typeof value === 'string' && allowed.includes(value);

/**
 * A date-only field ("YYYY-MM-DD").
 * Missing -> { ok: true, value: undefined } (leave as is); null or "" -> { ok: true, value: null } (clear);
 * a real date -> { ok: true, value: Date at UTC midnight }; anything else -> { ok: false }.
 */
export function parseDateOnly(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  const match = typeof input === 'string' ? DATE_ONLY.exec(input) : null;
  if (!match) return { ok: false };
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects 2026-02-31 and similar
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return { ok: false };
  return { ok: true, value: date };
}

/** A full timestamp (ISO string), same missing/null/invalid rules as parseDateOnly. */
export function parseDateTime(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  if (typeof input !== 'string') return { ok: false };
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? { ok: false } : { ok: true, value: date };
}

/** End on or after start, when both are set. */
export const datesInOrder = (start, end) => !start || !end || end.getTime() >= start.getTime();

/** Date -> "YYYY-MM-DD" (null stays null). */
export const toDateOnly = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);

/**
 * GPS from a request body: both numbers on Earth, or both absent.
 * -> { ok: true, latitude, longitude } (numbers or nulls) or { ok: false }.
 */
export function parsePosition(latitude, longitude) {
  const absent = (v) => v === undefined || v === null || v === '';
  if (absent(latitude) && absent(longitude)) return { ok: true, latitude: null, longitude: null };
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (absent(latitude) || absent(longitude) || !Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false };
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { ok: false };
  return { ok: true, latitude: lat, longitude: lng };
}

/** A positive whole pixel size. */
export const isPixelSize = (value) => Number.isInteger(value) && value > 0 && value <= 100000;

/** An array of distinct strings that are all in `allowedIds`. */
export function isSubsetOf(ids, allowedIds) {
  if (!Array.isArray(ids)) return false;
  const allowed = new Set(allowedIds);
  return new Set(ids).size === ids.length && ids.every((id) => allowed.has(id));
}
