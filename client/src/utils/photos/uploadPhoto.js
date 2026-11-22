// One photo, end to end (docs/API.md "Uploading"): read EXIF, make the copies, presign,
// PUT the three files to the private bucket, then confirm so the server records it.
// Which third file follows the map owner's plan (`uploadRules`, from the map or trip):
// the untouched ORIGINAL on Business and First Class, a PRINT copy on Economy, where the
// original never leaves the device.
import { createPhoto, presignPhoto } from '@/api/travelApi';
import { readPhotoMeta } from './readPhotoMeta';
import { ORIGINAL_TYPES, PRINT_MAX_BYTES, isHeic, makePhotoCopies } from './makePhotoCopies';
import { putFiles } from './putFile';

const MB = 1024 * 1024;
// The server's caps (server mediaConstants.js PHOTO_MAX_BYTES)
export const PHOTO_MAX_BYTES = { THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB, PRINT: PRINT_MAX_BYTES };
// A video's file, its ORIGINAL (server mediaConstants.js VIDEO_CONTENT_TYPES and
// VIDEO_MAX_BYTES); its THUMB and DISPLAY are poster frames, within the photo caps above.
// The map gives the same in `uploadRules.videos` (First Class); these stand in without it.
export const VIDEO_CONTENT_TYPES = ['video/mp4', 'video/quicktime'];
export const VIDEO_MAX_BYTES = 500 * MB;

// The server's LOCKED_MAP_MESSAGE, for a map that's locked before anything starts
export const LOCKED_MAP = "This map isn't paid for, so it can't take new photos.";

/**
 * onStage('reading' | 'resizing' | 'uploading' | 'saving'), onProgress(0..1, { sent, total }).
 * `countryCode` is the uploader's choice, always sent: the server uses it when the photo
 * has no location of its own, or a location in no country (taken at sea). For a photo
 * with no location it's also the presign's hint, so a country that's full is refused
 * before anything uploads (409). `uploadRules` is `{ keepsOriginals, locked }`; without
 * it, the original is kept. An import (utils/import/) gives `importedFrom`, the photo's key
 * (one photo per key on a map), and `fallbackTakenAt`, the date when the file has none.
 * Resolves { photo, hadLocation }; rejects with a message people can read.
 */
export async function uploadPhoto({ mapId, tripId, file, countryCode, uploadRules = null, importedFrom, fallbackTakenAt, onStage, onProgress }) {
  if (uploadRules?.locked) throw new Error(LOCKED_MAP);
  if (isHeic(file)) {
    throw new Error('This is a HEIC photo, which can’t be added. Save it as a JPEG first, or add it from your iPhone, which sends a JPEG.');
  }
  const originalType = file.type.toLowerCase();
  if (!ORIGINAL_TYPES.includes(originalType)) {
    throw new Error('Only JPEG, PNG and WebP photos can be added.');
  }
  if (file.size > PHOTO_MAX_BYTES.ORIGINAL) throw new Error('This photo is over 50 MB.');
  const keepsOriginal = uploadRules?.keepsOriginals !== false;

  onStage?.('reading');
  const meta = await readPhotoMeta(file);
  const hadLocation = meta.latitude != null && meta.longitude != null;

  onStage?.('resizing');
  const copies = await makePhotoCopies(file, { print: !keepsOriginal });

  const files = [
    { size: 'THUMB', ...copies.thumb },
    { size: 'DISPLAY', ...copies.display },
    keepsOriginal
      ? { size: 'ORIGINAL', blob: file, contentType: originalType, width: copies.width, height: copies.height }
      : { size: 'PRINT', ...copies.print },
  ];
  for (const f of files) {
    if (f.blob.size > PHOTO_MAX_BYTES[f.size]) throw new Error('This photo is too large to add.');
  }

  onStage?.('uploading');
  // Each upload URL is signed for this type and this exact size; the PUT sends both as declared
  for (const f of files) f.bytes = f.blob.size;
  const { photoId, uploads } = await presignPhoto(mapId, {
    tripId: tripId || undefined,
    importedFrom,
    // Where a photo with no location will go; one with a location is placed by it at confirm
    countryCode: !hadLocation && countryCode ? countryCode : undefined,
    files: files.map((f) => ({ size: f.size, contentType: f.contentType, bytes: f.bytes })),
  });

  const keys = await putFiles(files, uploads, onProgress);

  onStage?.('saving');
  const { photo } = await createPhoto(mapId, {
    photoId,
    tripId: tripId || undefined,
    takenAt: meta.takenAt || fallbackTakenAt || undefined,
    importedFrom,
    latitude: hadLocation ? meta.latitude : undefined,
    longitude: hadLocation ? meta.longitude : undefined,
    countryCode: countryCode || undefined,
    width: copies.width,
    height: copies.height,
    variants: files.map((f) => ({ size: f.size, key: keys[f.size], width: f.width, height: f.height })),
  });

  return { photo, hadLocation };
}
