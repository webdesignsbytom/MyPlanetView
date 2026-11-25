// Slideshows of chosen photos, shared by a link of their own (docs/API.md "Photo slideshows";
// 25 Nov 2026). Each returns the payload; errors keep the client's `friendlyMessage` (and
// `response.status`).
import client from './client';
import { MAPS_API, PHOTO_SHOWS_API, SHOW_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** A map's shows (its editors) -> `{ shows: [{ id, code, title, seconds, photoIds, photoCount, createdAt, updatedAt }] }` */
export const getMapPhotoShows = (mapId) => data(client.get(`${MAPS_API}/${enc(mapId)}/photo-shows`));
/** `{ title?, photoIds, seconds? }` (1 to 500 of the map's photos, none hidden) -> `{ show }` */
export const createPhotoShow = (mapId, body) => data(client.post(`${MAPS_API}/${enc(mapId)}/photo-shows`, body));
/** Any of `{ title, seconds, photoIds }` -> `{ show }` */
export const updatePhotoShow = (showId, body) => data(client.patch(`${PHOTO_SHOWS_API}/${enc(showId)}`, body));
/** A new link (the old one finds nothing) -> `{ show }` */
export const resetPhotoShowLink = (showId) => data(client.post(`${PHOTO_SHOWS_API}/${enc(showId)}/reset-link`));
export const deletePhotoShow = (showId) => data(client.delete(`${PHOTO_SHOWS_API}/${enc(showId)}`));

/** A show by its link (anyone) -> `{ show: { code, title, seconds, photoCount, coverUrl } }` */
export const openPhotoShow = (code) => data(client.get(`${SHOW_API}/${enc(code)}`));

/**
 * A page of a show's photos (anyone), as the slideshow plays them: in its own order
 * (`order: 'show'`) or shuffled by `seed` -> `{ photos, nextCursor }`
 */
export const getPhotoShowPage = (code, { order = 'show', seed, cursor, limit } = {}) => {
  const params = new URLSearchParams();
  params.set('order', order);
  if (order === 'shuffle' && seed !== undefined) params.set('seed', String(seed));
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  return data(client.get(`${SHOW_API}/${enc(code)}/photos?${params}`));
};
