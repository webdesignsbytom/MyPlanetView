// The admin pages' own reads (the audit, 26 Nov 2026; docs/API.md "Admin"): the overview of the
// site, gifts by code, and referral rewards. Admins and developers only (routes/users.js).
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { findGiftsForAdmin, findLastCronRuns, findOverviewCounts, findReferralRewardsForAdmin } from '../domain/admin.js';
import { giftAdminView, overviewView, referralAdminView } from '../utils/adminViews.js';
import { normaliseShareCode } from '../utils/shareCodes.js';
import { badRequest, handler } from './helpers/travel.js';

const D = DOMAINS.users;

// GET /api/users/admin/overview -> { overview }: accounts, maps, photos, storage, members,
// gifts, referral rewards, new feedback and each daily job's last run (utils/adminViews.js)
export const getAdminOverviewHandler = handler(D, 'Admin overview', async (req, res) => {
  const now = new Date();
  const [counts, lastRuns] = await Promise.all([findOverviewCounts(now), findLastCronRuns()]);
  return sendDataResponse(res, 200, { overview: overviewView(counts, lastRuns, now) });
});

// GET /api/users/admin/gifts?code= -> { gifts }: the gift with that code (none: an empty list),
// or with no code the 30 bought last. A code that can't be one is a 400.
export const getAdminGiftsHandler = handler(D, 'Admin gifts', async (req, res) => {
  const given = req.query?.code;
  let code = null;
  if (given !== undefined && String(given).trim() !== '') {
    code = normaliseShareCode(String(given));
    if (!code) return badRequest(req, res, D, EVENT_MESSAGES.giftNotFound);
  }
  const gifts = await findGiftsForAdmin({ code });
  return sendDataResponse(res, 200, { gifts: gifts.map(giftAdminView) });
});

// GET /api/users/admin/referrals -> { rewards }: the 50 newest referral rewards
export const getAdminReferralsHandler = handler(D, 'Admin referrals', async (req, res) => {
  const rewards = await findReferralRewardsForAdmin();
  return sendDataResponse(res, 200, { rewards: rewards.map(referralAdminView) });
});
