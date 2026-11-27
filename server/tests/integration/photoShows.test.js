// Slideshows of chosen photos, shared by a link of their own (25 Nov 2026, the user's wish;
// docs/API.md "Photo slideshows"): a map's editors make one from its photos and videos; anyone
// with the link watches those, in their order, as a share link's viewer would, and nothing
// else of the map; the link can be made new, and the show renamed, changed or deleted.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGINAL_SIZES, anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto, uploadVideo } from './helpers.js';

afterAll(cleanUp);

const CODE = /^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/;

describe('Photo slideshows', () => {
  let owner;
  let editor;
  let viewer;
  let stranger;
  let map;
  let rome;
  let paris;
  let tokyo;
  let hidden;
  let video;
  let unready;
  let strangersPhoto;
  let show;

  // The owner is on First Class, whose maps keep the originals
  const upload = async (agent, mapId, body, sizes = ORIGINAL_SIZES) => {
    const res = await uploadPhoto(agent, mapId, { ...body, sizes });
    if (!data(res)?.photo) throw new Error(`Upload failed (${res.status}): ${JSON.stringify(res.body)}`);
    return data(res).photo;
  };
  const make = (body, agent = owner.agent) => agent.post(`/api/maps/${map.id}/photo-shows`).send(body);

  beforeAll(async () => {
    [owner, editor, viewer, stranger] = await Promise.all([signUp('ShowOwner'), signUp('ShowEditor'), signUp('ShowViewer'), signUp('ShowStranger')]);
    // First Class, for a video
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    rome = await upload(owner.agent, map.id, { latitude: 41.8902, longitude: 12.4922, caption: 'The Colosseum' });
    paris = await upload(owner.agent, map.id, { countryCode: 'FR', caption: 'Paris' });
    tokyo = await upload(owner.agent, map.id, { countryCode: 'JP' });
    hidden = await upload(owner.agent, map.id, { countryCode: 'ES' });
    expect((await owner.agent.patch(`/api/photos/${hidden.id}`).send({ hidden: true })).status).toBe(200);
    video = data(await uploadVideo(owner.agent, map.id, { countryCode: 'IS', caption: 'Geysir' })).photo;
    await prisma.photo.update({ where: { id: video.id }, data: { videoState: 'READY', videoBytes: 90_000_000 } });
    unready = data(await uploadVideo(owner.agent, map.id, { countryCode: 'FI' })).photo;
    strangersPhoto = data(await uploadPhoto(stranger.agent, (await defaultMapOf(stranger.agent)).id, { countryCode: 'DE' })).photo;
  });

  it('an editor makes one from the map’s own photos and videos, none hidden', async () => {
    expect((await make({ photoIds: [] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id, rome.id] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id, hidden.id] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id, strangersPhoto.id] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id], seconds: 4 })).status).toBe(400);
    // A viewer can't; someone not on the map can't see it at all
    expect((await make({ photoIds: [rome.id] }, viewer.agent)).status).toBe(403);
    expect((await make({ photoIds: [rome.id] }, stranger.agent)).status).toBe(404);

    const made = await make({ title: '  Our <b>summer</b>  ', photoIds: [paris.id, video.id, unready.id, rome.id], seconds: 8 });
    expect(made.status).toBe(201);
    show = data(made).show;
    expect(show).toMatchObject({ title: 'Our summer', seconds: 8, photoCount: 4, photoIds: [paris.id, video.id, unready.id, rome.id] });
    expect(show.code).toMatch(CODE);
    // An editor makes one too; no title or seconds given: the usual ones
    const plain = data(await make({ photoIds: [tokyo.id] }, editor.agent)).show;
    expect(plain).toMatchObject({ title: 'A slideshow', seconds: 5, photoCount: 1 });

    const listed = data(await owner.agent.get(`/api/maps/${map.id}/photo-shows`));
    expect(listed.shows.map((s) => s.id)).toEqual([plain.id, show.id]);
    // A First Class map keeps 25 saved
    expect(listed).toMatchObject({ limit: 25, plan: 'PREMIUM' });
    expect((await viewer.agent.get(`/api/maps/${map.id}/photo-shows`)).status).toBe(403);
    expect((await stranger.agent.get(`/api/maps/${map.id}/photo-shows`)).status).toBe(404);
  });

  it('an unverified editor can’t make one', async () => {
    const unverified = await signUp('ShowUnverified', { verified: false });
    const ownMap = await defaultMapOf(unverified.agent);
    expect((await unverified.agent.post(`/api/maps/${ownMap.id}/photo-shows`).send({ photoIds: [] })).status).toBe(403);
  });

  it('anyone with the link opens it: its title, how many and a picture, nothing else of the map', async () => {
    const res = await anon().get(`/api/show/${show.code}`);
    expect(res.status).toBe(200);
    // The video still converting isn't counted, as a viewer can't watch it yet
    expect(data(res).show).toMatchObject({ code: show.code, title: 'Our summer', seconds: 8, photoCount: 3 });
    expect(data(res).show.coverUrl).toContain('display-');
    const text = JSON.stringify(res.body);
    // (The picture's signed link names the map's id in its path, as a share link's photos do:
    // it opens nothing on its own)
    for (const secret of [`"${map.name}"`, owner.email, 'ShowOwner', 'mapId']) expect(text.includes(secret)).toBe(false);
    // The code works however it's written; anything else finds nothing
    expect((await anon().get(`/api/show/${show.code.replace(/-/g, '').toLowerCase()}`)).status).toBe(200);
    expect((await anon().get('/api/show/ZZZZ-ZZZZ-ZZZZ')).status).toBe(404);
    expect((await anon().get('/api/show/not-a-code')).status).toBe(404);
  });

  it('plays its photos and videos in its order, as a share link shows them', async () => {
    const res = await anon().get(`/api/show/${show.code}/photos`);
    expect(res.status).toBe(200);
    const { photos, nextCursor } = data(res);
    expect(photos.map((p) => p.id)).toEqual([paris.id, video.id, rome.id]);
    expect(nextCursor).toBeNull();
    const [photo, clip, colosseum] = photos;
    expect(photo).toMatchObject({ kind: 'PHOTO', caption: 'Paris', countryCode: 'FR' });
    expect(photo.displayUrl).toContain('display-');
    expect(clip).toMatchObject({ kind: 'VIDEO', caption: 'Geysir' });
    expect(clip.videoUrl).toMatch(/^https:\/\//);
    // Never a position, an original, whether it's hidden, or an unconfirmed landmark
    for (const item of photos) {
      for (const key of ['latitude', 'longitude', 'originalUrl', 'hidden', 'videoState', 'best']) expect(item).not.toHaveProperty(key);
    }
    expect(colosseum.landmarks.every((l) => l.confirmed)).toBe(true);
  });

  it('pages and shuffles the same way for the same seed, and starts again when it’s lost its place', async () => {
    const first = data(await anon().get(`/api/show/${show.code}/photos?limit=2`));
    expect(first.photos.map((p) => p.id)).toEqual([paris.id, video.id]);
    expect(first.nextCursor).toBe(video.id);
    const second = data(await anon().get(`/api/show/${show.code}/photos?limit=2&cursor=${first.nextCursor}`));
    expect(second.photos.map((p) => p.id)).toEqual([rome.id]);

    const shuffled = (seed) => anon().get(`/api/show/${show.code}/photos?order=shuffle&seed=${seed}`);
    const once = data(await shuffled(42)).photos.map((p) => p.id);
    expect(data(await shuffled(42)).photos.map((p) => p.id)).toEqual(once);
    expect([...once].sort()).toEqual([paris.id, video.id, rome.id].sort());

    expect((await anon().get(`/api/show/${show.code}/photos?order=shuffle`)).status).toBe(400);
    expect((await anon().get(`/api/show/${show.code}/photos?order=taken`)).status).toBe(400);
    expect((await anon().get(`/api/show/${show.code}/photos?cursor=${tokyo.id}`)).status).toBe(400);
    expect((await anon().get('/api/show/ZZZZ-ZZZZ-ZZZZ/photos')).status).toBe(404);
  });

  it('leaves out a photo hidden or deleted later, and a video once it’s converted joins', async () => {
    const extra = await upload(owner.agent, map.id, { countryCode: 'PT' });
    const later = data(await make({ title: 'Later', photoIds: [extra.id, tokyo.id] })).show;
    expect((await owner.agent.patch(`/api/photos/${tokyo.id}`).send({ hidden: true })).status).toBe(200);
    expect((await owner.agent.delete(`/api/photos/${extra.id}`)).status).toBe(200);
    // Nothing left to play: as good as gone
    expect((await anon().get(`/api/show/${later.code}`)).status).toBe(404);
    expect(data(await anon().get(`/api/show/${later.code}/photos`)).photos).toEqual([]);
    expect((await owner.agent.patch(`/api/photos/${tokyo.id}`).send({ hidden: false })).status).toBe(200);
    expect(data(await anon().get(`/api/show/${later.code}`)).show.photoCount).toBe(1);

    await prisma.photo.update({ where: { id: unready.id }, data: { videoState: 'READY', videoBytes: 90_000_000 } });
    expect(data(await anon().get(`/api/show/${show.code}/photos`)).photos.map((p) => p.id)).toEqual([paris.id, video.id, unready.id, rome.id]);
  });

  it('its editors rename it, change its photos and speed, and give it a new link', async () => {
    const edit = (body, agent = owner.agent) => agent.patch(`/api/photo-shows/${show.id}`).send(body);
    expect((await edit({ title: '   ' })).status).toBe(400);
    expect((await edit({ seconds: 10 })).status).toBe(400);
    expect((await edit({ seconds: null })).status).toBe(400);
    expect((await edit({ photoIds: [hidden.id] })).status).toBe(400);
    expect((await edit({})).status).toBe(400);
    expect((await edit({ title: 'Nope' }, viewer.agent)).status).toBe(403);
    expect((await edit({ title: 'Nope' }, stranger.agent)).status).toBe(404);

    const changed = data(await edit({ title: 'Summer 2026', seconds: 3, photoIds: [rome.id, paris.id] }, editor.agent)).show;
    expect(changed).toMatchObject({ title: 'Summer 2026', seconds: 3, photoIds: [rome.id, paris.id], code: show.code });
    expect(data(await anon().get(`/api/show/${show.code}/photos`)).photos.map((p) => p.id)).toEqual([rome.id, paris.id]);

    // A new link: the old one finds nothing
    expect((await owner.agent.post(`/api/photo-shows/${show.id}/reset-link`)).status).toBe(200);
    const relinked = data(await owner.agent.get(`/api/maps/${map.id}/photo-shows`)).shows.find((s) => s.id === show.id);
    expect(relinked.code).toMatch(CODE);
    expect(relinked.code).not.toBe(show.code);
    expect((await anon().get(`/api/show/${show.code}`)).status).toBe(404);
    expect((await anon().get(`/api/show/${relinked.code}`)).status).toBe(200);
    expect((await viewer.agent.post(`/api/photo-shows/${show.id}/reset-link`)).status).toBe(403);
    show = relinked;
  });

  it('is deleted by its editors, its link with it, and goes with its map', async () => {
    expect((await viewer.agent.delete(`/api/photo-shows/${show.id}`)).status).toBe(403);
    expect((await stranger.agent.delete(`/api/photo-shows/${show.id}`)).status).toBe(404);
    expect((await owner.agent.delete('/api/photo-shows/not-an-id')).status).toBe(404);
    expect((await editor.agent.delete(`/api/photo-shows/${show.id}`)).status).toBe(200);
    expect((await anon().get(`/api/show/${show.code}`)).status).toBe(404);
    expect((await owner.agent.delete(`/api/photo-shows/${show.id}`)).status).toBe(404);

    // A map deleted takes its shows with it
    const spare = data(await owner.agent.post('/api/maps').send({ name: 'Spare map', groupType: 'SOLO', travellers: [{ name: 'Me' }] })).map;
    // (A second map is on Economy, which keeps a print copy instead of the original)
    const sparePhoto = data(await uploadPhoto(owner.agent, spare.id, { countryCode: 'GR' })).photo;
    const spareShow = data(await owner.agent.post(`/api/maps/${spare.id}/photo-shows`).send({ photoIds: [sparePhoto.id] })).show;
    expect((await owner.agent.delete(`/api/maps/${spare.id}`)).status).toBe(200);
    expect(await prisma.photoShow.findUnique({ where: { id: spareShow.id } })).toBeNull();
  });

  // 27 Nov 2026, the user's wish: "2, 10, 25 is the amount per tier", each a list of photo ids
  it('saves as many as the map’s plan keeps: 2 on Economy, 10 on Business, and keeps them when it goes down', async () => {
    const saver = await signUp('ShowSaver');
    const own = await defaultMapOf(saver.agent);
    const photo = data(await uploadPhoto(saver.agent, own.id, { countryCode: 'PT' })).photo;
    const list = async () => data(await saver.agent.get(`/api/maps/${own.id}/photo-shows`));
    const save = () => saver.agent.post(`/api/maps/${own.id}/photo-shows`).send({ photoIds: [photo.id] });

    expect(await list()).toEqual({ shows: [], limit: 2, plan: 'FREE' });
    const first = data(await save()).show;
    expect((await save()).status).toBe(201);
    const full = await save();
    expect(full.status).toBe(409);
    expect(full.body.message).toBe('2 of 2 slideshows saved on this map. Delete one, or upgrade to save more.');
    // Nothing copied: a show is its photos' ids
    expect(await prisma.mediaItem.count({ where: { ownerId: saver.user.id } })).toBe(3);

    // Business keeps 10
    await givePlan(saver.user.id, { plan: 'REGULAR' });
    expect(await list()).toMatchObject({ limit: 10, plan: 'REGULAR' });
    expect((await save()).status).toBe(201);

    // Back on Economy: the three saved stay and still play, and no more until there's room
    await givePlan(saver.user.id, { plan: 'REGULAR', status: 'canceled' });
    expect(await list()).toMatchObject({ limit: 2, plan: 'FREE' });
    expect((await list()).shows).toHaveLength(3);
    expect((await anon().get(`/api/show/${first.code}`)).status).toBe(200);
    expect((await save()).body.message).toBe('2 of 2 slideshows saved on this map. Delete one, or upgrade to save more.');
    for (const s of (await list()).shows.slice(0, 2)) expect((await saver.agent.delete(`/api/photo-shows/${s.id}`)).status).toBe(200);
    expect((await save()).status).toBe(201);
  });

  it('holds 1 to 500 photos and 3, 5 or 8 seconds, by the database’s own checks too', async () => {
    const row = { mapId: map.id, code: 'TEST2CHECK22', title: 'x', photoIds: [rome.id], seconds: 5 };
    await expect(prisma.photoShow.create({ data: { ...row, photoIds: [] } })).rejects.toThrow();
    await expect(prisma.photoShow.create({ data: { ...row, seconds: 4 } })).rejects.toThrow();
    const ok = await prisma.photoShow.create({ data: row });
    await prisma.photoShow.delete({ where: { id: ok.id } });
  });

  it('comes with the owner’s data', async () => {
    const res = await owner.agent.get(`/api/users/export/maps/${map.id}`);
    expect(res.status).toBe(200);
    expect(data(res).map.photoShows).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Later', seconds: 5, photoIds: [expect.any(String), tokyo.id], code: expect.any(String) })]),
    );
  });
});
