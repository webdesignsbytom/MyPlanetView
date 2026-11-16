// Deleting files in bulk, the daily clean-up cron, and the cap on unconfirmed uploads
// (docs/AUDIT.md A9, B8, E). Both buckets are the fake one from setup.js.
import crypto from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, inBucket, prisma, signUp, uploadPhoto } from './helpers.js';

vi.mock('../../src/services/s3/s3public.js', async (importOriginal) => {
  const actual = await importOriginal();
  const send = (command) => globalThis.__fakeBucketSend(command);
  return { ...actual, default: { send } };
});

const { deleteOrphanUploads } = await import('../../src/services/s3/mediaService.js');

const CRON_SECRET = 'integration-cron-secret';
const HOUR = 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms);
const runCron = () => anon().get('/api/media-services/cron/cleanup-orphans').set('Authorization', `Bearer ${CRON_SECRET}`);
const calls = () => globalThis.__fakeR2Calls;
const callsSince = (start) =>
  calls().slice(start).reduce((counts, name) => ({ ...counts, [name]: (counts[name] ?? 0) + 1 }), {});
const photoKeys = async (photoIds) =>
  (await prisma.mediaItem.findMany({ where: { photoVariant: { photoId: { in: photoIds } } }, select: { key: true } })).map((m) => m.key);
const backdate = (keys, when) => prisma.mediaItem.updateMany({ where: { key: { in: keys } }, data: { createdAt: when } });

// Rows made here that cleanUp() (by user) doesn't reach
const anonymousKeys = new Set();
const formIds = new Set();
const verificationIds = new Set();

beforeAll(() => vi.stubEnv('CRON_SECRET', CRON_SECRET));
afterEach(() => {
  globalThis.__fakeR2FailDeletes = false;
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await prisma.contactForm.deleteMany({ where: { id: { in: [...formIds] } } });
  await prisma.mediaItem.deleteMany({ where: { key: { in: [...anonymousKeys] } } });
  await prisma.verification.deleteMany({ where: { id: { in: [...verificationIds] } } });
  await cleanUp();
});

/** A presigned, never confirmed upload (file in the bucket, no PhotoVariant). */
async function unconfirmedPhoto(agent, mapId) {
  const res = await agent.post(`/api/maps/${mapId}/photos/presign`).send({
    files: [
      { size: 'THUMB', contentType: 'image/jpeg', bytes: 1000 },
      { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 2000 },
      { size: 'PRINT', contentType: 'image/jpeg', bytes: 2000 },
    ],
  });
  expect(res.status).toBe(200);
  const keys = data(res).uploads.map((u) => u.key);
  for (const key of keys) globalThis.__fakeR2.set(key, { bytes: 1000, contentType: 'image/jpeg' });
  return keys;
}

/** A confirmed anonymous contact image, optionally on a form. */
async function contactImage({ onForm = false } = {}) {
  const visitor = anon();
  const res = await visitor.post('/api/media-services/presign-url').send({ resource: 'contact', contentType: 'image/png', bytes: 2048 });
  expect(res.status).toBe(200);
  const { key } = res.body;
  anonymousKeys.add(key);
  globalThis.__fakeR2.set(key, { bytes: 2048, contentType: 'image/png' });
  expect((await visitor.post('/api/media-services/confirm-upload').send({ key })).status).toBe(200);
  if (onForm) {
    const form = await visitor
      .post('/api/contact/create-new-contact-form')
      .send({ name: 'Ada', email: 'ada@example.test', message: 'Hello there, a test message.', imageKey: key });
    expect(form.status).toBe(201);
    formIds.add(data(form).contactForm.id);
  }
  return key;
}

describe('deleting a map with many photos', () => {
  it('deletes its files in one DeleteObjects request, after the rows', async () => {
    const owner = await signUp('Bulk');
    await givePlan(owner.user.id, { extraMaps: 1 });
    const map = data(await owner.agent.post('/api/maps').send({ name: 'Bulk', groupType: 'SOLO', travellers: [{ name: 'B' }] })).map;
    const photos = [];
    for (let i = 0; i < 5; i++) photos.push(data(await uploadPhoto(owner.agent, map.id, { countryCode: 'GR' })).photo.id);
    const keys = await photoKeys(photos);
    expect(keys).toHaveLength(15);

    const start = calls().length;
    expect((await owner.agent.delete(`/api/maps/${map.id}`)).status).toBe(200);
    // One request for 15 files (it was one per file)
    expect(callsSince(start)).toEqual({ DeleteObjectsCommand: 1 });
    expect(keys.some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: keys } } })).toBe(0);
    expect(await prisma.photo.count({ where: { id: { in: photos } } })).toBe(0);
  });

  it('leaves only unused files and rows when the bucket fails, and the cron removes them', async () => {
    const owner = await signUp('BulkFail');
    await givePlan(owner.user.id, { extraMaps: 1 });
    const map = data(await owner.agent.post('/api/maps').send({ name: 'Flaky', groupType: 'SOLO', travellers: [{ name: 'F' }] })).map;
    const photo = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'GR' })).photo;
    const keys = await photoKeys([photo.id]);

    globalThis.__fakeR2FailDeletes = true;
    expect((await owner.agent.delete(`/api/maps/${map.id}`)).status).toBe(200);
    // Nothing anyone can open points at a missing file: the map and photo are gone...
    expect(await prisma.travelMap.findUnique({ where: { id: map.id } })).toBeNull();
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).toBeNull();
    // ...and the files stay, with rows nothing uses, for the clean-up
    expect(keys.every(inBucket)).toBe(true);
    expect(await prisma.mediaItem.count({ where: { key: { in: keys }, photoVariant: { is: null } } })).toBe(3);

    globalThis.__fakeR2FailDeletes = false;
    await backdate(keys, ago(2 * HOUR));
    const res = await runCron();
    expect(res.status).toBe(200);
    expect(keys.some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: keys } } })).toBe(0);
  });
});

