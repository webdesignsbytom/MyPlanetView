// The style a map is shown in (docs/API.md "Map styles"; 22 Nov 2026, the user's wish): the
// owner's choice is what everyone who opens the map sees, share links too. The map's own
// style, set by the owner or a co-owner, else the owner's own map settings' style.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('map styles', () => {
  let owner;
  let editor;
  let viewer;
  let map;
  const styleFor = async (who) => data(await who.agent.get(`/api/maps/${map.id}`)).map.style;

  beforeAll(async () => {
    [owner, editor, viewer] = await Promise.all([signUp('StyleOwner'), signUp('StyleEditor'), signUp('StyleViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' })).status).toBe(201);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
  });

  it('has none until the owner chooses one: each viewer sees their own', async () => {
    expect(await styleFor(owner)).toBeNull();
    expect(await styleFor(viewer)).toBeNull();
  });

  it('follows the owner’s own style while the map has none of its own', async () => {
    expect((await owner.agent.put('/api/users/map-settings').send({ mapSettings: { style: 'starry' } })).status).toBe(200);
    expect(await styleFor(owner)).toBe('starry');
    expect(await styleFor(viewer)).toBe('starry');
    // A viewer's own style changes nothing on someone else's map
    expect((await viewer.agent.put('/api/users/map-settings').send({ mapSettings: { style: 'old-map' } })).status).toBe(200);
    expect(await styleFor(viewer)).toBe('starry');
  });

  it('keeps its own, set by the owner: only a known style, never by an editor or a viewer', async () => {
    expect(data(await owner.agent.patch(`/api/maps/${map.id}`).send({ style: 'mono' })).map.style).toBe('mono');
    expect(await styleFor(viewer)).toBe('mono');
    // The owner's own style no longer decides it
    await owner.agent.put('/api/users/map-settings').send({ mapSettings: { style: 'animated' } });
    expect(await styleFor(editor)).toBe('mono');

    expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ style: 'neon' })).status).toBe(400);
    expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ style: null })).status).toBe(400);
    expect((await editor.agent.patch(`/api/maps/${map.id}`).send({ style: 'starry' })).status).toBe(403);
    expect((await viewer.agent.patch(`/api/maps/${map.id}`).send({ style: 'starry' })).status).toBe(403);
    expect(await styleFor(owner)).toBe('mono');
  });

  // The engraved ocean (25 Nov 2026, the user's wish): a style like the rest
  it('takes the engraved ocean, as the map’s own style and as anyone’s own', async () => {
    expect(data(await owner.agent.patch(`/api/maps/${map.id}`).send({ style: 'engraved' })).map.style).toBe('engraved');
    expect(await styleFor(viewer)).toBe('engraved');
    expect((await viewer.agent.put('/api/users/map-settings').send({ mapSettings: { style: 'engraved' } })).status).toBe(200);
  });

  it('shows on a share link', async () => {
    expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ style: 'starry' })).status).toBe(200);
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const { shareCode } = await prisma.travelMap.findUnique({ where: { id: map.id }, select: { shareCode: true } });
    expect(data(await anon().get(`/api/shared/${shareCode}`)).map.style).toBe('starry');
  });

  it('is in the owner’s data download', async () => {
    expect(data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map).toMatchObject({ style: 'starry' });
  });
});
