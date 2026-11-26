// Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish: "report a bug,
// request a feature ... simple for a non technical person ... and upload a screenshot if needed"):
// what a report may hold, the screenshot's rules, and the admin's changes. Pure, so it's
// unit-tested (tests/feedback.test.js); the client keeps the limits and words
// (client/src/utils/feedback/feedbackForm.js).
import { sanitizeText } from './sanitize.js';
import { isUuid } from './travelValidation.js';

const MB = 1024 * 1024;

export const FEEDBACK_KINDS = Object.freeze(['PROBLEM', 'IDEA', 'QUESTION', 'OTHER']);
export const FEEDBACK_IMPACTS = Object.freeze(['BLOCKING', 'ANNOYING', 'MINOR']);
export const FEEDBACK_STATUSES = Object.freeze(['NEW', 'IN_PROGRESS', 'DONE', 'WONT_DO']);
// The statuses that close a report (it gets its closedAt)
export const CLOSED_STATUSES = Object.freeze(['DONE', 'WONT_DO']);

export const FEEDBACK_LIMITS = Object.freeze({
  details: 4000,
  expected: 2000,
  why: 2000,
  adminNotes: 4000,
  page: 300,
  userAgent: 400,
});

// The screenshot: one picture, made again in the browser (so no camera details travel), into the
// private bucket; saved with its report within the window, as a photo is
export const SCREENSHOT_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
export const SCREENSHOT_MAX_BYTES = 8 * MB;
export const SCREENSHOT_SAVE_WINDOW_MINUTES = 50;
// Screenshots presigned and never sent, per user over the last day (429 above)
export const SCREENSHOT_UNSAVED_LIMIT = 10;

// The details the page adds by itself, each a short string, a number or yes/no
const CONTEXT_TEXT = Object.freeze({ screen: 20, window: 20, style: 20, build: 40, language: 35, timeZone: 64, plan: 20 });
const CONTEXT_FLAGS = Object.freeze(['phone', 'online', 'standalone']);

// A text field: null when empty, `{ tooLong }` past its limit (counted before tags are taken out)
function textField(value, max) {
  if (value === undefined || value === null || value === '') return { value: null };
  if (typeof value !== 'string') return { invalid: true };
  if (value.length > max) return { tooLong: true };
  return { value: sanitizeText(value, { maxLength: max }) };
}

// The site's pages whose address holds a secret (the client's ANALYTICS_EXCLUDED_PREFIXES): a share
// link's code, an invite's token, a game's, a challenge's or a gift's code
const SECRET_PAGES = [
  [/^(\/(?:shared|embed|guess|gift)\/)[^/]+/i, '$1:code'],
  [/^(\/challenges\/join\/)[^/]+/i, '$1:code'],
  [/^(\/invite\/)[^/]+/i, '$1:token'],
];

