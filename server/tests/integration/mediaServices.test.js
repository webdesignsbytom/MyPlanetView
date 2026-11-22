// The generic media routes not covered by media.test.js: the ping, signed view links and
// deleting an object. They only handle avatars and contact images: a travel photo's or a
// map design's key is refused (CLAUDE.md "The photo pipeline"). The public bucket is the
// fake one from setup.js, as in media.test.js.
import { afterAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, inBucket, prisma, signUp, uploadPhoto } from './helpers.js';

vi.mock('../../src/services/s3/s3public.js', async (importOriginal) => {
  const actual = await importOriginal();
  const send = (command) => globalThis.__fakeBucketSend(command);
  return { ...actual, default: { send } };
});

const PNG = { contentType: 'image/png', bytes: 2048 };
const getUrl = (agent, query) => agent.get('/api/media-services/get-url').query(query);
const deleteObject = (agent, query) => agent.delete('/api/media-services/delete-object').query(query);

const anonymousKeys = new Set();
const userIds = new Set();
afterAll(async () => {
  await prisma.mediaItem.deleteMany({ where: { key: { in: [...anonymousKeys] } } });
  await prisma.avatarMediaItem.deleteMany({ where: { userId: { in: [...userIds] } } });
  await cleanUp();
});

async function withRole(label, role = 'USER') {
  const person = await signUp(label);
  userIds.add(person.user.id);
  if (role !== 'USER') await prisma.user.update({ where: { id: person.user.id }, data: { role } });
  return person;
}

/** A confirmed generic upload (an avatar for `agent`, or a visitor's contact image). */
async function upload(agent, resource) {
  const presign = await agent.post('/api/media-services/presign-url').send({ resource, filename: 'shot.png', ...PNG });
  expect(presign.status).toBe(200);
  const { key } = presign.body;
  if (resource === 'contact') anonymousKeys.add(key);
  globalThis.__fakeR2.set(key, { ...PNG });
  expect((await agent.post('/api/media-services/confirm-upload').send({ key })).status).toBe(200);
  return key;
}

