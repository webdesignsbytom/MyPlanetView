// A moment's date: a day, a month or only a year, or none (an undated note), as the server
// keeps it (docs/API.md "Moments"): `happenedOn` is the first day of what's known
// ('2019-06-01' for June 2019) and `datePrecision` says how much (DAY, MONTH or YEAR).
// The rules are the server's (server/src/utils/moments.js); mock mode uses them too.
import { formatDay } from '@/utils/functions/dates';

export const DATE_PRECISIONS = Object.freeze(['DAY', 'MONTH', 'YEAR']);
export const MOMENT_YEAR_MIN = 1800;
export const MOMENT_YEAR_MAX = 2200;

// How much of the date is known, for the form's choice ('NONE': no date)
export const DATE_PRECISION_OPTIONS = [
  { value: 'DAY', label: 'A day' },
  { value: 'MONTH', label: 'A month' },
  { value: 'YEAR', label: 'Only the year' },
  { value: 'NONE', label: 'No date' },
];

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }));

const FINENESS = { YEAR: 1, MONTH: 2, DAY: 3 };
const WRITTEN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const pad = (n) => String(n).padStart(2, '0');

/**
 * As the server's parseMomentDate: `happenedOn` is "YYYY", "YYYY-MM" or "YYYY-MM-DD";
 * `datePrecision` follows the form when missing, may be coarser than what's written,
 * never finer; what's written must exist, from 1800 to 2200. A month or a year is kept
 * as its first day.
 * -> `{ ok: true, value: undefined }` (both missing), `{ ok: true, value: { happenedOn:
 *    null, datePrecision: null } }` (undated), `{ ok: true, value: { happenedOn:
 *    'YYYY-MM-DD', datePrecision } }`, or `{ ok: false }`.
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
  const asWritten = new Date(Date.UTC(year, month - 1, day));
  if (asWritten.getUTCMonth() !== month - 1 || asWritten.getUTCDate() !== day) return { ok: false };

  const storedMonth = precision === 'YEAR' ? 1 : month;
  const storedDay = precision === 'DAY' ? day : 1;
  return { ok: true, value: { happenedOn: `${match[1]}-${pad(storedMonth)}-${pad(storedDay)}`, datePrecision: precision } };
}

/** "14 Jun 2019", "June 2019", "2019", or '' for an undated moment. */
export function formatMomentDate({ happenedOn, datePrecision } = {}) {
  if (!happenedOn) return '';
  if (datePrecision === 'YEAR') return happenedOn.slice(0, 4);
  if (datePrecision === 'MONTH') {
    const month = MONTH_OPTIONS[Number(happenedOn.slice(5, 7)) - 1];
    return month ? `${month.label} ${happenedOn.slice(0, 4)}` : happenedOn.slice(0, 7);
  }
  return formatDay(happenedOn);
}

/** The form's date fields for a moment (or a new one). */
export function momentDateFields(moment) {
  const happenedOn = moment?.happenedOn || '';
  return {
    precision: happenedOn ? moment.datePrecision || 'DAY' : 'NONE',
    day: moment?.datePrecision === 'DAY' ? happenedOn : '',
    month: happenedOn && moment.datePrecision !== 'YEAR' ? happenedOn.slice(5, 7) : '',
    year: happenedOn ? happenedOn.slice(0, 4) : '',
  };
}

/**
 * The body's date from the form's fields -> `{ happenedOn, datePrecision }` (both null for
 * no date), or `{ error }` saying what's missing.
 */
export function momentDateBody({ precision, day, month, year }) {
  if (precision === 'NONE') return { happenedOn: null, datePrecision: null };
  const yearText = String(year || '').trim();
  const yearOk = /^\d{4}$/.test(yearText) && Number(yearText) >= MOMENT_YEAR_MIN && Number(yearText) <= MOMENT_YEAR_MAX;
  let written;
  if (precision === 'DAY') {
    if (!day) return { error: 'Choose the day, or say less about the date.' };
    written = day;
  } else if (precision === 'MONTH') {
    if (!month || !yearOk) return { error: `Choose the month and a year from ${MOMENT_YEAR_MIN} to ${MOMENT_YEAR_MAX}.` };
    written = `${yearText}-${month}`;
  } else {
    if (!yearOk) return { error: `Give a year from ${MOMENT_YEAR_MIN} to ${MOMENT_YEAR_MAX}.` };
    written = yearText;
  }
  const parsed = parseMomentDate(written, precision);
  if (!parsed.ok) return { error: 'That date doesn’t exist.' };
  return parsed.value;
}

/** The list's order: date order, oldest first, undated last, then by id. */
export function compareMoments(a, b) {
  if (!a.happenedOn !== !b.happenedOn) return a.happenedOn ? -1 : 1;
  if (a.happenedOn && a.happenedOn !== b.happenedOn) return a.happenedOn < b.happenedOn ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// The server's paging cursor: "<YYYY-MM-DD or undated>_<id>" after the page's last moment
const UNDATED = 'undated';
const CURSOR = /^(\d{4}-\d{2}-\d{2}|undated)_(.+)$/;

export const momentCursor = (moment) => `${moment.happenedOn || UNDATED}_${moment.id}`;

/** -> `{ ok: true, value: { happenedOn, id } | undefined }` or `{ ok: false }` */
export function parseMomentCursor(input) {
  if (input === undefined || input === '') return { ok: true, value: undefined };
  const match = typeof input === 'string' ? CURSOR.exec(input) : null;
  if (!match) return { ok: false };
  if (match[1] === UNDATED) return { ok: true, value: { happenedOn: null, id: match[2] } };
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) return { ok: false };
  return { ok: true, value: { happenedOn: match[1], id: match[2] } };
}