describe('the clean-up cron', () => {
  let owner;
  let map;
  beforeAll(async () => {
    owner = await signUp('Cron', { verified: true });
    map = await defaultMapOf(owner.agent);
  });

  it('needs the secret', async () => {
    expect((await anon().get('/api/media-services/cron/cleanup-orphans')).status).toBe(401);
    expect((await anon().get('/api/media-services/cron/cleanup-orphans').set('Authorization', 'Bearer nope')).status).toBe(401);
  });

  it('deletes unused uploads by age, and never a saved photo, an avatar in use or a form’s image', async () => {
    const stalePhoto = await unconfirmedPhoto(owner.agent, map.id);
    await backdate(stalePhoto, ago(61 * 60 * 1000));
    const freshPhoto = await unconfirmedPhoto(owner.agent, map.id);
    await backdate(freshPhoto, ago(30 * 60 * 1000));

    const saved = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PT' })).photo;
    const savedKeys = await photoKeys([saved.id]);
    await backdate(savedKeys, ago(48 * HOUR));

    const onForm = await contactImage({ onForm: true });
    const loose = await contactImage();
    const recentLoose = await contactImage();
    await backdate([onForm, loose], ago(25 * HOUR));
    await backdate([recentLoose], ago(2 * HOUR));

    const res = await runCron();
    expect(res.status).toBe(200);
    expect(data(res)).toMatchObject({ complete: true, failed: 0 });

    // Gone: a photo upload never saved after an hour, a contact image on no form after a day
    for (const key of [...stalePhoto, loose]) {
      expect(inBucket(key)).toBe(false);
      expect(await prisma.mediaItem.findUnique({ where: { key } })).toBeNull();
    }
    // Kept: an upload that can still be saved, a saved photo, a form's image, a recent upload
    for (const key of [...freshPhoto, ...savedKeys, onForm, recentLoose]) {
      expect(inBucket(key)).toBe(true);
      expect(await prisma.mediaItem.findUnique({ where: { key } })).not.toBeNull();
    }
  });

  it('works in batches, oldest first, and contact images on forms never hold it up', async () => {
    // More images on forms than a batch holds, all older than the orphans
    for (let i = 0; i < 3; i++) await backdate([await contactImage({ onForm: true })], ago(30 * HOUR));
    const orphans = [await contactImage(), await contactImage(), await contactImage()];
    await backdate(orphans, ago(26 * HOUR));

    const result = await deleteOrphanUploads({ batchSize: 2 });
    expect(result.complete).toBe(true);
    expect(result.batches).toBeGreaterThanOrEqual(2);
    expect(orphans.some(inBucket)).toBe(false);
  });

  it('moves past files it can’t delete, and stops at its deadline', async () => {
    const stuck = [await contactImage(), await contactImage()];
    await backdate(stuck, ago(26 * HOUR));

    globalThis.__fakeR2FailDeletes = true;
    const failing = await deleteOrphanUploads({ batchSize: 1 });
    expect(failing).toMatchObject({ complete: true, deleted: 0 });
    expect(failing.failed).toBeGreaterThanOrEqual(2);
    expect(stuck.every(inBucket)).toBe(true);
    globalThis.__fakeR2FailDeletes = false;

    expect(await deleteOrphanUploads({ deadline: Date.now() - 1 })).toMatchObject({ batches: 0, complete: false });
    expect((await deleteOrphanUploads()).complete).toBe(true);
    expect(stuck.some(inBucket)).toBe(false);
  });

  it('purges expired sessions and verifications, and old invites', async () => {
    const id = () => crypto.randomUUID();
    const expiredSession = await prisma.session.create({
      data: { id: id(), token: id(), expiresAt: ago(HOUR), userId: owner.user.id },
    });
    const liveSession = await prisma.session.create({
      data: { id: id(), token: id(), expiresAt: new Date(Date.now() + HOUR), userId: owner.user.id },
    });
    const expiredVerification = await prisma.verification.create({
      data: { id: id(), identifier: `it-${id()}`, value: 'x', expiresAt: ago(HOUR) },
    });
    verificationIds.add(expiredVerification.id);
    const invite = (fields) =>
      prisma.shareInvite.create({
        data: { mapId: map.id, email: `${id()}@example.test`, invitedById: owner.user.id, tokenHash: id(), ...fields },
      });
    const acceptedLongAgo = await invite({ expiresAt: ago(40 * 24 * HOUR), acceptedAt: ago(45 * 24 * HOUR) });
    const expiredLongAgo = await invite({ expiresAt: ago(31 * 24 * HOUR) });
    const expiredRecently = await invite({ expiresAt: ago(2 * 24 * HOUR) });
    const pending = await invite({ expiresAt: new Date(Date.now() + 14 * 24 * HOUR) });

    const res = await runCron();
    expect(res.status).toBe(200);
    expect(data(res).expiredSessions).toBeGreaterThanOrEqual(1);
    expect(data(res).expiredVerifications).toBeGreaterThanOrEqual(1);
    expect(data(res).oldInvites).toBeGreaterThanOrEqual(2);

    expect(await prisma.session.findUnique({ where: { id: expiredSession.id } })).toBeNull();
    expect(await prisma.session.findUnique({ where: { id: liveSession.id } })).not.toBeNull();
    expect(await prisma.verification.findUnique({ where: { id: expiredVerification.id } })).toBeNull();
    const left = (await prisma.shareInvite.findMany({ where: { mapId: map.id }, select: { id: true } })).map((i) => i.id);
    expect(left).not.toContain(acceptedLongAgo.id);
    expect(left).not.toContain(expiredLongAgo.id);
    expect(left).toEqual(expect.arrayContaining([expiredRecently.id, pending.id]));
  });
});

