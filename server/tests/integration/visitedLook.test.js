// How the places visited or lived in show (docs/API.md "The visited look"; 25 Nov 2026, the
// user's wish): their badge, one colour, or both, and a metallic finish; the map's own, in every
// map style (it was one style's design's, and showed only in that style), chosen by the owner or
// a co-owner, for everyone who opens the map, share links too.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('the visited look', () => {
  let owner;
  let editor;
  let viewer;
  let map;
  const lookOf = (body) => ({ visitedLook: body.visitedLook, visitedColour: body.visitedColour, visitedFinish: body.visitedFinish });
  const mapFor = async (who) => data(await who.agent.get(`/api/maps/${map.id}`)).map;
  const patch = (who, body) => who.agent.patch(`/api/maps/${map.id}`).send(body);

  beforeAll(async () => {
    [owner, editor, viewer] = await Promise.all([signUp('LookOwner'), signUp('LookEditor'), signUp('LookViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' })).status).toBe(201);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
  });

  it('starts as badges, with the style’s own colour and no metal', async () => {
    expect(lookOf(await mapFor(owner))).toEqual({ visitedLook: 'BADGE', visitedColour: null, visitedFinish: null });
  });

  it('saves a colour, in any case, and gives it to everyone in every style, share links too', async () => {
    const res = await patch(owner, { visitedLook: 'colour', visitedColour: '#7C3AED' });
    expect(res.status).toBe(200);
    expect(lookOf(data(res).map)).toEqual({ visitedLook: 'COLOUR', visitedColour: '#7c3aed', visitedFinish: null });
    expect(lookOf(await mapFor(viewer))).toEqual({ visitedLook: 'COLOUR', visitedColour: '#7c3aed', visitedFinish: null });
    // The map's, whatever its style: another style, and a style's design, leave it as it is
    expect((await patch(owner, { style: 'starry' })).status).toBe(200);
    expect((await owner.agent.patch(`/api/maps/${map.id}/design`).send({ style: 'starry', names: '#ffffff' })).status).toBe(200);
    expect(lookOf(await mapFor(viewer))).toMatchObject({ visitedLook: 'COLOUR', visitedColour: '#7c3aed' });
    expect((await mapFor(viewer)).designs.starry).not.toHaveProperty('visitedLook');
    // Through the link
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const { shareCode } = await prisma.travelMap.findUnique({ where: { id: map.id }, select: { shareCode: true } });
    expect(lookOf(data(await anon().get(`/api/shared/${shareCode}`)).map)).toMatchObject({ visitedLook: 'COLOUR', visitedColour: '#7c3aed' });
  });

  it('saves a metallic finish, and takes it off', async () => {
    expect(lookOf(data(await patch(owner, { visitedLook: 'BOTH', visitedFinish: 'gold' })).map)).toEqual({
      visitedLook: 'BOTH',
      visitedColour: '#7c3aed',
      visitedFinish: 'GOLD',
    });
    expect((await mapFor(viewer)).visitedFinish).toBe('GOLD');
    // "Your data" carries it with the map
    const exported = data(await owner.agent.get(`/api/users/export/maps/${map.id}`)).map;
    expect(lookOf(exported)).toEqual({ visitedLook: 'BOTH', visitedColour: '#7c3aed', visitedFinish: 'GOLD' });
    expect(exported.designs.every((design) => !('visitedLook' in design))).toBe(true);
    expect((await patch(owner, { visitedFinish: null })).status).toBe(200);
    expect((await mapFor(viewer)).visitedFinish).toBeNull();
  });

  it('refuses what isn’t a look, a metal or an opaque colour, changing nothing', async () => {
    expect((await patch(owner, { visitedLook: 'STICKER' })).status).toBe(400);
    expect((await patch(owner, { visitedFinish: 'PLATINUM' })).status).toBe(400);
    expect((await patch(owner, { visitedColour: '#7c3aed80' })).status).toBe(400);
    expect((await patch(owner, { name: 'Still ours', visitedColour: 'purple' })).status).toBe(400);
    expect((await mapFor(owner)).name).not.toBe('Still ours');
    // The database refuses a malformed colour too (CHECK travel_map_visited_colour)
    await expect(prisma.travelMap.update({ where: { id: map.id }, data: { visitedColour: 'purple' } })).rejects.toThrow();
  });

  it('is the owner’s and co-owners’ to choose, never an editor’s or a viewer’s', async () => {
    expect((await patch(editor, { visitedLook: 'BADGE' })).status).toBe(403);
    expect((await patch(viewer, { visitedLook: 'BADGE' })).status).toBe(403);
    expect((await mapFor(owner)).visitedLook).toBe('BOTH');
    expect(lookOf(data(await patch(owner, { visitedLook: 'BADGE', visitedColour: null })).map)).toEqual({
      visitedLook: 'BADGE',
      visitedColour: null,
      visitedFinish: null,
    });
  });
});
