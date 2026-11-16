// Monthly photo themes (docs/API.md, "Photo themes"): the themes, a map's albums, entering
// and taking out photos, and the admin's list and changes. Rules in utils/themes.js.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createThemeEvent } from '../event/travelUtils.js';
import { canEdit, canSeePhoto, canView } from '../utils/access.js';
import { clampInt } from '../utils/sanitize.js';
import { isUuid } from '../utils/travelValidation.js';
import { THEME_LIMITS, isRunning, monthStart, parseThemeInput, themeView } from '../utils/themes.js';
import {
  countThemeEntries,
  createThemeInDB,
  deleteThemeInDB,
  enterPhotoInTheme,
  findMapThemeAlbums,
  findPhotoThemes,
  findThemeAlbumPage,
  findThemeById,
  findThemeByMonth,
  findThemesBetween,
  listThemesWithCounts,
  removePhotoFromTheme,
  updateThemeInDB,
} from '../domain/themes.js';
import { findPhotosByIds } from '../domain/photos.js';
import { badRequest, conflict, forbidden, handler, loadMap, loadPhoto, notFound } from './helpers/travel.js';
import { photoListItem, visiblePhotos } from './helpers/views.js';

const D = DOMAINS.themes;
const ALBUM_PAGE_DEFAULT = 30;
const ALBUM_PAGE_MAX = 60;

// The themes (anyone)

/**
 * GET /themes: the theme running this month and the recent past ones (never future ones:
 * a month's theme is a surprise until it starts). The same for everyone, so cached.
 * -> `{ current: theme | null, recent: [theme] }`
 */
export const getThemesHandler = handler(D, 'Get themes', async (req, res) => {
  const now = new Date();
  const thisMonth = monthStart(now);
  const [current, recent] = await Promise.all([
    findThemeByMonth(thisMonth),
    findThemesBetween({ from: new Date(Date.UTC(thisMonth.getUTCFullYear() - 2, thisMonth.getUTCMonth(), 1)), before: thisMonth, take: THEME_LIMITS.recent }),
  ]);
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
  return sendDataResponse(res, 200, {
    current: current ? themeView(current, now) : null,
    recent: recent.map((theme) => themeView(theme, now)),
  });
});

// A map's albums

/**
 * A map's themes as `role` sees them: the theme running now (with this map's count, and
 * for editors how many more photos it may enter) and every theme it has photos in.
 * Shared with the share links (controllers/shared.js).
 */
export async function mapThemesView(mapId, role, now = new Date()) {
  const includeHidden = canEdit(role);
  const [current, albums] = await Promise.all([findThemeByMonth(monthStart(now)), findMapThemeAlbums(mapId, { includeHidden })]);
  // For editors the count includes hidden photos, as the cap does
  const currentCount = current ? albums.find((album) => album.theme.id === current.id)?.count ?? 0 : 0;
  return {
    current: current
      ? {
          ...themeView(current, now),
          count: currentCount,
          ...(includeHidden ? { entriesLeft: Math.max(0, THEME_LIMITS.entriesPerMap - currentCount) } : {}),
        }
      : null,
    albums: albums.map(({ theme, count }) => ({ ...themeView(theme, now), count })),
    entriesPerMap: THEME_LIMITS.entriesPerMap,
  };
}

/**
 * One page of a map's album for a theme, as `role` sees it (no hidden photos below
 * editor). Shared with the share links. -> `{ theme, photos, nextCursor }`, or
 * `{ notFound }` / `{ error }`.
 */
export async function themeAlbumPage({ mapId, themeId, role, query }) {
  const theme = isUuid(themeId) ? await findThemeById(themeId) : null;
  if (!theme) return { notFound: EVENT_MESSAGES.themeNotFound };
  if (query.cursor !== undefined && !isUuid(query.cursor)) return { error: EVENT_MESSAGES.malformedData };
  const limit = clampInt(query.limit, { min: 1, max: ALBUM_PAGE_MAX, fallback: ALBUM_PAGE_DEFAULT });
  const page = await findThemeAlbumPage({ mapId, themeId: theme.id, includeHidden: canEdit(role), cursor: query.cursor, limit });
  if (!page) return { error: EVENT_MESSAGES.malformedData };
  const photos = visiblePhotos(await findPhotosByIds(page.photoIds), role);
  return {
    theme: themeView(theme),
    photos: await Promise.all(photos.map((photo) => photoListItem(photo, role))),
    nextCursor: page.nextCursor,
  };
}

export const getMapThemesHandler = handler(D, 'Get map themes', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  return sendDataResponse(res, 200, await mapThemesView(map.id, role));
});

export const getMapThemeAlbumHandler = handler(D, 'Get theme album', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const result = await themeAlbumPage({ mapId: map.id, themeId: req.params.themeId, role, query: req.query || {} });
  if (result.notFound) return notFound(req, res, D, result.notFound);
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});

// Entering a photo (an editor of the photo, as for changing it)

const photoThemesView = async (photoId) => (await findPhotoThemes(photoId)).map((theme) => themeView(theme));

/** Load the photo and the theme for an entry change: `{ photo, theme }` or an answer sent. */
async function loadEntry(req, res) {
  const { photo, role } = await loadPhoto(req, req.params.photoId);
  if (!canSeePhoto(role, photo)) {
    notFound(req, res, D, EVENT_MESSAGES.photoNotFound);
    return null;
  }
  if (!canEdit(role)) {
    forbidden(req, res, D);
    return null;
  }
  const theme = isUuid(req.params.themeId) ? await findThemeById(req.params.themeId) : null;
  if (!theme) {
    notFound(req, res, D, EVENT_MESSAGES.themeNotFound);
    return null;
  }
  return { photo, theme };
}

