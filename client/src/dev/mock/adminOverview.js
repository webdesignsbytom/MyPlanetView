// Mock mode only: the admin overview, gifts and referral rewards (docs/API.md "Admin"), as the
// server's domain/admin.js and utils/adminViews.js shape them, counted over the store. Unlike the
// server, the daily jobs never run here: each shows a pretend run at its time today (or
// yesterday, before then), fine, so the page has something to show.
import { COUNTING_SUBSCRIPTION_STATUSES, planOf } from '@/utils/constants/plans';
import { formatShareCode } from './store';
import { dueReminders } from '@/utils/admin/reminders';

const DAY_MS = 24 * 60 * 60 * 1000;
const FOR_LIFE = '9999-12-31';
const PAID_PLANS = ['REGULAR', 'PREMIUM'];
const time = (value) => (value ? new Date(value).getTime() : 0);
const perPlan = (rows) => Object.fromEntries(PAID_PLANS.map((plan) => [plan, rows.filter((row) => row.plan === plan).length]));
const iso = (value) => (value ? new Date(value).toISOString() : null);

// The two daily jobs, as utils/cronRuns.js names them
const JOBS = [
  { job: 'cleanup', name: 'Nightly clean-up', time: '04:00 UTC', hour: 4, summary: { expiredSessions: 2, deleted: 0 } },
  { job: 'emails', name: 'Daily emails', time: '08:00 UTC', hour: 8, summary: { limit: 60, welcomeHomeSent: 0, onThisDaySent: 1, quotaReached: false } },
];

/** The last time `hour` o'clock UTC came round before `now` */
function lastRunAt(hour, now) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour));
  return today.getTime() <= now.getTime() ? today : new Date(today.getTime() - DAY_MS);
}

/** The overview the server's overviewView sends, from the store `db` at `now`. */
export function mockOverview(db, now = new Date()) {
  const users = db.users || [];
  const photos = db.photos || [];
  const subscriptions = (db.subscriptions || []).filter((sub) => COUNTING_SUBSCRIPTION_STATUSES.includes(sub.status));
  const grants = (db.planGrants || []).filter((grant) => time(grant.startsAt) <= now.getTime() && now.getTime() < time(grant.endsAt));
  const gifts = db.gifts || [];
  const rewards = db.referralRewards || [];
  const since = (days) => users.filter((user) => time(user.createdAt) >= now.getTime() - days * DAY_MS).length;
  const paid = gifts.filter((gift) => gift.paidAt).length;
  const redeemed = gifts.filter((gift) => gift.redeemedAt).length;
  const refunded = gifts.filter((gift) => gift.refundedAt).length;
  return {
    accounts: {
      total: users.length,
      verified: users.filter((user) => user.emailVerified).length,
      deactivated: users.filter((user) => user.isActive === false).length,
      new: { day: since(1), week: since(7), month: since(30) },
    },
    maps: (db.maps || []).length,
    trips: (db.trips || []).length,
    photos: { photos: photos.filter((p) => p.kind !== 'VIDEO').length, videos: photos.filter((p) => p.kind === 'VIDEO').length },
    storageBytes: photos.reduce((sum, p) => sum + (Number(p.bytes) || 0) + (Number(p.videoBytes) || 0), 0),
    members: {
      paying: perPlan(subscriptions),
      trialing: subscriptions.filter((sub) => sub.status === 'trialing').length,
      pastDue: subscriptions.filter((sub) => sub.status === 'past_due').length,
      complimentary: perPlan(grants),
      forLife: grants.filter((grant) => String(grant.endsAt).startsWith(FOR_LIFE)).length,
    },
    gifts: { paid, redeemed, refunded, waiting: Math.max(0, paid - redeemed - refunded) },
    referrals: Object.fromEntries(['CREDIT', 'GRANT', 'CAPPED'].map((kind) => [kind, rewards.filter((r) => r.kind === kind).length])),
    feedbackNew: (db.feedback || []).filter((report) => report.status === 'NEW').length,
    jobs: JOBS.map(({ job, name, time: at, hour, summary }) => ({
      job,
      name,
      time: at,
      lastRunAt: lastRunAt(hour, now).toISOString(),
      level: 'INFO',
      problems: [],
      warnings: [],
      summary,
      late: false,
    })),
    reminders: dueReminders(now),
  };
}

const personOf = (db, id) => {
  const user = (db.users || []).find((u) => u.id === id);
  return user ? { name: user.name, email: user.email } : null;
};

const giftStatus = (gift) => (gift.refundedAt ? 'REFUNDED' : gift.redeemedAt ? 'REDEEMED' : gift.paidAt ? 'READY' : 'UNPAID');

/** A gift as the server's giftAdminView sends it. */
export const mockGiftView = (db, gift) => {
  const grant = gift.grantId ? (db.planGrants || []).find((g) => g.id === gift.grantId) : null;
  return {
    id: gift.id,
    code: formatShareCode(gift.code),
    plan: gift.plan,
    planName: planOf(gift.plan).name,
    months: gift.months,
    amountPence: gift.amountPence,
    currency: gift.currency || 'gbp',
    status: giftStatus(gift),
    toName: gift.toName ?? null,
    createdAt: iso(gift.createdAt),
    paidAt: iso(gift.paidAt),
    redeemedAt: iso(gift.redeemedAt),
    refundedAt: iso(gift.refundedAt),
    buyer: personOf(db, gift.buyerId),
    redeemedBy: personOf(db, gift.redeemedById),
    grant: grant ? { startsAt: iso(grant.startsAt), endsAt: iso(grant.endsAt) } : null,
  };
};

/** A referral reward as the server's referralAdminView sends it. */
export const mockReferralView = (db, reward) => {
  const grant = reward.planGrantId ? (db.planGrants || []).find((g) => g.id === reward.planGrantId) : null;
  const friend = (db.users || []).find((u) => u.id === reward.friendId);
  return {
    id: reward.id,
    kind: reward.kind,
    amountPence: reward.amountPence ?? null,
    createdAt: iso(reward.createdAt),
    appliedAt: iso(reward.appliedAt),
    referrer: personOf(db, reward.referrerId),
    friend: friend ? { name: friend.name } : null,
    grant: grant ? { plan: grant.plan, planName: planOf(grant.plan).name, startsAt: iso(grant.startsAt), endsAt: iso(grant.endsAt) } : null,
  };
};
