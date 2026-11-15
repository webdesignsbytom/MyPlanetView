// S3 key prefix per project (buckets can be shared)
export const BucketNamespace = 'myplanetview';

// Max upload size per MediaKind (bytes)
const MB = 1024 * 1024;
export const MAX_UPLOAD_BYTES = {
  IMAGE: 5 * MB,
  VIDEO: 20 * MB,
  FILE: 10 * MB,
};

// Photos: each size of a photo is its own file in the private bucket
export const PHOTO_MAX_BYTES = {
  THUMB: 1 * MB,
  DISPLAY: 5 * MB,
  ORIGINAL: 50 * MB,
};

// Every size is a plain web image. No HEIC: iPhones send a JPEG when a photo is
// picked in a browser, and the client refuses HEIC files (docs/SITE-DESIGN.md)
const WEB_IMAGE_TYPES = ['image/jpeg', 'image/webp', 'image/png'];
export const PHOTO_CONTENT_TYPES = {
  THUMB: WEB_IMAGE_TYPES,
  DISPLAY: WEB_IMAGE_TYPES,
  ORIGINAL: WEB_IMAGE_TYPES,
};

export const PHOTO_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
};

// Signed photo URLs: signed at the start of the hour, valid for two, so a file
// keeps the same URL for at least an hour and the browser cache works
export const PHOTO_URL_TTL_SECONDS = 2 * 60 * 60;

// Presigned upload URLs
export const PHOTO_UPLOAD_URL_TTL_SECONDS = 10 * 60;

// A photo must be saved (POST /maps/:mapId/photos) within this time of its presign.
// It's below ORPHAN_PHOTO_AGE_MINUTES, so the clean-up never deletes the files of a
// photo that could still be saved.
export const PHOTO_SAVE_WINDOW_MINUTES = 50;

// The daily clean-up deletes unused uploads older than this: photo files nothing uses
// after an hour, every other upload after a day
export const ORPHAN_PHOTO_AGE_MINUTES = 60;
export const ORPHAN_AGE_HOURS = 24;

// Uploads a user may have started and not confirmed, counted over the last day: a
// presign above this answers 429. The uploader sends two photos (six files) at a time.
export const UNCONFIRMED_UPLOAD_WINDOW_HOURS = 24;
export const UNCONFIRMED_UPLOAD_LIMIT = Object.freeze({
  photo: 60, // files (three per photo at most)
  generic: 20, // avatars and contact images
});