describe('GET /api/media-services/ping', () => {
  it('answers anyone', async () => {
    const res = await anon().get('/api/media-services/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('GET /api/media-services/get-url', () => {
  it('signs a short view link for an avatar, for any signed-in user', async () => {
    const owner = await withRole('Viewed');
    const viewer = await withRole('Viewer');
    const key = await upload(owner.agent, 'avatar');

    const res = await getUrl(viewer.agent, { key });
    expect(res.status).toBe(200);
    expect(res.body.expiresIn).toBe(300);
    const url = new URL(res.body.url);
    expect(url.pathname).toContain(key);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
  });

  it('keeps the life of a link between 1 second and 7 days', async () => {
    const owner = await withRole('Ttl');
    const key = await upload(owner.agent, 'avatar');
    expect((await getUrl(owner.agent, { key, ttl: 60 })).body.expiresIn).toBe(60);
    expect((await getUrl(owner.agent, { key, ttl: 999999999 })).body.expiresIn).toBe(7 * 24 * 60 * 60);
    expect((await getUrl(owner.agent, { key, ttl: -5 })).body.expiresIn).toBe(1);
    expect((await getUrl(owner.agent, { key, ttl: 'soon' })).body.expiresIn).toBe(300);
  });

  it('shows contact images to admins and developers only', async () => {
    const key = await upload(anon(), 'contact');
    const user = await withRole('Contact peeker');
    const admin = await withRole('Contact viewer', 'ADMIN');
    const developer = await withRole('Contact viewer 2', 'DEVELOPER');
    const refused = await getUrl(user.agent, { key });
    expect(refused.status).toBe(403);
    expect(refused.body.message).toBe('Not authorized to view this object.');
    expect((await getUrl(admin.agent, { key })).status).toBe(200);
    expect((await getUrl(developer.agent, { key })).status).toBe(200);
  });

  it("refuses a travel photo's or a map design's key, any other prefix, and no key", async () => {
    const owner = await withRole('Photo owner');
    const map = await defaultMapOf(owner.agent);
    const photo = await uploadPhoto(owner.agent, map.id, { countryCode: 'FR' });
    expect(photo.status).toBe(201);
    const photoKey = photo.uploadedKeys[0];
    for (const key of [photoKey, `myplanetview/designs/${map.id}/sea-abc.webp`, 'elsewhere/secret.png', '../myplanetview/avatars/x.png']) {
      const res = await getUrl(owner.agent, { key });
      expect(res.status, key).toBe(400);
      expect(res.body.message).toBe('Key prefix not allowed');
    }
    expect((await getUrl(owner.agent, {})).status).toBe(400);
  });

  it('needs a session', async () => {
    expect((await getUrl(anon(), { key: 'myplanetview/avatars/x.png' })).status).toBe(401);
  });
});

describe('DELETE /api/media-services/delete-object', () => {
  it("deletes the owner's own upload, file and row", async () => {
    const owner = await withRole('Deleter');
    const key = await upload(owner.agent, 'avatar');
    const res = await deleteObject(owner.agent, { key });
    expect(res.status).toBe(204);
    expect(inBucket(key)).toBe(false);
    expect(await prisma.mediaItem.findUnique({ where: { key } })).toBeNull();
  });

  it("refuses someone else's upload, and a visitor's contact image to a plain user", async () => {
    const owner = await withRole('Kept');
    const other = await withRole('Not the owner');
    const avatarKey = await upload(owner.agent, 'avatar');
    const contactKey = await upload(anon(), 'contact');
    for (const key of [avatarKey, contactKey]) {
      const res = await deleteObject(other.agent, { key });
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to delete this object.');
      expect(inBucket(key)).toBe(true);
      expect(await prisma.mediaItem.findUnique({ where: { key } })).not.toBeNull();
    }
  });

  it("lets an admin or a developer delete anyone's", async () => {
    const owner = await withRole('Moderated');
    const admin = await withRole('Media admin', 'ADMIN');
    const developer = await withRole('Media developer', 'DEVELOPER');
    const avatarKey = await upload(owner.agent, 'avatar');
    const contactKey = await upload(anon(), 'contact');
    expect((await deleteObject(admin.agent, { key: avatarKey })).status).toBe(204);
    expect((await deleteObject(developer.agent, { key: contactKey })).status).toBe(204);
    expect(inBucket(avatarKey)).toBe(false);
    expect(inBucket(contactKey)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: [avatarKey, contactKey] } } })).toBe(0);
  });

  it("never deletes a travel photo's file, even for an admin", async () => {
    const owner = await withRole('Photo keeper');
    const admin = await withRole('Photo admin', 'ADMIN');
    const map = await defaultMapOf(owner.agent);
    const photo = await uploadPhoto(owner.agent, map.id, { countryCode: 'IT' });
    expect(photo.status).toBe(201);
    for (const agent of [owner.agent, admin.agent]) {
      for (const key of photo.uploadedKeys) {
        const res = await deleteObject(agent, { key });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Key prefix not allowed');
      }
    }
    expect(photo.uploadedKeys.every(inBucket)).toBe(true);
    expect(await prisma.photoVariant.count({ where: { photoId: data(photo).photo.id } })).toBe(3);
  });

  it('refuses no key (400) and a visitor (401)', async () => {
    const owner = await withRole('Keyless');
    expect((await deleteObject(owner.agent, {})).status).toBe(400);
    const key = await upload(owner.agent, 'avatar');
    expect((await deleteObject(anon(), { key })).status).toBe(401);
    expect(inBucket(key)).toBe(true);
  });

  // Until 22 Nov 2026 the file went and its row stayed (the avatar holds it, onDelete:
  // Restrict), so the avatar pointed at nothing. Nothing in the client calls this route
  // (CLAUDE.md "Unused code": deleteMediaObject); removing an avatar has its own route.
  it('refuses to delete the file of an avatar still in use', async () => {
    const owner = await withRole('Avatar in use');
    const key = await upload(owner.agent, 'avatar');
    expect((await owner.agent.post('/api/users/user/upload-or-change-avatar').send({ key })).status).toBe(200);
    const res = await deleteObject(owner.agent, { key });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('This file is still in use, so it can’t be deleted.');
    expect(inBucket(key)).toBe(true);
    expect(await prisma.mediaItem.count({ where: { key } })).toBe(1);
  });

  it('refuses to delete a contact form’s image, even for an admin', async () => {
    const admin = await withRole('Admin, form image', 'ADMIN');
    const key = await upload(anon(), 'contact');
    const form = await anon()
      .post('/api/contact/create-new-contact-form')
      .send({ name: 'Ada', email: 'ada@example.test', message: 'A photo of the problem, attached.', imageKey: key });
    expect(form.status).toBe(201);
    try {
      expect((await deleteObject(admin.agent, { key })).status).toBe(409);
      expect(inBucket(key)).toBe(true);
    } finally {
      await prisma.contactForm.delete({ where: { id: data(form).contactForm.id } });
    }
  });

  it('still asks for the owner or an admin before saying a file is in use', async () => {
    const owner = await withRole('Avatar, a stranger asks');
    const stranger = await withRole('Stranger');
    const key = await upload(owner.agent, 'avatar');
    expect((await owner.agent.post('/api/users/user/upload-or-change-avatar').send({ key })).status).toBe(200);
    expect((await deleteObject(stranger.agent, { key })).status).toBe(403);
  });
});
