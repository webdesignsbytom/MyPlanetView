// A feedback report's screenshot (docs/API.md "Feedback"): the chosen picture drawn again at most
// SCREENSHOT_EDGE wide or tall, as WebP (JPEG where the browser can't write WebP), which also
// leaves its camera and location details behind; then presigned and sent straight to the private
// bucket. -> its key, for the report
import { presignFeedbackScreenshot } from '@/api/feedbackApi';
import { decode, encode } from '@/utils/photos/makePhotoCopies';
import { putFile } from '@/utils/photos/putFile';
import { SCREENSHOT_MAX_BYTES } from './feedbackForm';

// Wide enough to read a screen's words; a 4K screenshot is drawn at this size
export const SCREENSHOT_EDGE = 2560;
const SCREENSHOT_QUALITY = 0.85;

/** Is this file a picture we can take? (A .heic is turned away with words, as photos are.) */
export const isPictureFile = (file) =>
  Boolean(file) && (file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name ?? '')) && !/\.(heic|heif)$/i.test(file.name ?? '');

export async function uploadScreenshot(file, onProgress) {
  if (/\.(heic|heif)$/i.test(file?.name ?? '')) throw new Error('That picture is an iPhone HEIC file. Please save it as a JPEG first, or take a screenshot instead.');
  if (!isPictureFile(file)) throw new Error('Please choose a picture: a screenshot or a photo.');
  const bitmap = await decode(file);
  let picture;
  try {
    picture = await encode(bitmap, SCREENSHOT_EDGE, SCREENSHOT_QUALITY);
  } finally {
    bitmap.close?.();
  }
  if (picture.blob.size > SCREENSHOT_MAX_BYTES) throw new Error('That picture is too big to send. Please choose a smaller one.');

  const bytes = picture.blob.size;
  const { key, upload } = await presignFeedbackScreenshot({ contentType: picture.contentType, bytes });
  await putFile(upload.url, picture.blob, picture.contentType, (sent) => onProgress?.(sent / bytes), bytes);
  return key;
}
