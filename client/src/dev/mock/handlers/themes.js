// Mock mode only: monthly photo themes (docs/API.md, "Photo themes"), as the server's
// controllers/themes.js: this month's theme and the recent ones, a map's albums (and through
// a map's share link), entering and taking out a photo, and the admin's list and changes.
// The rules are ../themes.js.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, normaliseShareCode, session } from '../store';
import { atLeast, canSeePhoto, higherRole, mapRole, photoListItem, photoRole } from '../views';
import { THEME_LIMITS, addMonths, monthOf, parseThemeInput, photoThemes, themeView } from '../themes';

// The server's words (utils/responses/responses.js)
const MESSAGES = {
  mapNotFound: "That map doesn't exist, or it hasn't been shared with you.",
  linkNotFound: "That share link doesn't exist or has been turned off.",
  photoNotFound: "That photo doesn't exist, or it hasn't been shared with you.",
  notFound: "That theme doesn't exist.",
  invalid: 'Check the theme: a month (YYYY-MM), a title of 1 to 60 characters and a blurb of up to 300.',
  monthTaken: "There's already a theme for that month.",
  monthPast: "A theme can't be set for a month that's over.",
  hasEntries: "Photos have been entered in this theme, so its month can't change and it can't be deleted.",
  notRunning: "That theme isn't running: photos can only be entered during its month.",
  video: 'Themes are for photos, not videos.',
  entryNotFound: "That photo isn't entered in that theme.",
  malformed: "Some details weren't in the right format. Please check them and try again.",
};
const ALBUM_PAGE_DEFAULT = 30;
const ALBUM_PAGE_MAX = 60;

const themes = () => getDb().themes || [];
const entries = () => getDb().themeEntries || [];
const findTheme = (id) => themes().find((t) => t.id === id) || null;
const themeForMonth = (month) => themes().find((t) => t.month === month) || null;
const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
const isAdmin = () => session.signedIn && ['ADMIN', 'DEVELOPER'].includes(me().role);
const notAdmin = () => (session.signedIn ? fail(403, 'Admins only.') : fail(401, 'No valid session. Please sign in.'));

// A map's share code, with the caller's own role, else VIEWER when the link is on; a
// trip's code has no albums (null, so 404)
function sharedMap(code) {
  const normal = normaliseShareCode(code);
  const map = normal ? getDb().maps.find((m) => m.shareCode === normal) : null;
  if (!map) return null;
  const role = higherRole(mapRole(map), map.linkAccess === 'ANYONE_WITH_LINK' ? 'VIEWER' : null);
  return role ? { map, role } : null;
}

// The entries `role` may see on a map: hidden photos for editors only
function visibleEntries(mapId, role) {
  const photos = new Map(getDb().photos.map((p) => [p.id, p]));
  return entries().filter((e) => e.mapId === mapId && photos.has(e.photoId) && canSeePhoto(photos.get(e.photoId), role));
}

// The server's mapThemesView
function mapThemesView(map, role, { viaLink = false } = {}) {
  const now = new Date();
  const visible = visibleEntries(map.id, role);
  const counts = new Map();
  for (const entry of visible) counts.set(entry.themeId, (counts.get(entry.themeId) ?? 0) + 1);
  const current = themeForMonth(monthOf(now));
  const currentCount = current ? counts.get(current.id) ?? 0 : 0;
  const editor = atLeast(role, 'EDITOR') && !viaLink;
  return {
    current: current
      ? {
          ...themeView(current, now),
          count: currentCount,
          ...(editor ? { entriesLeft: Math.max(0, THEME_LIMITS.entriesPerMap - currentCount) } : {}),
        }
      : null,
    albums: themes()
      .filter((theme) => counts.has(theme.id))
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .map((theme) => ({ ...themeView(theme, now), count: counts.get(theme.id) })),
    entriesPerMap: THEME_LIMITS.entriesPerMap,
  };
}

// The server's themeAlbumPage: newest entry first, paged by photo id
function albumPage(map, role, themeId, query) {
  const theme = findTheme(themeId);
  if (!theme) return fail(404, MESSAGES.notFound);
  const limit = Math.min(Math.max(Number(query.limit) || ALBUM_PAGE_DEFAULT, 1), ALBUM_PAGE_MAX);
  const list = visibleEntries(map.id, role)
    .filter((e) => e.themeId === theme.id)
    .sort((a, b) => (a.enteredAt === b.enteredAt ? (a.photoId < b.photoId ? 1 : -1) : a.enteredAt < b.enteredAt ? 1 : -1));
  let start = 0;
  if (query.cursor) {
    const at = list.findIndex((e) => e.photoId === query.cursor);
    if (at === -1) return fail(400, MESSAGES.malformed);
    start = at + 1;
  }
  const page = list.slice(start, start + limit);
  const photos = new Map(getDb().photos.map((p) => [p.id, p]));
  return ok({
    theme: themeView(theme),
    photos: page.map((e) => photoListItem(photos.get(e.photoId), role)),
    nextCursor: start + limit < list.length ? page[page.length - 1].photoId : null,
  });
}

// The photo and theme for an entry change, or the reply
function loadEntry(params) {
  const photo = getDb().photos.find((p) => p.id === params.photoId) || null;
  const role = photo ? photoRole(photo) : null;
  if (!photo || !canSeePhoto(photo, role)) return { reply: fail(404, MESSAGES.photoNotFound) };
  if (!atLeast(role, 'EDITOR')) return { reply: fail(403, 'You do not have permission to do that.') };
  const theme = findTheme(params.themeId);
  if (!theme) return { reply: fail(404, MESSAGES.notFound) };
  return { photo, theme };
}

