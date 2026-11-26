// The admin pages' own reads (the audit, 26 Nov 2026): the overview's counts, each daily job's
// last run, who gets told when one fails, and gifts and referral rewards for support. Thin
// queries; the shaping is utils/adminViews.js. Counts are plain COUNTs and sums over whole
// tables: fine for a page an admin opens now and then.
import { prisma } from '../prisma.js';
import { COUNTING_SUBSCRIPTION_STATUSES } from '../utils/constants/plans.js';
import { ROLES } from '../utils/constants/userConstants.js';
import { FOR_LIFE_ENDS_AT } from '../utils/promoCodes.js';
import { DOMAINS } from '../utils/responses/responses.js';
import { CRON_JOB_IDS, cronAction } from '../utils/cronRuns.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const since = (now, days) => ({ gte: new Date(now.getTime() - days * DAY_MS) });

/** The overview's raw counts at `now` (utils/adminViews.js overviewView shapes them). */
export async function findOverviewCounts(now = new Date()) {
  const [
    accounts,
    verified,
    deactivated,
    newDay,
    newWeek,
    newMonth,
    maps,
    trips,
    photoKinds,
    mediaBytes,
    videoBytes,
    subscriptions,
    grants,
    grantsForLife,
    giftsPaid,
    giftsRedeemed,
    giftsRefunded,
    referralKinds,
    feedbackNew,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { createdAt: since(now, 1) } }),
    prisma.user.count({ where: { createdAt: since(now, 7) } }),
    prisma.user.count({ where: { createdAt: since(now, 30) } }),
    prisma.travelMap.count(),
    prisma.trip.count(),
    prisma.photo.groupBy({ by: ['kind'], _count: { _all: true } }),
    prisma.mediaItem.aggregate({ _sum: { bytes: true } }),
    prisma.photo.aggregate({ _sum: { videoBytes: true } }),
    prisma.subscription.groupBy({ by: ['plan', 'status'], where: { status: { in: [...COUNTING_SUBSCRIPTION_STATUSES] } }, _count: { _all: true } }),
    prisma.planGrant.groupBy({ by: ['plan'], where: { startsAt: { lte: now }, endsAt: { gt: now } }, _count: { _all: true } }),
    prisma.planGrant.count({ where: { startsAt: { lte: now }, endsAt: { gte: FOR_LIFE_ENDS_AT } } }),
    prisma.giftCode.count({ where: { paidAt: { not: null } } }),
    prisma.giftCode.count({ where: { redeemedAt: { not: null } } }),
    prisma.giftCode.count({ where: { refundedAt: { not: null } } }),
    prisma.referralReward.groupBy({ by: ['kind'], _count: { _all: true } }),
    prisma.feedbackReport.count({ where: { status: 'NEW' } }),
  ]);
  return {
    accounts,
    verified,
    deactivated,
    newDay,
    newWeek,
    newMonth,
    maps,
    trips,
    photoKinds,
    storageBytes: (mediaBytes._sum.bytes ?? 0) + (videoBytes._sum.videoBytes ?? 0),
    subscriptions,
    grants,
    grantsForLife,
    giftsPaid,
    giftsRedeemed,
    giftsRefunded,
    referralKinds,
    feedbackNew,
  };
}

/** Each daily job's newest run in the audit log (none for a job that never ran). */
export const findLastCronRuns = () =>
  Promise.all(
    CRON_JOB_IDS.map((job) =>
      prisma.appEvent.findFirst({
        where: { domain: DOMAINS.cron, action: cronAction(job) },
        orderBy: { createdAt: 'desc' },
        select: { action: true, level: true, createdAt: true, metadata: true },
      }),
    ),
  ).then((runs) => runs.filter(Boolean));

/** Who is told when a daily job fails: the site's active, verified admins and developers (10 at most). */
export const findAlertRecipients = () =>
  prisma.user
    .findMany({
      where: { role: { in: [ROLES.ADMIN, ROLES.DEVELOPER] }, isActive: true, emailVerified: true },
      select: { email: true },
      orderBy: { createdAt: 'asc' },
      take: 10,
    })
    .then((users) => users.map((user) => user.email));

const PERSON = { select: { id: true, name: true, email: true } };
const GIFT_SELECT = {
  id: true,
  code: true,
  plan: true,
  months: true,
  amountPence: true,
  currency: true,
  toName: true,
  paidAt: true,
  refundedAt: true,
  redeemedAt: true,
  createdAt: true,
  buyer: PERSON,
  redeemedBy: PERSON,
  grant: { select: { startsAt: true, endsAt: true } },
};

/** Gifts for the admin: the one with this code (normalised), else the newest `take` bought. */
export const findGiftsForAdmin = ({ code = null, take = 30 } = {}) =>
  code
    ? prisma.giftCode.findMany({ where: { code }, select: GIFT_SELECT })
    : prisma.giftCode.findMany({ where: { paidAt: { not: null } }, orderBy: { paidAt: 'desc' }, take, select: GIFT_SELECT });

/** The newest `take` referral rewards, with who earned each and for which friend. */
export const findReferralRewardsForAdmin = ({ take = 50 } = {}) =>
  prisma.referralReward.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      kind: true,
      amountPence: true,
      appliedAt: true,
      createdAt: true,
      referrer: PERSON,
      friend: { select: { id: true, name: true } },
      planGrant: { select: { plan: true, startsAt: true, endsAt: true } },
    },
  });

/** Whether a yearly reminder (utils/reminders.js) has been emailed for `year` (its entry's metadata). */
export const findReminderSentFor = (action, year) =>
  prisma.appEvent
    .findFirst({ where: { domain: DOMAINS.cron, action, metadata: { path: ['year'], equals: year } }, select: { id: true } })
    .then(Boolean);
