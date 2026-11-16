// The copies made in the browser: a thumbnail (~400 px) and a display size (~1600 px)
// that people see, and, on an Economy map, a print copy (2,400 px JPEG) kept instead of
// the original (docs/FEATURE-PLAN.md, "Which copies each tier keeps"). Drawing the photo
// onto a canvas and re-encoding it leaves every bit of EXIF behind, location included.
// On Business and First Class maps the original is uploaded untouched instead.

export const THUMB_EDGE = 400;
export const DISPLAY_EDGE = 1600;
// Prints well up to about A4; the original's own size when it's smaller
export const PRINT_EDGE = 2400;
const PRINT_QUALITIES = [0.85, 0.75, 0.65];
const MB = 1024 * 1024;
// The server's PHOTO_MAX_BYTES.PRINT
export const PRINT_MAX_BYTES = 5 * MB;

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

function draw(bitmap, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

async function encode(bitmap, maxEdge, quality) {
  const { canvas, width, height } = draw(bitmap, maxEdge);
  // WebP where the browser can write it; JPEG otherwise (Safari hands back PNG for WebP)
  let blob = await toBlob(canvas, 'image/webp', quality);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality);
  if (!blob) throw new Error('This photo couldn’t be resized.');
  return { blob, width, height, contentType: blob.type };
}

// The print copy: JPEG only (many print shops don't take WebP), a little lower in
// quality if a very detailed photo would go over the server's cap
async function encodePrint(bitmap) {
  const { canvas, width, height } = draw(bitmap, PRINT_EDGE);
  for (const quality of PRINT_QUALITIES) {
    const blob = await toBlob(canvas, 'image/jpeg', quality);
    if (!blob || blob.type !== 'image/jpeg') break;
    if (blob.size <= PRINT_MAX_BYTES) return { blob, width, height, contentType: 'image/jpeg' };
  }
  throw new Error('This photo couldn’t be made into a print copy.');
}

/**
 * → { width, height (of the original), thumb, display, print? } where each copy is
 * { blob, width, height, contentType }. `print`: also make the print copy (Economy).
 */
export async function makePhotoCopies(file, { print = false } = {}) {
  const bitmap = await decode(file);
  try {
    const display = await encode(bitmap, DISPLAY_EDGE, 0.82);
    const thumb = await encode(bitmap, THUMB_EDGE, 0.75);
    const printCopy = print ? await encodePrint(bitmap) : null;
    return { width: bitmap.width, height: bitmap.height, display, thumb, ...(printCopy ? { print: printCopy } : {}) };
  } finally {
    bitmap.close?.();
  }
}
