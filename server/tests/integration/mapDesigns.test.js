// A map's own design (docs/API.md "Map designs"): the owner colours countries, the names and
// the grid, and puts a picture of theirs on the sea; everyone who opens the map sees it, a
// share link's visitors too. One picture per map: a new one deletes the old.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, inBucket, prisma, signUp } from './helpers.js';

const { deleteOrphanUploads } = await import('../../src/services/s3/mediaService.js');

const designers = [];
afterAll(async () => {
  // The pictures' rows lose their owner with the account (SET NULL), so they go first
  await prisma.mediaItem.deleteMany({ where: { resource: 'mapDesign', ownerId: { in: designers } } });
  await cleanUp();
});

const PICTURE = { contentType: 'image/webp', bytes: 420_000 };
const fakeR2 = () => globalThis.__fakeR2;

describe('map designs', () => {
  let owner;
  let editor;
  let viewer;
  let stranger;
  let map;

  const designOf = async (agent) => data(await agent.get(`/api/maps/${map.id}`)).map.design;
  const patch = (agent, body) => agent.patch(`/api/maps/${map.id}/design`).send(body);

  /** The browser's upload: presign, "PUT" into the fake bucket, save. -> the save's response */
  async function uploadPicture(agent, { put = PICTURE, file = PICTURE } = {}) {
    const presign = await agent.post(`/api/maps/${map.id}/design/picture/presign`).send(file);
    if (presign.status !== 200) return presign;
    const { key } = data(presign);
    if (put) fakeR2().set(key, { bytes: put.bytes, contentType: put.contentType });
    const res = await agent.put(`/api/maps/${map.id}/design/picture`).send({ key });
    res.key = key;
    return res;
  }

  beforeAll(async () => {
    [owner, editor, viewer, stranger] = await Promise.all(['DesignOwner', 'DesignEditor', 'DesignViewer', 'DesignStranger'].map((n) => signUp(n)));
    designers.push(owner.user.id, editor.user.id);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' })).status).toBe(201);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
  });

  it('starts with none', async () => {
    expect(await designOf(owner.agent)).toBeNull();
  });

  it('saves colours, and gives them to everyone who opens the map', async () => {
    const res = await patch(owner.agent, { countries: { FR: '#AA0000', XE: '#00aa00', AQ: '#ffffff' }, names: '#ffffff', grid: '#ffcc00' });
    expect(res.status).toBe(200);
    expect(data(res).design).toEqual({
      shown: true,
      countries: { FR: '#aa0000', XE: '#00aa00', AQ: '#ffffff' },
      names: '#ffffff',
      grid: '#ffcc00',
      picture: null,
    });
    expect(await designOf(viewer.agent)).toMatchObject({ countries: { FR: '#aa0000' }, names: '#ffffff' });

    // A change keeps what it doesn't name; `countries` replaces the set
    expect(data(await patch(owner.agent, { countries: { FR: '#aa0000' }, grid: null })).design).toMatchObject({
      countries: { FR: '#aa0000' },
      names: '#ffffff',
      grid: null,
    });
  });

  it('can be turned off and on again, keeping it', async () => {
    expect(data(await patch(owner.agent, { shown: false })).design).toMatchObject({ shown: false, countries: { FR: '#aa0000' } });
    expect(data(await patch(owner.agent, { shown: true })).design.shown).toBe(true);
  });

  it('refuses bad colours and places', async () => {
    for (const body of [{ names: 'white' }, { countries: { FR: 'red' } }, { countries: { XN: '#000000' } }, { countries: { ZZ: '#000000' } }, {}]) {
      expect((await patch(owner.agent, body)).status).toBe(400);
    }
  });

  it('only the owner (and co-owners) change it; strangers get a 404', async () => {
    expect((await patch(editor.agent, { names: '#000000' })).status).toBe(403);
    expect((await patch(viewer.agent, { names: '#000000' })).status).toBe(403);
    expect((await patch(stranger.agent, { names: '#000000' })).status).toBe(404);
    expect((await editor.agent.post(`/api/maps/${map.id}/design/picture/presign`).send(PICTURE)).status).toBe(403);
    expect((await editor.agent.delete(`/api/maps/${map.id}/design/picture`)).status).toBe(403);
  });

  it('puts a picture on the sea, which a new one replaces and deletes', async () => {
    const first = await uploadPicture(owner.agent);
    expect(first.status).toBe(200);
    expect(data(first).design.picture.url).toContain('designs');
    expect(inBucket(first.key)).toBe(true);
    expect((await designOf(viewer.agent)).picture).not.toBeNull();

    const second = await uploadPicture(owner.agent);
    expect(second.status).toBe(200);
    expect(inBucket(second.key)).toBe(true);
    expect(inBucket(first.key)).toBe(false);
    expect(await prisma.mediaItem.findUnique({ where: { key: first.key } })).toBeNull();
    expect((await prisma.mapDesign.findUnique({ where: { mapId: map.id }, include: { picture: true } })).picture.key).toBe(second.key);
  });

  it('refuses a picture that is not a web image, too big, or not what was presigned', async () => {
    expect((await uploadPicture(owner.agent, { file: { contentType: 'image/svg+xml', bytes: 100 } })).status).toBe(400);
    expect((await uploadPicture(owner.agent, { file: { contentType: 'image/png', bytes: 9 * 1024 * 1024 } })).status).toBe(413);

    const wrongType = await uploadPicture(owner.agent, { put: { contentType: 'text/html', bytes: PICTURE.bytes } });
    expect(wrongType.status).toBe(400);
    expect(inBucket(wrongType.key)).toBe(false);
    expect((await uploadPicture(owner.agent, { put: null })).status).toBe(400);

    // Another map's folder, or someone else's upload, can't be named
    const elsewhere = await owner.agent.put(`/api/maps/${map.id}/design/picture`).send({ key: 'myplanetview/designs/other/sea-x.webp' });
    expect(elsewhere.status).toBe(400);
  });

  it('needs a verified email to upload, not to remove', async () => {
    const unverified = await signUp('DesignUnverified', { verified: false });
    designers.push(unverified.user.id);
    const own = await defaultMapOf(unverified.agent);
    expect((await unverified.agent.post(`/api/maps/${own.id}/design/picture/presign`).send(PICTURE)).status).toBe(403);
    expect((await unverified.agent.patch(`/api/maps/${own.id}/design`).send({ names: '#000000' })).status).toBe(200);
    expect((await unverified.agent.delete(`/api/maps/${own.id}/design/picture`)).status).toBe(200);
  });

  it('shows on a share link', async () => {
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const { shareCode } = await prisma.travelMap.findUnique({ where: { id: map.id }, select: { shareCode: true } });
    const shared = data(await anon().get(`/api/shared/${shareCode}`));
    expect(shared.map.design).toMatchObject({ shown: true, countries: { FR: '#aa0000' } });
    expect(shared.map.design.picture.url).toContain('designs');
  });

  it('the daily clean-up keeps a picture in use, and removes an unsaved one', async () => {
    const used = (await prisma.mapDesign.findUnique({ where: { mapId: map.id }, include: { picture: true } })).picture.key;
    const presign = data(await owner.agent.post(`/api/maps/${map.id}/design/picture/presign`).send(PICTURE));
    fakeR2().set(presign.key, PICTURE);
    await prisma.mediaItem.updateMany({ where: { key: { in: [used, presign.key] } }, data: { createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } });

    expect((await deleteOrphanUploads()).complete).toBe(true);
    expect(inBucket(used)).toBe(true);
    expect(inBucket(presign.key)).toBe(false);
  });

  it('removes the picture, and deleting the map deletes its file', async () => {
    const removed = await owner.agent.delete(`/api/maps/${map.id}/design/picture`);
    expect(removed.status).toBe(200);
    expect(data(removed).design.picture).toBeNull();

    // A second map with a picture, then deleted
    const other = data(await owner.agent.post('/api/maps').send({ name: 'Designed', groupType: 'SOLO', travellers: [{ name: 'Me' }] })).map;
    const saved = await (async () => {
      const presign = data(await owner.agent.post(`/api/maps/${other.id}/design/picture/presign`).send(PICTURE));
      fakeR2().set(presign.key, PICTURE);
      expect((await owner.agent.put(`/api/maps/${other.id}/design/picture`).send({ key: presign.key })).status).toBe(200);
      return presign.key;
    })();
    expect((await owner.agent.delete(`/api/maps/${other.id}`)).status).toBe(200);
    expect(inBucket(saved)).toBe(false);
    expect(await prisma.mediaItem.findUnique({ where: { key: saved } })).toBeNull();
  });
});
