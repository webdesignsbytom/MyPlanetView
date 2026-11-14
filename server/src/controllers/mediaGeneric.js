import crypto from 'node:crypto';
import {
  mintUploadUrl,
  signDownloadUrl,
  hardDeleteObject,
  confirmUpload,
  deleteOrphanUploads,
} from '../services/s3/mediaService.js';
import { deleteExpiredRateLimits } from '../middleware/dbRateLimit.js';

const matchesSecret = (header, secret) => {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(String(header || ''));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

// Vercel cron: delete unattached uploads (needs CRON_SECRET)
export const cleanupOrphanUploadsHandler = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || !matchesSecret(req.headers.authorization, secret)) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  }

  try {
    const result = await deleteOrphanUploads();
    // Same daily job: drop finished rate-limit windows
    const rateLimits = await deleteExpiredRateLimits().catch(() => ({ count: 0 }));
    return res.json({ status: 'success', data: { ...result, expiredRateLimits: rateLimits.count } });
  } catch (err) {
    console.error('[media] orphan cleanup failed:', err);
    return res.status(500).json({ status: 'error', message: 'Orphan cleanup failed.' });
  }
};

export const presignUploadHandler = async (req, res) => {
  try {
    const { resource, filename, contentType, cache } = req.body || {};

    if (!resource || !filename || !contentType) {
      return res
        .status(400)
        .json({
          error: 'resource, filename, contentType required',
          message: 'resource, filename, contentType required',
        });
    }

    const userId = req?.user?.id || null;

    const out = await mintUploadUrl({
      resource,
      userId,
      filename,
      contentType,
      cache,
    });

    return res.status(200).json({
      ...out,
      method: 'PUT',
      headers: { 'Content-Type': out.contentType },
    });
  } catch (e) {
    const message = String(e?.message || e);
    return res.status(e.status || 500).json({ error: message, message });
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
    const message = String(e?.message || e);
    return res.status(e.status || 500).json({ error: message, message });
  }
};

export const confirmUploadHandler = async (req, res) => {
  try {
    const { key } = req.body || {};

    if (!key) {
      return res.status(400).json({ error: 'key required', message: 'key required' });
    }

    const out = await confirmUpload({ key: String(key) });

    return res.status(200).json(out);
  } catch (e) {
    const message = String(e?.message || e);
    return res.status(e.status || 500).json({ error: message, message });
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
    const message = String(e?.message || e);
    return res.status(e.status || 500).json({ error: message, message });
  }
};
