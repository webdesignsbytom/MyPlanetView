// Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish): anyone signed
// in sends a problem, an idea, a question or anything else, with an optional screenshot in the
// private bucket; admins read and act on them at /admin/feedback. No verified email needed: someone
// stuck verifying may be the one reporting it. Events hold ids, kinds and statuses, never words.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createFeedbackEvent } from '../event/travelUtils.js';
import { isUuid } from '../utils/travelValidation.js';
import { clampInt } from '../utils/sanitize.js';
import {
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_SAVE_WINDOW_MINUTES,
  SCREENSHOT_TYPES,
  SCREENSHOT_UNSAVED_LIMIT,
  checkScreenshot,
  closedAtFor,
  feedbackListItem,
  feedbackReference,
  feedbackView,
  parseFeedbackFilters,
  parseFeedbackInput,
  parseFeedbackUpdate,
} from '../utils/feedback.js';
import { pageOf, parseExportCursor } from '../utils/dataExport.js';
import {
  countFeedbackByStatus,
  createFeedbackInDB,
  deleteFeedbackInDB,
  findFeedbackById,
  findScreenshotUpload,
  listFeedbackInDB,
  updateFeedbackInDB,
} from '../domain/feedback.js';
import {
  buildFeedbackScreenshotKey,
  deleteStoredObjects,
  feedbackScreenshotFolder,
  headPrivateObject,
  presignFeedbackScreenshot,
  signPhotoUrl,
} from '../services/s3/mediaService.js';
import { badRequest, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.feedback;
// The admin's list, a page at a time
const PAGE_DEFAULT = 30;
const PAGE_MAX = 100;

const log = (req, action, id, extra = {}) => logEvent(createFeedbackEvent({ user: req.user, action, id, ...extra }));

// POST /feedback/screenshot/presign: { contentType, bytes } -> a PUT into the private bucket,
// signing both. The browser makes the picture again first (no camera details travel).
export const presignScreenshotHandler = handler(D, 'Presign feedback screenshot', async (req, res) => {
  const { contentType, bytes } = req.body || {};
  const problem = checkScreenshot({ contentType, bytes });
  if (problem === 'feedbackScreenshotTooLarge') return sendMessageResponse(res, 413, EVENT_MESSAGES[problem]);
  if (problem) return badRequest(req, res, D, EVENT_MESSAGES[problem]);

  const key = buildFeedbackScreenshotKey({ userId: req.user.id, contentType });
  const { url, expiresIn } = await presignFeedbackScreenshot({ key, contentType, bytes, userId: req.user.id, limit: SCREENSHOT_UNSAVED_LIMIT });
  return sendDataResponse(res, 200, {
    key,
    upload: { url, method: 'PUT', headers: { 'Content-Type': contentType }, bytes, expiresIn },
  });
});

// The screenshot a report names: the sender's own upload, unused, fresh, and in the bucket as
// an allowed picture. -> `{ screenshot }` (`{ mediaId, bytes, contentType }`), or `{ reply }` sent
async function checkSentScreenshot(req, res, key) {
  const invalid = () => ({ reply: badRequest(req, res, D, EVENT_MESSAGES.feedbackScreenshotInvalid) });
  if (!key.startsWith(`${feedbackScreenshotFolder(req.user.id)}shot-`)) return invalid();
  const item = await findScreenshotUpload(key);
  if (!item || item.resource !== 'feedback' || item.ownerId !== req.user.id || item.usedAsFeedbackScreenshot) return invalid();
  if (Date.now() - new Date(item.createdAt).getTime() > SCREENSHOT_SAVE_WINDOW_MINUTES * 60 * 1000) {
    return { reply: badRequest(req, res, D, EVENT_MESSAGES.feedbackScreenshotExpired) };
  }
  const stored = await headPrivateObject(key);
  if (!stored) return invalid();
  if (stored.bytes > SCREENSHOT_MAX_BYTES || !SCREENSHOT_TYPES.includes(stored.contentType)) {
    await deleteStoredObjects([key]);
    return {
      reply:
        stored.bytes > SCREENSHOT_MAX_BYTES
          ? sendMessageResponse(res, 413, EVENT_MESSAGES.feedbackScreenshotTooLarge)
          : badRequest(req, res, D, EVENT_MESSAGES.feedbackScreenshotType),
    };
  }
  return { screenshot: { mediaId: item.id, bytes: stored.bytes, contentType: stored.contentType } };
}

// POST /feedback: the report (utils/feedback.js parseFeedbackInput) -> 201 `{ feedback: { id, reference } }`
export const sendFeedbackHandler = handler(D, 'Send feedback', async (req, res) => {
  const parsed = parseFeedbackInput(req.body, { userAgent: req.get('user-agent') });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.error]);
  const { screenshotKey, ...report } = parsed.value;

  let screenshot = null;
  if (screenshotKey) {
    const checked = await checkSentScreenshot(req, res, screenshotKey);
    if (checked.reply) return checked.reply;
    ({ screenshot } = checked);
  }
  const made = await createFeedbackInDB({ userId: req.user.id, report, screenshot });
  log(req, 'Send Success', made.id, { detail: `kind=${report.kind}${screenshot ? ' screenshot' : ''}`, statusCode: 201 });
  return sendDataResponse(res, 201, { feedback: { id: made.id, reference: feedbackReference(made.id), createdAt: made.createdAt } });
});

