// Emails people can stop (docs/API.md "Emails"; 21 Nov 2026): "On this day", its daily run,
// the picture its email shows, the unsubscribe link, and the account's own settings.
import crypto from 'node:crypto';
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { photoLinkToken, tokenMatches, unsubscribeToken } from '../utils/onThisDay.js';
import { findEmailPreferences, findMemoryPhotoKey, saveEmailPreferences, turnOffOnThisDayInDB } from '../domain/onThisDay.js';
import { sendOnThisDayEmails } from '../services/memories/onThisDay.js';
import { signPhotoUrl } from '../services/s3/mediaService.js';
import { badRequest, handler } from './helpers/travel.js';

const D = DOMAINS.users;
const secret = () => process.env.BETTER_AUTH_SECRET;

const matchesCron = (header) => {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const given = Buffer.from(String(header || ''));
  return Boolean(process.env.CRON_SECRET) && given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

// GET /api/emails/on-this-day/cron (Vercel's cron, with CRON_SECRET)
export const onThisDayCronHandler = async (req, res) => {
  if (!matchesCron(req.headers.authorization)) return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  try {
    return res.json({ status: 'success', data: await sendOnThisDayEmails() });
  } catch (err) {
    console.error('[emails] on this day failed:', err);
    return res.status(500).json({ status: 'error', message: 'On this day failed.' });
  }
};

// GET /api/emails/photos/:photoId?t= : the email's picture, a fresh signed link to its DISPLAY
// copy each time (so the email shows it however long after it's opened). 404 otherwise.
export const memoryPhotoHandler = handler(D, 'Memory photo', async (req, res) => {
  const { photoId } = req.params;
  if (!tokenMatches(req.query?.t, photoLinkToken(photoId, secret()))) return sendMessageResponse(res, 404, EVENT_MESSAGES.photoNotFound);
  const key = await findMemoryPhotoKey(photoId);
  if (!key) return sendMessageResponse(res, 404, EVENT_MESSAGES.photoNotFound);
  return res.redirect(302, await signPhotoUrl(key));
});

// POST /api/emails/unsubscribe?u=&t= (the email's one-click header; a mail client sends
// "List-Unsubscribe=One-Click", which isn't read) or with `{ u, t }` (the /unsubscribe page):
// "On this day" off. No sign-in: the signed link is the proof.
export const unsubscribeHandler = handler(D, 'Unsubscribe', async (req, res) => {
  const u = req.query?.u ?? req.body?.u;
  const t = req.query?.t ?? req.body?.t;
  if (typeof u !== 'string' || !u || !tokenMatches(t, unsubscribeToken(u, secret()))) {
    return badRequest(req, res, D, EVENT_MESSAGES.unsubscribeInvalid);
  }
  await turnOffOnThisDayInDB(u);
  return sendDataResponse(res, 200, { onThisDay: false });
});

// GET /api/users/email-preferences -> { onThisDay }
export const getEmailPreferencesHandler = handler(D, 'Get email preferences', async (req, res) =>
  sendDataResponse(res, 200, await findEmailPreferences(req.user.id)),
);

// PUT /api/users/email-preferences { onThisDay } -> { onThisDay }
export const putEmailPreferencesHandler = handler(D, 'Save email preferences', async (req, res) => {
  const onThisDay = req.body?.onThisDay;
  if (typeof onThisDay !== 'boolean') return badRequest(req, res, D, EVENT_MESSAGES.invalidEmailPreferences);
  const saved = await saveEmailPreferences(req.user.id, { onThisDay });
  return sendDataResponse(res, 200, { onThisDay: saved.onThisDayEmails });
});
