import { deleteUnpaidGiftsInDB } from '../domain/gifts.js';
import { GIFT_UNPAID_DAYS } from '../utils/gifts.js';
import crypto from 'node:crypto';
import { deleteOrphanStreamVideos } from '../services/stream/videos.js';
import { continueApprovedCopies } from '../services/travel/travelCopies.js';
import {
  mintUploadUrl,
  signDownloadUrl,
  hardDeleteObject,
  confirmUpload,
  deleteOrphanUploads,
} from '../services/s3/mediaService.js';
import { deleteExpiredRateLimits } from '../middleware/dbRateLimit.js';
import { deleteOldEvents } from '../domain/events.js';
import { deleteOldInvites } from '../domain/sharing.js';
import { deleteExpiredSessions, deleteExpiredVerifications } from '../domain/users.js';
import { deleteOldStripeEvents } from '../domain/billing.js';
import { sanitizeText } from '../utils/sanitize.js';
import { logEvent } from '../utils/events/logEvent.js';
import { ServerErrorEvent, createGenericErrorEvent } from '../event/errorUtils.js';
import { DOMAINS, RESPONSE_MESSAGES } from '../utils/responses/responses.js';

// A 4xx from the media service is meant for the client (fixed messages, no internals).
// Anything else is logged, and the client only gets the generic 500 message.
const sendFailure = (req, res, err, what) => {
  const status = Number(err?.status);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message, message: err.message });
  }
  console.error(`[media] ${what} failed:`, err);
  logEvent(createGenericErrorEvent(
    new ServerErrorEvent(req.user, DOMAINS.system, `[media] ${what} failed: ${String(err?.message || err)}`)
  ));
  const message = RESPONSE_MESSAGES.ServerErrorEvent;
  return res.status(500).json({ error: message, message });
};

const matchesSecret = (header, secret) => {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(String(header || ''));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

// Vercel stops the function after 60 s (vercel.json, maxDuration). The orphan clean-up
// starts no new batch after this long from the start of the request, which leaves
// time for the batch in hand and the reply. What's left waits for the next day.
export const CRON_BUDGET_MS = 40_000;

// One purge; a failure is logged and counts as null, and never stops the others
const purge = (name, run) =>
  Promise.resolve()
    .then(run)
    .then((result) => result?.count ?? 0)
    .catch((err) => {
      console.error(`[cron] ${name} purge failed:`, err);
      return null;
    });

// Vercel cron, daily (needs CRON_SECRET): retention purges, then unused uploads
export const cleanupOrphanUploadsHandler = async (req, res) => {
  const startedAt = Date.now();
  const secret = process.env.CRON_SECRET;
  if (!secret || !matchesSecret(req.headers.authorization, secret)) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  }

  // The cheap purges run first, together and each on its own, so a slow orphan
  // clean-up can't skip them: finished rate-limit windows, events older than 90 days
  // (docs/AUDIT.md B3), expired sessions and verifications, invites accepted or
  // expired over 30 days ago, Stripe webhook event ids over 90 days old (Stripe
  // retries for 3 days at most), and Cloudflare Stream videos no row points at (an upload
  // never saved, a video deleted with its map or account; services/stream/videos.js). Also
  // approved travel copies nobody's browser finished (docs/API.md "Travel copies"), and gifts
  // whose Checkout was never finished (docs/API.md "Gifts")
  const [expiredRateLimits, oldEvents, expiredSessions, expiredVerifications, oldInvites, oldStripeEvents, orphanStreamVideos, travelCopiesFinished, unpaidGifts] =
    await Promise.all([
      purge('rate-limit', deleteExpiredRateLimits),
      purge('event', () => deleteOldEvents()),
      purge('session', deleteExpiredSessions),
      purge('verification', deleteExpiredVerifications),
      purge('invite', () => deleteOldInvites()),
      purge('stripe-event', () => deleteOldStripeEvents()),
      purge('stream-video', () => deleteOrphanStreamVideos({ budgetMs: 15000 })),
      purge('travel-copy', () => continueApprovedCopies({ budgetMs: 15000 })),
      purge('gift', () => deleteUnpaidGiftsInDB(new Date(Date.now() - GIFT_UNPAID_DAYS * 24 * 60 * 60 * 1000))),
    ]);
  const purged = {
    expiredRateLimits,
    oldEvents,
    expiredSessions,
    expiredVerifications,
    oldInvites,
    oldStripeEvents,
    orphanStreamVideos,
    travelCopiesFinished,
    unpaidGifts,
  };

  try {
    const result = await deleteOrphanUploads({ deadline: startedAt + CRON_BUDGET_MS });
    return res.json({ status: 'success', data: { ...result, ...purged } });
  } catch (err) {
    console.error('[media] orphan cleanup failed:', err);
    return res.status(500).json({ status: 'error', message: 'Orphan cleanup failed.', data: purged });
  }
};

// Body: { resource, contentType, bytes, filename?, cache? }. The URL is signed for that
// exact Content-Type and byte size (docs/API.md, "Generic uploads").
export const presignUploadHandler = async (req, res) => {
  try {
    const { resource, filename, contentType, bytes, cache } = req.body || {};

    if (typeof resource !== 'string' || typeof contentType !== 'string' || bytes === undefined) {
      const message = 'resource, contentType and bytes are required';
      return res.status(400).json({ error: message, message });
    }

    const userId = req?.user?.id || null;

    const out = await mintUploadUrl({
      resource,
      userId,
      filename: sanitizeText(filename, { maxLength: 200 }),
      contentType,
      bytes,
      cache,
    });

    return res.status(200).json({
      ...out,
      method: 'PUT',
      headers: { 'Content-Type': out.contentType },
    });
  } catch (e) {
    return sendFailure(req, res, e, 'presign');
  }
};

export const signViewHandler = async (req, res) => {
  try {
    const { key, ttl } = req.query || {};

    if (!key) {
      return res.status(400).json({ error: 'key required', message: 'key required' });
    }

    const out = await signDownloadUrl({
      key: String(key),
      ttl: Number(ttl) || 300,
      user: req.user,
    });

    return res.status(200).json(out);
  } catch (e) {
    return sendFailure(req, res, e, 'sign view');
  }
};

// HEADs the object: its real type and size must match the presign and the resource's
// rules, or the file is deleted and the answer is 400
export const confirmUploadHandler = async (req, res) => {
  try {
    const { key } = req.body || {};

    if (!key) {
      return res.status(400).json({ error: 'key required', message: 'key required' });
    }

    const out = await confirmUpload({ key: String(key), user: req.user });

    return res.status(200).json(out);
  } catch (e) {
    return sendFailure(req, res, e, 'confirm upload');
  }
};

export const deleteMediaHandler = async (req, res) => {
  try {
    const { key } = req.query || {};

    if (!key) {
      return res.status(400).json({ error: 'key required', message: 'key required' });
    }

    await hardDeleteObject({ key: String(key), user: req.user });

    return res.sendStatus(204);
  } catch (e) {
    return sendFailure(req, res, e, 'delete');
  }
};
