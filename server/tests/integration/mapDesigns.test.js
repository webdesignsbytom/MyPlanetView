// A map's own design (docs/API.md "Map designs"): the owner colours countries, the names and
// the grid, and puts a picture of theirs on the sea; everyone who opens the map sees it, a
// share link's visitors too. One design per map style (22 Nov 2026), each with one picture:
// a new one deletes the old.
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

  // The World map's design unless another style is named
  const designsOf = async (agent) => data(await agent.get(`/api/maps/${map.id}`)).map.designs;
  const designOf = async (agent, style = 'animated') => (await designsOf(agent))[style] ?? null;
  const patch = (agent, body) => agent.patch(`/api/maps/${map.id}/design`).send({ style: 'animated', ...body });
  const removePicture = (agent, mapId = map.id, style = 'animated') => agent.delete(`/api/maps/${mapId}/design/picture?style=${style}`);
  const designRow = (style = 'animated') =>
    prisma.mapDesign.findUnique({ where: { mapId_style: { mapId: map.id, style } }, include: { picture: true } });

  /** The browser's upload: presign, "PUT" into the fake bucket, save. -> the save's response */
  async function uploadPicture(agent, { put = PICTURE, file = PICTURE, style = 'animated' } = {}) {
    const presign = await agent.post(`/api/maps/${map.id}/design/picture/presign`).send(file);
    if (presign.status !== 200) return presign;
    const { key } = data(presign);
    if (put) fakeR2().set(key, { bytes: put.bytes, contentType: put.contentType });
    const res = await agent.put(`/api/maps/${map.id}/design/picture`).send({ key, style });
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
    expect(await designsOf(owner.agent)).toEqual({});
  });

  it('saves colours, and gives them to everyone who opens the map', async () => {
    const res = await patch(owner.agent, { countries: { FR: '#AA0000', XE: '#00aa00', AQ: '#ffffff' }, names: '#ffffff', grid: '#ffcc00' });
    expect(res.status).toBe(200);
    expect(data(res).design).toEqual({
      style: 'animated',
      shown: true,
      countries: { FR: '#aa0000', XE: '#00aa00', AQ: '#ffffff' },
      names: '#ffffff',
      grid: '#ffcc00',
      hover: null,
      string: null,
      stringTwist: null,
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

  it('saves the colour of the country under the pointer, and gives it to everyone', async () => {
    expect(data(await patch(owner.agent, { hover: '#FF00AA' })).design).toMatchObject({ hover: '#ff00aa', names: '#ffffff' });
    expect((await designOf(viewer.agent)).hover).toBe('#ff00aa');
    // "Your data" carries it with the rest of the style's design
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.designs;
    expect(exported.find((design) => design.style === 'animated')).toMatchObject({
      hoverColour: '#ff00aa',
      namesColour: '#ffffff',
      hasSeaPicture: false,
    });
    expect((await patch(owner.agent, { hover: 'pink' })).status).toBe(400);
    // The database refuses a malformed one too (CHECK map_design_hover_colour)
    await expect(
      prisma.mapDesign.update({ where: { mapId_style: { mapId: map.id, style: 'animated' } }, data: { hoverColour: 'pink' } }),
    ).rejects.toThrow();
    // Back to the style's usual highlight
    expect(data(await patch(owner.agent, { hover: null })).design.hover).toBeNull();
  });

  it('saves the colour of the strings between places, and gives it to everyone', async () => {
    expect(data(await patch(owner.agent, { string: '#1D4ED8' })).design).toMatchObject({ string: '#1d4ed8', names: '#ffffff' });
    expect((await designOf(viewer.agent)).string).toBe('#1d4ed8');
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.designs;
    expect(exported.find((design) => design.style === 'animated')).toMatchObject({ stringColour: '#1d4ed8' });
    expect((await patch(owner.agent, { string: 'blue' })).status).toBe(400);
    // The database refuses a malformed one too (CHECK map_design_string_colour)
    await expect(
      prisma.mapDesign.update({ where: { mapId_style: { mapId: map.id, style: 'animated' } }, data: { stringColour: 'blue' } }),
    ).rejects.toThrow();
    // Back to the style's usual red
    expect(data(await patch(owner.agent, { string: null })).design.string).toBeNull();
  });

  // See-through strings (25 Nov 2026, the user's wish): "#rrggbbaa", for the strings only
  it('saves a see-through string colour, and keeps a fully opaque one as six digits', async () => {
    expect(data(await patch(owner.agent, { string: '#1D4ED866' })).design.string).toBe('#1d4ed866');
    expect((await designOf(viewer.agent)).string).toBe('#1d4ed866');
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.designs;
    expect(exported.find((design) => design.style === 'animated')).toMatchObject({ stringColour: '#1d4ed866' });
    expect(data(await patch(owner.agent, { string: '#1d4ed8ff' })).design.string).toBe('#1d4ed8');
    // Never the other colours
    expect((await patch(owner.agent, { names: '#ffffff80' })).status).toBe(400);
    // The database takes the eight digits and refuses anything longer (CHECK map_design_string_colour)
    const where = { mapId_style: { mapId: map.id, style: 'animated' } };
    await expect(prisma.mapDesign.update({ where, data: { stringColour: '#1d4ed800' } })).resolves.toBeTruthy();
    await expect(prisma.mapDesign.update({ where, data: { stringColour: '#1d4ed8000' } })).rejects.toThrow();
    expect(data(await patch(owner.agent, { string: null })).design.string).toBeNull();
  });

  // Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish)
  it('saves a second colour twisted into the strings, and takes it off again', async () => {
    const twined = data(await patch(owner.agent, { string: '#C8102E', stringTwist: '#FFFFFF' })).design;
    expect(twined).toMatchObject({ string: '#c8102e', stringTwist: '#ffffff' });
    expect(await designOf(viewer.agent)).toMatchObject({ string: '#c8102e', stringTwist: '#ffffff' });
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map.designs;
    expect(exported.find((design) => design.style === 'animated')).toMatchObject({ stringColour: '#c8102e', stringTwistColour: '#ffffff' });
    // Opaque only, and the database says so too (CHECK map_design_string_twist_colour)
    expect((await patch(owner.agent, { stringTwist: '#ffffff80' })).status).toBe(400);
    const where = { mapId_style: { mapId: map.id, style: 'animated' } };
    await expect(prisma.mapDesign.update({ where, data: { stringTwistColour: 'white' } })).rejects.toThrow();
    // Back to one colour; the first is kept
    expect(data(await patch(owner.agent, { stringTwist: null })).design).toMatchObject({ string: '#c8102e', stringTwist: null });
    await patch(owner.agent, { string: null });
  });

  it('can be turned off and on again, keeping it', async () => {
    expect(data(await patch(owner.agent, { shown: false })).design).toMatchObject({ shown: false, countries: { FR: '#aa0000' } });
    expect(data(await patch(owner.agent, { shown: true })).design.shown).toBe(true);
  });

  it('refuses bad colours and places, and a style that isn’t one', async () => {
    for (const body of [{ names: 'white' }, { countries: { FR: 'red' } }, { countries: { XN: '#000000' } }, { countries: { ZZ: '#000000' } }, {}]) {
      expect((await patch(owner.agent, body)).status).toBe(400);
    }
    for (const style of [undefined, null, 'jupiter']) {
      expect((await owner.agent.patch(`/api/maps/${map.id}/design`).send({ style, names: '#000000' })).status).toBe(400);
    }
    expect((await owner.agent.delete(`/api/maps/${map.id}/design/picture`)).status).toBe(400);
  });

  it('keeps one design per map style, each shown in its own style', async () => {
    const starry = await patch(owner.agent, { style: 'starry', names: '#ff0000', countries: { JP: '#123456' } });
    expect(starry.status).toBe(200);
    expect(data(starry).design).toMatchObject({ style: 'starry', shown: true, names: '#ff0000', countries: { JP: '#123456' } });
    // The World map's is untouched, and both reach everyone on the map
    const designs = await designsOf(viewer.agent);
    expect(Object.keys(designs).sort()).toEqual(['animated', 'starry']);
    expect(designs.animated).toMatchObject({ names: '#ffffff', countries: { FR: '#aa0000' } });
    expect(designs.starry).toMatchObject({ names: '#ff0000', countries: { JP: '#123456' } });
    // Black and white has none until one is made
    expect(designs.mono).toBeUndefined();
  });

  it('only the owner (and co-owners) change it; strangers get a 404', async () => {
    expect((await patch(editor.agent, { names: '#000000' })).status).toBe(403);
    expect((await patch(viewer.agent, { names: '#000000' })).status).toBe(403);
    expect((await patch(stranger.agent, { names: '#000000' })).status).toBe(404);
    expect((await editor.agent.post(`/api/maps/${map.id}/design/picture/presign`).send(PICTURE)).status).toBe(403);
    expect((await removePicture(editor.agent)).status).toBe(403);
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
    expect((await designRow()).picture.key).toBe(second.key);

    // Another style's picture is its own: it replaces nothing of the World map's
    const starry = await uploadPicture(owner.agent, { style: 'starry' });
    expect(starry.status).toBe(200);
    expect(data(starry).design.style).toBe('starry');
    expect(inBucket(second.key)).toBe(true);
    expect((await designRow('starry')).picture.key).toBe(starry.key);
    expect((await designOf(viewer.agent, 'starry')).picture).not.toBeNull();
    expect((await designOf(viewer.agent)).picture).not.toBeNull();
    expect((await uploadPicture(owner.agent, { style: 'jupiter' })).status).toBe(400);
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
    expect((await unverified.agent.patch(`/api/maps/${own.id}/design`).send({ style: 'mono', names: '#000000' })).status).toBe(200);
    expect((await removePicture(unverified.agent, own.id, 'mono')).status).toBe(200);
  });

  it('shows on a share link', async () => {
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const { shareCode } = await prisma.travelMap.findUnique({ where: { id: map.id }, select: { shareCode: true } });
    const shared = data(await anon().get(`/api/shared/${shareCode}`));
    expect(shared.map.designs.animated).toMatchObject({ shown: true, countries: { FR: '#aa0000' } });
    expect(shared.map.designs.animated.picture.url).toContain('designs');
    expect(shared.map.designs.starry).toMatchObject({ names: '#ff0000' });
  });

  it('the daily clean-up keeps a picture in use, and removes an unsaved one', async () => {
    const used = (await designRow()).picture.key;
    const presign = data(await owner.agent.post(`/api/maps/${map.id}/design/picture/presign`).send(PICTURE));
    fakeR2().set(presign.key, PICTURE);
    await prisma.mediaItem.updateMany({ where: { key: { in: [used, presign.key] } }, data: { createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } });

    expect((await deleteOrphanUploads()).complete).toBe(true);
    expect(inBucket(used)).toBe(true);
    expect(inBucket(presign.key)).toBe(false);
  });

  it('removes the picture, and deleting the map deletes its file', async () => {
    const starryKey = (await designRow('starry')).picture.key;
    const removed = await removePicture(owner.agent);
    expect(removed.status).toBe(200);
    expect(data(removed).design.picture).toBeNull();
    // Only that style's
    expect(inBucket(starryKey)).toBe(true);
    expect((await designOf(owner.agent, 'starry')).picture).not.toBeNull();

    // A second map with a picture, then deleted
    const other = data(await owner.agent.post('/api/maps').send({ name: 'Designed', groupType: 'SOLO', travellers: [{ name: 'Me' }] })).map;
    const saved = [];
    for (const style of ['animated', 'old-map']) {
      const presign = data(await owner.agent.post(`/api/maps/${other.id}/design/picture/presign`).send(PICTURE));
      fakeR2().set(presign.key, PICTURE);
      expect((await owner.agent.put(`/api/maps/${other.id}/design/picture`).send({ key: presign.key, style })).status).toBe(200);
      saved.push(presign.key);
    }
    expect((await owner.agent.delete(`/api/maps/${other.id}`)).status).toBe(200);
    for (const key of saved) {
      expect(inBucket(key)).toBe(false);
      expect(await prisma.mediaItem.findUnique({ where: { key } })).toBeNull();
    }
  });
});
