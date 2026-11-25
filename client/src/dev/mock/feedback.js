// Mock mode only: feedback sent from the map (docs/API.md "Feedback"), as the server's
// utils/feedback.js: what a report keeps for each kind, the page's secrets taken out, the
// screenshot's rules, the admin's changes and the views. `db.feedback` rows are the server's
// columns, with `screenshotKey` (an upload this session, in session.blobs) or `screenshotUrl`
// (the seed's, a repo test photo).
import { getDb, session } from './store';
import { FEEDBACK_LIMITS, SCREENSHOT_MAX_BYTES, SCREENSHOT_TYPES } from '@/utils/feedback/feedbackForm';

export const FEEDBACK_KINDS = ['PROBLEM', 'IDEA', 'QUESTION', 'OTHER'];
export const FEEDBACK_IMPACTS = ['BLOCKING', 'ANNOYING', 'MINOR'];
export const FEEDBACK_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE', 'WONT_DO'];
const CLOSED = ['DONE', 'WONT_DO'];

// The server's EVENT_MESSAGES for feedback
export const FEEDBACK_MESSAGES = {
  feedbackKindInvalid: 'Choose what your message is about.',
  feedbackDetailsRequired: 'Please tell us a little about it in the first box.',
  feedbackTooLong: "That's a bit long. Please shorten it and try again.",
  feedbackImpactInvalid: 'Choose how much it gets in your way.',
  feedbackScreenshotType: 'The screenshot must be a JPEG, PNG or WebP picture.',
  feedbackScreenshotInvalid: "That screenshot upload isn't valid. Please add it again.",
  feedbackScreenshotTooLarge: 'That screenshot is too big. Please choose a smaller one.',
  feedbackScreenshotExpired: 'That screenshot took too long to send. Please add it again.',
  feedbackStatusInvalid: 'Choose one of the statuses.',
  feedbackNotFound: "That report couldn't be found. It may have been deleted.",
  feedbackDeleted: 'Report deleted.',
  malformedData: "Some details weren't in the right format. Please check them and try again.",
  missingFields: 'Some required details are missing. Please fill them in and try again.',
};

const SECRET_PAGES = [
  [/^(\/(?:shared|embed|guess|gift)\/)[^/]+/i, '$1:code'],
  [/^(\/challenges\/join\/)[^/]+/i, '$1:code'],
  [/^(\/invite\/)[^/]+/i, '$1:token'],
];

