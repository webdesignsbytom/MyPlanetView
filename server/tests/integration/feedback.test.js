// Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish): anyone signed in
// sends a report with an optional screenshot in the private bucket; admins list, read, act on and
// delete them; a report goes with its sender's account, and the daily clean-up keeps a used
// screenshot.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, inBucket, prisma, signUp } from './helpers.js';

const { deleteOrphanUploads } = await import('../../src/services/s3/mediaService.js');

const senders = [];
afterAll(async () => {
  // The screenshots' rows lose their owner with the account (SET NULL), so they go first
  await prisma.mediaItem.deleteMany({ where: { resource: 'feedback', ownerId: { in: senders } } });
  await cleanUp();
});

const SHOT = { contentType: 'image/webp', bytes: 220_000 };
const fakeR2 = () => globalThis.__fakeR2;

const PROBLEM = {
  kind: 'PROBLEM',
  details: 'I pressed Save on my trip and nothing happened.',
  expected: 'The trip to be saved.',
  why: 'I lost my notes.',
  impact: 'BLOCKING',
  page: '/maps/6b0c1c2e-0000-4000-8000-000000000001?home=x#top',
  mapId: '6b0c1c2e-0000-4000-8000-000000000001',
  context: { screen: '1920×1080', window: '1280×720', style: 'starry', phone: false, build: 'b123', secret: 'dropped' },
};

