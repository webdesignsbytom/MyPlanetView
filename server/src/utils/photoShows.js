// Slideshows of chosen photos, shared by a link of their own (25 Nov 2026, the user's wish:
// "share just a slideshow of selected photos"; docs/API.md "Photo slideshows"). A map's
// editors choose some of its photos and videos, a title and how long each stays up; anyone
// with the link watches them, in that order, and nothing else of the map. Pure, so tested on
// its own (tests/photoShows.test.js). The client's copy is client/src/utils/shows/showRules.js.

export const SHOW_TITLE_MAX = 80;
export const SHOW_PHOTOS_MAX = 500;
// A guard against a runaway script, not a plan limit
export const SHOWS_PER_MAP = 100;
// Seconds a photo stays up to start with (the watcher can change it, as in every slideshow)
export const SHOW_SECONDS = Object.freeze([3, 5, 8]);
export const SHOW_DEFAULT_SECONDS = 5;
export const SHOW_DEFAULT_TITLE = 'A slideshow';
// How a show is watched: in its own order, or shuffled by a seed
export const SHOW_ORDERS = Object.freeze(['show', 'shuffle']);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A show's photos from a request: 1 to 500 different photo ids, in order. -> the ids, or null */
export function parseShowPhotoIds(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > SHOW_PHOTOS_MAX) return null;
  if (!value.every((id) => typeof id === 'string' && UUID.test(id))) return null;
  return new Set(value).size === value.length ? value : null;
}

/** Seconds a photo stays up: 3, 5 or 8, or the default when none is given. -> the seconds, or null */
export function parseShowSeconds(value) {
  if (value === undefined || value === null) return SHOW_DEFAULT_SECONDS;
  return SHOW_SECONDS.includes(value) ? value : null;
}

/**
 * The photos a show plays as it stands: its ids, in its order, that are still among
 * `visibleIds` (the map's photos a viewer may see: not hidden, a video once it's ready).
 */
export const showablePhotoIds = (photoIds, visibleIds) => {
  const visible = new Set(visibleIds);
  return photoIds.filter((id) => visible.has(id));
};
