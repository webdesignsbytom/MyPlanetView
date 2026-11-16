// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { photoPlace } from '@/utils/photos/slideshow';

/**
 * What's on screen, in words, for screen readers only: the slideshow's footer shows just
 * the controls (16 Nov 2026, the user's wish), and reads this out when the show is moved
 * by hand. A photo: where it is ("Photo 3 of 16"), its place and landmarks, the day it was
 * taken, whether it's hidden, and its own caption. A title card names its country, a
 * moment gives its title, and the end card says how many photos there were.
 */
function SlideCaption({ slide, photoCount, counter = '' }) {
  if (!slide) return null;
  if (slide.type === 'card') return countryName(slide.countryCode);
  if (slide.type === 'moment') return slide.moment.title;
  if (slide.type === 'end') return `That’s all ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}.`;
  const { photo } = slide;
  return [
    counter,
    photoPlace(photo) || 'Somewhere unplaced',
    photo.takenAt ? formatDay(photo.takenAt) : null,
    photo.hidden ? 'Hidden from viewers' : null,
    photo.caption,
  ]
    .filter(Boolean)
    .join('. ');
}

export default SlideCaption;
