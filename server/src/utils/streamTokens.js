// Cloudflare Stream, the parts that need no network (docs/API.md "Videos"): signed playback
// tokens made locally with the account's signing key (no API call per view), the playback
// and thumbnail URLs, checking a webhook's signature, a video's state, and the upload
// ticket that ties a finished upload to the map it was started for. Pure.
import crypto from 'node:crypto';

const base64url = (input) => Buffer.from(input).toString('base64url');

/**
 * A signed token for one video, valid until `expiresAt` (a Date): an RS256 JWT with the
 * signing key's id as `kid`, the video's id as `sub` (Cloudflare's "self-signed tokens").
 */
export function signStreamToken({ uid, keyId, pemBase64, expiresAt }) {
  const header = { alg: 'RS256', kid: keyId };
  const payload = { sub: uid, kid: keyId, exp: Math.floor(expiresAt.getTime() / 1000) };
  const body = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const pem = Buffer.from(pemBase64, 'base64').toString('utf8');
  const signature = crypto.createSign('RSA-SHA256').update(body).sign(pem);
  return `${body}.${signature.toString('base64url')}`;
}

/** Playback and thumbnail URLs for a signed token. */
export function streamUrls({ customerCode, token }) {
  const base = `https://customer-${customerCode}.cloudflarestream.com/${token}`;
  return {
    hls: `${base}/manifest/video.m3u8`,
    thumbnail: (height) => `${base}/thumbnails/thumbnail.jpg?time=1s&height=${height}`,
  };
}

/**
 * Stream's webhook header, `Webhook-Signature: time=<unix>,sig1=<hex>`, where sig1 is the
 * HMAC-SHA256 of `<time>.<raw body>` with the webhook secret. Notices older than 5 minutes
 * are refused (a replayed one). -> true or false
 */
export function verifyStreamWebhook({ header, body, secret, now = Date.now(), toleranceS = 300 }) {
  if (typeof header !== 'string' || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=')));
  const time = Number(parts.time);
  if (!Number.isFinite(time) || !/^[0-9a-f]{64}$/.test(parts.sig1 ?? '')) return false;
  if (Math.abs(now / 1000 - time) > toleranceS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${parts.time}.${body}`).digest();
  const given = Buffer.from(parts.sig1, 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** Our state for a Stream video: READY when it can be streamed, FAILED on an error, else PROCESSING. */
export function videoStateFrom(video) {
  if (video?.readyToStream || video?.status?.state === 'ready') return 'READY';
  if (video?.status?.state === 'error') return 'FAILED';
  return 'PROCESSING';
}

// ── Upload tickets ───────────────────────────────────────────────────────────
// Starting an upload answers a ticket naming the video, the map, the person and the
// photo id it will have; saving needs it back, so a finished upload can only be saved
// where it was started, by whoever started it, before it expires.

const ticketMac = (payload, secret) => crypto.createHmac('sha256', `video-ticket:${secret}`).update(payload).digest('base64url');

export function signUploadTicket(fields, { secret, expiresAt }) {
  const payload = base64url(JSON.stringify({ ...fields, exp: expiresAt.getTime() }));
  return `${payload}.${ticketMac(payload, secret)}`;
}

/** -> the ticket's fields, or null when it's forged, broken or expired. */
export function readUploadTicket(ticket, { secret, now = Date.now() }) {
  if (typeof ticket !== 'string' || !secret) return null;
  const [payload, mac] = ticket.split('.');
  if (!payload || !mac) return null;
  const expected = Buffer.from(ticketMac(payload, secret));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  let fields;
  try {
    fields = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!Number.isFinite(fields?.exp) || fields.exp < now) return null;
  return fields;
}
