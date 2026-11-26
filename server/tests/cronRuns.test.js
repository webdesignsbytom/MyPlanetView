// The daily jobs' runs (src/utils/cronRuns.js; the audit, 26 Nov 2026), pure.
import { describe, expect, it } from 'vitest';
import {
  CRON_JOB_IDS,
  CRON_STALE_MS,
  cleanupProblems,
  cronAction,
  cronRunLevel,
  cronRunMessage,
  cronStatuses,
  emailRunProblems,
} from '../src/utils/cronRuns.js';

const NOW = new Date('2026-11-26T12:00:00Z');
const ago = (hours) => new Date(NOW.getTime() - hours * 60 * 60 * 1000);

describe('the daily jobs', () => {
  it('are the clean-up and the emails, recorded as cron:<job>', () => {
    expect(CRON_JOB_IDS).toEqual(['cleanup', 'emails']);
    expect(cronAction('emails')).toBe('cron:emails');
    expect(CRON_STALE_MS).toBe(26 * 60 * 60 * 1000);
  });

  it('the clean-up’s problems: each purge that failed, and the uploads', () => {
    expect(cleanupProblems({ expiredSessions: 3, oldEvents: 0 })).toEqual([]);
    expect(cleanupProblems({ expiredSessions: null, oldEvents: 2, mystery: null })).toEqual([
      'Expired sessions: not cleaned up',
      'mystery: not cleaned up',
    ]);
    expect(cleanupProblems({}, { uploadsFailed: true })).toEqual(['Unused uploads: the clean-up failed']);
    expect(cleanupProblems(null)).toEqual([]);
  });

  it('the emails’ problems and warnings', () => {
    const done = { sent: 3, complete: true, quotaReached: false };
    expect(emailRunProblems({ tripShare: done, onThisDay: done })).toEqual({ problems: [], warnings: [] });
    expect(emailRunProblems({ tripShare: null, onThisDay: done }).problems).toEqual(['“Welcome home” emails failed']);
    expect(emailRunProblems({ tripShare: done, onThisDay: null }).problems).toEqual(['“On this day” emails failed']);
    // The quota: a problem (sign-up emails fail too), never also the warning
    const quota = emailRunProblems({ tripShare: done, onThisDay: { sent: 1, complete: false, quotaReached: true } });
    expect(quota.problems).toHaveLength(1);
    expect(quota.problems[0]).toContain('quota');
    expect(quota.warnings).toEqual([]);
    // Some left out by the day's limit or the time: a warning
    const capped = emailRunProblems({ tripShare: done, onThisDay: { sent: 60, complete: false, quotaReached: false } });
    expect(capped.problems).toEqual([]);
    expect(capped.warnings[0]).toContain('MEMORY_EMAILS_PER_DAY');
  });

  it('a run’s level and message', () => {
    expect(cronRunLevel({})).toBe('INFO');
    expect(cronRunLevel({ warnings: ['w'] })).toBe('WARNING');
    expect(cronRunLevel({ problems: ['p'], warnings: ['w'] })).toBe('ERROR');
    expect(cronRunMessage('emails', {})).toBe('Daily emails: done');
    expect(cronRunMessage('cleanup', { warnings: ['w'] })).toBe('Nightly clean-up: done, with a warning');
    expect(cronRunMessage('cleanup', { problems: ['a'] })).toBe('Nightly clean-up: 1 problem');
    expect(cronRunMessage('emails', { problems: ['a', 'b'] })).toBe('Daily emails: 2 problems');
  });

  it('each job’s last run, late after 26 hours or never', () => {
    const runs = [
      { action: 'cron:emails', level: 'WARNING', createdAt: ago(3), metadata: { problems: [], warnings: ['w'], summary: { sent: 4 } } },
      { action: 'cron:cleanup', level: 'INFO', createdAt: ago(30), metadata: null },
    ];
    expect(cronStatuses(runs, NOW)).toEqual([
      { job: 'cleanup', name: 'Nightly clean-up', time: '04:00 UTC', lastRunAt: ago(30).toISOString(), level: 'INFO', problems: [], warnings: [], summary: null, late: true },
      { job: 'emails', name: 'Daily emails', time: '08:00 UTC', lastRunAt: ago(3).toISOString(), level: 'WARNING', problems: [], warnings: ['w'], summary: { sent: 4 }, late: false },
    ]);
    const never = cronStatuses([], NOW);
    expect(never.every((job) => job.late && job.lastRunAt === null && job.level === null)).toBe(true);
    // Only words are kept from the metadata
    expect(cronStatuses([{ action: 'cron:emails', level: 'ERROR', createdAt: ago(1), metadata: { problems: ['x', 3, null] } }], NOW)[1].problems).toEqual(['x']);
  });
});
