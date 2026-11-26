// The admin pages' own reads and the daily jobs' runs (docs/API.md "Admin", "Emails"; the audit,
// 26 Nov 2026): the overview, gifts by code, referral rewards; each daily run recorded in the
// audit log, the admins emailed when one fails, and the memory emails kept under the day's limit
// and stopped at Resend's quota (setup.js stands in for the quota with __memoryQuotaLeft).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, sentEmails, signUp, uploadPhoto } from './helpers.js';
import { MAGNETIC_POLES_YEAR } from '../../src/utils/specialPlaces.js';

const { sendOnThisDayEmails } = await import('../../src/services/memories/onThisDay.js');

// A day no other test's photos or trips fall on
const NOW = new Date('2026-02-09T08:00:00Z');
const GIFT_CODE = 'GFT2AD3MN4QR';
const CRON_SECRET = 'admin-overview-cron-secret';
const alertsTo = (email) => sentEmails().filter((e) => e.kind === 'alert' && e.to === email);
const runEmails = () => anon().get('/api/emails/on-this-day/cron').set('Authorization', `Bearer ${CRON_SECRET}`);
const lastRun = (job) => prisma.appEvent.findFirst({ where: { domain: 'cron', action: `cron:${job}` }, orderBy: { createdAt: 'desc' } });

let admin;
let member;
let travellers;
let late;

beforeAll(async () => {
  process.env.CRON_SECRET = CRON_SECRET;
  [admin, member] = await Promise.all([signUp('OverviewAdmin'), signUp('OverviewMember')]);
  await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
  await givePlan(member.user.id, { plan: 'REGULAR' });
  // Three people with a photo from this day in an earlier year: three "On this day" candidates
  travellers = await Promise.all([signUp('OverviewTravellerA'), signUp('OverviewTravellerB'), signUp('OverviewTravellerC')]);
  for (const who of travellers) {
    const map = await defaultMapOf(who.agent);
    await uploadPhoto(who.agent, map.id, { countryCode: 'IT', takenAt: '2022-02-09T12:00:00.000Z' });
  }
  // Someone with a memory for the next day
  late = await signUp('OverviewTravellerD');
  await uploadPhoto(late.agent, (await defaultMapOf(late.agent)).id, { countryCode: 'IT', takenAt: '2021-02-10T12:00:00.000Z' });
  await prisma.giftCode.create({
    data: { code: GIFT_CODE, plan: 'REGULAR', months: 12, amountPence: 4900, buyerId: member.user.id, toName: 'Gran', paidAt: new Date() },
  });
  await prisma.referralReward.create({ data: { referrerId: member.user.id, friendId: travellers[0].user.id, kind: 'CAPPED' } });
});

afterEach(() => {
  delete globalThis.__memoryQuotaLeft;
  delete process.env.MEMORY_EMAILS_PER_DAY;
  vi.useRealTimers();
});

afterAll(async () => {
  await prisma.giftCode.deleteMany({ where: { code: GIFT_CODE } });
  await prisma.appEvent.deleteMany({ where: { domain: 'cron' } });
  await cleanUp();
});

describe('the admin pages', () => {
  it('only admins open them', async () => {
    for (const path of ['/api/users/admin/overview', '/api/users/admin/gifts', '/api/users/admin/referrals']) {
      expect((await anon().get(path)).status).toBe(401);
      expect((await member.agent.get(path)).status).toBe(403);
      expect((await admin.agent.get(path)).status).toBe(200);
    }
  });

  it('the overview counts the site', async () => {
    const { overview } = data(await admin.agent.get('/api/users/admin/overview'));
    expect(overview.accounts.total).toBeGreaterThanOrEqual(5);
    expect(overview.accounts.new.day).toBeGreaterThanOrEqual(5);
    expect(overview.maps).toBeGreaterThanOrEqual(5);
    expect(overview.photos.photos).toBeGreaterThanOrEqual(3);
    expect(overview.storageBytes).toBeGreaterThan(0);
    expect(overview.members.paying.REGULAR).toBeGreaterThanOrEqual(1);
    expect(overview.gifts.paid).toBeGreaterThanOrEqual(1);
    expect(overview.gifts.waiting).toBeGreaterThanOrEqual(1);
    expect(overview.referrals.CAPPED).toBeGreaterThanOrEqual(1);
    expect(overview.jobs.map((job) => job.job)).toEqual(['cleanup', 'emails']);
  });

  it('a gift is found by its code, however it is typed, with who bought it', async () => {
    const { gifts } = data(await admin.agent.get('/api/users/admin/gifts?code=gft2-ad3m-n4qr'));
    expect(gifts).toHaveLength(1);
    expect(gifts[0]).toMatchObject({
      code: 'GFT2-AD3M-N4QR',
      plan: 'REGULAR',
      planName: 'Business',
      status: 'READY',
      toName: 'Gran',
      buyer: { name: 'OverviewMember', email: member.email },
      redeemedBy: null,
    });
    // A code nobody has: none; something that can't be a code: 400
    expect(data(await admin.agent.get('/api/users/admin/gifts?code=2222-3333-4444')).gifts).toEqual([]);
    expect((await admin.agent.get('/api/users/admin/gifts?code=!!')).status).toBe(400);
    // No code: the gifts bought last
    expect(data(await admin.agent.get('/api/users/admin/gifts')).gifts.map((g) => g.code)).toContain('GFT2-AD3M-N4QR');
  });

  it('lists the referral rewards with who earned each', async () => {
    const { rewards } = data(await admin.agent.get('/api/users/admin/referrals'));
    expect(rewards.find((r) => r.referrer?.email === member.email)).toMatchObject({
      kind: 'CAPPED',
      friend: { name: 'OverviewTravellerA' },
      grant: null,
    });
  });
});