describe('feedback', () => {
  let sender;
  let unverified;
  let admin;

  /** The browser's screenshot: presign, "PUT" into the fake bucket. -> its key */
  async function uploadShot(agent, { put = SHOT } = {}) {
    const presign = await agent.post('/api/feedback/screenshot/presign').send(SHOT);
    expect(presign.status).toBe(200);
    const { key, upload } = data(presign);
    expect(upload).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'image/webp' }, bytes: SHOT.bytes });
    if (put) fakeR2().set(key, put);
    return key;
  }

  beforeAll(async () => {
    [sender, admin] = await Promise.all([signUp('FeedbackSender'), signUp('FeedbackAdmin')]);
    unverified = await signUp('FeedbackUnverified', { verified: false });
    senders.push(sender.user.id, unverified.user.id);
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
  });

  it('takes a report from anyone signed in, verified or not, and never from no one', async () => {
    const res = await sender.agent.post('/api/feedback').set('User-Agent', 'TestBrowser/1.0').send(PROBLEM);
    expect(res.status).toBe(201);
    expect(data(res).feedback.reference).toMatch(/^FB-[0-9A-F]{8}$/);
    const row = await prisma.feedbackReport.findUnique({ where: { id: data(res).feedback.id } });
    expect(row).toMatchObject({
      userId: sender.user.id,
      kind: 'PROBLEM',
      details: PROBLEM.details,
      expected: PROBLEM.expected,
      why: PROBLEM.why,
      impact: 'BLOCKING',
      // The path alone, and the map's id
      page: '/maps/6b0c1c2e-0000-4000-8000-000000000001',
      mapId: PROBLEM.mapId,
      userAgent: 'TestBrowser/1.0',
      status: 'NEW',
      screenshotId: null,
    });
    // Only the known details
    expect(row.context).toEqual({ screen: '1920×1080', window: '1280×720', style: 'starry', build: 'b123', phone: false });

    expect((await unverified.agent.post('/api/feedback').send({ kind: 'QUESTION', details: 'How do I verify?' })).status).toBe(201);
    expect((await anon().post('/api/feedback').send({ kind: 'IDEA', details: 'Hello' })).status).toBe(401);
  });

  it('keeps only what each kind asks, and refuses what isn’t a report', async () => {
    const idea = await sender.agent.post('/api/feedback').send({ kind: 'IDEA', details: 'Dark mode', expected: 'x', why: 'Easier at night', impact: 'MINOR' });
    expect(idea.status).toBe(201);
    expect(await prisma.feedbackReport.findUnique({ where: { id: data(idea).feedback.id } })).toMatchObject({ expected: null, why: 'Easier at night', impact: null });

    const bad = (body) => sender.agent.post('/api/feedback').send(body);
    expect((await bad({ kind: 'RANT', details: 'x' })).body.message).toBe('Choose what your message is about.');
    expect((await bad({ kind: 'PROBLEM', details: '   ' })).body.message).toBe('Please tell us a little about it in the first box.');
    expect((await bad({ kind: 'PROBLEM', details: 'x'.repeat(4001) })).status).toBe(400);
    expect((await bad({ kind: 'PROBLEM', details: 'x', impact: 'TERRIBLE' })).status).toBe(400);
  });

  it('carries a screenshot in the private bucket, the sender’s own and fresh only', async () => {
    const key = await uploadShot(sender.agent);
    expect(key).toMatch(new RegExp(`/feedback/${sender.user.id}/shot-[A-Za-z0-9]+\\.webp$`));
    // Someone else's screenshot can't be sent
    expect((await unverified.agent.post('/api/feedback').send({ kind: 'PROBLEM', details: 'x', screenshotKey: key })).status).toBe(400);

    const res = await sender.agent.post('/api/feedback').send({ ...PROBLEM, screenshotKey: key });
    expect(res.status).toBe(201);
    const row = await prisma.feedbackReport.findUnique({ where: { id: data(res).feedback.id }, include: { screenshot: true } });
    expect(row.screenshot).toMatchObject({ key, resource: 'feedback', visibility: 'PRIVATE', bytes: SHOT.bytes });
    // Never twice
    expect((await sender.agent.post('/api/feedback').send({ ...PROBLEM, screenshotKey: key })).status).toBe(400);

    // Not uploaded, or too old
    expect((await sender.agent.post('/api/feedback').send({ ...PROBLEM, screenshotKey: await uploadShot(sender.agent, { put: null }) })).status).toBe(400);
    const stale = await uploadShot(sender.agent);
    await prisma.mediaItem.update({ where: { key: stale }, data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } });
    expect((await sender.agent.post('/api/feedback').send({ ...PROBLEM, screenshotKey: stale })).body.message).toBe('That screenshot took too long to send. Please add it again.');

    // A screenshot that isn't a picture, or too big
    expect((await sender.agent.post('/api/feedback/screenshot/presign').send({ contentType: 'image/svg+xml', bytes: 10 })).status).toBe(400);
    expect((await sender.agent.post('/api/feedback/screenshot/presign').send({ contentType: 'image/png', bytes: 9 * 1024 * 1024 })).status).toBe(413);
    expect((await anon().post('/api/feedback/screenshot/presign').send(SHOT)).status).toBe(401);
  });

  it('lists the reports for admins only, newest first, by status and kind, with their counts', async () => {
    expect((await sender.agent.get('/api/users/admin/feedback')).status).toBe(403);
    expect((await anon().get('/api/users/admin/feedback')).status).toBe(401);

    const res = await admin.agent.get('/api/users/admin/feedback');
    expect(res.status).toBe(200);
    const { reports, counts } = data(res);
    const mine = reports.filter((r) => r.sender?.id === sender.user.id);
    expect(mine.length).toBeGreaterThanOrEqual(3);
    expect(mine[0]).toMatchObject({ kind: 'PROBLEM', impact: 'BLOCKING', status: 'NEW', hasScreenshot: true, sender: { id: sender.user.id } });
    // The list never carries the sender's address
    expect(mine[0].sender.email).toBeUndefined();
    expect(counts.NEW).toBeGreaterThanOrEqual(4);

    const questions = data(await admin.agent.get('/api/users/admin/feedback?kind=QUESTION')).reports;
    expect(questions.every((r) => r.kind === 'QUESTION')).toBe(true);
    expect((await admin.agent.get('/api/users/admin/feedback?status=SOON')).status).toBe(400);
    // A page at a time
    const first = data(await admin.agent.get('/api/users/admin/feedback?limit=1'));
    expect(first.reports).toHaveLength(1);
    const second = data(await admin.agent.get(`/api/users/admin/feedback?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`));
    expect(second.reports[0].id).not.toBe(first.reports[0].id);
  });

  it('shows an admin the whole report, its screenshot signed, and the sender to reply to', async () => {
    const { reports } = data(await admin.agent.get('/api/users/admin/feedback?kind=PROBLEM'));
    const withShot = reports.find((r) => r.sender?.id === sender.user.id && r.hasScreenshot);
    const res = await admin.agent.get(`/api/users/admin/feedback/${withShot.id}`);
    expect(res.status).toBe(200);
    const { report } = data(res);
    expect(report).toMatchObject({ details: PROBLEM.details, expected: PROBLEM.expected, why: PROBLEM.why, sender: { email: sender.email } });
    expect(report.screenshot.url).toContain('/feedback/');
    expect((await sender.agent.get(`/api/users/admin/feedback/${withShot.id}`)).status).toBe(403);
    expect((await admin.agent.get('/api/users/admin/feedback/not-an-id')).status).toBe(404);
  });

  it('lets an admin move a report on and keep notes; closing dates it, opening again clears it', async () => {
    const { reports } = data(await admin.agent.get('/api/users/admin/feedback?status=NEW'));
    const id = reports.find((r) => r.sender?.id === sender.user.id).id;
    const patch = (body) => admin.agent.patch(`/api/users/admin/feedback/${id}`).send(body);

    const working = await patch({ status: 'IN_PROGRESS', adminNotes: 'Seen it on Firefox too.' });
    expect(working.status).toBe(200);
    expect(data(working).report).toMatchObject({ status: 'IN_PROGRESS', adminNotes: 'Seen it on Firefox too.', closedAt: null, updatedBy: { id: admin.user.id } });

    const done = data(await patch({ status: 'DONE' })).report;
    expect(done.closedAt).not.toBeNull();
    // Still done: its date stays
    expect(data(await patch({ adminNotes: 'Fixed in the next release.' })).report.closedAt).toBe(done.closedAt);
    expect(data(await patch({ status: 'NEW' })).report.closedAt).toBeNull();

    expect((await patch({ status: 'MAYBE' })).status).toBe(400);
    expect((await patch({})).status).toBe(400);
    expect((await sender.agent.patch(`/api/users/admin/feedback/${id}`).send({ status: 'DONE' })).status).toBe(403);
  });

  it('keeps a sent screenshot through the daily clean-up, and deleting the report deletes it', async () => {
    const key = await uploadShot(sender.agent);
    const sent = data(await sender.agent.post('/api/feedback').send({ ...PROBLEM, screenshotKey: key })).feedback;
    const unsent = await uploadShot(sender.agent);
    await prisma.mediaItem.updateMany({ where: { key: { in: [key, unsent] } }, data: { createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } });
    expect((await deleteOrphanUploads()).complete).toBe(true);
    expect(inBucket(key)).toBe(true);
    expect(inBucket(unsent)).toBe(false);

    const res = await admin.agent.delete(`/api/users/admin/feedback/${sent.id}`);
    expect(res.status).toBe(200);
    expect(await prisma.feedbackReport.findUnique({ where: { id: sent.id } })).toBeNull();
    expect(inBucket(key)).toBe(false);
    expect((await admin.agent.delete(`/api/users/admin/feedback/${sent.id}`)).status).toBe(404);
  });

  it('puts the sender’s reports in their "Your data" file', async () => {
    const res = await sender.agent.get('/api/users/export');
    expect(res.status).toBe(200);
    const { feedback } = data(res);
    expect(feedback.length).toBeGreaterThanOrEqual(3);
    expect(feedback[0]).toMatchObject({ kind: 'PROBLEM', details: PROBLEM.details, reference: expect.stringMatching(/^FB-/) });
    expect('adminNotes' in feedback[0]).toBe(false);
  });

  it('goes with the sender’s account', async () => {
    const leaver = await signUp('FeedbackLeaver');
    senders.push(leaver.user.id);
    const sent = data(await leaver.agent.post('/api/feedback').send({ kind: 'OTHER', details: 'Bye' })).feedback;
    await prisma.user.delete({ where: { id: leaver.user.id } });
    expect(await prisma.feedbackReport.findUnique({ where: { id: sent.id } })).toBeNull();
  });
});
