// The admin's travel offers (docs/API.md, "Travel offers"): the list with each offer's
// clicks, a new offer, changes, deleting one, and the import. ADMIN or DEVELOPER.
// Each function returns the payload (`res.data.data`).
import client from './client';
import { ADMIN_OFFERS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

// -> { offers: [{ ...every field, clicks: { total, byPlacement, byDay } }], clicksSince }
export const getAdminOffers = () => data(client.get(ADMIN_OFFERS_API));
// -> 201 { offer }; 409 for a taken key; 400 "Check the offer's details: … (<field>)"
export const createOffer = (body) => data(client.post(ADMIN_OFFERS_API, body));
// Any field but the key -> { offer } (without clicks)
export const updateOffer = (offerId, body) => data(client.patch(`${ADMIN_OFFERS_API}/${enc(offerId)}`, body));
// Deletes it and its click tallies -> { message }
export const deleteOffer = (offerId) => data(client.delete(`${ADMIN_OFFERS_API}/${enc(offerId)}`));

/**
 * An import file's contents (`{ offers: [...] }`) -> { created, updated, keys }.
 * When nothing was imported (400) the error carries the server's list as
 * `error.problems` ([{ index, key, field }], index from 0; `index: null` when the file
 * itself is wrong), besides `error.friendlyMessage`.
 */
export const importOffers = (payload) =>
  data(client.post(`${ADMIN_OFFERS_API}/import`, payload)).catch((err) => {
    const problems = err?.response?.data?.data?.problems;
    if (Array.isArray(problems)) err.problems = problems;
    throw err;
  });
