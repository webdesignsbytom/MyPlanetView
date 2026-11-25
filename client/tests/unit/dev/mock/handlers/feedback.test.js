import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FEEDBACK_MESSAGES as M, cleanPage, closedAtFor, feedbackReference, parseFeedbackInput, parseFeedbackUpdate } from '@/dev/mock/feedback';
import { receiveMockUpload } from '@/dev/mock/uploads';
import { session } from '@/dev/mock/store';
import { USER, db, del, freshStore, get, patch, post, registerAllRoutes, setVerified, signOut, stubObjectUrls, testUser } from '../mockApi';
import * as server from '../../../../../../server/src/utils/feedback.js';
import { EVENT_MESSAGES } from '../../../../../../server/src/utils/responses/responses.js';

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  stubObjectUrls();
});

const ADMIN_LIST = '/api/users/admin/feedback';
const asAdmin = () => {
  testUser().role = 'ADMIN';
};
async function screenshotKey(bytes = 4) {
  const signed = await post('/api/feedback/screenshot/presign', { contentType: 'image/webp', bytes });
  await receiveMockUpload(signed.data.upload.url, new Blob(['a'.repeat(bytes)]), 'image/webp');
  return signed.data.key;
}

// The server's rules, copied (utils/feedback.js)
describe('the mock’s rules are the server’s', () => {
  it('words its refusals as the server does', () => {
    for (const [key, words] of Object.entries(M)) expect(words).toBe(EVENT_MESSAGES[key]);
  });

  it('parses the same reports, changes and pages alike', () => {
    const bodies = [
      { kind: 'PROBLEM', details: ' Save did nothing ', expected: 'It saves', why: 'Notes', impact: 'ANNOYING', page: '/shared/K7QX-M2PA-9RTW/passport?x=1', mapId: 'map-home' },
      { kind: 'IDEA', details: 'Dark mode', expected: 'x', why: 'Night', impact: 'MINOR' },
      { kind: 'QUESTION', details: 'How?', why: 'y' },
      { kind: 'OTHER', details: '' },
      { kind: 'PROBLEM', details: 'x', impact: 'TERRIBLE' },
      { kind: 'PROBLEM', details: 'x'.repeat(4001) },
      { details: 'x' },
    ];
    for (const body of bodies) {
      const mine = parseFeedbackInput(body);
      const theirs = server.parseFeedbackInput(body);
      if (theirs.ok) expect({ ...mine.value, userAgent: null, context: null }).toEqual({ ...theirs.value, userAgent: null, context: null });
      else expect(mine.error).toBe(theirs.error);
    }
    for (const change of [{ status: 'DONE' }, { adminNotes: '' }, { status: 'SOON' }, {}]) {
      const mine = parseFeedbackUpdate(change);
      const theirs = server.parseFeedbackUpdate(change);
      expect(theirs.ok ? mine.value : mine.error).toEqual(theirs.ok ? theirs.value : theirs.error);
    }
    for (const page of ['/invite/abc', '/challenges/join/X', '/maps/m?x', 'http://x']) expect(cleanPage(page)).toBe(server.cleanPage(page));
    expect(feedbackReference('1a2b3c4d-0000')).toBe(server.feedbackReference('1a2b3c4d-0000'));
    expect(closedAtFor('DONE', { status: 'DONE', closedAt: 'then' }, 'now')).toBe('then');
    expect(closedAtFor('NEW', {}, 'now')).toBeNull();
  });
});

