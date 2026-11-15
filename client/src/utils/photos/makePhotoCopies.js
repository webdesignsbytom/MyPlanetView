// The two copies people see, made in the browser: a thumbnail (~400 px) and a display
// size (~1600 px). Drawing the photo onto a canvas and re-encoding it leaves every bit
// of EXIF behind, location included. The original is uploaded untouched.

export const THUMB_EDGE = 400;
export const DISPLAY_EDGE = 1600;

// What the server accepts as an original (server mediaConstants.js PHOTO_CONTENT_TYPES)
export const ORIGINAL_TYPES = ['image/jpeg', 'image/webp', 'image/png', 'image/heic', 'image/heif'];

const isHeic = (file) => /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

/** The original's content type (Windows often gives HEIC files no type at all). */
export function originalContentType(file) {
  if (file.type) return file.type.toLowerCase();
  if (/\.heic$/i.test(file.name)) return 'image/heic';
  if (/\.heif$/i.test(file.name)) return 'image/heif';
  return '';
}

// heic2any converts in a worker that can hang for good (under a CSP without
// 'unsafe-eval' it never answers), so each conversion gets a deadline: half a minute,
// plus 2 s per MB for big files. Once one has run out, the others in this page view fail
// at once rather than each waiting, and the rest of the upload batch carries on.
const HEIC_BASE_MS = 30000;
const HEIC_MS_PER_MB = 2000;
const HEIC_STUCK_MESSAGE =
  'This HEIC photo couldn’t be converted in this browser. Try again in Safari, or save it as a JPEG first.';
let heicStuck = false;

const heicDeadline = (file) => HEIC_BASE_MS + (file.size / (1024 * 1024)) * HEIC_MS_PER_MB;

async function convertHeic(file) {
  if (heicStuck) throw new Error(HEIC_STUCK_MESSAGE);
  let heic2any;
  try {
    ({ default: heic2any } = await import('heic2any'));
  } catch {
    throw new Error('The HEIC converter couldn’t be downloaded. Check your connection and try again.');
  }
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      heicStuck = true;
      reject(new Error(HEIC_STUCK_MESSAGE));
    }, heicDeadline(file));
  });
  try {
    const converted = await Promise.race([heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }), deadline]);
    return Array.isArray(converted) ? converted[0] : converted;
  } catch (err) {
    // heic2any rejects with a plain object ({ code, message }) for a file it can't read
    throw err instanceof Error ? err : new Error('This HEIC file couldn’t be read. It may be damaged.');
  } finally {
    clearTimeout(timer);
  }
}

// Decode to pixels. Only Safari reads HEIC itself; elsewhere heic2any converts it
// (a large library, so it's fetched only for those files).
async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    if (!isHeic(file)) throw new Error('This browser can’t read that file as a photo.');
    const blob = await convertHeic(file);
    return createImageBitmap(blob, { imageOrientation: 'from-image' });
  }
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function encode(bitmap, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);

  // WebP where the browser can write it; JPEG otherwise (Safari hands back PNG for WebP)
  let blob = await toBlob(canvas, 'image/webp', quality);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality);
  if (!blob) throw new Error('This photo couldn’t be resized.');
  return { blob, width, height, contentType: blob.type };
}

/** → { width, height (of the original), thumb, display } where each copy is { blob, width, height, contentType } */
export async function makePhotoCopies(file) {
  const bitmap = await decode(file);
  try {
    const display = await encode(bitmap, DISPLAY_EDGE, 0.82);
    const thumb = await encode(bitmap, THUMB_EDGE, 0.75);
    return { width: bitmap.width, height: bitmap.height, display, thumb };
  } finally {
    bitmap.close?.();
  }
}
