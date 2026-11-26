// The two daily Vercel crons (server/vercel.json) and what each run records (the audit, 26 Nov
// 2026: "nothing tells you when a daily job fails"): an audit-log entry per run with its totals
// (services/system/cronRuns.js), an email to the admins when something failed, and each job's
// last run on the admin overview, flagged when it's late. Pure, so tested on its own
// (tests/cronRuns.test.js).

const HOUR_MS = 60 * 60 * 1000;

export const CRON_JOBS = Object.freeze({
  cleanup: { name: 'Nightly clean-up', time: '04:00 UTC' },
  emails: { name: 'Daily emails', time: '08:00 UTC' },
});
export const CRON_JOB_IDS = Object.freeze(Object.keys(CRON_JOBS));

// A daily job not heard from in this long has missed a run (a day, and slack for a slow start)
export const CRON_STALE_MS = 26 * HOUR_MS;

/** The audit log's action for a job's run ("cron:emails"). */
export const cronAction = (job) => `cron:${job}`;

// The clean-up's purges (controllers/mediaGeneric.js), in words
const PURGE_LABELS = Object.freeze({
  expiredRateLimits: 'Finished rate-limit windows',
  oldEvents: 'Audit log entries over 90 days old',
  expiredSessions: 'Expired sessions',
  expiredVerifications: 'Expired verification links',
  oldInvites: 'Old invites',
  oldStripeEvents: 'Old Stripe event ids',
  orphanStreamVideos: 'Videos nothing points at',
  travelCopiesFinished: 'Approved travel copies',
  unpaidGifts: 'Unpaid gifts',
  unnamedGuessPlays: 'Unnamed guess plays',
});

/** The clean-up's problems: each purge that failed (its count is null), and the unused uploads if they did. */
export function cleanupProblems(purged, { uploadsFailed = false } = {}) {
  const problems = Object.entries(purged || {})
    .filter(([, count]) => count === null)
    .map(([key]) => `${PURGE_LABELS[key] ?? key}: not cleaned up`);
  if (uploadsFailed) problems.push('Unused uploads: the clean-up failed');
  return problems;
}

/**
 * The email run's `{ problems, warnings }`: "Welcome home" (`tripShare`, null when it failed)
 * and "On this day" (`onThisDay`, null when it failed). Resend's quota reached is a problem:
 * sign-up and password emails fail until it resets. Not everyone sent theirs (the day's limit
 * or the time ran out) is a warning.
 */
export function emailRunProblems({ tripShare, onThisDay }) {
  const problems = [];
  const warnings = [];
  if (!tripShare) problems.push('“Welcome home” emails failed');
  if (!onThisDay) problems.push('“On this day” emails failed');
  if (tripShare?.quotaReached || onThisDay?.quotaReached) {
    problems.push('Resend’s sending quota was reached: sign-up and password emails may fail until it resets');
  } else if ((tripShare && !tripShare.complete) || (onThisDay && !onThisDay.complete)) {
    warnings.push('Not everyone was sent theirs today: the day’s limit (MEMORY_EMAILS_PER_DAY) or the time ran out');
  }
  return { problems, warnings };
}

/** The audit log's level for a run: ERROR with a problem, WARNING with a warning, else INFO. */
export const cronRunLevel = ({ problems = [], warnings = [] } = {}) =>
  problems.length ? 'ERROR' : warnings.length ? 'WARNING' : 'INFO';

/** The audit log's message for a run: "Daily emails: done", "…: 2 problems". */
export function cronRunMessage(job, { problems = [], warnings = [] } = {}) {
  const name = CRON_JOBS[job]?.name ?? job;
  if (problems.length) return `${name}: ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}`;
  if (warnings.length) return `${name}: done, with a warning`;
  return `${name}: done`;
}

const list = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);

/**
 * Each job's last run, as the admin overview shows it, from the newest audit-log entry of each
 * (`{ action, level, createdAt, metadata }`; none for a job that never ran):
 * `[{ job, name, time, lastRunAt, level, problems, warnings, summary, late }]`. `late`: no run in
 * CRON_STALE_MS (or never).
 */
export function cronStatuses(lastRuns = [], now = new Date()) {
  return CRON_JOB_IDS.map((job) => {
    const run = lastRuns.find((entry) => entry.action === cronAction(job)) ?? null;
    const at = run ? new Date(run.createdAt) : null;
    const meta = run?.metadata && typeof run.metadata === 'object' ? run.metadata : {};
    return {
      job,
      name: CRON_JOBS[job].name,
      time: CRON_JOBS[job].time,
      lastRunAt: at ? at.toISOString() : null,
      level: run?.level ?? null,
      problems: list(meta.problems),
      warnings: list(meta.warnings),
      summary: meta.summary && typeof meta.summary === 'object' ? meta.summary : null,
      late: !at || now.getTime() - at.getTime() > CRON_STALE_MS,
    };
  });
}
