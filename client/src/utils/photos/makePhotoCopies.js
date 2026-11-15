// The two copies people see, made in the browser: a thumbnail (~400 px) and a display
// size (~1600 px). Drawing the photo onto a canvas and re-encoding it leaves every bit
// of EXIF behind, location included. The original is uploaded untouched.

export const THUMB_EDGE = 400;
export const DISPLAY_EDGE = 1600;

// What the server accepts as an original (server mediaConstants.js PHOTO_CONTENT_TYPES).
// No HEIC: iPhones turn their HEIC photos into JPEGs when one is picked in a browser, and
// converting HEIC elsewhere needed a 1.3 MB library whose worker the CSP blocks.
export const ORIGINAL_TYPES = ['image/jpeg', 'image/webp', 'image/png'];

/** An iPhone's own format, by type or by name (Windows often gives HEIC files no type). */
export const isHeic = (file) => /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This browser can’t read that file as a photo.');
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
