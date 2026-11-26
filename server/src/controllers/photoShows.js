// Slideshows of chosen photos, shared by a link of their own (25 Nov 2026, the user's wish;
// docs/API.md "Photo slideshows"). A map's editors make, rename, re-link and delete them; anyone
// with the link watches the photos and videos it holds, as a share link's viewer sees them
// (never a hidden one, a video still converting, a position or an original), and nothing else
// of the map: not its name, its places or its other photos.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createPhotoShowEvent } from '../event/travelUtils.js';
import { clampInt, sanitizeText } from '../utils/sanitize.js';
import { ROLES, canEdit, canView } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { formatShareCode, normaliseShareCode } from '../utils/shareCodes.js';
import { pageAfter, parseShuffleSeed, shuffled } from '../utils/shuffle.js';
import {
  SHOWS_PER_MAP,
  SHOW_DEFAULT_TITLE,
  SHOW_ORDERS,
  SHOW_TITLE_MAX,
  parseShowPhotoIds,
  parseShowSeconds,
  showablePhotoIds,
} from '../utils/photoShows.js';
import {
  countChoosablePhotos,
  createPhotoShowInDB,
  deletePhotoShowInDB,
  findPhotoShowByCode,
  findPhotoShowById,
  findPhotoShowsForMap,
  findVisibleShowPhotoIds,
  resetPhotoShowCodeInDB,
  updatePhotoShowInDB,
} from '../domain/photoShows.js';
import { findPhotosByIds } from '../domain/photos.js';
import { photoListItem } from './helpers/views.js';
import { badRequest, conflict, denyUnless, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.photoShows;
const PAGE_DEFAULT = 30;
const PAGE_MAX = 60;

/** A show for its map's editors: its link's code, title, seconds and how many photos it holds. */
const showView = (show) => ({
  id: show.id,
  code: formatShareCode(show.code),
  title: show.title,
  seconds: show.seconds,
  photoIds: show.photoIds,
  photoCount: show.photoIds.length,
  createdAt: show.createdAt.toISOString(),
  updatedAt: show.updatedAt.toISOString(),
});

const titleFrom = (value) => (typeof value === 'string' ? sanitizeText(value, { maxLength: SHOW_TITLE_MAX }) : '');

// The show by its link's code, or null (any code that can't be one finds nothing)
const showByCode = (code) => {
  const normal = normaliseShareCode(code);
  return normal ? findPhotoShowByCode(normal) : null;
};

// The photos it plays now: its own, in its order, that a viewer may still see
const playableIds = async (show) => showablePhotoIds(show.photoIds, await findVisibleShowPhotoIds(show.mapId, show.photoIds));

// Some of a show's photos as a viewer's list items, with their display copies (the slideshow's)
const listItems = async (ids) =>
  Promise.all((await findPhotosByIds(ids, { withDisplay: true })).map((photo) => photoListItem({ ...photo, withDisplay: true }, ROLES.VIEWER)));

// A show of the caller's map, with their role on it; null when there's none they can see
async function editableShow(req) {
  const show = isUuid(req.params.showId) ? await findPhotoShowById(req.params.showId) : null;
  const { role } = show ? await loadMap(req, show.mapId) : { role: null };
  return show && canView(role) ? { show, role } : null;
}

// GET /api/maps/:mapId/photo-shows (editors) -> { shows }
export const getMapPhotoShowsHandler = handler(D, 'Get photo shows', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  return sendDataResponse(res, 200, { shows: (await findPhotoShowsForMap(map.id)).map(showView) });
});

// POST /api/maps/:mapId/photo-shows { title?, photoIds, seconds? } (editors, verified) -> 201 { show }
export const createPhotoShowHandler = handler(D, 'Create photo show', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const body = req.body || {};
  const photoIds = parseShowPhotoIds(body.photoIds);
  if (!photoIds || (await countChoosablePhotos(map.id, photoIds)) !== photoIds.length) {
    return badRequest(req, res, D, EVENT_MESSAGES.showPhotosInvalid);
  }
  const seconds = parseShowSeconds(body.seconds);
  if (seconds === null) return badRequest(req, res, D, EVENT_MESSAGES.showSecondsInvalid);
  const title = titleFrom(body.title) || SHOW_DEFAULT_TITLE;

  const made = await createPhotoShowInDB({ mapId: map.id, title, photoIds, seconds, createdById: req.user.id, cap: SHOWS_PER_MAP });
  if (made.tooMany) return conflict(req, res, D, EVENT_MESSAGES.showTooMany);
  logEvent(createPhotoShowEvent({ user: req.user, action: 'Create Success', id: made.show.id, statusCode: 201 }));
  return sendDataResponse(res, 201, { show: showView(made.show) });
});

