// First Class videos in Cloudflare Stream (docs/API.md "Videos"): uploaded straight to
// Stream, saved with a ticket, PROCESSING until Stream converts them (its notice or a check
// when an editor opens one), then played by anyone who can see them from signed links.
import crypto from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadVideo } from './helpers.js';

afterAll(cleanUp);

const stream = () => globalThis.__fakeStream;
const notice = (body, { secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET, time = Math.floor(Date.now() / 1000) } = {}) => {
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac('sha256', secret).update(`${time}.${raw}`).digest('hex');
  return anon().post('/api/videos/stream-webhook').set('Content-Type', 'application/json').set('Webhook-Signature', `time=${time},sig1=${sig}`).send(raw);
};

describe('videos', () => {
  let owner;
  let viewer;
  let map;

  beforeAll(async () => {
    owner = await signUp('VideoOwner');
    viewer = await signUp('VideoViewer');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
  });

  it('are First Class only, and never go through the photo upload', async () => {
    expect((await uploadVideo(owner.agent, map.id)).status).toBe(403);
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    const business = await uploadVideo(owner.agent, map.id);
    expect(business.status).toBe(403);
    expect(business.body.message).toMatch(/First Class/);
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    expect(data(await owner.agent.get(`/api/maps/${map.id}`)).map.uploadRules.videos).toMatchObject({ perCountry: 20, maxSeconds: 180 });
    const viaPhotos = await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({ kind: 'VIDEO', files: [] });
    expect(viaPhotos.status).toBe(400);
  });

  it('start an upload Stream will hold to three minutes, then save it as processing', async () => {
    const res = await uploadVideo(owner.agent, map.id, { caption: 'Geysir going off', countryCode: 'IS' });
    expect(res.status).toBe(201);
    const saved = data(res).photo;
    expect(saved).toMatchObject({ kind: 'VIDEO', durationS: 90, countryCode: 'IS', videoState: 'PROCESSING', thumbUrl: null, videoUrl: null, latitude: null });
    expect(stream().get(res.streamUid)).toMatchObject({ maxDurationSeconds: 181, meta: { photoId: saved.id, mapId: map.id } });
    expect(await prisma.photo.findUnique({ where: { id: saved.id } })).toMatchObject({ streamUid: res.streamUid, videoBytes: 90_000_000 });

    // Not shown below editor until it's converted
    expect((await viewer.agent.get(`/api/photos/${saved.id}`)).status).toBe(404);
    expect(data(await viewer.agent.get(`/api/maps/${map.id}/photos`)).photos.map((p) => p.id)).not.toContain(saved.id);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/photos`)).photos.find((p) => p.id === saved.id)).toMatchObject({ videoState: 'PROCESSING' });
  });

  it('become ready from Stream’s notice, and play from signed Stream links', async () => {
    const res = await uploadVideo(owner.agent, map.id, { countryCode: 'NO', durationS: 30 });
    const id = data(res).photo.id;
    globalThis.__fakeStreamReady(res.streamUid, { duration: 29.4 });
    const signedNotice = await notice({ ...stream().get(res.streamUid) });
    expect(signedNotice.status).toBe(200);
    expect(signedNotice.body).toMatchObject({ received: true, updated: 1 });

    const forViewer = data(await viewer.agent.get(`/api/photos/${id}`)).photo;
    expect(forViewer).toMatchObject({ kind: 'VIDEO', durationS: 30 });
    expect(forViewer).not.toHaveProperty('videoState');
    expect(forViewer.videoUrl).toMatch(/^https:\/\/customer-itcustomer\.cloudflarestream\.com\/[\w-]+\.[\w-]+\.[\w-]+\/manifest\/video\.m3u8$/);
    expect(forViewer.thumbUrl).toMatch(/\/thumbnails\/thumbnail\.jpg\?time=1s&height=400$/);
    // The token is the video's, signed with the account's key
    const token = forViewer.videoUrl.split('/')[3];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload).toMatchObject({ sub: res.streamUid, kid: 'it-signing-key' });

    const listed = data(await viewer.agent.get(`/api/maps/${map.id}/photos?order=taken&display=1`)).photos.find((p) => p.id === id);
    expect(listed).toMatchObject({ videoUrl: expect.stringContaining('.m3u8'), displayUrl: expect.stringContaining('height=1080') });
    expect(data(await viewer.agent.get(`/api/maps/${map.id}/photos`)).photos.find((p) => p.id === id)).not.toHaveProperty('videoUrl');
  });

  it('refuse a notice with a bad or stale signature', async () => {
    expect((await notice({ uid: 'x' }, { secret: 'wrong' })).status).toBe(400);
    expect((await notice({ uid: 'x' }, { time: Math.floor(Date.now() / 1000) - 3600 })).status).toBe(400);
  });

  it('catch up when an editor opens one whose notice never came', async () => {
    const res = await uploadVideo(owner.agent, map.id, { countryCode: 'SE' });
    const id = data(res).photo.id;
    globalThis.__fakeStreamReady(res.streamUid, { duration: 61 });
    expect(data(await owner.agent.get(`/api/photos/${id}`)).photo).toMatchObject({ durationS: 61, videoUrl: expect.stringContaining('.m3u8') });
    expect((await viewer.agent.get(`/api/photos/${id}`)).status).toBe(200);
  });

  it('check the upload: finished, started here, by this person, not saved twice', async () => {
    const unfinished = await uploadVideo(owner.agent, map.id, { skipUpload: true });
    expect(unfinished.status).toBe(400);
    expect(unfinished.body.message).toMatch(/hasn’t finished/);
    const done = await uploadVideo(owner.agent, map.id, { countryCode: 'DK' });
    expect((await owner.agent.post(`/api/maps/${map.id}/videos`).send({ ticket: done.ticket })).status).toBe(409);
    expect((await viewer.agent.post(`/api/maps/${map.id}/videos`).send({ ticket: done.ticket })).status).toBe(400);
    expect((await owner.agent.post(`/api/maps/${map.id}/videos`).send({ ticket: `${done.ticket}x` })).status).toBe(400);
  });

  it('refuse a wrong length, type or size before anything uploads', async () => {
    expect((await uploadVideo(owner.agent, map.id, { durationS: 181 })).status).toBe(400);
    expect((await uploadVideo(owner.agent, map.id, { contentType: 'video/webm' })).status).toBe(400);
    expect((await uploadVideo(owner.agent, map.id, { bytes: 600 * 1024 * 1024 })).status).toBe(413);
  });

  it('have their own cap per country, counted in the storage too', async () => {
    const existing = await prisma.photo.count({ where: { mapId: map.id, countryCode: 'IS', kind: 'VIDEO' } });
    await prisma.photo.createMany({
      data: [...Array(20 - existing)].map((_, i) => ({
        mapId: map.id, uploaderId: owner.user.id, countryCode: 'IS', kind: 'VIDEO', durationS: 10, width: 1920, height: 1080,
        streamUid: `filler-${map.id}-${i}`, videoState: 'READY', videoBytes: 1000,
      })),
    });
    const full = await uploadVideo(owner.agent, map.id, { countryCode: 'IS' });
    expect(full.status).toBe(409);
    expect(full.body.message).toBe('20 of 20 videos of Iceland on this map.');
  });

  it('are deleted from Stream with their row, and orphans by the daily clean-up', async () => {
    const res = await uploadVideo(owner.agent, map.id, { countryCode: 'FI', ready: true });
    const id = data(res).photo.id;
    expect((await owner.agent.delete(`/api/photos/${id}`)).status).toBe(200);
    expect(stream().has(res.streamUid)).toBe(false);

    // An upload never saved, seven hours old: the clean-up deletes it; a new one it leaves
    const { deleteOrphanStreamVideos } = await import('../../src/services/stream/videos.js');
    const old = await owner.agent.post(`/api/maps/${map.id}/videos/upload`).send({ bytes: 1000, durationS: 5, contentType: 'video/mp4' });
    const oldUid = data(old).uploadUrl.split('/').pop();
    stream().get(oldUid).created = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
    const fresh = await owner.agent.post(`/api/maps/${map.id}/videos/upload`).send({ bytes: 1000, durationS: 5, contentType: 'video/mp4' });
    const freshUid = data(fresh).uploadUrl.split('/').pop();
    const result = await deleteOrphanStreamVideos();
    expect(result.deleted).toBeGreaterThanOrEqual(1);
    expect(stream().has(oldUid)).toBe(false);
    expect(stream().has(freshUid)).toBe(true);
  });

  it('are held to their shape by the database', async () => {
    const row = { mapId: map.id, uploaderId: owner.user.id, width: 10, height: 10 };
    await expect(prisma.photo.create({ data: { ...row, kind: 'VIDEO', durationS: 5 } })).rejects.toThrow();
    await expect(prisma.photo.create({ data: { ...row, kind: 'PHOTO', streamUid: 'x', videoState: 'READY', videoBytes: 1 } })).rejects.toThrow();
  });
});
