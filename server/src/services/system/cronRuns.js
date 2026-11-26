// Each run of the two daily jobs (the audit, 26 Nov 2026: "nothing tells you when a daily job
// fails"): an audit-log entry with its totals, at ERROR when something failed (WARNING when not
// everyone got their email), and an email to the site's admins when something failed. The
// admin overview shows each job's last run (utils/cronRuns.js cronStatuses). Never throws: a
// job's own reply goes out whatever happens here.
import { createAppEvent } from '../../event/events.js';
import { DOMAINS } from '../../utils/responses/responses.js';
import { CRON_JOBS, cronAction, cronRunLevel, cronRunMessage } from '../../utils/cronRuns.js';
import { findAlertRecipients } from '../../domain/admin.js';
import { sendAlertEmail } from '../email/emailHandler.js';
import { FRONTEND_ORIGINS } from '../../utils/config.js';
import { BusinessName, FrontendUrl, LogoUrl } from '../../utils/constants/siteConstants.js';

const siteOrigin = () => FRONTEND_ORIGINS[0] ?? FrontendUrl;

/** "26 Nov 2026, 08:00 UTC" */
const whenWords = (date) =>
  `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${date.toISOString().slice(11, 16)} UTC`;

/** The summary's lines for the email: "sent: 12". */
const summaryLines = (summary) =>
  Object.entries(summary || {})
    .filter(([, value]) => value !== null && typeof value !== 'object')
    .map(([key, value]) => `${key}: ${value}`);

async function alertAdmins(job, { problems, summary, startedAt }) {
  const recipients = await findAlertRecipients();
  const name = CRON_JOBS[job]?.name ?? job;
  const context = {
    title: `${name} had a problem`,
    jobName: name,
    jobTime: CRON_JOBS[job]?.time ?? '',
    when: whenWords(new Date(startedAt)),
    problems,
    summary: summaryLines(summary),
    adminUrl: `${siteOrigin()}/admin`,
    businessName: BusinessName,
    logoUrl: LogoUrl,
    year: new Date(startedAt).getUTCFullYear(),
  };
  await Promise.all(recipients.map((to) => sendAlertEmail(to, `${BusinessName}: ${name.toLowerCase()} had a problem`, 'cronAlertEmail', context)));
}

/**
 * Record a run of `job` ('cleanup' or 'emails'): `problems` and `warnings` in words
 * (utils/cronRuns.js), `summary` its totals (numbers and flags), `startedAt` when it began (ms).
 */
export async function recordCronRun({ job, startedAt, problems = [], warnings = [], summary = {} }) {
  const outcome = { problems, warnings };
  try {
    await createAppEvent({
      level: cronRunLevel(outcome),
      domain: DOMAINS.cron,
      action: cronAction(job),
      message: cronRunMessage(job, outcome),
      statusCode: problems.length ? 500 : 200,
      metadata: { job, ms: Date.now() - startedAt, problems, warnings, summary },
    });
  } catch (err) {
    console.error(`[cron:${job}] run not recorded:`, err);
  }
  if (!problems.length) return;
  try {
    await alertAdmins(job, { problems, summary, startedAt });
  } catch (err) {
    console.error(`[cron:${job}] admins not told:`, err);
  }
}
