// Slideshows of chosen photos (docs/API.md "Photo slideshows"; 25 Nov 2026): the server's
// rules, copied (server/src/utils/photoShows.js; a test compares them), and what the maker
// and the page say.
import { showPath } from '@/utils/constants/routes';
import { isTopPlan, planOf } from '@/utils/constants/plans';

export const SHOW_TITLE_MAX = 80;
export const SHOW_PHOTOS_MAX = 500;
export const SHOW_SECONDS = Object.freeze([3, 5, 8]);
export const SHOW_DEFAULT_SECONDS = 5;
export const SHOW_DEFAULT_TITLE = 'A slideshow';

/** How many slideshows a map keeps saved on its plan: Economy 2, Business 10, First Class 25 (27 Nov 2026). */
export const showsAllowed = (planId) => planOf(planId).limits.photoShows;

/** The server's 409, word for word: "2 of 2 slideshows saved on this map. Delete one, or upgrade to save more." */
export const showsFullMessage = ({ count, cap, planId }) =>
  `${Math.min(count, cap)} of ${cap} slideshows saved on this map. ${isTopPlan(planId) ? 'Delete one to save another.' : 'Delete one, or upgrade to save more.'}`;

/** "1 of 10 saved on this map"; a map whose plan went down keeps what it has: "3 saved on this map, more than the 2 it keeps now". */
export const showsSavedWords = (count, limit) =>
  count > limit ? `${count} saved on this map, more than the ${limit} it keeps now` : `${count} of ${limit} saved on this map`;

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
