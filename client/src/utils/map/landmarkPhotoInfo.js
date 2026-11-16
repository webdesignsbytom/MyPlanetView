import { mediaUrlFrom } from '@/utils/media/mediaUrl';

const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/File:';

/**
 * One landmark's photo from the generated credits (utils/map/landmarkPhotos.js, loaded
 * by useLandmarkPhotos), or null when it has none: its two files in the public bucket
 * (landmarkPhotos/<slug>-<width>.avif and .webp), its size, and its credit (author,
 * licence and the Commons page it came from).
 */
export function landmarkPhotoInfo(data, slug) {
  const entry = data?.LANDMARK_PHOTOS?.[slug];
  if (!entry) return null;
  const [width, height, author, licenceAt, file] = entry;
  const [licence, licenceUrl] = data.LICENCES[licenceAt] || ['', ''];
  const key = `landmarkPhotos/${slug}-${width}`;
  return {
    avif: mediaUrlFrom({ objectKey: `${key}.avif` }),
    webp: mediaUrlFrom({ objectKey: `${key}.webp` }),
    width,
    height,
    author,
    licence,
    licenceUrl,
    source: `${COMMONS_FILE}${encodeURIComponent(file.replace(/ /g, '_'))}`,
  };
}
