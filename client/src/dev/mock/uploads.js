// Mock mode only. Presigned uploads as the bucket treats them: each URL is "signed" for
// one Content-Type and one byte size (docs/API.md), and a PUT that differs gets a 403,
// so mock mode catches a client that sends something other than what it declared.
// Videos go to the mock Stream instead (stream.js), which refuses a file that still holds
// a location with videoStillHasLocation below, so the e2e tests prove the browser cleaned it.
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

/**
 * The mock bucket's answer to a PUT (a promise): 200 (file kept), or 403 when it isn't
 * what was signed.
 */
export async function receiveMockUpload(url, body, contentType) {
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

// The server's markers (utils/mp4Info.js LOCATION_MARKERS): "©xyz", and QuickTime's key
const LOCATION_MARKERS = [[0xa9, 0x78, 0x79, 0x7a], [...'com.apple.quicktime.location.ISO6709'].map((c) => c.charCodeAt(0))];
const includesBytes = (bytes, marker) => {
  for (let at = bytes.indexOf(marker[0]); at !== -1; at = bytes.indexOf(marker[0], at + 1)) {
    if (marker.every((b, i) => bytes[at + i] === b)) return true;
  }
  return false;
};

/**
 * Does a video's movie box (moov) still hold a location? Walks the top-level boxes with
 * small reads (its own few lines, apart from the client's cleaner), then checks the movie
 * box as the server's mp4Info.js does. No movie box, or a broken box: treated as holding one.
 */
export async function videoStillHasLocation(blob) {
  let at = 0;
  while (at + 8 <= blob.size) {
    const head = new DataView(await blob.slice(at, at + 16).arrayBuffer());
    let size = head.getUint32(0);
    if (size === 1) size = Number(head.getBigUint64(8));
    else if (size === 0) size = blob.size - at;
    if (size < 8 || at + size > blob.size) return true;
    const type = String.fromCharCode(head.getUint8(4), head.getUint8(5), head.getUint8(6), head.getUint8(7));
    if (type === 'moov') {
      const movie = new Uint8Array(await blob.slice(at, at + size).arrayBuffer());
      return LOCATION_MARKERS.some((marker) => includesBytes(movie, marker));
    }
    at += size;
  }
  return true;
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
