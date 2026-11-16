// Monthly photo themes (docs/API.md, "Photo themes"; docs/FEATURE-PLAN.md, "Monthly photo
// themes"): months, which theme is running, a theme as it's sent, and checking an admin's
// input. Pure. A theme runs for its calendar month in UTC.
import { sanitizeText } from './sanitize.js';

export const THEME_LIMITS = Object.freeze({
  title: 60,
  blurb: 300,
  // Photos one map may enter in one theme: an album, not a dump of the whole map
  entriesPerMap: 20,
  // Past themes listed with the current one (GET /themes)
  recent: 12,
});

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** The first day of `date`'s month, in UTC. */
export const monthStart = (date = new Date()) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

/** The first day of the month after `month` (a month start): when a theme ends. */
export const nextMonth = (month) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));

/** "2026-11" for a month start. */
export const monthKey = (month) => month.toISOString().slice(0, 7);

/** "2026-11" -> its first day (UTC), or null for anything else. */
export function parseMonth(value) {
  const match = typeof value === 'string' ? MONTH_PATTERN.exec(value) : null;
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 2000 || year > 2999) return null;
  return new Date(Date.UTC(year, Number(match[2]) - 1, 1));
}

/** Is the theme running at `now` (its month)? */
export const isRunning = (theme, now = new Date()) => monthStart(now).getTime() === new Date(theme.month).getTime();

/**
 * A theme as the API sends it: `{ id, month: 'YYYY-MM', title, blurb, startsAt, endsAt,
 * running }` (`endsAt` is the first moment of the next month, UTC).
 */
export function themeView(theme, now = new Date()) {
  const month = new Date(theme.month);
  return {
    id: theme.id,
    month: monthKey(month),
    title: theme.title,
    blurb: theme.blurb ?? null,
    startsAt: month.toISOString(),
    endsAt: nextMonth(month).toISOString(),
    running: isRunning(theme, now),
  };
}

/**
 * An admin's theme (`{ month: 'YYYY-MM', title, blurb? }`), cleaned. With `existing`, only
 * the fields sent are checked and returned (a change). A month that's over is refused,
 * the current one is allowed (a theme set mid-month starts at once).
 * -> `{ ok: true, data }` or `{ ok: false, message }` (an EVENT_MESSAGES key)
 */
export function parseThemeInput(body, { existing = null, now = new Date() } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, message: 'themeInvalid' };
  const data = {};
  if (!existing || body.month !== undefined) {
    const month = parseMonth(body.month);
    if (!month) return { ok: false, message: 'themeInvalid' };
    if (month < monthStart(now)) return { ok: false, message: 'themeMonthPast' };
    data.month = month;
  }
  if (!existing || body.title !== undefined) {
    const raw = typeof body.title === 'string' ? sanitizeText(body.title.replace(/\s+/g, ' '), { maxLength: 1000 }) : null;
    if (!raw || raw.length > THEME_LIMITS.title) return { ok: false, message: 'themeInvalid' };
    data.title = raw;
  }
  if (!existing || body.blurb !== undefined) {
    if (body.blurb != null && typeof body.blurb !== 'string') return { ok: false, message: 'themeInvalid' };
    const blurb = body.blurb == null ? null : sanitizeText(body.blurb, { maxLength: 1000 });
    if (blurb && blurb.length > THEME_LIMITS.blurb) return { ok: false, message: 'themeInvalid' };
    data.blurb = blurb;
  }
  return { ok: true, data };
}
