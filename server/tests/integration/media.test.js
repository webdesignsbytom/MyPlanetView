// Generic uploads (avatars, contact images) and the contact form's image and email
// rules. The public bucket is mocked here the way setup.js mocks the private one;
// presigned URLs are still signed for real.
import { afterAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, inBucket, prisma, signUp } from './helpers.js';

vi.mock('../../src/services/s3/s3public.js', async (importOriginal) => {
  const actual = await importOriginal();
  // The fake bucket from setup.js (HEAD, DeleteObject, DeleteObjects)
  const send = (command) => globalThis.__fakeBucketSend(command);
  return {
    ...actual,
    default: { send },
    s3DeleteObject: async ({ key }) => {
      globalThis.__fakeR2.delete(key);
    },
  };
});

const MB = 1024 * 1024;
const PNG = { contentType: 'image/png', bytes: 2048 };
const CONTACT = { name: 'Ada', email: 'ada@example.test', message: 'The map shows the wrong flag.' };

// Anonymous uploads and contact forms aren't removed by cleanUp()
const anonymousKeys = new Set();
const formIds = new Set();
const userIds = new Set();

afterAll(async () => {
  await prisma.contactForm.deleteMany({ where: { id: { in: [...formIds] } } });
  await prisma.mediaItem.deleteMany({ where: { key: { in: [...anonymousKeys] } } });
  // An avatar row would block deleting its MediaItem (onDelete: Restrict)
  await prisma.avatarMediaItem.deleteMany({ where: { userId: { in: [...userIds] } } });
  await cleanUp();
});

const presign = (agent, body) => agent.post('/api/media-services/presign-url').send(body);
const confirm = (agent, key) => agent.post('/api/media-services/confirm-upload').send({ key });
const sendContactForm = (body) => anon().post('/api/contact/create-new-contact-form').send(body);

/** Presign, "PUT" into the fake bucket (as declared unless `put` says otherwise), confirm. */
async function upload(agent, resource, { put, ...declared } = {}) {
  const res = await presign(agent, { resource, filename: 'shot.png', ...PNG, ...declared });
  expect(res.status).toBe(200);
  const { key } = res.body;
  if (resource === 'contact') anonymousKeys.add(key);
  globalThis.__fakeR2.set(key, put ?? { bytes: res.body.bytes, contentType: res.body.contentType });
  return { key, confirmed: await confirm(agent, key) };
}

