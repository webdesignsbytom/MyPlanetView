// Give a month, get a month (docs/API.md "Give a month, get a month"; 21 Nov 2026): a member's
// own code for inviting friends, and what it has brought them.
import { DOMAINS, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createBillingEvent } from '../event/travelUtils.js';
import { PROMO_TRIAL_DAYS } from '../utils/promoCodes.js';
import { REFERRAL_REWARDS_PER_YEAR, referralTotals } from '../utils/referrals.js';
import { countReferralSignUps, findReferralCode, findReferralRewards } from '../domain/referrals.js';
import { ensureReferralCode } from '../services/billing/referrals.js';
import { handler } from './helpers/travel.js';

const D = DOMAINS.billing;

/**
 * The member's invite: their code (null until they ask for one), friends who joined with it
 * (verified), friends who've paid (each a reward), the months earned and still to earn this
 * year. The browser makes the link (its own address, so a test site's link is the test site's).
 */
async function referralView(userId, code) {
  const rewards = await findReferralRewards(userId);
  return {
    code: code?.code ?? null,
    friendDays: PROMO_TRIAL_DAYS,
    perYear: REFERRAL_REWARDS_PER_YEAR,
    friendsJoined: code ? await countReferralSignUps(code.id) : 0,
    friendsPaid: rewards.length,
    ...referralTotals(rewards),
  };
}

// GET /api/users/referral
export const getReferralHandler = handler(D, 'Get referral', async (req, res) =>
  sendDataResponse(res, 200, { referral: await referralView(req.user.id, await findReferralCode(req.user.id)) }),
);

// POST /api/users/referral: the member's code, made now if they have none (a verified address)
export const createReferralHandler = handler(D, 'Create referral code', async (req, res) => {
  const had = await findReferralCode(req.user.id);
  const code = had ?? (await ensureReferralCode(req.user));
  if (!had) logEvent(createBillingEvent({ user: req.user, action: 'Referral Code Create Success', id: code.id, statusCode: 201 }));
  return sendDataResponse(res, had ? 200 : 201, { referral: await referralView(req.user.id, code) });
});
