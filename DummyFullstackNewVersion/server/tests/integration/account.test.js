// Deleting an account: shared maps pass to the longest-standing editor, the
// person's uploads go everywhere, and their unshared maps go.
import { afterAll, describe, expect, it } from 'vitest';
import { PASSWORD, cleanUp, data, defaultMapOf, inBucket, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const photoKeys = async (photoId) =>
  (await prisma.photoVariant.findMany({ where: { photoId }, include: { media: true } })).map((v) => v.media.key);

describe('deleting an account', () => {
  it('hands shared maps to the longest-standing editor and removes the rest', async () => {
    const leaver = await signUp('Leaver');
    const viewer = await signUp('EarlyViewer');
    const firstEditor = await signUp('FirstEditor');
    const secondEditor = await signUp('SecondEditor');
    const elsewhere = await signUp('Elsewhere');

    const sharedMap = await defaultMapOf(leaver.agent);
    // The viewer joined first, but only editors can inherit
    await leaver.agent.post(`/api/maps/${sharedMap.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    await leaver.agent.post(`/api/maps/${sharedMap.id}/members`).send({ email: firstEditor.email, role: 'EDITOR' });
    await leaver.agent.post(`/api/maps/${sharedMap.id}/members`).send({ email: secondEditor.email, role: 'EDITOR' });
    await leaver.agent.put(`/api/maps/${sharedMap.id}/visits/FR`).send({ status: 'VISITED' });

    const soloMap = data(
      await leaver.agent.post('/api/maps').send({ name: 'Just me', groupType: 'SOLO', travellers: [{ name: 'Leaver' }] })
    ).map;

    // Uploads: the leaver's on both their maps and on someone else's; an editor's on the shared map
    const leaverOnShared = data(await uploadPhoto(leaver.agent, sharedMap.id, { countryCode: 'FR' })).photo;
    const leaverOnSolo = data(await uploadPhoto(leaver.agent, soloMap.id, { countryCode: 'ES' })).photo;
    const editorOnShared = data(await uploadPhoto(firstEditor.agent, sharedMap.id, { countryCode: 'IT' })).photo;
    const elsewhereMap = await defaultMapOf(elsewhere.agent);
    await elsewhere.agent.post(`/api/maps/${elsewhereMap.id}/members`).send({ email: leaver.email, role: 'EDITOR' });
    const leaverOnElsewhere = data(await uploadPhoto(leaver.agent, elsewhereMap.id, { countryCode: 'JP' })).photo;

    const goneKeys = [
      ...(await photoKeys(leaverOnShared.id)),
      ...(await photoKeys(leaverOnSolo.id)),
      ...(await photoKeys(leaverOnElsewhere.id)),
    ];
    const keptKeys = await photoKeys(editorOnShared.id);

    const res = await leaver.agent.post('/api/auth/delete-user').send({ password: PASSWORD });
    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: leaver.user.id } })).toBeNull();

    // The shared map now belongs to the first editor, not as a second default, and they're no longer a member of it
    const inherited = await prisma.travelMap.findUnique({ where: { id: sharedMap.id }, include: { members: true } });
    expect(inherited).toMatchObject({ ownerId: firstEditor.user.id, isDefault: false });
    expect(inherited.members.map((m) => [m.userId, m.role]).sort()).toEqual(
      [[viewer.user.id, 'VIEWER'], [secondEditor.user.id, 'EDITOR']].sort()
    );
    const heirMaps = data(await firstEditor.agent.get('/api/maps')).maps;
    expect(heirMaps.filter((m) => m.id === sharedMap.id)).toEqual([expect.objectContaining({ role: 'OWNER', isDefault: false })]);
    expect(heirMaps.filter((m) => m.isDefault)).toHaveLength(1);
    // Its visits stay
    expect(data(await firstEditor.agent.get(`/api/maps/${sharedMap.id}`)).map.visits.map((v) => v.countryCode)).toContain('FR');

    // The unshared map is gone; every photo the leaver uploaded is gone, files included
    expect(await prisma.travelMap.findUnique({ where: { id: soloMap.id } })).toBeNull();
    for (const id of [leaverOnShared.id, leaverOnSolo.id, leaverOnElsewhere.id]) {
      expect(await prisma.photo.findUnique({ where: { id } })).toBeNull();
    }
    expect(goneKeys.some(inBucket)).toBe(false);
    expect(await prisma.mediaItem.count({ where: { key: { in: goneKeys } } })).toBe(0);

    // The editor's photo on the inherited map stays
    expect(await prisma.photo.findUnique({ where: { id: editorOnShared.id } })).not.toBeNull();
    expect(keptKeys.every(inBucket)).toBe(true);
  });

  it('an admin deleting a user does the same, skipping a deactivated editor', async () => {
    const admin = await signUp('Admin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    const target = await signUp('Target');
    const sleepy = await signUp('Sleepy');
    const active = await signUp('Active');
    const map = await defaultMapOf(target.agent);
    await target.agent.post(`/api/maps/${map.id}/members`).send({ email: sleepy.email, role: 'EDITOR' });
    await target.agent.post(`/api/maps/${map.id}/members`).send({ email: active.email, role: 'EDITOR' });
    // The longest-standing editor can't sign in any more
    await prisma.user.update({ where: { id: sleepy.user.id }, data: { isActive: false } });

    const res = await admin.agent.delete(`/api/users/admin/delete-user-by-id/${target.user.id}`);
    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: target.user.id } })).toBeNull();
    expect(await prisma.travelMap.findUnique({ where: { id: map.id } })).toMatchObject({ ownerId: active.user.id, isDefault: false });
  });

  it('keeps a map whose only editor is deactivated, rather than deleting it', async () => {
    const owner = await signUp('Keeper');
    const onlyEditor = await signUp('OnlyEditor');
    const map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: onlyEditor.email, role: 'EDITOR' });
    await prisma.user.update({ where: { id: onlyEditor.user.id }, data: { isActive: false } });

    expect((await owner.agent.post('/api/auth/delete-user').send({ password: PASSWORD })).status).toBe(200);
    expect(await prisma.travelMap.findUnique({ where: { id: map.id } })).toMatchObject({ ownerId: onlyEditor.user.id });
  });

  it('needs the right password', async () => {
    const user = await signUp('Careful');
    const res = await user.agent.post('/api/auth/delete-user').send({ password: 'wrong-password-123' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await prisma.user.findUnique({ where: { id: user.user.id } })).not.toBeNull();
  });
});