// GET /users/admin/feedback?status=&kind=&cursor=&limit= -> `{ reports, counts, nextCursor }`
export const listFeedbackHandler = handler(D, 'List feedback', async (req, res) => {
  const filters = parseFeedbackFilters(req.query);
  if (filters.error) return badRequest(req, res, D, EVENT_MESSAGES[filters.error]);
  const cursor = parseExportCursor(req.query.cursor);
  if (!cursor.ok) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  const take = clampInt(req.query.limit, { min: 1, max: PAGE_MAX, fallback: PAGE_DEFAULT });

  const [rows, counts] = await Promise.all([listFeedbackInDB({ ...filters, after: cursor.value, take }), countFeedbackByStatus()]);
  const page = pageOf(rows, take);
  return sendDataResponse(res, 200, { reports: page.rows.map(feedbackListItem), counts, nextCursor: page.nextCursor });
});

// The whole report for an admin, its screenshot signed for an hour or two
const adminView = async (row) => feedbackView(row, { screenshotUrl: row.screenshot?.key ? await signPhotoUrl(row.screenshot.key) : null });

// GET /users/admin/feedback/:feedbackId -> `{ report }`
export const getFeedbackHandler = handler(D, 'Get feedback', async (req, res) => {
  const row = isUuid(req.params.feedbackId) ? await findFeedbackById(req.params.feedbackId) : null;
  if (!row) return notFound(req, res, D, EVENT_MESSAGES.feedbackNotFound);
  return sendDataResponse(res, 200, { report: await adminView(row) });
});

// PATCH /users/admin/feedback/:feedbackId: `{ status?, adminNotes? }` -> `{ report }`
export const updateFeedbackHandler = handler(D, 'Update feedback', async (req, res) => {
  const row = isUuid(req.params.feedbackId) ? await findFeedbackById(req.params.feedbackId) : null;
  if (!row) return notFound(req, res, D, EVENT_MESSAGES.feedbackNotFound);
  const change = parseFeedbackUpdate(req.body);
  if (!change.ok) return badRequest(req, res, D, EVENT_MESSAGES[change.error]);

  const status = change.value.status ?? row.status;
  const updated = await updateFeedbackInDB(row.id, {
    ...change.value,
    closedAt: closedAtFor(status, row),
    updatedById: req.user.id,
  });
  log(req, 'Update Success', row.id, { detail: `status=${updated.status}${'adminNotes' in change.value ? ' notes' : ''}` });
  return sendDataResponse(res, 200, { report: await adminView(updated) });
});

// DELETE /users/admin/feedback/:feedbackId: the report, then its screenshot's file
export const deleteFeedbackHandler = handler(D, 'Delete feedback', async (req, res) => {
  const row = isUuid(req.params.feedbackId) ? await findFeedbackById(req.params.feedbackId) : null;
  if (!row) return notFound(req, res, D, EVENT_MESSAGES.feedbackNotFound);
  const key = await deleteFeedbackInDB(row.id);
  // The row no longer points at the file, so it can go (never throws; a failure is the cron's)
  if (key) await deleteStoredObjects([key]);
  log(req, 'Delete Success', row.id);
  return sendMessageResponse(res, 200, EVENT_MESSAGES.feedbackDeleted);
});
