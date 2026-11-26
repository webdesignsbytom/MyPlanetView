// Words for the admin overview and the gifts and referrals page (docs/API.md, "Admin"; the
// audit, 26 Nov 2026). Pure, so tested on its own.
import { formatPence, planOf } from '@/utils/constants/plans';

/** "26 Nov 2026, 08:00 UTC", or null for no date. */
export function whenWords(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${day}, ${date.toISOString().slice(11, 16)} UTC`;
}

/** "1.2 GB", "340 MB": the site's storage. */
export function storageWords(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TB`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)} GB`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} MB`;
  if (n > 0) return `${Math.max(1, Math.round(n / 1e3))} KB`;
  return 'Nothing yet';
}

/**
 * A daily job's state from its last run (the server's cronStatuses): `{ label, tone }`, tone one
 * of good, warning or critical (the status tokens). A problem outranks being late.
 */
export function jobState(job) {
  if (!job?.lastRunAt) return { label: 'Not run yet', tone: 'warning' };
  if (job.level === 'ERROR' || job.problems?.length) return { label: 'Had a problem', tone: 'critical' };
  if (job.late) return { label: 'Late: no run in over a day', tone: 'critical' };
  if (job.level === 'WARNING' || job.warnings?.length) return { label: 'Ran, with a warning', tone: 'warning' };
  return { label: 'Ran fine', tone: 'good' };
}

export const GIFT_STATUS_WORDS = Object.freeze({
  READY: 'Paid, not redeemed yet',
  REDEEMED: 'Redeemed',
  REFUNDED: 'Refunded: it no longer works',
  UNPAID: 'Not paid',
});

/** A gift's state in words ("Redeemed"). */
export const giftStatusWords = (status) => GIFT_STATUS_WORDS[status] ?? status;

/** "A year of Business, £49" */
export const giftWords = (gift) =>
  `${gift.months === 12 ? 'A year' : `${gift.months} months`} of ${gift.planName || planOf(gift.plan).name}, ${formatPence(gift.amountPence)}`;

/** What a referral reward gave: "£4.99 off their bill", "A month of Business", "Nothing: 12 this year already". */
export function referralWords(reward) {
  if (reward.kind === 'CREDIT') return reward.amountPence ? `${formatPence(reward.amountPence)} off their bill` : 'Credit off their bill';
  if (reward.kind === 'GRANT') return `A month of ${reward.grant?.planName || 'their plan'}`;
  return 'Nothing: 12 this year already';
}
