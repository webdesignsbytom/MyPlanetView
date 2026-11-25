// Feedback (docs/API.md, "Feedback"): sending a report (its screenshot presigned first) and the
// admin's list, report, changes and deleting. Each function returns the payload
// (`res.data.data`); errors keep the client's `friendlyMessage`.
import client from './client';
import { ADMIN_FEEDBACK_API, FEEDBACK_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** `{ contentType, bytes }` -> `{ key, upload: { url, method, headers, bytes } }` */
export const presignFeedbackScreenshot = (file) => data(client.post(`${FEEDBACK_API}/screenshot/presign`, file));

/** The report (utils/feedback/feedbackForm.js feedbackBody) -> `{ feedback: { id, reference } }` */
export const sendFeedback = (body) => data(client.post(FEEDBACK_API, body));

/** The admin's list: `{ status, kind, cursor }` (each optional) -> `{ reports, counts, nextCursor }` */
export function getAdminFeedback({ status, kind, cursor } = {}) {
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (kind) search.set('kind', kind);
  if (cursor) search.set('cursor', cursor);
  const query = search.toString();
  return data(client.get(query ? `${ADMIN_FEEDBACK_API}?${query}` : ADMIN_FEEDBACK_API));
}

/** -> `{ report }`, the whole report with its screenshot's link and the sender's address */
export const getFeedbackReport = (id) => data(client.get(`${ADMIN_FEEDBACK_API}/${enc(id)}`));

/** `{ status?, adminNotes? }` -> `{ report }` */
export const updateFeedbackReport = (id, change) => data(client.patch(`${ADMIN_FEEDBACK_API}/${enc(id)}`, change));

export const deleteFeedbackReport = (id) => client.delete(`${ADMIN_FEEDBACK_API}/${enc(id)}`).then((res) => res.data);
