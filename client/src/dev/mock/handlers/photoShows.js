// Mock mode only: slideshows of chosen photos, shared by a link of their own (docs/API.md
// "Photo slideshows"; 25 Nov 2026), as the server's controllers/photoShows.js: a map's editors
// make, change, re-link and delete them; anyone with the code watches the photos and videos
// it holds that a share link's viewer could see, in its order or shuffled by a seed. The
// store keeps `db.photoShows` ({ id, mapId, code, title, photoIds, seconds, createdById,
// createdAt, updatedAt }).
import { deny, fail, ok, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, session } from '../store';
import { canSeePhoto, displayListItem, mapRole } from '../views';
import { pageAfter, parseShuffleSeed, shuffled } from '../shuffle';
import { SHOW_DEFAULT_SECONDS, SHOW_DEFAULT_TITLE, SHOW_PHOTOS_MAX, SHOW_SECONDS, SHOW_TITLE_MAX } from '@/utils/shows/showRules';

const NOT_FOUND = 'That slideshow isn’t there any more. Ask whoever sent it for a new link.';
const MAP_NOT_FOUND = 'This map could not be found.';
const PHOTOS_INVALID = 'Choose 1 to 500 of this map’s photos or videos, none of them hidden.';
const SECONDS_INVALID = 'Each photo stays up for 3, 5 or 8 seconds.';
const BAD = 'Malformed data.';
const SHOWS_PER_MAP = 100;
const clean = (text, max) => String(text ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const normal = (code) => String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

const showView = (show) => ({
  id: show.id,
  code: formatShareCode(show.code),
  title: show.title,
  seconds: show.seconds,
  photoIds: show.photoIds,
  photoCount: show.photoIds.length,
  createdAt: show.createdAt,
  updatedAt: show.updatedAt,
});
const showByCode = (code) => getDb().photoShows.find((s) => s.code === normal(code)) || null;
// What it holds when it's made or changed: the map's own photos and videos, none hidden
const validPhotoIds = (ids, mapId) => {
  const photos = getDb().photos;
  const shaped = Array.isArray(ids) && ids.length >= 1 && ids.length <= SHOW_PHOTOS_MAX && new Set(ids).size === ids.length;
  return shaped && ids.every((id) => photos.some((p) => p.id === id && p.mapId === mapId && !p.hidden));
};
const secondsFrom = (value) => (value === undefined ? SHOW_DEFAULT_SECONDS : SHOW_SECONDS.includes(value) ? value : null);
// What it plays now: its photos, in its order, that a share link's viewer could see
const playable = (show) => {
  const photos = getDb().photos;
  return show.photoIds.map((id) => photos.find((p) => p.id === id && p.mapId === show.mapId)).filter((p) => p && canSeePhoto(p, 'VIEWER'));
};
// The show an editor of its map is changing; else the server's answer
const editable = (params) => {
  if (!session.signedIn) return { denied: fail(401, 'No valid session. Please sign in.') };
  const db = getDb();
  const show = db.photoShows.find((s) => s.id === params.showId);
  const denied = deny(show ? mapRole(db.maps.find((m) => m.id === show.mapId)) : null, 'EDITOR', NOT_FOUND);
  return denied ? { denied } : { show };
};

export function registerPhotoShowRoutes() {
  route('GET', '/api/maps/:mapId/photo-shows', ({ params }) => {
    const map = getDb().maps.find((m) => m.id === params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    const shows = getDb()
      .photoShows.filter((s) => s.mapId === map.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return ok({ shows: shows.map(showView) });
  });

  route('POST', '/api/maps/:mapId/photo-shows', ({ params, body }) => {
    const db = getDb();
    const map = db.maps.find((m) => m.id === params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MAP_NOT_FOUND);
    if (denied) return denied;
    if (!validPhotoIds(body?.photoIds, map.id)) return fail(400, PHOTOS_INVALID);
    const seconds = secondsFrom(body?.seconds);
    if (seconds === null) return fail(400, SECONDS_INVALID);
    if (db.photoShows.filter((s) => s.mapId === map.id).length >= SHOWS_PER_MAP) {
      return fail(409, 'A map can have 100 slideshows. Delete one to make another.');
    }
    const now = new Date().toISOString();
    const show = {
      id: newId(),
      mapId: map.id,
      code: newShareCode(),
      title: clean(body.title, SHOW_TITLE_MAX) || SHOW_DEFAULT_TITLE,
      photoIds: [...body.photoIds],
      seconds,
      createdById: me().id,
      createdAt: now,
      updatedAt: now,
    };
    db.photoShows.push(show);
    return ok({ show: showView(show) }, 201);
  });

  route('PATCH', '/api/photo-shows/:showId', ({ params, body }) => {
    const { show, denied } = editable(params);
    if (denied) return denied;
    const changes = {};
    if (body?.title !== undefined) {
      const title = clean(body.title, SHOW_TITLE_MAX);
      if (!title) return fail(400, 'Give the slideshow a title of 1 to 80 characters.');
      changes.title = title;
    }
    if (body?.seconds !== undefined) {
      if (!SHOW_SECONDS.includes(body.seconds)) return fail(400, SECONDS_INVALID);
      changes.seconds = body.seconds;
    }
    if (body?.photoIds !== undefined) {
      if (!validPhotoIds(body.photoIds, show.mapId)) return fail(400, PHOTOS_INVALID);
      changes.photoIds = [...body.photoIds];
    }
    if (!Object.keys(changes).length) return fail(400, BAD);
    Object.assign(show, changes, { updatedAt: new Date().toISOString() });
    return ok({ show: showView(show) });
  });

  route('POST', '/api/photo-shows/:showId/reset-link', ({ params }) => {
    const { show, denied } = editable(params);
    if (denied) return denied;
    show.code = newShareCode();
    show.updatedAt = new Date().toISOString();
    return ok({ show: showView(show) });
  });

  route('DELETE', '/api/photo-shows/:showId', ({ params }) => {
    const { show, denied } = editable(params);
    if (denied) return denied;
    const db = getDb();
    db.photoShows = db.photoShows.filter((s) => s.id !== show.id);
    return ok({ deleted: true });
  });

  route('GET', '/api/show/:code', ({ params }) => {
    const show = showByCode(params.code);
    const photos = show ? playable(show) : [];
    if (!photos.length) return fail(404, NOT_FOUND);
    const cover = displayListItem(photos[0], 'VIEWER');
    return ok({
      show: {
        code: formatShareCode(show.code),
        title: show.title,
        seconds: show.seconds,
        photoCount: photos.length,
        coverUrl: cover.displayUrl || cover.thumbUrl || null,
      },
    });
  });

  route('GET', '/api/show/:code/photos', ({ params, query }) => {
    const show = showByCode(params.code);
    if (!show) return fail(404, NOT_FOUND);
    const order = query.order ?? 'show';
    if (order !== 'show' && order !== 'shuffle') return fail(400, BAD);
    const seed = order === 'shuffle' ? parseShuffleSeed(query.seed) : null;
    if (order === 'shuffle' && seed === null) return fail(400, BAD);
    const size = Math.min(Math.max(Number(query.limit) || 30, 1), 60);
    const byId = new Map(playable(show).map((p) => [p.id, p]));
    const ids = [...byId.keys()];
    const slice = pageAfter(order === 'shuffle' ? shuffled(ids, seed) : ids, query.cursor, size);
    if (!slice) return fail(400, BAD);
    return ok({ photos: slice.ids.map((id) => displayListItem(byId.get(id), 'VIEWER')), nextCursor: slice.more ? slice.ids[slice.ids.length - 1] : null });
  });
}
