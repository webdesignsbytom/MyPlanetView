// Postcards (docs/API.md "Postcards"; 26 Nov 2026). Each returns the payload; errors keep the
// client's `friendlyMessage` (and `response.status`).
import client from './client';
import { POSTCARD_API, POSTCARDS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** The caller's cards, newest first, and whether their plan gives landmark and photo cards -> `{ postcards, paidCards }` */
export const getMyPostcards = () => data(client.get(POSTCARDS_API));
/** A photo of your own for a card (a paid plan): `{ contentType, bytes }` -> `{ key, upload }` */
export const presignPostcardPicture = (body) => data(client.post(`${POSTCARDS_API}/picture/presign`, body));
/** `{ kind, countryCode, landmarkId?, pictureKey?, style, message, toName?, fromName? }` -> `{ postcard }` */
export const sendPostcard = (body) => data(client.post(POSTCARDS_API, body));
/** A new link (the old one finds nothing) -> `{ postcard }` */
export const resetPostcardLink = (postcardId) => data(client.post(`${POSTCARDS_API}/${enc(postcardId)}/reset-link`));
export const deletePostcard = (postcardId) => data(client.delete(`${POSTCARDS_API}/${enc(postcardId)}`));

/** A card by its link (anyone) -> `{ postcard }` */
export const openPostcard = (code) => data(client.get(`${POSTCARD_API}/${enc(code)}`));
