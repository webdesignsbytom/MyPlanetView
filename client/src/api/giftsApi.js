// Gifts of a year of a plan (docs/API.md "Gifts"). Each returns the payload; errors keep
// the client's `friendlyMessage`.
import client from './client';
import { BILLING_API, GIFTS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});

/** -> `{ offers: [{ plan, name, months, pence }], gifts, paymentsEnabled }` */
export const getMyGifts = () => data(client.get(GIFTS_API));
/** `{ plan, toName?, message? }` -> `{ url }`: Stripe's Checkout for it */
export const startGiftCheckout = (body) => data(client.post(`${BILLING_API}/gift-checkout`, body));
/** -> `{ gift: { code, plan, planName, months, toName, message, fromName, status } }` */
export const getGift = (code) => data(client.get(`${GIFTS_API}/${encodeURIComponent(code)}`));
/** -> `{ grant: { plan, planName, startsAt, endsAt } }` */
export const redeemGift = (code) => data(client.post(`${GIFTS_API}/redeem`, { code }));
