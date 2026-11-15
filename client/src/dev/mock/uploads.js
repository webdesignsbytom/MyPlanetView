// Mock mode only. Presigned uploads as the bucket treats them: each URL is "signed" for
// one Content-Type and one byte size (docs/API.md), and a PUT that differs gets a 403,
// so mock mode catches a client that sends something other than what it declared.
import { MOCK_UPLOAD_ORIGIN, storeUpload } from './mockAdapter';

const MB = 1024 * 1024;
// Server utils/media/uploadRules.js and MEDIA_CFG
export const UPLOAD_IMAGE_EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
export const GENERIC_MAX_BYTES = 5 * MB;
export const CONTACT_IMAGE_MAX_AGE_MS = 60 * 60 * 1000;

// storage key -> { resource, contentType, bytes, ownerId, createdAt, confirmed }
const uploads = new Map();

const keyOf = (url) => decodeURIComponent(new URL(url).pathname.slice(1));

/** A whole, positive byte size within `max`: null when fine, else [status, message]. */
export function declaredSizeProblem(bytes, max) {
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return [400, 'The file’s size in bytes is required.'];
  if (bytes > max) return [413, 'That file is too large.'];
  return null;
}

/** Record what the URL is signed for and return the URL. */
export function presignMockUpload(key, { resource, contentType, bytes, ownerId = null }) {
  uploads.set(key, { resource, contentType, bytes, ownerId, createdAt: Date.now(), confirmed: false });
  return `${MOCK_UPLOAD_ORIGIN}/${encodeURIComponent(key)}?X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost`;
}

/** The mock bucket's answer to a PUT: 200 (file kept), or 403 when it isn't what was signed. */
export function receiveMockUpload(url, body, contentType) {
  const signed = uploads.get(keyOf(url));
  if (!signed || !(body instanceof Blob) || body.size !== signed.bytes || contentType !== signed.contentType) {
    console.warn('[mock upload] 403: the PUT differs from what the URL was signed for', {
      signed,
      sent: { contentType, bytes: body?.size },
    });
    return 403;
  }
  storeUpload(url, body);
  return 200;
}

/** What was presigned for a key (or undefined). */
export const mockUpload = (key) => uploads.get(key);

/** Confirm: the file arrived (the 403 above already enforced type and size). */
export function confirmMockUpload(key, received) {
  const upload = uploads.get(key);
  if (!upload || !received) return null;
  upload.confirmed = true;
  return upload;
}
