// Cloudflare Stream's API (docs/API.md "Videos"): starting a direct upload, reading,
// changing, listing and deleting videos, and the seed's upload of a file. The integration
// tests replace this module with an in-memory Stream (tests/integration/setup.js).
import { streamConfig } from './streamConfig.js';

const API = 'https://api.cloudflare.com/client/v4';

class StreamApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'StreamApiError';
    this.status = status;
  }
}

async function call(path, { method = 'GET', headers = {}, body } = {}) {
  const { accountId, apiToken } = streamConfig();
  const res = await fetch(`${API}/accounts/${accountId}/stream${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiToken}`, ...headers },
    body,
  });
  return res;
}

async function json(path, options) {
  const res = await call(path, options);
  if (res.status === 404) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.success === false) {
    throw new StreamApiError(`Stream ${options?.method ?? 'GET'} ${path} failed (${res.status})`, res.status);
  }
  return data?.result ?? null;
}

// Upload-Metadata values are base64; a key alone is a flag
const tusMetadata = (entries) =>
  Object.entries(entries)
    .map(([key, value]) => (value === true ? key : `${key} ${Buffer.from(String(value)).toString('base64')}`))
    .join(',');

/**
 * A resumable (tus) direct upload the browser sends the file to, with no credentials:
 * Stream refuses it past `maxDurationSeconds`, and the video needs signed URLs to play.
 * -> `{ uid, uploadUrl }`
 */
export async function createDirectUpload({ bytes, maxDurationSeconds, name, expiresAt }) {
  const res = await call('?direct_user=true', {
    method: 'POST',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(bytes),
      'Upload-Metadata': tusMetadata({
        name,
        maxdurationseconds: maxDurationSeconds,
        requiresignedurls: true,
        expiry: expiresAt.toISOString(),
      }),
    },
  });
  const uploadUrl = res.headers.get('location');
  const uid = res.headers.get('stream-media-id');
  if (!res.ok || !uploadUrl || !uid) throw new StreamApiError(`Stream direct upload failed (${res.status})`, res.status);
  const host = uploadHostOf(uploadUrl);
  if (!host || !UPLOAD_HOSTS.some((allowed) => allowed.test(host))) {
    throw new StreamApiError(`Stream gave an upload host the site's CSP doesn't allow: ${host ?? 'none'}`, 502);
  }
  return { uid, uploadUrl };
}

// Where the browser may send a video: the hosts in the CSP's connect-src (client/public/.htaccess,
// client/netlify.toml). Stream names the host in its Location header, and nobody has seen a
// real one yet (19 Nov 2026, the audit, B13): one outside these would be blocked in the browser
// with nothing to say why, so it's refused here instead, and the logged error names it. Add it
// to both CSP files and here.
const UPLOAD_HOSTS = [/^upload\.videodelivery\.net$/, /(^|\.)cloudflarestream\.com$/];
const uploadHostOf = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.hostname : null;
  } catch {
    return null;
  }
};

/** A video's details, or null when Stream has no such video. */
export const getVideo = (uid) => json(`/${encodeURIComponent(uid)}`);

/** Set a video's meta (and keep it needing signed URLs). */
export const updateVideo = (uid, { meta }) =>
  json(`/${encodeURIComponent(uid)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta, requireSignedURLs: true }),
  });

/** Delete a video; one already gone counts as deleted. -> true */
export async function deleteVideo(uid) {
  const res = await call(`/${encodeURIComponent(uid)}`, { method: 'DELETE' });
  if (res.ok || res.status === 404) return true;
  throw new StreamApiError(`Stream DELETE failed (${res.status})`, res.status);
}

/** Up to 1,000 videos created before `before` (a Date), newest first. */
export const listVideos = async ({ before }) =>
  (await json(`?asc=false&before=${encodeURIComponent(before.toISOString())}`)) ?? [];

/** The seed's upload of a whole file (up to 200 MB) from the server. -> the video */
export async function uploadFile({ buffer, name, contentType = 'video/mp4' }) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: contentType }), name);
  return json('', { method: 'POST', body: form });
}

// Setup, run once by the user (createSigningKey.js, setWebhook.js)

/** A signing key for private playback links. -> `{ id, pem }` (pem is base64, as stored in the env) */
export const createSigningKey = () => json('/keys', { method: 'POST' });

/** Where Stream sends its notices. -> `{ notificationUrl, secret }` */
export const setWebhook = (notificationUrl) =>
  json('/webhook', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationUrl }),
  });
