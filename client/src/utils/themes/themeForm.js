// The admin's theme form (docs/API.md, "Photo themes"): the inputs' strings, checked as the
// server checks them (server/src/utils/themes.js parseThemeInput; change both together),
// and the months of the year ahead that have no theme yet. Pure.

export const THEME_TITLE_MAX = 60;
export const THEME_BLURB_MAX = 300;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "2026-11" for the month `date` is in (UTC, as themes run). */
export const monthOf = (date) => date.toISOString().slice(0, 7);

/** "2026-11" moved `n` months. */
export function addMonths(month, n) {
  const [year, m] = month.split('-').map(Number);
  return monthOf(new Date(Date.UTC(year, m - 1 + n, 1)));
}

export const emptyThemeForm = (month = '') => ({ month, title: '', blurb: '' });

export const themeFormFrom = (theme) => ({ month: theme.month, title: theme.title, blurb: theme.blurb || '' });

/**
 * The request body from the form, or the problems by field. With `existing`, only what
 * changed is sent. `thisMonth` ("YYYY-MM") is the earliest month allowed.
 * -> `{ ok: true, body }` or `{ ok: false, errors }`
 */
export function themeBodyFrom(form, { existing = null, thisMonth }) {
  const errors = {};
  const month = form.month.trim();
  const title = form.title.replace(/\s+/g, ' ').trim();
  const blurb = form.blurb.trim();
  // The years the server takes (its parseMonth: 2000 to 2999)
  const year = Number(month.slice(0, 4));
  if (!MONTH_PATTERN.test(month) || year < 2000 || year > 2999) errors.month = 'Choose a month (YYYY-MM).';
  else if (month < thisMonth && month !== existing?.month) errors.month = 'Choose this month or a later one.';
  if (!title) errors.title = 'Give it a title.';
  else if (title.length > THEME_TITLE_MAX) errors.title = `At most ${THEME_TITLE_MAX} characters.`;
  if (blurb.length > THEME_BLURB_MAX) errors.blurb = `At most ${THEME_BLURB_MAX} characters.`;
  if (Object.keys(errors).length) return { ok: false, errors };
  const body = { month, title, blurb: blurb || null };
  if (!existing) return { ok: true, body };
  const changed = Object.fromEntries(Object.entries(body).filter(([field, value]) => value !== (existing[field] ?? null)));
  return { ok: true, body: changed };
}

/** The months from this one to `ahead` - 1 months on that have no theme: ["2027-01", …] */
export function monthsWithoutTheme(themes, thisMonth, ahead = 12) {
  const taken = new Set(themes.map((t) => t.month));
  return Array.from({ length: ahead }, (_, i) => addMonths(thisMonth, i)).filter((month) => !taken.has(month));
}
