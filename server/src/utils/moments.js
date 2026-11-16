// Input rules for moments (docs/API.md "Moments"). Pure, so they're unit-tested.
import { isUuid, toDateOnly } from './travelValidation.js';

export const DATE_PRECISIONS = Object.freeze(['DAY', 'MONTH', 'YEAR']);
// A sanity range: grandparents' births to plans a lifetime ahead
export const MOMENT_YEAR_MIN = 1800;
export const MOMENT_YEAR_MAX = 2200;
export const MOMENT_TITLE_MAX = 120;
export const MOMENT_TEXT_MAX = 2000;
export const MOMENT_PLACE_MAX = 120;
// Chosen from the map's existing photos (nothing is uploaded)
export const MOMENT_PHOTOS_MAX = 20;
export const MOMENT_PAGE_DEFAULT = 30;
export const MOMENT_PAGE_MAX = 60;

// How fine each written form is: "2019" (a year), "2019-06" (a month), "2019-06-14" (a day)
const FINENESS = { YEAR: 1, MONTH: 2, DAY: 3 };
const WRITTEN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/**
 * A moment's date from a request body: `happenedOn` is "YYYY", "YYYY-MM" or
 * "YYYY-MM-DD"; `datePrecision` (DAY, MONTH or YEAR) is optional and follows the form
 * when missing. It may be coarser than what's written ("2019-06-14" as a YEAR), never
 * finer ("2019" as a DAY). What's written must be a real date. A month or a year is
 * stored as its first day.
 * -> `{ ok: true, value: undefined }` when both are missing (leave as is);
 *    `{ ok: true, value: { happenedOn: null, datePrecision: null } }` for an undated note
 *    (`happenedOn` null or ""); `{ ok: true, value: { happenedOn: Date, datePrecision } }`;
 *    `{ ok: false }` otherwise (a precision sent alone included).
 */
export function parseMomentDate(happenedOn, datePrecision) {
  if (happenedOn === undefined) return datePrecision === undefined ? { ok: true, value: undefined } : { ok: false };
  if (happenedOn === null || happenedOn === '') {
    return datePrecision === undefined || datePrecision === null
      ? { ok: true, value: { happenedOn: null, datePrecision: null } }
      : { ok: false };
  }
  const match = typeof happenedOn === 'string' ? WRITTEN.exec(happenedOn) : null;
  if (!match) return { ok: false };
  const written = match[3] ? 'DAY' : match[2] ? 'MONTH' : 'YEAR';
  const precision = datePrecision ?? written;
  if (!DATE_PRECISIONS.includes(precision) || FINENESS[precision] > FINENESS[written]) return { ok: false };

  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  const day = match[3] ? Number(match[3]) : 1;
  if (year < MOMENT_YEAR_MIN || year > MOMENT_YEAR_MAX) return { ok: false };
  // What's written must exist (no 2019-02-31, no month 13)
  const asWritten = new Date(Date.UTC(year, month - 1, day));
  if (asWritten.getUTCMonth() !== month - 1 || asWritten.getUTCDate() !== day) return { ok: false };

  const stored = new Date(Date.UTC(year, precision === 'YEAR' ? 0 : month - 1, precision === 'DAY' ? day : 1));
  return { ok: true, value: { happenedOn: stored, datePrecision: precision } };
}

// The list's order is (happenedOn, id), oldest first, undated last; a page's cursor is
// its last moment's place in that order: "<YYYY-MM-DD or undated>_<id>". Opaque to the
// client, and it still works when that moment has been deleted meanwhile.
const UNDATED = 'undated';
const CURSOR = /^(\d{4}-\d{2}-\d{2}|undated)_(.+)$/;

/** The cursor after `moment` (`{ id, happenedOn }`). */
export const momentCursor = (moment) => `${toDateOnly(moment.happenedOn) ?? UNDATED}_${moment.id}`;

/**
 * A cursor from the query string -> `{ ok: true, value: { happenedOn: Date | null, id } }`,
 * `{ ok: true, value: undefined }` when there's none, or `{ ok: false }`.
 */
export function parseMomentCursor(input) {
  if (input === undefined || input === '') return { ok: true, value: undefined };
  const match = typeof input === 'string' ? CURSOR.exec(input) : null;
  if (!match || !isUuid(match[2])) return { ok: false };
  if (match[1] === UNDATED) return { ok: true, value: { happenedOn: null, id: match[2] } };
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || toDateOnly(date) !== match[1]) return { ok: false };
  return { ok: true, value: { happenedOn: date, id: match[2] } };
}