/** The page they were on: its path alone (no query or hash), secrets taken out, cut to its limit. */
export function cleanPage(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  let path = value.split(/[?#]/)[0];
  for (const [pattern, replacement] of SECRET_PAGES) path = path.replace(pattern, replacement);
  return sanitizeText(path, { maxLength: FEEDBACK_LIMITS.page });
}

/** The small details the page sends: only the known ones, each short. -> an object, or null */
export function cleanContext(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clean = {};
  for (const [key, max] of Object.entries(CONTEXT_TEXT)) {
    const text = typeof value[key] === 'string' ? sanitizeText(value[key], { maxLength: max }) : null;
    if (text) clean[key] = text;
  }
  for (const key of CONTEXT_FLAGS) if (typeof value[key] === 'boolean') clean[key] = value[key];
  return Object.keys(clean).length ? clean : null;
}

/**
 * A report as sent: `{ kind, details, expected?, why?, impact?, page?, mapId?, context?,
 * screenshotKey? }`. Only a problem has `expected` and `impact`; a problem or an idea `why`.
 * -> `{ ok: true, value }`, or `{ ok: false, error }` (an EVENT_MESSAGES key)
 */
export function parseFeedbackInput(body, { userAgent } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  if (!FEEDBACK_KINDS.includes(input.kind)) return { ok: false, error: 'feedbackKindInvalid' };
  const kind = input.kind;

  const details = textField(input.details, FEEDBACK_LIMITS.details);
  const expected = kind === 'PROBLEM' ? textField(input.expected, FEEDBACK_LIMITS.expected) : { value: null };
  const why = kind === 'PROBLEM' || kind === 'IDEA' ? textField(input.why, FEEDBACK_LIMITS.why) : { value: null };
  if ([details, expected, why].some((f) => f.invalid)) return { ok: false, error: 'malformedData' };
  if ([details, expected, why].some((f) => f.tooLong)) return { ok: false, error: 'feedbackTooLong' };
  if (!details.value) return { ok: false, error: 'feedbackDetailsRequired' };

  let impact = null;
  if (kind === 'PROBLEM' && input.impact !== undefined && input.impact !== null && input.impact !== '') {
    if (!FEEDBACK_IMPACTS.includes(input.impact)) return { ok: false, error: 'feedbackImpactInvalid' };
    impact = input.impact;
  }

  const screenshotKey = input.screenshotKey === undefined || input.screenshotKey === null || input.screenshotKey === '' ? null : input.screenshotKey;
  if (screenshotKey !== null && typeof screenshotKey !== 'string') return { ok: false, error: 'feedbackScreenshotInvalid' };

  return {
    ok: true,
    value: {
      kind,
      details: details.value,
      expected: expected.value,
      why: why.value,
      impact,
      page: cleanPage(input.page),
      mapId: isUuid(input.mapId) || (typeof input.mapId === 'string' && /^[\w-]{1,64}$/.test(input.mapId)) ? input.mapId : null,
      userAgent: typeof userAgent === 'string' ? sanitizeText(userAgent, { maxLength: FEEDBACK_LIMITS.userAgent }) : null,
      context: cleanContext(input.context),
      screenshotKey,
    },
  };
}

/** A screenshot about to be uploaded. -> null when fine, else an EVENT_MESSAGES key */
export function checkScreenshot({ contentType, bytes }) {
  if (!SCREENSHOT_TYPES.includes(contentType)) return 'feedbackScreenshotType';
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return 'feedbackScreenshotInvalid';
  if (bytes > SCREENSHOT_MAX_BYTES) return 'feedbackScreenshotTooLarge';
  return null;
}

/**
 * An admin's change: `{ status?, adminNotes? }` (notes null or '' clears them).
 * -> `{ ok: true, value }` with only what's changing, or `{ ok: false, error }`
 */
export function parseFeedbackUpdate(body) {
  const input = body && typeof body === 'object' ? body : {};
  const value = {};
  if (input.status !== undefined) {
    if (!FEEDBACK_STATUSES.includes(input.status)) return { ok: false, error: 'feedbackStatusInvalid' };
    value.status = input.status;
  }
  if (input.adminNotes !== undefined) {
    const notes = textField(input.adminNotes, FEEDBACK_LIMITS.adminNotes);
    if (notes.invalid) return { ok: false, error: 'malformedData' };
    if (notes.tooLong) return { ok: false, error: 'feedbackTooLong' };
    value.adminNotes = notes.value;
  }
  if (!Object.keys(value).length) return { ok: false, error: 'missingFields' };
  return { ok: true, value };
}

/** When a report with this status was closed: kept while it stays closed, now when it closes, else null. */
export function closedAtFor(status, previous = {}, now = new Date()) {
  if (!CLOSED_STATUSES.includes(status)) return null;
  return CLOSED_STATUSES.includes(previous.status) && previous.closedAt ? previous.closedAt : now;
}

/** The admin list's filters from a query: `{ status, kind }`, each null for all, or `{ error }`. */
export function parseFeedbackFilters(query = {}) {
  const status = query.status === undefined || query.status === '' || query.status === 'ALL' ? null : query.status;
  const kind = query.kind === undefined || query.kind === '' || query.kind === 'ALL' ? null : query.kind;
  if (status !== null && !FEEDBACK_STATUSES.includes(status)) return { error: 'feedbackStatusInvalid' };
  if (kind !== null && !FEEDBACK_KINDS.includes(kind)) return { error: 'feedbackKindInvalid' };
  return { status, kind };
}

/** The short reference a sender is given and the admin sees: "FB-1A2B3C4D". */
export const feedbackReference = (id) => `FB-${String(id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;

/** A report on the admin's list: its words cut short, who sent it, where. */
export function feedbackListItem(row) {
  return {
    id: row.id,
    reference: feedbackReference(row.id),
    kind: row.kind,
    impact: row.impact,
    status: row.status,
    summary: row.details.length > 160 ? `${row.details.slice(0, 157).trimEnd()}…` : row.details,
    page: row.page,
    hasScreenshot: Boolean(row.screenshotId),
    sender: row.user ? { id: row.user.id, name: row.user.name } : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** A whole report for the admin, `screenshotUrl` the screenshot's signed link (or null). */
export function feedbackView(row, { screenshotUrl = null } = {}) {
  return {
    ...feedbackListItem(row),
    details: row.details,
    expected: row.expected,
    why: row.why,
    mapId: row.mapId,
    userAgent: row.userAgent,
    context: row.context ?? null,
    screenshot: screenshotUrl ? { url: screenshotUrl } : null,
    sender: row.user ? { id: row.user.id, name: row.user.name, email: row.user.email } : null,
    adminNotes: row.adminNotes,
    closedAt: row.closedAt,
    updatedBy: row.updatedBy ? { id: row.updatedBy.id, name: row.updatedBy.name } : null,
  };
}

/** A report in its sender's "Your data" file: their words and where it stands, no notes. */
export const feedbackExportItem = (row) => ({
  reference: feedbackReference(row.id),
  kind: row.kind,
  details: row.details,
  expected: row.expected,
  why: row.why,
  impact: row.impact,
  page: row.page,
  status: row.status,
  hasScreenshot: Boolean(row.screenshotId),
  sentAt: row.createdAt,
});
