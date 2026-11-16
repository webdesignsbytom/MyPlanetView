// First Class videos (docs/API.md, "Videos"): only on a First Class owner's map, MP4 or MOV
// up to 500 MB and 3 minutes, their own cap per country, no position, no landmark stamps,
// and playable by anyone who can see them.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VIDEO_SIZES, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('videos', () => {
  let owner;
  let viewer;
  let map;
  const video = (extra = {}) => uploadPhoto(owner.agent, map.id, { kind: 'VIDEO', durationS: 90, sizes: VIDEO_SIZES, countryCode: 'IS', ...extra });

  beforeAll(async () => {
    owner = await signUp('VideoOwner');
    viewer = await signUp('VideoViewer');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
  });

  it('are First Class only', async () => {
    expect((await video()).status).toBe(403);
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    const business = await video();
    expect(business.status).toBe(403);
    expect(business.body.message).toMatch(/First Class/);
    expect(data(await owner.agent.get(`/api/maps/${map.id}`)).map.uploadRules.videos).toBeNull();
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    expect(data(await owner.agent.get(`/api/maps/${map.id}`)).map.uploadRules.videos).toMatchObject({ perCountry: 20, maxSeconds: 180 });
  });

  it('are saved with their length and no position, and play for viewers', async () => {
    const res = await video({ latitude: 64.1, longitude: -21.9, caption: 'Geysir going off' });
    expect(res.status).toBe(201);
    const saved = data(res).photo;
    expect(saved).toMatchObject({ kind: 'VIDEO', durationS: 90, countryCode: 'IS', latitude: null, longitude: null, videoUrl: expect.any(String) });

    const forViewer = data(await viewer.agent.get(`/api/photos/${saved.id}`)).photo;
    expect(forViewer).toMatchObject({ kind: 'VIDEO', videoUrl: expect.any(String) });
    expect(forViewer).not.toHaveProperty('originalUrl');
    const listed = data(await viewer.agent.get(`/api/maps/${map.id}/photos?order=taken&display=1`)).photos.find((p) => p.id === saved.id);
    expect(listed).toMatchObject({ kind: 'VIDEO', durationS: 90, videoUrl: expect.any(String), displayUrl: expect.any(String) });
    const plain = data(await viewer.agent.get(`/api/maps/${map.id}/photos`)).photos.find((p) => p.id === saved.id);
    expect(plain).not.toHaveProperty('videoUrl');
    expect(data(await owner.agent.get(`/api/maps/${map.id}`)).map.videoCounts).toEqual({ IS: 1 });

    // Never a passport stamp
    const landmark = data(await owner.agent.get('/api/landmarks?country=IS')).landmarks[0];
    expect((await owner.agent.post(`/api/photos/${saved.id}/landmarks`).send({ landmarkId: landmark.id })).status).toBe(400);
  });

  it('refuse a wrong length, type, size or set of files', async () => {
    expect((await video({ durationS: 181 })).status).toBe(400);
    expect((await video({ durationS: undefined })).status).toBe(400);
    expect((await video({ sizes: ['THUMB', 'DISPLAY'] })).status).toBe(400);
    const tooBig = await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({
      kind: 'VIDEO',
      durationS: 60,
      files: [
        { size: 'THUMB', contentType: 'image/jpeg', bytes: 40_000 },
        { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 400_000 },
        { size: 'ORIGINAL', contentType: 'video/mp4', bytes: 600 * 1024 * 1024 },
      ],
    });
    expect(tooBig.status).toBe(413);
    const wrongType = await owner.agent.post(`/api/maps/${map.id}/photos/presign`).send({
      kind: 'VIDEO',
      durationS: 60,
      files: [
        { size: 'THUMB', contentType: 'image/jpeg', bytes: 40_000 },
        { size: 'DISPLAY', contentType: 'image/jpeg', bytes: 400_000 },
        { size: 'ORIGINAL', contentType: 'video/webm', bytes: 1_000_000 },
      ],
    });
    expect(wrongType.status).toBe(400);
    expect((await video({ kind: 'GIF' })).status).toBe(400);
  });

  it('have their own cap per country, apart from photos', async () => {
    const existing = await prisma.photo.count({ where: { mapId: map.id, countryCode: 'IS', kind: 'VIDEO' } });
    await prisma.photo.createMany({
      data: [...Array(20 - existing)].map(() => ({
        mapId: map.id, uploaderId: owner.user.id, countryCode: 'IS', kind: 'VIDEO', durationS: 10, width: 1920, height: 1080,
      })),
    });
    const full = await video();
    expect(full.status).toBe(409);
    expect(full.body.message).toBe('20 of 20 videos of Iceland on this map.');
    // A photo of Iceland still goes in
    expect((await uploadPhoto(owner.agent, map.id, { countryCode: 'IS', sizes: VIDEO_SIZES })).status).toBe(201);
  });

  it('are held to their shape by the database too', async () => {
    const row = { mapId: map.id, uploaderId: owner.user.id, width: 10, height: 10 };
    await expect(prisma.photo.create({ data: { ...row, kind: 'VIDEO' } })).rejects.toThrow();
    await expect(prisma.photo.create({ data: { ...row, kind: 'PHOTO', durationS: 5 } })).rejects.toThrow();
    await expect(prisma.photo.create({ data: { ...row, kind: 'VIDEO', durationS: 5, latitude: 1, longitude: 1 } })).rejects.toThrow();
  });
});
