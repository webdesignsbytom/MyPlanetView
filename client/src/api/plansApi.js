// Plans and billing, leaving, and the admin's plan tools (docs/API.md, "Plans and
// billing", "Leaving", "Transferring a map"). Each returns the payload (`res.data.data`);
// errors keep the client's `friendlyMessage`.
import client from './client';
import {
  ADMIN_END_PLAN_GRANT_API,
  ADMIN_PLAN_GRANTS_API,
  ADMIN_TRANSFER_MAP_API,
  BILLING_API,
  LEAVING_OPTIONS_API,
  LEAVING_PLAN_API,
} from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

// The account's plan, extra maps and prices
export const getBilling = () => data(client.get(BILLING_API));
// A new subscription -> { url } (Stripe Checkout). `plan: 'FREE'` buys extra maps only.
export const startCheckout = ({ plan, interval, extraMaps = 0 }) =>
  data(client.post(`${BILLING_API}/checkout`, { plan, interval, extraMaps }));
// The live subscription's plan line -> { billing }
export const changePlan = ({ plan, interval }) => data(client.post(`${BILLING_API}/change-plan`, { plan, interval }));
// How many extra maps to pay for -> { billing } (a subscription changed), or { url } (a Checkout)
export const setExtraMaps = ({ quantity, interval }) =>
  data(client.post(`${BILLING_API}/extra-maps`, { quantity, ...(interval ? { interval } : {}) }));
// Stripe's customer portal -> { url }
export const openBillingPortal = () => data(client.post(`${BILLING_API}/portal`, {}));

// Leaving: the maps you own (with everyone on them) and the photos you added elsewhere
export const getLeavingOptions = () => data(client.get(LEAVING_OPTIONS_API));
export const putLeavingPlan = (plan) => data(client.put(LEAVING_PLAN_API, plan));

// Admin
export const getPlanGrants = (userId) => data(client.get(`${ADMIN_PLAN_GRANTS_API}/${enc(userId)}`));
export const createPlanGrant = (userId, { plan, months, reason }) =>
  data(client.post(`${ADMIN_PLAN_GRANTS_API}/${enc(userId)}`, { plan, months, reason: reason || undefined }));
export const endPlanGrant = (grantId) => data(client.patch(`${ADMIN_END_PLAN_GRANT_API}/${enc(grantId)}`, {}));
export const adminTransferMap = ({ mapId, toEmail, keepOldOwnerAsEditor }) =>
  data(client.post(ADMIN_TRANSFER_MAP_API, { mapId, toEmail, keepOldOwnerAsEditor }));