/**
 * PUT /photos/:photoId/themes/:themeId: enter the photo in the theme running now (any
 * photo of the map, from any date; not a video). Already in: 200, nothing changes.
 * -> 201 `{ themes }` (every theme the photo is in)
 */
export const enterPhotoHandler = handler(D, 'Enter theme', async (req, res) => {
  const loaded = await loadEntry(req, res);
  if (!loaded) return undefined;
  const { photo, theme } = loaded;
  if (photo.kind === 'VIDEO') return badRequest(req, res, D, EVENT_MESSAGES.themeVideo);
  if (!isRunning(theme)) return conflict(req, res, D, EVENT_MESSAGES.themeNotRunning);
  const result = await enterPhotoInTheme({
    themeId: theme.id,
    photoId: photo.id,
    mapId: photo.mapId,
    userId: req.user.id,
    cap: THEME_LIMITS.entriesPerMap,
  });
  if (result.full) {
    return conflict(req, res, D, `This map has ${THEME_LIMITS.entriesPerMap} photos in “${theme.title}” already: take one out to enter another.`);
  }
  if (result.created) {
    logEvent(createThemeEvent({ user: req.user, action: 'Entry Create Success', id: theme.id, detail: `photo=${photo.id}`, statusCode: 201 }));
  }
  return sendDataResponse(res, result.created ? 201 : 200, { themes: await photoThemesView(photo.id) });
});

/** DELETE /photos/:photoId/themes/:themeId: take it out (any time). -> `{ themes }` */
export const leaveThemeHandler = handler(D, 'Leave theme', async (req, res) => {
  const loaded = await loadEntry(req, res);
  if (!loaded) return undefined;
  const { photo, theme } = loaded;
  if (!(await removePhotoFromTheme({ themeId: theme.id, photoId: photo.id }))) {
    return notFound(req, res, D, EVENT_MESSAGES.themeEntryNotFound);
  }
  logEvent(createThemeEvent({ user: req.user, action: 'Entry Delete Success', id: theme.id, detail: `photo=${photo.id}` }));
  return sendDataResponse(res, 200, { themes: await photoThemesView(photo.id) });
});

// Admin (ADMIN or DEVELOPER)

const adminView = (theme, now = new Date()) => ({
  ...themeView(theme, now),
  entryCount: theme.entryCount ?? 0,
  mapCount: theme.mapCount ?? 0,
  ended: new Date(theme.month) < monthStart(now),
});

export const listThemesHandler = handler(D, 'List themes', async (req, res) => {
  const themes = await listThemesWithCounts();
  return sendDataResponse(res, 200, { themes: themes.map((theme) => adminView(theme)), entriesPerMap: THEME_LIMITS.entriesPerMap });
});

/** `{ month: 'YYYY-MM', title, blurb? }`: this month or a later one, one theme a month */
export const createThemeHandler = handler(D, 'Create theme', async (req, res) => {
  const parsed = parseThemeInput(req.body);
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  if (await findThemeByMonth(parsed.data.month)) return conflict(req, res, D, EVENT_MESSAGES.themeMonthTaken);
  const theme = await createThemeInDB(parsed.data);
  logEvent(createThemeEvent({ user: req.user, action: 'Create Success', id: theme.id, detail: `month=${themeView(theme).month}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { theme: adminView(theme) });
});

/**
 * `{ month?, title?, blurb? }`. The words can always change; the month only while no photo
 * is entered (and never to a month that's over, or one with its own theme).
 */
export const updateThemeHandler = handler(D, 'Update theme', async (req, res) => {
  const existing = isUuid(req.params.themeId) ? await findThemeById(req.params.themeId) : null;
  if (!existing) return notFound(req, res, D, EVENT_MESSAGES.themeNotFound);
  const parsed = parseThemeInput(req.body, { existing });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  const entryCount = await countThemeEntries(existing.id);
  const data = { ...parsed.data };
  if (data.month && data.month.getTime() === new Date(existing.month).getTime()) delete data.month;
  if (data.month) {
    if (entryCount) return conflict(req, res, D, EVENT_MESSAGES.themeHasEntries);
    if (await findThemeByMonth(data.month)) return conflict(req, res, D, EVENT_MESSAGES.themeMonthTaken);
  }
  const theme = Object.keys(data).length ? await updateThemeInDB(existing.id, data) : existing;
  logEvent(createThemeEvent({ user: req.user, action: 'Update Success', id: theme.id, detail: Object.keys(data).join(',') }));
  return sendDataResponse(res, 200, { theme: adminView({ ...theme, entryCount }) });
});

/** Only a theme with no photos entered can go (its albums would vanish with it). */
export const deleteThemeHandler = handler(D, 'Delete theme', async (req, res) => {
  const existing = isUuid(req.params.themeId) ? await findThemeById(req.params.themeId) : null;
  if (!existing) return notFound(req, res, D, EVENT_MESSAGES.themeNotFound);
  if (await countThemeEntries(existing.id)) return conflict(req, res, D, EVENT_MESSAGES.themeHasEntries);
  await deleteThemeInDB(existing.id);
  logEvent(createThemeEvent({ user: req.user, action: 'Delete Success', id: existing.id, detail: `month=${themeView(existing).month}` }));
  return sendMessageResponse(res, 200, 'Theme deleted.');
});