describe('sending feedback', () => {
  it('takes a report from anyone signed in, verified or not, with a screenshot they sent', async () => {
    setVerified(false);
    const key = await screenshotKey();
    expect(key.startsWith(`myplanetview/feedback/${USER}/shot-`)).toBe(true);
    const sent = await post('/api/feedback', { kind: 'PROBLEM', details: 'Save did nothing', impact: 'BLOCKING', page: '/maps/map-home', mapId: 'map-home', screenshotKey: key });
    expect(sent.status).toBe(201);
    expect(sent.data.feedback.reference).toMatch(/^FB-[0-9A-F]{8}$/);
    const row = db().feedback.find((f) => f.id === sent.data.feedback.id);
    expect(row).toMatchObject({ userId: USER, kind: 'PROBLEM', status: 'NEW', screenshotKey: key, page: '/maps/map-home' });
  });

  it('refuses someone signed out, a bad report, or a screenshot not theirs, not uploaded or used already', async () => {
    expect((await post('/api/feedback', { kind: 'NOPE', details: 'x' })).message).toBe(M.feedbackKindInvalid);
    expect((await post('/api/feedback/screenshot/presign', { contentType: 'image/svg+xml', bytes: 4 })).message).toBe(M.feedbackScreenshotType);
    expect((await post('/api/feedback/screenshot/presign', { contentType: 'image/png', bytes: 9 * 1024 * 1024 })).status).toBe(413);
    const unsent = (await post('/api/feedback/screenshot/presign', { contentType: 'image/webp', bytes: 4 })).data.key;
    expect((await post('/api/feedback', { kind: 'IDEA', details: 'x', screenshotKey: unsent })).message).toBe(M.feedbackScreenshotInvalid);
    expect((await post('/api/feedback', { kind: 'IDEA', details: 'x', screenshotKey: 'myplanetview/feedback/mock-sam/shot-1.webp' })).message).toBe(M.feedbackScreenshotInvalid);
    const key = await screenshotKey();
    expect((await post('/api/feedback', { kind: 'IDEA', details: 'x', screenshotKey: key })).status).toBe(201);
    expect((await post('/api/feedback', { kind: 'IDEA', details: 'y', screenshotKey: key })).message).toBe(M.feedbackScreenshotInvalid);
    signOut();
    expect((await post('/api/feedback', { kind: 'IDEA', details: 'x' })).status).toBe(401);
    expect((await post('/api/feedback/screenshot/presign', { contentType: 'image/webp', bytes: 4 })).status).toBe(401);
  });

  it('puts what they sent in their own data file, never the admin’s notes', async () => {
    const file = (await get('/api/users/export')).data;
    expect(file.feedback.map((f) => f.kind)).toEqual(['PROBLEM', 'QUESTION']);
    expect(file.feedback[0]).toMatchObject({ reference: 'FB-FB000001', hasScreenshot: true, status: 'NEW' });
    expect('adminNotes' in file.feedback[1]).toBe(false);
  });
});

describe('the admin’s reports', () => {
  it('are for admins only', async () => {
    expect((await get(ADMIN_LIST)).status).toBe(403);
    signOut();
    expect((await get(ADMIN_LIST)).status).toBe(401);
  });

  it('list the seed’s reports newest first, filtered, with each status’s count and a cursor', async () => {
    asAdmin();
    const all = await get(ADMIN_LIST, { limit: 2 });
    expect(all.data.reports.map((r) => r.kind)).toEqual(['PROBLEM', 'IDEA']);
    expect(all.data.counts).toEqual({ NEW: 1, IN_PROGRESS: 1, DONE: 1 });
    expect(all.data.reports[0]).toMatchObject({ hasScreenshot: true, sender: { id: USER, name: 'Charlie Reid' } });
    expect('email' in all.data.reports[0].sender).toBe(false);
    const rest = await get(ADMIN_LIST, { cursor: all.data.nextCursor });
    expect(rest.data.reports.map((r) => r.kind)).toEqual(['QUESTION']);
    expect(rest.data.nextCursor).toBeNull();
    expect((await get(ADMIN_LIST, { status: 'NEW' })).data.reports.map((r) => r.kind)).toEqual(['PROBLEM']);
    expect((await get(ADMIN_LIST, { kind: 'IDEA' })).data.reports.map((r) => r.kind)).toEqual(['IDEA']);
    expect((await get(ADMIN_LIST, { status: 'SOON' })).message).toBe(M.feedbackStatusInvalid);
  });

  it('open one whole, change its status and notes, and delete it with its screenshot', async () => {
    const key = await screenshotKey();
    const id = (await post('/api/feedback', { kind: 'IDEA', details: 'Dark mode', screenshotKey: key })).data.feedback.id;
    asAdmin();
    const report = (await get(`${ADMIN_LIST}/${id}`)).data.report;
    expect(report).toMatchObject({ details: 'Dark mode', sender: { email: 'test@myplanetview.local' }, screenshot: { url: expect.stringMatching(/^blob:/) } });
    const done = (await patch(`${ADMIN_LIST}/${id}`, { status: 'DONE', adminNotes: ' Shipped ' })).data.report;
    expect(done).toMatchObject({ status: 'DONE', adminNotes: 'Shipped', updatedBy: { name: 'Charlie Reid' } });
    expect(done.closedAt).toBeTruthy();
    expect((await patch(`${ADMIN_LIST}/${id}`, { status: 'NEW' })).data.report.closedAt).toBeNull();
    expect((await patch(`${ADMIN_LIST}/${id}`, {})).message).toBe(M.missingFields);
    const gone = await del(`${ADMIN_LIST}/${id}`);
    expect(gone.body.message).toBe(M.feedbackDeleted);
    expect(session.blobs.has(key)).toBe(false);
    expect((await get(`${ADMIN_LIST}/${id}`)).status).toBe(404);
  });

  it('show the seed’s screenshot from the repo’s test photos', async () => {
    asAdmin();
    const report = (await get(`${ADMIN_LIST}/fb000001-0000-4000-8000-000000000001`)).data.report;
    expect(report.screenshot.url).toBe('/seed-photos/eiffel-tower/display.webp');
  });
});
