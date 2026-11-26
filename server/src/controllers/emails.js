// Emails people can stop (docs/API.md "Emails"; 21 Nov 2026): "On this day" and "Welcome
// home" (23 Nov 2026), their daily run, the picture "On this day" shows, the unsubscribe link,
// and the account's own settings.
import crypto from 'node:crypto';
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import {
  EMAIL_LISTS,
  ON_THIS_DAY_BUDGET_MS,
  ON_THIS_DAY_MAX_EMAILS,
  memoryEmailsPerDay,
  photoLinkToken,
  tokenMatches,
  unsubscribeToken,
} from '../utils/onThisDay.js';
import { TRIP_SHARE_MAX_EMAILS } from '../utils/tripShare.js';
import { emailRunProblems } from '../utils/cronRuns.js';
import { recordCronRun } from '../services/system/cronRuns.js';
import { findEmailPreferences, findMemoryPhotoKey, saveEmailPreferences, turnOffOnThisDayInDB } from '../domain/onThisDay.js';
import { turnOffTripShareInDB } from '../domain/tripShare.js';
import { sendOnThisDayEmails } from '../services/memories/onThisDay.js';
import { sendTripShareEmails } from '../services/memories/tripShare.js';
import { signPhotoUrl } from '../services/s3/mediaService.js';
import { badRequest, handler } from './helpers/travel.js';

const D = DOMAINS.users;
const secret = () => process.env.BETTER_AUTH_SECRET;

const matchesCron = (header) => {
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const given = Buffer.from(String(header || ''));
  return Boolean(process.env.CRON_SECRET) && given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

// GET /api/emails/on-this-day/cron (Vercel's cron, with CRON_SECRET; one daily run for both,
// so it needs no second cron): first the "Welcome home" emails (a few a day, in their own short
// budget), reported as `tripShare` (null if they failed: "On this day" still goes), then "On this
// day" in what's left of its budget, its totals at the top as before. Both together send at most
// MEMORY_EMAILS_PER_DAY (`limit`; 60 unset), so Resend's daily limit keeps room for sign-up and
// password emails, and a run stops once Resend says the quota is used up (the audit, 26 Nov
// 2026). Each run is recorded, and a failure emails the admins (services/system/cronRuns.js).
export const onThisDayCronHandler = async (req, res) => {
  if (!matchesCron(req.headers.authorization)) return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  const startedAt = Date.now();
  const limit = memoryEmailsPerDay(process.env.MEMORY_EMAILS_PER_DAY);
  let tripShare = null;
  try {
    tripShare = await sendTripShareEmails({ maxEmails: Math.min(TRIP_SHARE_MAX_EMAILS, limit) });
  } catch (err) {
    console.error('[emails] welcome home failed:', err);
  }
  // What "Welcome home" sent comes off the day's limit; none once the quota's reached
  const left = tripShare?.quotaReached ? 0 : Math.max(0, limit - (tripShare?.sent ?? 0));
  let onThisDay = null;
  try {
    onThisDay = await sendOnThisDayEmails({
      budgetMs: Math.max(0, ON_THIS_DAY_BUDGET_MS - (Date.now() - startedAt)),
      maxEmails: Math.min(ON_THIS_DAY_MAX_EMAILS, left),
    });
  } catch (err) {
    console.error('[emails] on this day failed:', err);
  }
  const { problems, warnings } = emailRunProblems({ tripShare, onThisDay });
  await recordCronRun({
    job: 'emails',
    startedAt,
    problems,
    warnings,
    summary: {
      limit,
      welcomeHomeSent: tripShare?.sent ?? null,
      welcomeHomeAccounts: tripShare?.accounts ?? null,
      onThisDaySent: onThisDay?.sent ?? null,
      onThisDayAccounts: onThisDay?.accounts ?? null,
      quotaReached: Boolean(tripShare?.quotaReached || onThisDay?.quotaReached),
    },
  });
  if (!onThisDay) return res.status(500).json({ status: 'error', message: 'On this day failed.' });
  return res.json({ status: 'success', data: { ...onThisDay, tripShare, limit } });
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

// POST /api/emails/unsubscribe?u=&t=&l= (the email's one-click header; a mail client sends
// "List-Unsubscribe=One-Click", which isn't read) or with `{ u, t, l }` (the /unsubscribe
// page): that email off, "On this day" (no `l`, as the first emails' links have none) or
// "Welcome home" (`l=trips`). No sign-in: the signed link, made for that email, is the proof.
export const unsubscribeHandler = handler(D, 'Unsubscribe', async (req, res) => {
  const u = req.query?.u ?? req.body?.u;
  const t = req.query?.t ?? req.body?.t;
  const list = req.query?.l ?? req.body?.l ?? EMAIL_LISTS.onThisDay;
  const known = list === EMAIL_LISTS.onThisDay || list === EMAIL_LISTS.tripShare;
  if (!known || typeof u !== 'string' || !u || !tokenMatches(t, unsubscribeToken(u, secret(), list))) {
    return badRequest(req, res, D, EVENT_MESSAGES.unsubscribeInvalid);
  }
  if (list === EMAIL_LISTS.tripShare) {
    await turnOffTripShareInDB(u);
    return sendDataResponse(res, 200, { tripShare: false });
  }
  await turnOffOnThisDayInDB(u);
  return sendDataResponse(res, 200, { onThisDay: false });
});

// GET /api/users/email-preferences -> { onThisDay, tripShare }
export const getEmailPreferencesHandler = handler(D, 'Get email preferences', async (req, res) =>
  sendDataResponse(res, 200, await findEmailPreferences(req.user.id)),
);

// PUT /api/users/email-preferences { onThisDay?, tripShare? } (at least one, each true or
// false) -> { onThisDay, tripShare }
export const putEmailPreferencesHandler = handler(D, 'Save email preferences', async (req, res) => {
  const { onThisDay, tripShare } = req.body || {};
  const fine = (value) => value === undefined || typeof value === 'boolean';
  if (!fine(onThisDay) || !fine(tripShare) || (onThisDay === undefined && tripShare === undefined)) {
    return badRequest(req, res, D, EVENT_MESSAGES.invalidEmailPreferences);
  }
  const saved = await saveEmailPreferences(req.user.id, { onThisDay, tripShare });
  return sendDataResponse(res, 200, { onThisDay: saved.onThisDayEmails, tripShare: saved.tripShareEmails });
});
