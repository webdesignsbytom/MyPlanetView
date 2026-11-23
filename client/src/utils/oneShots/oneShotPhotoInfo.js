import { mediaUrlFrom } from '@/utils/media/mediaUrl';

const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/File:';

/**
 * One item's photo from the generated credits (utils/oneShots/oneShotPhotos.js, loaded by
 * useOneShotPhotos), or null when it has none: its two files in the public bucket
 * (oneShotPhotos/<key>-<width>.avif and .webp), its size, and its credit, as a landmark's
 * (utils/map/landmarkPhotoInfo.js).
 */
export function oneShotPhotoInfo(data, key) {
  const entry = data?.ONE_SHOT_PHOTOS?.[key];
  if (!entry) return null;
  const [width, height, author, licenceAt, file] = entry;
  const [licence, licenceUrl] = data.ONE_SHOT_LICENCES[licenceAt] || ['', ''];
  const name = `oneShotPhotos/${key}-${width}`;
  return {
    avif: mediaUrlFrom({ objectKey: `${name}.avif` }),
    webp: mediaUrlFrom({ objectKey: `${name}.webp` }),
    width,
    height,
    author,
    licence,
    licenceUrl,
    source: `${COMMONS_FILE}${encodeURIComponent(file.replace(/ /g, '_'))}`,
  };
}