const adminView = (theme) => {
  const now = new Date();
  const own = entries().filter((e) => e.themeId === theme.id);
  return {
    ...themeView(theme, now),
    entryCount: own.length,
    mapCount: new Set(own.map((e) => e.mapId)).size,
    ended: theme.month < monthOf(now),
  };
};

export function registerThemeRoutes() {
  route('GET', '/api/themes', () => {
    const now = new Date();
    const month = monthOf(now);
    const current = themeForMonth(month);
    const oldest = addMonths(month, -24);
    const recent = themes()
      .filter((t) => t.month < month && t.month >= oldest)
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .slice(0, THEME_LIMITS.recent);
    return ok({ current: current ? themeView(current, now) : null, recent: recent.map((t) => themeView(t, now)) });
  });

  // A map's albums
  route('GET', '/api/maps/:mapId/themes', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', MESSAGES.mapNotFound) || ok(mapThemesView(map, role));
  });

  route('GET', '/api/maps/:mapId/themes/:themeId/photos', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', MESSAGES.mapNotFound) || albumPage(map, role, params.themeId, query);
  });

  route('GET', '/api/shared/:code/themes', ({ params }) => {
    const shared = sharedMap(params.code);
    return shared ? ok(mapThemesView(shared.map, shared.role, { viaLink: true })) : fail(404, MESSAGES.linkNotFound);
  });

  route('GET', '/api/shared/:code/themes/:themeId/photos', ({ params, query }) => {
    const shared = sharedMap(params.code);
    return shared ? albumPage(shared.map, shared.role, params.themeId, query) : fail(404, MESSAGES.linkNotFound);
  });

  // Entering a photo while its theme runs (not a video; 20 a map), and taking it out
  route('PUT', '/api/photos/:photoId/themes/:themeId', ({ params }) => {
    const { photo, theme, reply } = loadEntry(params);
    if (reply) return reply;
    if (photo.kind === 'VIDEO') return fail(400, MESSAGES.video);
    if (theme.month !== monthOf()) return fail(409, MESSAGES.notRunning);
    const db = getDb();
    if (db.themeEntries.some((e) => e.themeId === theme.id && e.photoId === photo.id)) return ok({ themes: photoThemes(getDb(), photo.id) });
    const onMap = db.themeEntries.filter((e) => e.themeId === theme.id && e.mapId === photo.mapId).length;
    if (onMap >= THEME_LIMITS.entriesPerMap) {
      return fail(409, `This map has ${THEME_LIMITS.entriesPerMap} photos in “${theme.title}” already: take one out to enter another.`);
    }
    db.themeEntries.push({ themeId: theme.id, photoId: photo.id, mapId: photo.mapId, enteredById: me().id, enteredAt: new Date().toISOString() });
    return ok({ themes: photoThemes(getDb(), photo.id) }, 201);
  });

  route('DELETE', '/api/photos/:photoId/themes/:themeId', ({ params }) => {
    const { photo, theme, reply } = loadEntry(params);
    if (reply) return reply;
    const db = getDb();
    const before = db.themeEntries.length;
    db.themeEntries = db.themeEntries.filter((e) => !(e.themeId === theme.id && e.photoId === photo.id));
    if (db.themeEntries.length === before) return fail(404, MESSAGES.entryNotFound);
    return ok({ themes: photoThemes(getDb(), photo.id) });
  });

  // Admin
  route('GET', '/api/users/admin/themes', () => {
    if (!isAdmin()) return notAdmin();
    const list = [...themes()].sort((a, b) => (a.month < b.month ? 1 : -1)).map(adminView);
    return ok({ themes: list, entriesPerMap: THEME_LIMITS.entriesPerMap });
  });

  route('POST', '/api/users/admin/themes', ({ body }) => {
    if (!isAdmin()) return notAdmin();
    const parsed = parseThemeInput(body);
    if (!parsed.ok) return fail(400, MESSAGES[parsed.message]);
    if (themeForMonth(parsed.data.month)) return fail(409, MESSAGES.monthTaken);
    const now = new Date().toISOString();
    const theme = { id: `theme-${parsed.data.month}-${Date.now().toString(36)}`, ...parsed.data, createdAt: now, updatedAt: now };
    getDb().themes.push(theme);
    return ok({ theme: adminView(theme) }, 201);
  });

  route('PATCH', '/api/users/admin/themes/:themeId', ({ params, body }) => {
    if (!isAdmin()) return notAdmin();
    const theme = findTheme(params.themeId);
    if (!theme) return fail(404, MESSAGES.notFound);
    const parsed = parseThemeInput(body, { existing: theme });
    if (!parsed.ok) return fail(400, MESSAGES[parsed.message]);
    const data = { ...parsed.data };
    if (data.month === theme.month) delete data.month;
    if (data.month) {
      if (entries().some((e) => e.themeId === theme.id)) return fail(409, MESSAGES.hasEntries);
      if (themeForMonth(data.month)) return fail(409, MESSAGES.monthTaken);
    }
    Object.assign(theme, data, { updatedAt: new Date().toISOString() });
    return ok({ theme: adminView(theme) });
  });

  route('DELETE', '/api/users/admin/themes/:themeId', ({ params }) => {
    if (!isAdmin()) return notAdmin();
    const theme = findTheme(params.themeId);
    if (!theme) return fail(404, MESSAGES.notFound);
    if (entries().some((e) => e.themeId === theme.id)) return fail(409, MESSAGES.hasEntries);
    getDb().themes = themes().filter((t) => t.id !== theme.id);
    return { status: 200, body: { status: 'success', message: 'Theme deleted.' } };
  });
}
