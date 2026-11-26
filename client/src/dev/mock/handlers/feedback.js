// Mock mode only: feedback (docs/API.md "Feedback"), as the server's controllers/feedback.js:
// anyone signed in sends a report (no verified email needed), its screenshot presigned first
// and put in the mock bucket; admins list, read, change and delete them. Unlike the server,
// nothing is rate limited.
import { fail, ok, raw, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { mockUpload, presignMockUpload } from '../uploads';
import {
  FEEDBACK_MESSAGES as M,
  FEEDBACK_KINDS,
  FEEDBACK_STATUSES,
  checkScreenshot,
  closedAtFor,
  feedbackListItem,
  feedbackReference,
  feedbackView,
  parseFeedbackInput,
  parseFeedbackUpdate,
} from '../feedback';

const PAGE_DEFAULT = 30;
const signedOut = () => fail(401, 'No valid session. Please sign in.');
const isAdmin = () => session.signedIn && ['ADMIN', 'DEVELOPER'].includes(me().role);
const notAdmin = () => (session.signedIn ? fail(403, 'Admins only.') : signedOut());
const reports = () => (getDb().feedback ||= []);
const folderOf = (userId) => `myplanetview/feedback/${userId}/shot-`;
// Newest first, then by id, as the server's list
const newestFirst = (a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1);

export function registerFeedbackRoutes() {
  route('POST', '/api/feedback/screenshot/presign', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const { contentType, bytes } = body || {};
    const problem = checkScreenshot({ contentType, bytes });
    if (problem) return fail(problem === 'feedbackScreenshotTooLarge' ? 413 : 400, M[problem]);
    const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[contentType];
    const key = `${folderOf(me().id)}${newId()}.${ext}`;
    const url = presignMockUpload(key, { resource: 'feedback', contentType, bytes, ownerId: me().id });
    return ok({ key, upload: { url, method: 'PUT', headers: { 'Content-Type': contentType }, bytes, expiresIn: 600 } });
  });

  route('POST', '/api/feedback', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const parsed = parseFeedbackInput(body, { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null });
    if (parsed.error) return fail(400, M[parsed.error]);
    const { screenshotKey, ...report } = parsed.value;
    if (screenshotKey) {
      const signed = screenshotKey.startsWith(folderOf(me().id)) ? mockUpload(screenshotKey) : null;
      const used = reports().some((r) => r.screenshotKey === screenshotKey);
      // Only what this person presigned and the mock bucket took, and only once
      if (!signed || signed.resource !== 'feedback' || signed.ownerId !== me().id || !session.blobs.has(screenshotKey) || used) {
        return fail(400, M.feedbackScreenshotInvalid);
      }
    }
    const now = new Date().toISOString();
    const row = {
      id: newId(),
      userId: me().id,
      ...report,
      screenshotKey: screenshotKey || null,
      screenshotUrl: null,
      status: 'NEW',
      adminNotes: null,
      closedAt: null,
      updatedById: null,
      createdAt: now,
      updatedAt: now,
    };
    reports().push(row);
    return ok({ feedback: { id: row.id, reference: feedbackReference(row.id), createdAt: row.createdAt } }, 201);
  });

  route('GET', '/api/users/admin/feedback', ({ query }) => {
    if (!isAdmin()) return notAdmin();
    const status = !query?.status || query.status === 'ALL' ? null : query.status;
    const kind = !query?.kind || query.kind === 'ALL' ? null : query.kind;
    if (status && !FEEDBACK_STATUSES.includes(status)) return fail(400, M.feedbackStatusInvalid);
    if (kind && !FEEDBACK_KINDS.includes(kind)) return fail(400, M.feedbackKindInvalid);
    const take = Math.min(100, Math.max(1, Number(query?.limit) || PAGE_DEFAULT));
    const all = reports()
      .filter((r) => (!status || r.status === status) && (!kind || r.kind === kind))
      .sort(newestFirst);
    // The cursor is the last report's id (the server's is opaque)
    const start = query?.cursor ? all.findIndex((r) => r.id === query.cursor) + 1 : 0;
    const page = all.slice(start, start + take);
    const counts = {};
    for (const r of reports()) counts[r.status] = (counts[r.status] || 0) + 1;
    return ok({ reports: page.map(feedbackListItem), counts, nextCursor: start + take < all.length ? page.at(-1).id : null });
  });

  route('GET', '/api/users/admin/feedback/:feedbackId', ({ params }) => {
    if (!isAdmin()) return notAdmin();
    const row = reports().find((r) => r.id === params.feedbackId);
    return row ? ok({ report: feedbackView(row) }) : fail(404, M.feedbackNotFound);
  });

  route('PATCH', '/api/users/admin/feedback/:feedbackId', ({ params, body }) => {
    if (!isAdmin()) return notAdmin();
    const row = reports().find((r) => r.id === params.feedbackId);
    if (!row) return fail(404, M.feedbackNotFound);
    const parsed = parseFeedbackUpdate(body);
    if (parsed.error) return fail(400, M[parsed.error]);
    const status = parsed.value.status ?? row.status;
    Object.assign(row, parsed.value, {
      closedAt: closedAtFor(status, row),
      updatedById: me().id,
      updatedAt: new Date().toISOString(),
    });
    return ok({ report: feedbackView(row) });
  });

  route('DELETE', '/api/users/admin/feedback/:feedbackId', ({ params }) => {
    if (!isAdmin()) return notAdmin();
    const db = getDb();
    const row = reports().find((r) => r.id === params.feedbackId);
    if (!row) return fail(404, M.feedbackNotFound);
    db.feedback = reports().filter((r) => r.id !== row.id);
    if (row.screenshotKey) session.blobs.delete(row.screenshotKey);
    return raw({ status: 'success', message: M.feedbackDeleted });
  });
}
