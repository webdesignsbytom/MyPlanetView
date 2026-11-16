// "Print or download" (docs/API.md, "Downloads"): the photo lists' `best=1` gives editors
// each photo's best copy (the original, or an Economy map's print copy) with its type and
// size, so the browser can zip them. Viewers, share links and trip viewers get 403.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGINAL_SIZES, anon, cleanUp, data, defaultMapOf, givePlan, signUp, uploadPhoto, uploadVideo } from './helpers.js';

afterAll(cleanUp);

describe('download lists (best=1)', () => {
  let owner;
  let editor;
  let viewer;
  let tripEditor;
  let tripViewer;
  let map;
  let trip;
  const ids = {};

  beforeAll(async () => {
    owner = await signUp('DlOwner');
    editor = await signUp('DlEditor');
    viewer = await signUp('DlViewer');
    tripEditor = await signUp('DlTripEditor');
    tripViewer = await signUp('DlTripViewer');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon' })).trip;
    await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: tripEditor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: tripViewer.email, role: 'VIEWER' });
    // Economy: each photo keeps a print copy
    ids.print = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PT', tripId: trip.id })).photo.id;
    ids.hidden = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PT' })).photo.id;
    await owner.agent.patch(`/api/photos/${ids.hidden}`).send({ hidden: true });
  });

  const list = (agent, query) => agent.get(`/api/maps/${map.id}/photos?best=1&${query}`);

  it('gives editors each photo’s best copy: the print copy on Economy', async () => {
    const res = await list(editor.agent, 'country=PT');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const byId = new Map(data(res).photos.map((p) => [p.id, p]));
    // Hidden photos are the editors' too
    expect([...byId.keys()].sort()).toEqual([ids.print, ids.hidden].sort());
    expect(byId.get(ids.print).best).toEqual({
      copy: 'PRINT',
      url: expect.any(String),
      contentType: 'image/jpeg',
      bytes: 1_000_000,
      width: 2400,
      height: 1800,
    });
    // Nothing a download doesn't need
    expect(byId.get(ids.print)).not.toHaveProperty('displayUrl');
  });

  it('gives the original once the owner pays for a plan that keeps it', async () => {
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    const original = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', sizes: ORIGINAL_SIZES })).photo.id;
    const photo = data(await list(owner.agent, 'country=FR')).photos.find((p) => p.id === original);
    expect(photo.best).toMatchObject({ copy: 'ORIGINAL', bytes: 4_000_000, width: 4000 });
  });

  it('pages up to 200 at a time, and only with best=1', async () => {
    const page = data(await list(owner.agent, 'limit=500'));
    expect(page.photos.length).toBeGreaterThan(0);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/photos?limit=1`)).photos).toHaveLength(1);
    expect((await owner.agent.get(`/api/maps/${map.id}/photos?best=yes`)).status).toBe(400);
  });

  it('lists a trip’s best copies for the trip’s editors, never its viewers', async () => {
    const res = await tripEditor.agent.get(`/api/trips/${trip.id}/photos?best=1`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(data(res).photos.map((p) => p.best?.copy)).toEqual(['PRINT']);
    expect((await tripViewer.agent.get(`/api/trips/${trip.id}/photos?best=1`)).status).toBe(403);
    // Their plain list still works
    expect((await tripViewer.agent.get(`/api/trips/${trip.id}/photos`)).status).toBe(200);
  });

  it('refuses viewers and share links, signed in or not', async () => {
    expect((await list(viewer.agent, '')).status).toBe(403);
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    expect((await anon().get(`/api/shared/${shareCode}/photos?best=1`)).status).toBe(403);
    // Not even the map's own editor gets them through the link
    expect((await editor.agent.get(`/api/shared/${shareCode}/photos?best=1`)).status).toBe(403);
    expect((await anon().get(`/api/shared/${shareCode}/photos`)).status).toBe(200);
  });

  it('answers 404 to someone with no role, as every map route does', async () => {
    const stranger = await signUp('DlStranger');
    expect((await list(stranger.agent, '')).status).toBe(404);
  });

  it('lists a video with no file to download', async () => {
    const first = await signUp('DlFirstClass');
    await givePlan(first.user.id, { plan: 'PREMIUM' });
    const own = await defaultMapOf(first.agent);
    const video = data(await uploadVideo(first.agent, own.id, { ready: true })).photo.id;
    const listed = data(await first.agent.get(`/api/maps/${own.id}/photos?best=1`)).photos.find((p) => p.id === video);
    expect(listed).toMatchObject({ kind: 'VIDEO', best: null });
  });
});
