// Monthly photo themes (docs/API.md, "Photo themes"): this month's theme, a map's albums
// (signed in, or through a map's share link), entering and taking out a photo, and the
// admin's list and changes. Each function returns the payload (`res.data.data`); errors
// keep the client's `friendlyMessage`.
import client from './client';
import { ADMIN_THEMES_API, MAPS_API, PHOTOS_API, SHARED_API, THEMES_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;
const pageQuery = ({ cursor, limit }) => {
  const search = new URLSearchParams();
  if (cursor) search.set('cursor', cursor);
  if (limit) search.set('limit', limit);
  const text = search.toString();
  return text ? `?${text}` : '';
};

// Once per session (the server caches it 5 minutes too); a failed request is forgotten
let themes = null;

/** -> `{ current: theme | null, recent: [theme] }`; a theme is `{ id, month, title, blurb, startsAt, endsAt, running }` */
export function getThemes() {
  themes ||= data(client.get(THEMES_API, false)).catch((err) => {
    themes = null;
    throw err;
  });
  return themes;
}

const mapBase = ({ mapId, shareCode }) => (shareCode ? `${SHARED_API}/${enc(shareCode)}` : `${MAPS_API}/${enc(mapId)}`);

/**
 * A map's themes: `{ current: { ...theme, count, entriesLeft? }, albums: [{ ...theme,
 * count }], entriesPerMap }` (`entriesLeft` for its editors, never through a link).
 */
export const getMapThemes = (source) => data(client.get(`${mapBase(source)}/themes`));

/** One page of a map's album for a theme: `{ theme, photos, nextCursor }`, newest entry first. */
export const getThemeAlbumPage = (source, themeId, { cursor, limit } = {}) =>
  data(client.get(`${mapBase(source)}/themes/${enc(themeId)}/photos${pageQuery({ cursor, limit })}`));

/** Enter a photo in the running theme -> `{ themes }` (every theme the photo is in). */
export const enterPhotoInTheme = (photoId, themeId) => data(client.put(`${PHOTOS_API}/${enc(photoId)}/themes/${enc(themeId)}`));

/** Take a photo out of a theme -> `{ themes }`. */
export const takePhotoOutOfTheme = (photoId, themeId) => data(client.delete(`${PHOTOS_API}/${enc(photoId)}/themes/${enc(themeId)}`));

// Admin (ADMIN or DEVELOPER)

/** -> `{ themes: [{ ...theme, entryCount, mapCount, ended }], entriesPerMap }`, newest month first */
export const getAdminThemes = () => data(client.get(ADMIN_THEMES_API));
/** `{ month: 'YYYY-MM', title, blurb? }` -> 201 `{ theme }`; 409 for a month that has one */
export const createTheme = (body) => data(client.post(ADMIN_THEMES_API, body));
/** `{ month?, title?, blurb? }` -> `{ theme }`; the month only while no photo is entered */
export const updateTheme = (themeId, body) => data(client.patch(`${ADMIN_THEMES_API}/${enc(themeId)}`, body));
/** Only a theme with no photos entered -> `{ message }` */
export const deleteTheme = (themeId) => data(client.delete(`${ADMIN_THEMES_API}/${enc(themeId)}`));

/** Forget the cached themes (after an admin's change, so the next read is fresh). */
export const forgetThemes = () => {
  themes = null;
};
