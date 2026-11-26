// What the admin pages are sent (the audit, 26 Nov 2026; docs/API.md "Admin"): the overview,
// gifts and referral rewards, shaped from domain/admin.js's rows. Pure, so tested on its own
// (tests/adminViews.test.js). Admins see buyers' and members' addresses: they're for answering
// "my gift code doesn't work".
import { formatShareCode } from './shareCodes.js';
import { giftStatus } from './gifts.js';
import { planOf } from './constants/plans.js';
import { cronStatuses } from './cronRuns.js';
import { dueReminders } from './reminders.js';

const PAID_PLANS = ['REGULAR', 'PREMIUM'];
const iso = (date) => (date ? new Date(date).toISOString() : null);
const person = (user) => (user ? { name: user.name, email: user.email } : null);

/** `[{ <key>: value, _count: { _all } }]` -> `{ value: count }` */
const countsBy = (rows, key) =>
  Object.fromEntries((rows || []).map((row) => [row[key], row._count?._all ?? 0]));

/** One count per paid plan (0 when none): `{ REGULAR, PREMIUM }`. */
const perPlan = (counts) => Object.fromEntries(PAID_PLANS.map((plan) => [plan, counts[plan] ?? 0]));

/**
 * The overview from findOverviewCounts and findLastCronRuns:
 * accounts (total, verified, deactivated, new in a day, a week, 30 days), maps, trips, photos and
 * videos, storage in bytes (photo files and videos), members (paying by plan, of whom on a free
 * month or behind with a payment; given a plan by plan; for life), gifts (paid, redeemed,
 * refunded, waiting to be redeemed), referral rewards by kind, new feedback, the daily jobs and
 * the yearly reminders due.
 */
export function overviewView(counts, lastRuns = [], now = new Date()) {
  const paying = {};
  let trialing = 0;
  let pastDue = 0;
  for (const row of counts.subscriptions || []) {
    const n = row._count?._all ?? 0;
    paying[row.plan] = (paying[row.plan] ?? 0) + n;
    if (row.status === 'trialing') trialing += n;
    if (row.status === 'past_due') pastDue += n;
  }
  const kinds = countsBy(counts.photoKinds, 'kind');
  const referrals = countsBy(counts.referralKinds, 'kind');
  return {
    accounts: {
      total: counts.accounts,
      verified: counts.verified,
      deactivated: counts.deactivated,
      new: { day: counts.newDay, week: counts.newWeek, month: counts.newMonth },
    },
    maps: counts.maps,
    trips: counts.trips,
    photos: { photos: kinds.PHOTO ?? 0, videos: kinds.VIDEO ?? 0 },
    storageBytes: Number(counts.storageBytes) || 0,
    members: {
      paying: perPlan(paying),
      trialing,
      pastDue,
      complimentary: perPlan(countsBy(counts.grants, 'plan')),
      forLife: counts.grantsForLife,
    },
    gifts: {
      paid: counts.giftsPaid,
      redeemed: counts.giftsRedeemed,
      refunded: counts.giftsRefunded,
      waiting: Math.max(0, counts.giftsPaid - counts.giftsRedeemed - counts.giftsRefunded),
    },
    referrals: { CREDIT: referrals.CREDIT ?? 0, GRANT: referrals.GRANT ?? 0, CAPPED: referrals.CAPPED ?? 0 },
    feedbackNew: counts.feedbackNew,
    jobs: cronStatuses(lastRuns, now),
    // The yearly chores due now (the magnetic poles' pins): shown until done
    reminders: dueReminders(now),
  };
}

/** A gift as the admin sees it: its code shown XXXX-XXXX-XXXX, its state, who bought and who redeemed it. */
export const giftAdminView = (gift) => ({
  id: gift.id,
  code: formatShareCode(gift.code),
  plan: gift.plan,
  planName: planOf(gift.plan).name,
  months: gift.months,
  amountPence: gift.amountPence,
  currency: gift.currency,
  status: giftStatus(gift),
  toName: gift.toName ?? null,
  createdAt: iso(gift.createdAt),
  paidAt: iso(gift.paidAt),
  redeemedAt: iso(gift.redeemedAt),
  refundedAt: iso(gift.refundedAt),
  buyer: person(gift.buyer),
  redeemedBy: person(gift.redeemedBy),
  grant: gift.grant ? { startsAt: iso(gift.grant.startsAt), endsAt: iso(gift.grant.endsAt) } : null,
});

/** A referral reward as the admin sees it: what the member got (CREDIT, GRANT or CAPPED), for which friend. */
export const referralAdminView = (reward) => ({
  id: reward.id,
  kind: reward.kind,
  amountPence: reward.amountPence ?? null,
  createdAt: iso(reward.createdAt),
  appliedAt: iso(reward.appliedAt),
  referrer: person(reward.referrer),
  friend: reward.friend ? { name: reward.friend.name } : null,
  grant: reward.planGrant
    ? { plan: reward.planGrant.plan, planName: planOf(reward.planGrant.plan).name, startsAt: iso(reward.planGrant.startsAt), endsAt: iso(reward.planGrant.endsAt) }
    : null,
});
