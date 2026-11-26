// Slideshows of chosen photos (docs/API.md "Photo slideshows"; 25 Nov 2026): the server's
// rules, copied (server/src/utils/photoShows.js; a test compares them), and what the maker
// and the page say.
import { showPath } from '@/utils/constants/routes';

export const SHOW_TITLE_MAX = 80;
export const SHOW_PHOTOS_MAX = 500;
export const SHOW_SECONDS = Object.freeze([3, 5, 8]);
export const SHOW_DEFAULT_SECONDS = 5;
export const SHOW_DEFAULT_TITLE = 'A slideshow';

/** The show's link on this site (wherever it's running, as the share links are); `code` as the server shows it. */
export const showLink = (origin, code) => `${origin}${showPath(code)}`;

/**
 * The chosen photos in the order the show plays them: when they were taken (`'taken'`, oldest
 * first, the undated after them in the order chosen), or as chosen (`'chosen'`). -> ids
 */
export function showOrder(chosen, order) {
  if (order !== 'taken') return chosen.map((photo) => photo.id);
  return chosen
    .map((photo, i) => ({ photo, i }))
    .sort((a, b) => {
      const ta = a.photo.takenAt || null;
      const tb = b.photo.takenAt || null;
      if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      return a.i - b.i;
    })
    .map(({ photo }) => photo.id);
}

/** "12 photos", "1 photo". */
export const photoCountWords = (n) => `${Number(n).toLocaleString('en-GB')} ${n === 1 ? 'photo' : 'photos'}`;

/** Can the chooser take this one? A hidden photo never goes in a show (the server refuses it). */
export const choosable = (photo) => !photo.hidden;
