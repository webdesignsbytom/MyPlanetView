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

// A moment's card stays up at least this long: it has words to read
export const MOMENT_CARD_SECONDS = 6;

/**
 * The slides for a list of photos: each photo, and in the worldwide show (`titleCards`)
 * a country's title card before the first photo of each stretch in a new country (a
 * photo with no country gets none, and doesn't end the stretch). `moments` (dated, oldest
 * first; a show in date order) come as cards of their own before the first photo taken
 * after them: after the title card when the moment is in that photo's country, before it
 * otherwise. Photos with no date place none. `complete`: every page is in, so the moments
 * still to come go before the end card. `intro` (a shared slideshow's title; 25 Nov 2026)
 * opens the show with a card of its own.
 * -> `[{ id: 'intro', type: 'intro', title } | { id, type: 'card', countryCode } | { id, type: 'moment', moment } | { id, type: 'photo', photo } | { id: 'end', type: 'end' }]`
 */
export function buildSlides(photos, { titleCards = false, complete = false, moments = [], intro = null } = {}) {
  const slides = intro && photos.length ? [{ id: 'intro', type: 'intro', title: intro }] : [];
  const queue = [...moments];
  const takeDue = (day) => {
    const due = [];
    while (queue.length && queue[0].happenedOn <= day) due.push(queue.shift());
    return due;
  };
  const pushMoments = (list) => {
    for (const moment of list) slides.push({ id: `moment-${moment.id}`, type: 'moment', moment });
  };
  let country = null;
  for (const photo of photos) {
    const due = photo.takenAt ? takeDue(photo.takenAt.slice(0, 10)) : [];
    const newCountry = titleCards && photo.countryCode && photo.countryCode !== country;
    if (newCountry) {
      pushMoments(due.filter((m) => m.countryCode !== photo.countryCode));
      country = photo.countryCode;
      // Named after its photo, so the id stays when moments come in around it
      slides.push({ id: `card-${photo.id}`, type: 'card', countryCode: country });
      pushMoments(due.filter((m) => m.countryCode === photo.countryCode));
    } else {
      pushMoments(due);
    }
    slides.push({ id: photo.id, type: 'photo', photo });
  }
  if (complete && photos.length) {
    pushMoments(queue);
    slides.push({ id: 'end', type: 'end' });
  }
  return slides;
}

/** Where a photo was (its country and confirmed landmarks), for its caption line and alt text. */
export function photoPlace(photo) {
  const landmarks = (photo.landmarks || []).filter((l) => l.confirmed).map((l) => l.name);
  return [photo.countryCode ? countryName(photo.countryCode) : null, ...landmarks].filter(Boolean).join(' · ');
}