describe('generic upload presign', () => {
  it('signs the declared type and size; the extension comes from the type, not the name', async () => {
    const res = await presign(anon(), { resource: 'contact', filename: 'evil.html', ...PNG });
    expect(res.status).toBe(200);
    anonymousKeys.add(res.body.key);
    expect(res.body.key).toMatch(/^myplanetview\/contact\/anon\/\d{4}\/\d{2}\/evil_[A-Za-z0-9]+\.png$/);
    expect(new URL(res.body.url).searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(res.body).toMatchObject({ bytes: 2048, contentType: 'image/png', maxBytes: 5 * MB, headers: { 'Content-Type': 'image/png' } });
  });

  it('refuses other types, a missing size, an oversized file and the wrong resource', async () => {
    const visitor = anon();
    expect((await presign(visitor, { resource: 'contact', contentType: 'text/html', bytes: 100 })).status).toBe(400);
    expect((await presign(visitor, { resource: 'contact', contentType: 'image/svg+xml', bytes: 100 })).status).toBe(400);
    expect((await presign(visitor, { resource: 'contact', contentType: 'image/png' })).status).toBe(400);
    expect((await presign(visitor, { resource: 'contact', contentType: 'image/png', bytes: '100' })).status).toBe(400);
    expect((await presign(visitor, { resource: 'contact', contentType: 'image/png', bytes: 5 * MB + 1 })).status).toBe(413);
    expect((await presign(visitor, { resource: 'photo', ...PNG })).status).toBe(400);
    expect((await presign(visitor, { resource: 'avatar', ...PNG })).status).toBe(401);
  });
});

describe('confirm-upload', () => {
  it('confirms a file that arrived as presigned', async () => {
    const { key, confirmed } = await upload(anon(), 'contact');
    expect(confirmed.status).toBe(200);
    expect(confirmed.body).toEqual({ key, bytes: 2048 });
    expect((await prisma.mediaItem.findUnique({ where: { key } })).bytes).toBe(2048);
  });

  it('deletes a file of another type or size; the upload stays unusable', async () => {
    for (const put of [{ bytes: 2048, contentType: 'text/html' }, { bytes: 6 * MB, contentType: 'image/png' }, { bytes: 2048, contentType: 'image/gif' }]) {
      const { key, confirmed } = await upload(anon(), 'contact', { put });
      expect(confirmed.status).toBe(400);
      expect(inBucket(key)).toBe(false);
      // Kept unconfirmed, so the daily clean-up also removes a second PUT on the same URL
      expect((await prisma.mediaItem.findUnique({ where: { key } })).bytes).toBeNull();
    }
  });

  it('answers 400 when nothing arrived', async () => {
    const res = await presign(anon(), { resource: 'contact', ...PNG });
    anonymousKeys.add(res.body.key);
    expect((await confirm(anon(), res.body.key)).status).toBe(400);
  });

  it("treats someone else's upload as unknown", async () => {
    const owner = await signUp('Avatar owner');
    const other = await signUp('Someone else');
    userIds.add(owner.user.id);
    const res = await presign(owner.agent, { resource: 'avatar', ...PNG });
    globalThis.__fakeR2.set(res.body.key, PNG);
    expect((await confirm(other.agent, res.body.key)).status).toBe(404);
    expect((await confirm(anon(), res.body.key)).status).toBe(404);
    expect((await confirm(owner.agent, res.body.key)).status).toBe(200);
  });

  it('answers an unknown key with 404 and a fixed message', async () => {
    const res = await confirm(anon(), 'myplanetview/contact/anon/2026/11/unknown_x.png');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Unknown media key.');
  });
});

describe('contact form', () => {
  it('takes a fresh, confirmed contact image once', async () => {
    const { key } = await upload(anon(), 'contact');
    const first = await sendContactForm({ ...CONTACT, imageKey: key });
    expect(first.status).toBe(201);
    formIds.add(data(first).contactForm.id);
    expect(data(first).contactForm.imageKey).toBe(key);
    // Already on a form
    expect((await sendContactForm({ ...CONTACT, imageKey: key })).status).toBe(400);
  });

  it('refuses an unconfirmed, stale or non-contact image', async () => {
    const unconfirmed = await presign(anon(), { resource: 'contact', ...PNG });
    anonymousKeys.add(unconfirmed.body.key);
    expect((await sendContactForm({ ...CONTACT, imageKey: unconfirmed.body.key })).status).toBe(400);

    const { key: stale } = await upload(anon(), 'contact');
    await prisma.mediaItem.update({ where: { key: stale }, data: { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } });
    expect((await sendContactForm({ ...CONTACT, imageKey: stale })).status).toBe(400);

    const user = await signUp('Contact avatar');
    const { key: avatarKey } = await upload(user.agent, 'avatar');
    expect((await sendContactForm({ ...CONTACT, imageKey: avatarKey })).status).toBe(400);
    expect((await sendContactForm({ ...CONTACT, imageKey: { key: avatarKey } })).status).toBe(400);
  });

  it('needs a valid email address', async () => {
    for (const email of ['', 'ada', 'ada@example', 'Ada <ada@example.test>', 'ada@example.test,eve@example.test', 'ada@example.test\r\nBcc: eve@example.test']) {
      const res = await sendContactForm({ ...CONTACT, email });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Enter a valid email address.');
    }
    const ok = await sendContactForm({ ...CONTACT, email: '  Ada@Example.TEST ' });
    expect(ok.status).toBe(201);
    formIds.add(data(ok).contactForm.id);
    expect(data(ok).contactForm.email).toBe('ada@example.test');
  });
});

describe('avatar', () => {
  it('takes only a confirmed avatar upload of an allowed image type', async () => {
    const user = await signUp('Avatar');
    userIds.add(user.user.id);
    const setAvatar = (key) => user.agent.post('/api/users/user/upload-or-change-avatar').send({ key });

    const unconfirmed = await presign(user.agent, { resource: 'avatar', ...PNG });
    expect((await setAvatar(unconfirmed.body.key)).status).toBe(400);

    const { key: wrongType } = await upload(user.agent, 'avatar');
    await prisma.mediaItem.update({ where: { key: wrongType }, data: { contentType: 'text/html' } });
    expect((await setAvatar(wrongType)).status).toBe(400);

    const { key } = await upload(user.agent, 'avatar', { contentType: 'image/webp', put: { bytes: 2048, contentType: 'image/webp' } });
    expect(key).toMatch(/\.webp$/);
    expect((await setAvatar(key)).status).toBe(200);
  });
});
