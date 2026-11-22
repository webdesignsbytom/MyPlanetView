// A map design's sea picture (docs/API.md "Map designs"): the chosen file drawn again at
// most DESIGN_PICTURE_EDGE wide or tall, as WebP (JPEG where the browser can't write WebP),
// which also leaves its location and camera details behind; then presigned, sent straight
// to the bucket, and saved on the design for `style` (one per map style). -> that design,
// with the picture on it
import { presignDesignPicture, saveDesignPicture } from '@/api/travelApi';
import { decode, encode } from '@/utils/photos/makePhotoCopies';
import { putFile } from '@/utils/photos/putFile';
import { DESIGN_PICTURE_EDGE, DESIGN_PICTURE_MAX_BYTES, DESIGN_PICTURE_QUALITY } from './mapDesign';

export async function uploadDesignPicture(mapId, style, file, onProgress) {
  if (!file?.type?.startsWith('image/') && !/\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file?.name ?? '')) {
    throw new Error('Please choose a picture: a photo or an image file.');
  }
  const bitmap = await decode(file);
  let picture;
  try {
    picture = await encode(bitmap, DESIGN_PICTURE_EDGE, DESIGN_PICTURE_QUALITY);
  } finally {
    bitmap.close?.();
  }
  if (picture.blob.size > DESIGN_PICTURE_MAX_BYTES) throw new Error('That picture is too detailed to use. Please choose another.');

  const bytes = picture.blob.size;
  const { key, upload } = await presignDesignPicture(mapId, { contentType: picture.contentType, bytes });
  await putFile(upload.url, picture.blob, picture.contentType, (sent) => onProgress?.(sent / bytes), bytes);
  const { design } = await saveDesignPicture(mapId, style, key);
  return design;
}
