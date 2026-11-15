// Rules for the generic uploads (avatars and contact images, /api/media-services).
// Pure, so they're unit-tested (tests/uploadRules.test.js).

// The only types the generic uploads take, each with the extension its key gets.
// The extension never comes from the uploaded file's name. No SVG (an XML document
// that can carry <script>) and nothing a browser would render as a page.
export const UPLOAD_IMAGE_EXTENSIONS = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
});
export const UPLOAD_IMAGE_TYPES = Object.freeze(Object.keys(UPLOAD_IMAGE_EXTENSIONS));

// A contact form may attach an image uploaded at most this long ago
export const CONTACT_IMAGE_MAX_AGE_MS = 60 * 60 * 1000;

/** The key extension for an upload type, or null when the type isn't one we take. */
export const extensionForType = (contentType) =>
  typeof contentType === 'string' && Object.hasOwn(UPLOAD_IMAGE_EXTENSIONS, contentType)
    ? UPLOAD_IMAGE_EXTENSIONS[contentType]
    : null;

const MB = 1024 * 1024;
const megabytes = (bytes) => `${Math.round((bytes / MB) * 10) / 10} MB`;

/**
 * A presign request: an exact allowed type, and the file's size as a whole number of
 * bytes within the resource's cap. -> { ok: true } or { ok: false, status, message }.
 */
export function checkDeclaredUpload({ contentType, bytes }, { allowedTypes, maxBytes }) {
  if (typeof contentType !== 'string' || !allowedTypes.includes(contentType) || !extensionForType(contentType)) {
    return { ok: false, status: 400, message: 'That file type can’t be uploaded here.' };
  }
  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    return { ok: false, status: 400, message: 'The file’s size in bytes is required.' };
  }
  if (bytes > maxBytes) {
    return { ok: false, status: 413, message: `That file is too large (the limit is ${megabytes(maxBytes)}).` };
  }
  return { ok: true };
}

/**
 * What the bucket holds after the PUT (`{ bytes, contentType }` from a HEAD, or null),
 * against the type it was presigned for and the resource's rules.
 * -> { ok: true }, or { ok: false, missing, message } (`missing`: nothing arrived).
 */
export function checkStoredUpload(stored, { contentType, allowedTypes, maxBytes }) {
  if (!stored) {
    return { ok: false, missing: true, message: 'The upload didn’t arrive. Please try again.' };
  }
  if (stored.contentType !== contentType || !allowedTypes.includes(stored.contentType)) {
    return { ok: false, missing: false, message: 'The uploaded file isn’t the type that was declared.' };
  }
  if (!Number.isSafeInteger(stored.bytes) || stored.bytes <= 0 || stored.bytes > maxBytes) {
    return { ok: false, missing: false, message: 'The uploaded file is empty or too large.' };
  }
  return { ok: true };
}

/**
 * Whether a contact form may attach this upload: a confirmed `contact` image of an
 * allowed type, uploaded within the last hour, and not on another form already.
 * `item` is the MediaItem row (or null).
 */
export function canAttachContactImage({
  item,
  alreadyUsed,
  allowedTypes = UPLOAD_IMAGE_TYPES,
  now = new Date(),
  maxAgeMs = CONTACT_IMAGE_MAX_AGE_MS,
}) {
  if (!item || item.resource !== 'contact' || item.bytes == null) return false;
  if (!allowedTypes.includes(item.contentType)) return false;
  if (alreadyUsed) return false;
  const age = now.getTime() - new Date(item.createdAt).getTime();
  return Number.isFinite(age) && age <= maxAgeMs;
}
