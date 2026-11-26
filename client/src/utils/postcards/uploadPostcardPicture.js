// A photo of the sender's own for a postcard's front (docs/API.md "Postcards"; a paid plan): a
// file from the device, or one of the map's photos (its display copy, fetched), drawn again at
// most POSTCARD_PICTURE_EDGE wide or tall, as WebP (JPEG where the browser can't write WebP),
// which leaves its location and camera details behind; then presigned and sent straight to the
// private bucket. Never on the map: it's the card's alone. -> its key, for the card
import { presignPostcardPicture } from '@/api/postcardsApi';
import { decode, encode } from '@/utils/photos/makePhotoCopies';
import { putFile } from '@/utils/photos/putFile';
import { POSTCARD_PICTURE_MAX_BYTES } from './postcardRules';

// Sharp on the card (1200 wide) and on a big screen, small to send
export const POSTCARD_PICTURE_EDGE = 2000;
const POSTCARD_PICTURE_QUALITY = 0.86;

/** Is this file a picture we can take? (A .heic is turned away with words, as photos are.) */
export const isPictureFile = (file) =>
  Boolean(file) && (file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name ?? '')) && !/\.(heic|heif)$/i.test(file.name ?? '');

/** One of the map's photos as a file to send: its display copy, fetched from where it's kept. */
export async function photoAsBlob(url) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error('That photo couldn’t be fetched. Please try again, or choose another.');
  return res.blob();
}

export async function uploadPostcardPicture(file, onProgress) {
  if (/\.(heic|heif)$/i.test(file?.name ?? '')) throw new Error('That photo is an iPhone HEIC file. Please save it as a JPEG first.');
  if (!(file instanceof Blob) || (file.name !== undefined && !isPictureFile(file))) throw new Error('Please choose a photo.');
  const bitmap = await decode(file);
  let picture;
  try {
    picture = await encode(bitmap, POSTCARD_PICTURE_EDGE, POSTCARD_PICTURE_QUALITY);
  } finally {
    bitmap.close?.();
  }
  if (picture.blob.size > POSTCARD_PICTURE_MAX_BYTES) throw new Error('That photo is too detailed to use. Please choose another.');

  const bytes = picture.blob.size;
  const { key, upload } = await presignPostcardPicture({ contentType: picture.contentType, bytes });
  await putFile(upload.url, picture.blob, picture.contentType, (sent) => onProgress?.(sent / bytes), bytes);
  return { key, previewUrl: URL.createObjectURL(picture.blob) };
}