// PATCH /api/photo-shows/:showId { title?, seconds?, photoIds? } (editors of its map, verified) -> { show }
export const updatePhotoShowHandler = handler(D, 'Update photo show', async (req, res) => {
  const found = await editableShow(req);
  if (!found) return notFound(req, res, D, EVENT_MESSAGES.showNotFound);
  if (denyUnless(req, res, D, found.role, canEdit, EVENT_MESSAGES.showNotFound)) return undefined;
  const body = req.body || {};
  const data = {};
  if (body.title !== undefined) {
    const title = titleFrom(body.title);
    if (!title) return badRequest(req, res, D, EVENT_MESSAGES.showTitleInvalid);
    data.title = title;
  }
  if (body.seconds !== undefined) {
    const seconds = parseShowSeconds(body.seconds);
    if (seconds === null || body.seconds === null) return badRequest(req, res, D, EVENT_MESSAGES.showSecondsInvalid);
    data.seconds = seconds;
  }
  if (body.photoIds !== undefined) {
    const photoIds = parseShowPhotoIds(body.photoIds);
    if (!photoIds || (await countChoosablePhotos(found.show.mapId, photoIds)) !== photoIds.length) {
      return badRequest(req, res, D, EVENT_MESSAGES.showPhotosInvalid);
    }
    data.photoIds = photoIds;
  }
  if (!Object.keys(data).length) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  const show = await updatePhotoShowInDB(found.show.id, data);
  logEvent(createPhotoShowEvent({ user: req.user, action: 'Update Success', id: show.id }));
  return sendDataResponse(res, 200, { show: showView(show) });
});

// POST /api/photo-shows/:showId/reset-link (editors of its map, verified) -> { show } with a new code
export const resetPhotoShowLinkHandler = handler(D, 'Reset photo show link', async (req, res) => {
  const found = await editableShow(req);
  if (!found) return notFound(req, res, D, EVENT_MESSAGES.showNotFound);
  if (denyUnless(req, res, D, found.role, canEdit, EVENT_MESSAGES.showNotFound)) return undefined;
  const show = await resetPhotoShowCodeInDB(found.show.id);
  logEvent(createPhotoShowEvent({ user: req.user, action: 'Reset Link Success', id: show.id }));
  return sendDataResponse(res, 200, { show: showView(show) });
});

// DELETE /api/photo-shows/:showId (editors of its map, verified)
export const deletePhotoShowHandler = handler(D, 'Delete photo show', async (req, res) => {
  const found = await editableShow(req);
  if (!found) return notFound(req, res, D, EVENT_MESSAGES.showNotFound);
  if (denyUnless(req, res, D, found.role, canEdit, EVENT_MESSAGES.showNotFound)) return undefined;
  await deletePhotoShowInDB(found.show.id);
  logEvent(createPhotoShowEvent({ user: req.user, action: 'Delete Success', id: found.show.id }));
  return sendDataResponse(res, 200, { deleted: true });
});

// GET /api/show/:code (anyone) -> { show: { code, title, seconds, photoCount, coverUrl } }
// A show with nothing left to play (every photo deleted or hidden) is a 404, as a gone one
export const getPhotoShowHandler = handler(D, 'Open photo show', async (req, res) => {
  const show = await showByCode(req.params.code);
  const ids = show ? await playableIds(show) : [];
  if (!ids.length) return notFound(req, res, D, EVENT_MESSAGES.showNotFound);
  const [cover] = await listItems(ids.slice(0, 1));
  return sendDataResponse(res, 200, {
    show: {
      code: formatShareCode(show.code),
      title: show.title,
      seconds: show.seconds,
      photoCount: ids.length,
      coverUrl: cover?.displayUrl || cover?.thumbUrl || null,
    },
  });
});

// GET /api/show/:code/photos?order=show|shuffle&seed=&cursor=&limit= (anyone) -> { photos, nextCursor }
// In the show's own order, or shuffled by the seed (the same order for the same seed, as the
// map's slideshows: utils/shuffle.js). A cursor no longer in the list (a photo hidden or
// deleted as it played) is a 400, and the client starts the show again.
export const getPhotoShowPhotosHandler = handler(D, 'Open photo show photos', async (req, res) => {
  const show = await showByCode(req.params.code);
  if (!show) return notFound(req, res, D, EVENT_MESSAGES.showNotFound);
  const query = req.query || {};
  const order = query.order ?? 'show';
  if (!SHOW_ORDERS.includes(order)) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  const seed = order === 'shuffle' ? parseShuffleSeed(query.seed) : null;
  if (order === 'shuffle' && seed === null) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  if (query.cursor !== undefined && !isUuid(query.cursor)) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  const limit = clampInt(query.limit, { min: 1, max: PAGE_MAX, fallback: PAGE_DEFAULT });

  const ids = await playableIds(show);
  const slice = pageAfter(order === 'shuffle' ? shuffled(ids, seed) : ids, query.cursor, limit);
  if (!slice) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  return sendDataResponse(res, 200, { photos: await listItems(slice.ids), nextCursor: slice.more ? slice.ids[slice.ids.length - 1] : null });
});
