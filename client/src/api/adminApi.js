// The admin pages' own reads (docs/API.md, "Admin"): the overview of the site, gifts by code and
// referral rewards. Each function returns the payload (`res.data.data`); errors keep the
// client's `friendlyMessage`.
import client from './client';
import { ADMIN_GIFTS_API, ADMIN_OVERVIEW_API, ADMIN_REFERRALS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});

/** -> `{ overview }`: accounts, maps, photos, storage, members, gifts, referrals, new feedback, the daily jobs */
export const getAdminOverview = () => data(client.get(ADMIN_OVERVIEW_API));

/** `{ code }` (optional) -> `{ gifts }`: the gift with that code, or the 30 bought last */
export function getAdminGifts({ code } = {}) {
  const typed = typeof code === 'string' ? code.trim() : '';
  return data(client.get(typed ? `${ADMIN_GIFTS_API}?code=${encodeURIComponent(typed)}` : ADMIN_GIFTS_API));
}

/** -> `{ rewards }`: the 50 newest referral rewards */
export const getAdminReferrals = () => data(client.get(ADMIN_REFERRALS_API));
