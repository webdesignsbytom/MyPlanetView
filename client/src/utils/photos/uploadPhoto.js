// One photo, end to end (docs/API.md "Uploading"): read EXIF, make the copies, presign,
// PUT the three files to the private bucket, then confirm so the server records it.
// Which third file follows the map owner's plan (`uploadRules`, from the map or trip):
// the untouched ORIGINAL on Business and First Class, a PRINT copy on Economy, where the
// original never leaves the device.
import { createPhoto, presignPhoto } from '@/api/travelApi';
import { readPhotoMeta } from './readPhotoMeta';
import { ORIGINAL_TYPES, PRINT_MAX_BYTES, isHeic, makePhotoCopies } from './makePhotoCopies';
import { putFile } from './putFile';

const MB = 1024 * 1024;
// The server's caps (server mediaConstants.js PHOTO_MAX_BYTES)
export const PHOTO_MAX_BYTES = { THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB, PRINT: PRINT_MAX_BYTES };

// The server's LOCKED_MAP_MESSAGE, for a map that's locked before anything starts
const LOCKED_MAP = "This map isn't paid for, so it can't take new photos.";

/**
 * onStage('reading' | 'resizing' | 'uploading' | 'saving'), onProgress(0..1).
 * `countryCode` is the uploader's choice, always sent: the server uses it when the photo
 * has no location of its own, or a location in no country (taken at sea). For a photo
 * with no location it's also the presign's hint, so a country that's full is refused
 * before anything uploads (409). `uploadRules` is `{ keepsOriginals, locked }`; without
 * it, the original is kept.
 * Resolves { photo, hadLocation }; rejects with a message people can read.
 */
export async function uploadPhoto({ mapId, tripId, file, countryCode, uploadRules = null, onStage, onProgress }) {
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
    // Where a photo with no location will go; one with a location is placed by it at confirm
    countryCode: !hadLocation && countryCode ? countryCode : undefined,
    files: files.map((f) => ({ size: f.size, contentType: f.contentType, bytes: f.bytes })),
  });

  const total = files.reduce((sum, f) => sum + f.bytes, 0);
  const sent = {};
  const report = () => onProgress?.(Object.values(sent).reduce((a, b) => a + b, 0) / total);
  const keys = {};
  for (const f of files) {
    const target = uploads.find((u) => u.size === f.size);
    if (!target) throw new Error('The server didn’t give an upload address for this photo.');
    keys[f.size] = target.key;
    const onFileProgress = (loaded) => {
      sent[f.size] = loaded;
      report();
    };
    await putFile(target.url, f.blob, f.contentType, onFileProgress, f.bytes);
    sent[f.size] = f.bytes;
    report();
  }

  onStage?.('saving');
  const { photo } = await createPhoto(mapId, {
    photoId,
    tripId: tripId || undefined,
    takenAt: meta.takenAt || undefined,
    latitude: hadLocation ? meta.latitude : undefined,
    longitude: hadLocation ? meta.longitude : undefined,
    countryCode: countryCode || undefined,
    width: copies.width,
    height: copies.height,
    variants: files.map((f) => ({ size: f.size, key: keys[f.size], width: f.width, height: f.height })),
  });

  return { photo, hadLocation };
}
