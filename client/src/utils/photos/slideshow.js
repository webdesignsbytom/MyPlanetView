// The slideshows (docs/FEATURE-PLAN.md, "Slideshows"; docs/API.md, "Slideshows"): what
// plays, in what order, and how fast.
import { countryName } from '@/utils/map/countries';

// Seconds a photo stays up; the viewer picks one (remembered in this browser)
export const SLIDE_SPEEDS = [3, 5, 8];
export const DEFAULT_SLIDE_SPEED = 5;
export const SLIDE_SPEED_STORAGE_KEY = 'mpv:slideshowSpeed';
// A country's title card stays up this long at most (shorter when the photos go faster)
export const TITLE_CARD_SECONDS = 3;
// Photos asked for at a time, and how close to the end of those the next page is fetched
export const SLIDE_PAGE_SIZE = 30;
export const SLIDE_FETCH_AHEAD = 5;

/** A new shuffle seed for each show: a whole number from 1 to 2^31 − 1, as the API takes. */
export function newShuffleSeed() {
  const max = 2 ** 31 - 1;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const [value] = crypto.getRandomValues(new Uint32Array(1));
    return (value % max) + 1;
  }
  return Math.floor(Math.random() * max) + 1;
}

/**
 * The slides for a list of photos: each photo, and in the worldwide show (`titleCards`)
 * a country's title card before the first photo of each stretch in a new country (a
 * photo with no country gets none, and doesn't end the stretch). `complete`: every page is
 * in, so the show ends with an end card.
 * -> `[{ id, type: 'card', countryCode } | { id, type: 'photo', photo } | { id: 'end', type: 'end' }]`
 */
export function buildSlides(photos, { titleCards = false, complete = false } = {}) {
  const slides = [];
  let country = null;
  for (const photo of photos) {
    if (titleCards && photo.countryCode && photo.countryCode !== country) {
      country = photo.countryCode;
      slides.push({ id: `card-${slides.length}-${country}`, type: 'card', countryCode: country });
    }
    slides.push({ id: photo.id, type: 'photo', photo });
  }
  if (complete && photos.length) slides.push({ id: 'end', type: 'end' });
  return slides;
}

/** Where a photo was (its country and confirmed landmarks), for its caption line and alt text. */
export function photoPlace(photo) {
  const landmarks = (photo.landmarks || []).filter((l) => l.confirmed).map((l) => l.name);
  return [photo.countryCode ? countryName(photo.countryCode) : null, ...landmarks].filter(Boolean).join(' · ');
}
