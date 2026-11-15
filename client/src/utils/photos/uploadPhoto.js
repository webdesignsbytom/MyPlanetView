// One photo, end to end (docs/API.md "Uploading"): read EXIF, make the copies, presign,
// PUT the three files to the private bucket, then confirm so the server records it.
import { createPhoto, presignPhoto } from '@/api/travelApi';
import { readPhotoMeta } from './readPhotoMeta';
import { ORIGINAL_TYPES, isHeic, makePhotoCopies } from './makePhotoCopies';
import { putFile } from './putFile';

const MB = 1024 * 1024;
// The server's caps (server mediaConstants.js PHOTO_MAX_BYTES)
export const PHOTO_MAX_BYTES = { THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB };

/**
 * onStage('reading' | 'resizing' | 'uploading' | 'saving'), onProgress(0..1).
 * `countryCode` is the uploader's choice, always sent: the server uses it when the photo
 * has no location of its own, or a location in no country (taken at sea).
 * Resolves { photo, hadLocation }; rejects with a message people can read.
 */
export async function uploadPhoto({ mapId, tripId, file, countryCode, onStage, onProgress }) {
  if (isHeic(file)) {
    throw new Error('This is a HEIC photo, which can’t be added. Save it as a JPEG first, or add it from your iPhone, which sends a JPEG.');
  }
  const originalType = file.type.toLowerCase();
  if (!ORIGINAL_TYPES.includes(originalType)) {
    throw new Error('Only JPEG, PNG and WebP photos can be added.');
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
  // Each upload URL is signed for this type and this exact size; the PUT sends both as declared
  for (const f of files) f.bytes = f.blob.size;
  const { photoId, uploads } = await presignPhoto(mapId, {
    tripId: tripId || undefined,
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
  const hadLocation = meta.latitude != null && meta.longitude != null;
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
