// Leaving with a plan (docs/API.md, "Leaving"): the options, the stored choice, and what
// account deletion does with it. account.test.js covers the defaults (no plan).
import { afterAll, describe, expect, it } from 'vitest';
import { PASSWORD, cleanUp, data, defaultMapOf, givePlan, inBucket, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const photoKeys = async (photoId) =>
  (await prisma.photoVariant.findMany({ where: { photoId }, include: { media: true } })).map((v) => v.media.key);

/** A leaver who owns a shared map and a solo one, and has a photo on a friend's map. */
async function setUpLeaver(label) {
  const leaver = await signUp(label);
  const viewer = await signUp(`${label}Viewer`);
  const editor = await signUp(`${label}Editor`);
  const friend = await signUp(`${label}Friend`);
  await givePlan(leaver.user.id, { extraMaps: 1 });
  const shared = await defaultMapOf(leaver.agent);
  await leaver.agent.post(`/api/maps/${shared.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
  await leaver.agent.post(`/api/maps/${shared.id}/members`).send({ email: editor.email, role: 'EDITOR' });
  const solo = data(await leaver.agent.post('/api/maps').send({ name: 'Solo', groupType: 'SOLO', travellers: [{ name: 'Me' }] })).map;
  const friendsMap = await defaultMapOf(friend.agent);
  await friend.agent.post(`/api/maps/${friendsMap.id}/members`).send({ email: leaver.email, role: 'EDITOR' });
  const onShared = data(await uploadPhoto(leaver.agent, shared.id, { countryCode: 'FR' })).photo;
  const onSolo = data(await uploadPhoto(leaver.agent, solo.id, { countryCode: 'ES' })).photo;
  const onFriends = data(await uploadPhoto(leaver.agent, friendsMap.id, { countryCode: 'JP' })).photo;
  return { leaver, viewer, editor, friend, shared, solo, friendsMap, onShared, onSolo, onFriends };
}

describe('leaving options and plan', () => {
  it('lists the maps you own with everyone on them, and your photos elsewhere', async () => {
    const s = await setUpLeaver('Lister');
    const res = await s.leaver.agent.get('/api/users/leaving-options');
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({
      maps: [
        {
          id: s.shared.id,
          name: 'My map',
          members: [
            { userId: s.viewer.user.id, name: 'ListerViewer', role: 'VIEWER' },
            { userId: s.editor.user.id, name: 'ListerEditor', role: 'EDITOR' },
          ],
        },
        { id: s.solo.id, name: 'Solo', members: [] },
      ],
      photosOnOtherMaps: 1,
    });
  });

  it('stores a plan only when every owned map is listed once, transfers going to someone on it', async () => {
    const s = await setUpLeaver('Checker');
    const put = (body) => s.leaver.agent.put('/api/users/leaving-plan').send(body);
    const transfer = { mapId: s.shared.id, action: 'TRANSFER', toUserId: s.viewer.user.id };
    const drop = { mapId: s.solo.id, action: 'DELETE' };

    for (const body of [
      { maps: [transfer] },
      { maps: [transfer, drop, drop] },
      { maps: [{ ...transfer, toUserId: s.friend.user.id }, drop] },
      { maps: [transfer, { mapId: s.friendsMap.id, action: 'DELETE' }] },
      { maps: [transfer, drop], leavePhotos: 'no' },
    ]) {
      const res = await put(body);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/^List each map you own once/);
    }
    expect(await prisma.profile.findUnique({ where: { userId: s.leaver.user.id } })).toBeNull();

    const saved = await put({ maps: [transfer, drop], leavePhotos: false });
    expect(saved.status).toBe(200);
    expect(data(saved).leavingPlan).toEqual({ maps: [transfer, drop], leavePhotos: false });
    expect(new Date(data(saved).expiresAt).getTime() - new Date(data(saved).savedAt).getTime()).toBe(60 * 60 * 1000);
    // No verified email needed: it's an account change
    await prisma.user.update({ where: { id: s.leaver.user.id }, data: { emailVerified: false } });
    expect((await put({ maps: [transfer, drop] })).status).toBe(200);
  });
});

describe('deleting an account with a plan', () => {
  it('follows the plan: a transfer to a viewer, a delete, and photos elsewhere deleted', async () => {
    const s = await setUpLeaver('Planned');
    await s.leaver.agent.put('/api/users/leaving-plan').send({
      maps: [
        { mapId: s.shared.id, action: 'TRANSFER', toUserId: s.viewer.user.id },
        { mapId: s.solo.id, action: 'DELETE' },
      ],
      leavePhotos: false,
    });
    const soloKeys = await photoKeys(s.onSolo.id);
    const friendsKeys = await photoKeys(s.onFriends.id);
    const sharedKeys = await photoKeys(s.onShared.id);

    expect((await s.leaver.agent.post('/api/auth/delete-user').send({ password: PASSWORD })).status).toBe(200);

    // The viewer chosen, not the longest-standing editor; the editor stays an editor
    const shared = await prisma.travelMap.findUnique({ where: { id: s.shared.id }, include: { members: true } });
    expect(shared).toMatchObject({ ownerId: s.viewer.user.id, isDefault: false });
    expect(shared.members.map((m) => [m.userId, m.role])).toEqual([[s.editor.user.id, 'EDITOR']]);
    // The handed-over map keeps the leaver's photo, now its new owner's
    expect(await prisma.photo.findUnique({ where: { id: s.onShared.id } })).toMatchObject({ uploaderId: s.viewer.user.id });
    expect(sharedKeys.every(inBucket)).toBe(true);

    // The solo map is gone, and leavePhotos: false took the photo on the friend's map
    expect(await prisma.travelMap.findUnique({ where: { id: s.solo.id } })).toBeNull();
    for (const id of [s.onSolo.id, s.onFriends.id]) expect(await prisma.photo.findUnique({ where: { id } })).toBeNull();
    expect([...soloKeys, ...friendsKeys].some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: [...soloKeys, ...friendsKeys] } } })).toBe(0);
  });

  it('a delete in the plan wins over an editor who would have inherited', async () => {
    const s = await setUpLeaver('Deleter');
    await s.leaver.agent.put('/api/users/leaving-plan').send({
      maps: [
        { mapId: s.shared.id, action: 'DELETE' },
        { mapId: s.solo.id, action: 'DELETE' },
      ],
    });
    expect((await s.leaver.agent.post('/api/auth/delete-user').send({ password: PASSWORD })).status).toBe(200);
    expect(await prisma.travelMap.count({ where: { id: { in: [s.shared.id, s.solo.id] } } })).toBe(0);
    // leavePhotos left out: true, so the photo on the friend's map stays (the friend's now)
    expect(await prisma.photo.findUnique({ where: { id: s.onFriends.id } })).toMatchObject({ uploaderId: s.friend.user.id });
  });

  it('ignores a plan saved over an hour ago (the defaults apply)', async () => {
    const s = await setUpLeaver('Stale');
    await s.leaver.agent.put('/api/users/leaving-plan').send({
      maps: [
        { mapId: s.shared.id, action: 'DELETE' },
        { mapId: s.solo.id, action: 'DELETE' },
      ],
      leavePhotos: false,
    });
    await prisma.profile.update({
      where: { userId: s.leaver.user.id },
      data: { leavingPlanAt: new Date(Date.now() - 61 * 60 * 1000) },
    });
    expect((await s.leaver.agent.post('/api/auth/delete-user').send({ password: PASSWORD })).status).toBe(200);
    // Default: the editor inherits the shared map, the solo map goes, photos elsewhere stay
    expect(await prisma.travelMap.findUnique({ where: { id: s.shared.id } })).toMatchObject({ ownerId: s.editor.user.id });
    expect(await prisma.travelMap.findUnique({ where: { id: s.solo.id } })).toBeNull();
    expect(await prisma.photo.findUnique({ where: { id: s.onFriends.id } })).toMatchObject({ uploaderId: s.friend.user.id });
  });

  it('a map handed over to someone with no free slot gets the grace period', async () => {
    const s = await setUpLeaver('Graceful');
    await s.leaver.agent.put('/api/users/leaving-plan').send({
      maps: [
        { mapId: s.shared.id, action: 'DELETE' },
        { mapId: s.solo.id, action: 'DELETE' },
      ],
    });
    // Planned later: the solo map gets a member and is now handed over by the default rule
    await s.leaver.agent.post(`/api/maps/${s.solo.id}/members`).send({ email: s.friend.email, role: 'EDITOR' });
    await s.leaver.agent.put('/api/users/leaving-plan').send({
      maps: [
        { mapId: s.shared.id, action: 'DELETE' },
        { mapId: s.solo.id, action: 'TRANSFER', toUserId: s.friend.user.id },
      ],
    });
    expect((await s.leaver.agent.post('/api/auth/delete-user').send({ password: PASSWORD })).status).toBe(200);
    const solo = await prisma.travelMap.findUnique({ where: { id: s.solo.id } });
    expect(solo).toMatchObject({ ownerId: s.friend.user.id, isDefault: false });
    expect(solo.graceUntil.getTime()).toBeGreaterThan(Date.now() + 59 * 24 * 60 * 60 * 1000);
    expect(await prisma.photo.findUnique({ where: { id: s.onSolo.id } })).toMatchObject({ uploaderId: s.friend.user.id });
  });
});