describe('unconfirmed uploads', () => {
  const unconfirmedRows = (ownerId, resource, count, createdAt = new Date()) =>
    prisma.mediaItem.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        key: `myplanetview/${resource === 'photo' ? 'photos' : 'avatars'}/it-cap/${ownerId}/${crypto.randomUUID()}-${i}`,
        resource,
        kind: 'IMAGE',
        visibility: resource === 'photo' ? 'PRIVATE' : 'PUBLIC',
        contentType: 'image/jpeg',
        ownerId,
        createdAt,
      })),
    });

  it('refuses a photo presign above 60 unfinished files a day (429)', async () => {
    const user = await signUp('Hoarder');
    const map = await defaultMapOf(user.agent);
    const presign = () =>
      user.agent.post(`/api/maps/${map.id}/photos/presign`).send({
        files: ['THUMB', 'DISPLAY', 'PRINT'].map((size) => ({ size, contentType: 'image/jpeg', bytes: 1000 })),
      });
    // Older than a day: no longer counted
    await unconfirmedRows(user.user.id, 'photo', 50, ago(25 * HOUR));
    await unconfirmedRows(user.user.id, 'photo', 57);
    expect((await presign()).status).toBe(200); // 57 + 3 = 60
    const refused = await presign();
    expect(refused.status).toBe(429);
    expect(refused.body.message).toBe('Too many unfinished uploads. Please try again later.');
    // Saving photos frees the count: a confirmed upload isn't unfinished
    await prisma.mediaItem.updateMany({ where: { ownerId: user.user.id, resource: 'photo' }, data: { bytes: 1000 } });
    expect((await uploadPhoto(user.agent, map.id, { countryCode: 'FR' })).status).toBe(201);
  });

  it('refuses an avatar presign above 20 unfinished uploads a day (429)', async () => {
    const user = await signUp('AvatarHoarder');
    await unconfirmedRows(user.user.id, 'avatar', 20);
    const res = await user.agent.post('/api/media-services/presign-url').send({ resource: 'avatar', contentType: 'image/png', bytes: 100 });
    expect(res.status).toBe(429);
    expect(res.body.message).toBe('Too many unfinished uploads. Please try again later.');
  });

  it('won’t save a photo presigned over 50 minutes ago, and deletes its files', async () => {
    const user = await signUp('Slowcoach');
    const map = await defaultMapOf(user.agent);
    const presign = await user.agent.post(`/api/maps/${map.id}/photos/presign`).send({
      files: [
        { size: 'THUMB', contentType: 'image/jpeg', bytes: 40_000 },
        { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 400_000 },
        { size: 'PRINT', contentType: 'image/jpeg', bytes: 400_000 },
      ],
    });
    const { photoId, uploads } = data(presign);
    for (const u of uploads) globalThis.__fakeR2.set(u.key, { bytes: u.bytes, contentType: 'image/jpeg' });
    await backdate(uploads.map((u) => u.key), ago(51 * 60 * 1000));

    const res = await user.agent.post(`/api/maps/${map.id}/photos`).send({
      photoId,
      width: 4000,
      height: 3000,
      variants: uploads.map((u) => ({ size: u.size, key: u.key, width: 400, height: 300 })),
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This upload took too long to finish. Please try again.');
    expect(uploads.some((u) => inBucket(u.key))).toBe(false);
    expect(await prisma.photo.findUnique({ where: { id: photoId } })).toBeNull();
  });
});
