// Influencer codes (docs/API.md, "Promo codes"): the check before signing up, and the
// admin's list and changes. Each function returns the payload (`res.data.data`).
import client from './client';
import { ADMIN_PROMO_CODES_API, PROMO_CODES_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

// -> { promoCode: { code, freePlan, trialDays } } (freePlan: a plan for life, else null); 404 when it can't be used
export const checkPromoCode = (code) => data(client.get(`${PROMO_CODES_API}/${enc(code)}`, false));

// Admin (ADMIN or DEVELOPER)
export const getPromoCodes = () => data(client.get(ADMIN_PROMO_CODES_API));
export const createPromoCode = (body) => data(client.post(ADMIN_PROMO_CODES_API, body));
export const updatePromoCode = (promoCodeId, body) => data(client.patch(`${ADMIN_PROMO_CODES_API}/${enc(promoCodeId)}`, body));