describe('the memory emails', () => {
  it('stop at the given number, and at Resend’s quota', async () => {
    const none = await sendOnThisDayEmails({ now: NOW, maxEmails: 0 });
    expect(none).toMatchObject({ sent: 0, complete: false, quotaReached: false });
    expect(none.accounts).toBeGreaterThanOrEqual(3);

    globalThis.__memoryQuotaLeft = 1;
    const result = await sendOnThisDayEmails({ now: NOW });
    expect(result).toMatchObject({ sent: 1, complete: false, quotaReached: true });
  });
});

describe('the daily jobs', () => {
  it('a run that hits the quota is recorded as an error and emails the admins', async () => {
    await prisma.appEvent.deleteMany({ where: { domain: 'cron' } });
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-02-10T08:00:00Z') });
    globalThis.__memoryQuotaLeft = 0;
    const res = await runEmails();
    expect(res.status).toBe(200);
    expect(data(res)).toMatchObject({ quotaReached: true, limit: 60 });

    const run = await lastRun('emails');
    expect(run).toMatchObject({ level: 'ERROR', statusCode: 500 });
    expect(run.metadata.problems.join(' ')).toContain('quota');
    expect(alertsTo(admin.email)).toHaveLength(1);
    expect(alertsTo(admin.email)[0]).toMatchObject({ template: 'cronAlertEmail', context: { jobName: 'Daily emails' } });
    expect(alertsTo(member.email)).toHaveLength(0);

    vi.useRealTimers();
    const { overview } = data(await admin.agent.get('/api/users/admin/overview'));
    const emails = overview.jobs.find((job) => job.job === 'emails');
    expect(emails).toMatchObject({ level: 'ERROR' });
    expect(emails.problems.length).toBeGreaterThan(0);
  });

  it('a run kept to the day’s limit is a warning, and nobody is emailed', async () => {
    await prisma.appEvent.deleteMany({ where: { domain: 'cron' } });
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
    process.env.MEMORY_EMAILS_PER_DAY = '0';
    const before = sentEmails().length;
    const res = await runEmails();
    expect(res.status).toBe(200);
    expect(data(res)).toMatchObject({ limit: 0, sent: 0, complete: false });
    expect(data(res).tripShare).toMatchObject({ sent: 0 });
    expect(await lastRun('emails')).toMatchObject({ level: 'WARNING' });
    expect(sentEmails().length).toBe(before);
  });

  // The yearly reminders (utils/reminders.js; 26 Nov 2026, the user's wish): the magnetic poles'
  // pins, emailed to the admins by the nightly job once a year while due, and on the overview
  it('the clean-up emails the admins a yearly reminder once a year while it is due', async () => {
    await prisma.appEvent.deleteMany({ where: { domain: 'cron' } });
    const cleanup = () => anon().get('/api/media-services/cron/cleanup-orphans').set('Authorization', `Bearer ${CRON_SECRET}`);
    const reminders = (email) => alertsTo(email).filter((e) => e.template === 'reminderEmail');
    const before = reminders(admin.email).length;
    // The January after the pins' year (never ahead of the real date: the job purges sessions
    // that have run out, and the test's would have). One emailed the year before doesn't count.
    const year = MAGNETIC_POLES_YEAR + 1;
    await prisma.appEvent.create({
      data: { level: 'INFO', domain: 'cron', action: 'reminder:magneticPoles', message: 'Reminder emailed', metadata: { key: 'magneticPoles', year: year - 1 } },
    });
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(Date.UTC(year, 0, 2, 4)) });

    let res = await cleanup();
    expect(res.status).toBe(200);
    expect(data(res).remindersSent).toBe(1);
    expect(reminders(admin.email)).toHaveLength(before + 1);
    expect(reminders(admin.email).at(-1)).toMatchObject({ context: { reminderTitle: 'Move the magnetic poles' } });
    expect(reminders(admin.email).at(-1).context.text).toContain(`Move them to ${year}'s`);
    expect(reminders(member.email)).toHaveLength(0);
    // The run's own entry keeps the count
    expect((await lastRun('cleanup')).metadata.summary.remindersSent).toBe(1);

    // Not again that year
    res = await cleanup();
    expect(data(res).remindersSent).toBe(0);
    expect(reminders(admin.email)).toHaveLength(before + 1);
    const { overview } = data(await admin.agent.get('/api/users/admin/overview'));
    expect(overview.reminders.map((reminder) => reminder.key)).toEqual(['magneticPoles']);
  });

  it('the clean-up records its run too', async () => {
    await prisma.appEvent.deleteMany({ where: { domain: 'cron' } });
    const res = await anon().get('/api/media-services/cron/cleanup-orphans').set('Authorization', `Bearer ${CRON_SECRET}`);
    expect(res.status).toBe(200);
    const run = await lastRun('cleanup');
    expect(run).toMatchObject({ level: 'INFO', message: 'Nightly clean-up: done' });
    expect(run.metadata.summary).toHaveProperty('expiredSessions');
    const { overview } = data(await admin.agent.get('/api/users/admin/overview'));
    expect(overview.jobs.find((job) => job.job === 'cleanup')).toMatchObject({ level: 'INFO', late: false, problems: [] });
  });
});
