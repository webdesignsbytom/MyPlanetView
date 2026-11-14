// One photo, end to end (docs/API.md "Uploading"): read EXIF, make the copies, presign,
// PUT the three files to the private bucket, then confirm so the server records it.
import { createPhoto, presignPhoto } from '@/api/travelApi';
import { readPhotoMeta } from './readPhotoMeta';
import { ORIGINAL_TYPES, makePhotoCopies, originalContentType } from './makePhotoCopies';
import { putFile } from './putFile';

const MB = 1024 * 1024;
// The server's caps (server mediaConstants.js PHOTO_MAX_BYTES)
export const PHOTO_MAX_BYTES = { THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB };

/**
 * onStage('reading' | 'resizing' | 'uploading' | 'saving'), onProgress(0..1).
 * `countryCode` is used only when the photo has no location of its own.
 * Resolves { photo, hadLocation }; rejects with a message people can read.
 */
export async function uploadPhoto({ mapId, tripId, file, countryCode, onStage, onProgress }) {
  const originalType = originalContentType(file);
  if (!ORIGINAL_TYPES.includes(originalType)) {
    throw new Error('Only JPEG, PNG, WebP and HEIC photos can be added.');
  }
  if (file.size > PHOTO_MAX_BYTES.ORIGINAL) throw new Error('This photo is over 50 MB.');

  onStage?.('reading');
  const meta = await readPhotoMeta(file);

  onStage?.('resizing');
  const copies = await makePhotoCopies(file);

  const files = [
    { size: 'THUMB', ...copies.thumb },
    { size: 'DISPLAY', ...copies.display },
    { size: 'ORIGINAL', blob: file, contentType: originalType, width: copies.width, height: copies.height },
  ];
  for (const f of files) {
    if (f.blob.size > PHOTO_MAX_BYTES[f.size]) throw new Error('This photo is too large to add.');
  }

  onStage?.('uploading');
  const { photoId, uploads } = await presignPhoto(mapId, {
    tripId: tripId || undefined,
    files: files.map((f) => ({ size: f.size, contentType: f.contentType, bytes: f.blob.size })),
  });

  const total = files.reduce((sum, f) => sum + f.blob.size, 0);
  const sent = {};
  const report = () => onProgress?.(Object.values(sent).reduce((a, b) => a + b, 0) / total);
  const keys = {};
  for (const f of files) {
    const target = uploads.find((u) => u.size === f.size);
    if (!target) throw new Error('The server didn’t give an upload address for this photo.');
    keys[f.size] = target.key;
    await putFile(target.url, f.blob, f.contentType, (loaded) => {
      sent[f.size] = loaded;
      report();
    });
    sent[f.size] = f.blob.size;
    report();
  }

  onStage?.('saving');
  const hadLocation = meta.latitude != null && meta.longitude != null;
  const { photo } = await createPhoto(mapId, {
    photoId,
    tripId: tripId || undefined,
    takenAt: meta.takenAt || undefined,
    latitude: hadLocation ? meta.latitude : undefined,
    longitude: hadLocation ? meta.longitude : undefined,
    countryCode: !hadLocation && countryCode ? countryCode : undefined,
    width: copies.width,
    height: copies.height,
    variants: files.map((f) => ({ size: f.size, key: keys[f.size], width: f.width, height: f.height })),
  });

  return { photo, hadLocation };
}
