import { mediaUrlFrom } from '@/utils/media/mediaUrl';

const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/File:';

/**
 * A country guide's photo (a landmark's or a festival's, from Wikimedia Commons): its two
 * files in the public bucket (`<folder>/<name>-<width>.avif` and `.webp`, as
 * images/src/tools/landmark-photos.mjs and festival-photos.mjs make them) and its credit.
 * `photo` is the page data's `{ width, height, author, licence, licenceUrl, file }`
 * (scripts/country-pages.mjs); null without one.
 */
export function guidePhoto(folder, name, photo) {
  if (!photo) return null;
  const key = `${folder}/${name}-${photo.width}`;
  return {
    avif: mediaUrlFrom({ objectKey: `${key}.avif` }),
    webp: mediaUrlFrom({ objectKey: `${key}.webp` }),
    width: photo.width,
    height: photo.height,
    author: photo.author,
    licence: photo.licence,
    licenceUrl: photo.licenceUrl,
    source: `${COMMONS_FILE}${encodeURIComponent(photo.file.replace(/ /g, '_'))}`,
  };
}

export const landmarkGuidePhoto = (landmark) => guidePhoto('landmarkPhotos', landmark.slug, landmark.photo);
export const festivalGuidePhoto = (festival) => guidePhoto('festivalPhotos', festival.key, festival.photo);