export function cleanPage(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  let path = value.split(/[?#]/)[0];
  for (const [pattern, replacement] of SECRET_PAGES) path = path.replace(pattern, replacement);
  return path.slice(0, 300);
}

const text = (value, max) => {
  if (value === undefined || value === null || value === '') return { value: null };
  if (typeof value !== 'string') return { invalid: true };
  if (value.length > max) return { tooLong: true };
  return { value: value.replace(/<[^>]*>/g, '').trim() || null };
};

const CONTEXT_TEXT = { screen: 20, window: 20, style: 20, build: 40, language: 35, timeZone: 64, plan: 20 };
const CONTEXT_FLAGS = ['phone', 'online', 'standalone'];
function cleanContext(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clean = {};
  for (const [key, max] of Object.entries(CONTEXT_TEXT)) if (typeof value[key] === 'string' && value[key].trim()) clean[key] = value[key].trim().slice(0, max);
  for (const key of CONTEXT_FLAGS) if (typeof value[key] === 'boolean') clean[key] = value[key];
  return Object.keys(clean).length ? clean : null;
}

/** As the server's parseFeedbackInput. */
export function parseFeedbackInput(body, { userAgent = null } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  if (!FEEDBACK_KINDS.includes(input.kind)) return { error: 'feedbackKindInvalid' };
  const kind = input.kind;
  const details = text(input.details, FEEDBACK_LIMITS.details);
  const expected = kind === 'PROBLEM' ? text(input.expected, FEEDBACK_LIMITS.expected) : { value: null };
  const why = kind === 'PROBLEM' || kind === 'IDEA' ? text(input.why, FEEDBACK_LIMITS.why) : { value: null };
  if ([details, expected, why].some((f) => f.invalid)) return { error: 'malformedData' };
  if ([details, expected, why].some((f) => f.tooLong)) return { error: 'feedbackTooLong' };
  if (!details.value) return { error: 'feedbackDetailsRequired' };
  let impact = null;
  if (kind === 'PROBLEM' && input.impact) {
    if (!FEEDBACK_IMPACTS.includes(input.impact)) return { error: 'feedbackImpactInvalid' };
    impact = input.impact;
  }
  const screenshotKey = input.screenshotKey || null;
  if (screenshotKey !== null && typeof screenshotKey !== 'string') return { error: 'feedbackScreenshotInvalid' };
  return {
    value: {
      kind,
      details: details.value,
      expected: expected.value,
      why: why.value,
      impact,
      page: cleanPage(input.page),
      mapId: typeof input.mapId === 'string' && /^[\w-]{1,64}$/.test(input.mapId) ? input.mapId : null,
      userAgent: typeof userAgent === 'string' ? userAgent.slice(0, FEEDBACK_LIMITS.userAgent ?? 400) : null,
      context: cleanContext(input.context),
      screenshotKey,
    },
  };
}

export function checkScreenshot({ contentType, bytes }) {
  if (!SCREENSHOT_TYPES.includes(contentType)) return 'feedbackScreenshotType';
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return 'feedbackScreenshotInvalid';
  if (bytes > SCREENSHOT_MAX_BYTES) return 'feedbackScreenshotTooLarge';
  return null;
}

export function parseFeedbackUpdate(body) {
  const input = body && typeof body === 'object' ? body : {};
  const value = {};
  if (input.status !== undefined) {
    if (!FEEDBACK_STATUSES.includes(input.status)) return { error: 'feedbackStatusInvalid' };
    value.status = input.status;
  }
  if (input.adminNotes !== undefined) {
    const notes = text(input.adminNotes, FEEDBACK_LIMITS.adminNotes);
    if (notes.invalid) return { error: 'malformedData' };
    if (notes.tooLong) return { error: 'feedbackTooLong' };
    value.adminNotes = notes.value;
  }
  if (!Object.keys(value).length) return { error: 'missingFields' };
  return { value };
}

export const closedAtFor = (status, previous = {}, now = new Date().toISOString()) =>
  CLOSED.includes(status) ? (CLOSED.includes(previous.status) && previous.closedAt ? previous.closedAt : now) : null;

export const feedbackReference = (id) => `FB-${String(id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const userOf = (id) => getDb().users.find((u) => u.id === id) || null;
const hasScreenshot = (row) => Boolean(row.screenshotUrl || (row.screenshotKey && session.blobs.has(row.screenshotKey)));

export function feedbackListItem(row) {
  const sender = userOf(row.userId);
  return {
    id: row.id,
    reference: feedbackReference(row.id),
    kind: row.kind,
    impact: row.impact,
    status: row.status,
    summary: row.details.length > 160 ? `${row.details.slice(0, 157).trimEnd()}…` : row.details,
    page: row.page,
    hasScreenshot: hasScreenshot(row),
    sender: sender ? { id: sender.id, name: sender.name } : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function feedbackView(row) {
  const sender = userOf(row.userId);
  const updater = row.updatedById ? userOf(row.updatedById) : null;
  const url = row.screenshotKey ? session.blobs.get(row.screenshotKey) || null : row.screenshotUrl || null;
  return {
    ...feedbackListItem(row),
    details: row.details,
    expected: row.expected,
    why: row.why,
    mapId: row.mapId,
    userAgent: row.userAgent,
    context: row.context ?? null,
    screenshot: url ? { url } : null,
    sender: sender ? { id: sender.id, name: sender.name, email: sender.email } : null,
    adminNotes: row.adminNotes,
    closedAt: row.closedAt,
    updatedBy: updater ? { id: updater.id, name: updater.name } : null,
  };
}

export const feedbackExportItem = (row) => ({
  reference: feedbackReference(row.id),
  kind: row.kind,
  details: row.details,
  expected: row.expected,
  why: row.why,
  impact: row.impact,
  page: row.page,
  status: row.status,
  hasScreenshot: hasScreenshot(row),
  sentAt: row.createdAt,
});

/** The seed's reports: a problem with a screenshot, an idea in progress, a question answered. */
export function exampleFeedback({ userId, otherId, mapId, daysAgo }) {
  return [
    {
      id: 'fb000001-0000-4000-8000-000000000001',
      userId,
      kind: 'PROBLEM',
      details: 'I pressed Save on my trip to Lisbon and nothing happened. The button went grey and stayed grey.',
      expected: 'The trip to be saved and the form to close.',
      why: 'I had to type my notes again.',
      impact: 'ANNOYING',
      page: `/maps/${mapId}`,
      mapId,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      context: { screen: '390×844', window: '390×664', style: 'animated', phone: true, online: true, standalone: false, language: 'en-GB', timeZone: 'Europe/London' },
      screenshotKey: null,
      screenshotUrl: '/seed-photos/eiffel-tower/display.webp',
      status: 'NEW',
      adminNotes: null,
      closedAt: null,
      updatedById: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'fb000002-0000-4000-8000-000000000002',
      userId: otherId,
      kind: 'IDEA',
      details: 'A way to print my passport as a little book.',
      expected: null,
      why: 'I’d give it to my mum as a present.',
      impact: null,
      page: '/maps/map-sam/passport',
      mapId: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
      context: { screen: '1920×1080', window: '1536×864', style: 'old-map', phone: false, online: true, standalone: false, language: 'en-AU', timeZone: 'Australia/Sydney' },
      screenshotKey: null,
      screenshotUrl: null,
      status: 'IN_PROGRESS',
      adminNotes: 'Lovely idea: on the list for the print partner.',
      closedAt: null,
      updatedById: 'mock-admin',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
    {
      id: 'fb000003-0000-4000-8000-000000000003',
      userId,
      kind: 'QUESTION',
      details: 'How do I add my partner to my map?',
      expected: null,
      why: null,
      impact: null,
      page: `/maps/${mapId}`,
      mapId,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
      context: { screen: '1512×982', window: '1512×860', style: 'starry', phone: false, online: true, standalone: false, language: 'en-GB', timeZone: 'Europe/London' },
      screenshotKey: null,
      screenshotUrl: null,
      status: 'DONE',
      adminNotes: 'Replied by email: Share this map, then Co-owner.',
      closedAt: daysAgo(8),
      updatedById: 'mock-admin',
      createdAt: daysAgo(9),
      updatedAt: daysAgo(8),
    },
  ];
}
