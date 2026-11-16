// Transferring a map (docs/API.md, "Transferring a map"): the owner's transfer to
// someone on the map, the admin's to any active account, and the 60-day grace for a
// new owner with no free map slot.
import { afterAll, describe, expect, it, vi } from 'vitest';
import { cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

const DAY = 24 * 60 * 60 * 1000;
const NEW_MAP = { name: 'Family map', groupType: 'FAMILY', travellers: [{ name: 'Dad' }, { name: 'Mum' }] };

describe('the owner transfers a map', () => {
  it('hands a map to someone on it, staying as an editor; with no free slot it gets 60 days', async () => {
    const dad = await signUp('Dad');
    const mum = await signUp('Mum');
    await givePlan(dad.user.id, { plan: 'REGULAR', extraMaps: 1 });
    const family = data(await dad.agent.post('/api/maps').send(NEW_MAP)).map;
    await dad.agent.post(`/api/maps/${family.id}/members`).send({ email: mum.email, role: 'EDITOR' });
    await dad.agent.put(`/api/maps/${family.id}/visits/FR`).send({ status: 'VISITED' });

    const before = Date.now();
    const res = await dad.agent.post(`/api/maps/${family.id}/transfer`).send({ userId: mum.user.id });
    expect(res.status).toBe(200);
    // Dad stays as an editor (the default), and sees the map as one
    expect(data(res).map).toMatchObject({ id: family.id, role: 'EDITOR' });

    const row = await prisma.travelMap.findUnique({ where: { id: family.id }, include: { members: true } });
    expect(row).toMatchObject({ ownerId: mum.user.id, isDefault: false, defaultForOwnerId: null });
    expect(row.members.map((m) => [m.userId, m.role])).toEqual([[dad.user.id, 'EDITOR']]);
    // Mum (Economy, her one slot used by her own map) gets 60 days before it needs paying for
    expect(row.graceUntil.getTime()).toBeGreaterThanOrEqual(before + 60 * DAY - 1000);
    expect(row.graceUntil.getTime()).toBeLessThanOrEqual(Date.now() + 60 * DAY);

    // It now has Mum's plan, and is active through its grace
    const view = data(await mum.agent.get(`/api/maps/${family.id}`)).map;
    expect(view).toMatchObject({ role: 'OWNER', locked: false, plan: { id: 'FREE' }, uploadRules: { keepsOriginals: false } });
    expect(view.graceUntil).toBeTruthy();
    expect((await uploadPhoto(mum.agent, family.id, { countryCode: 'FR' })).status).toBe(201);
    const mumsList = data(await mum.agent.get('/api/maps')).maps;
    expect(mumsList.find((m) => m.id === family.id)).toMatchObject({ role: 'OWNER', isDefault: false, locked: false });
    expect(mumsList.filter((m) => m.isDefault)).toHaveLength(1);

    // Once the grace ends, it's locked until paid for; nothing is lost
    await prisma.travelMap.update({ where: { id: family.id }, data: { graceUntil: new Date(Date.now() - DAY) } });
    expect(data(await mum.agent.get(`/api/maps/${family.id}`)).map.locked).toBe(true);
    expect((await mum.agent.post(`/api/maps/${family.id}/photos/presign`).send({ files: [] })).status).toBe(403);
    await givePlan(mum.user.id, { extraMaps: 1 });
    expect(data(await mum.agent.get(`/api/maps/${family.id}`)).map.locked).toBe(false);

    // Dad is an editor now: he can't transfer or manage it
    expect((await dad.agent.post(`/api/maps/${family.id}/transfer`).send({ userId: dad.user.id })).status).toBe(403);
  });

  it('no grace when the new owner has a free slot; leaving the map, or the default map, works too', async () => {
    const owner = await signUp('Giver');
    const taker = await signUp('Taker');
    await givePlan(taker.user.id, { extraMaps: 1 });
    const home = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${home.id}/members`).send({ email: taker.email, role: 'VIEWER' });

    const res = await owner.agent.post(`/api/maps/${home.id}/transfer`).send({ userId: taker.user.id, stayAsEditor: false });
    expect(res.status).toBe(200);
    expect(data(res).map).toEqual({ id: home.id, name: home.name, role: null });
    const row = await prisma.travelMap.findUnique({ where: { id: home.id }, include: { members: true } });
    expect(row).toMatchObject({ ownerId: taker.user.id, isDefault: false, graceUntil: null, members: [] });
    expect((await owner.agent.get(`/api/maps/${home.id}`)).status).toBe(404);

    // The giver handed over their default map: they have a new one at once
    const giversMaps = await prisma.travelMap.findMany({ where: { ownerId: owner.user.id } });
    expect(giversMaps).toEqual([expect.objectContaining({ isDefault: true, name: 'My map' })]);
  });

  it('only to someone on the map, with an active account and a verified address', async () => {
    const owner = await signUp('Picky');
    const outsider = await signUp('Outsider');
    const unverified = await signUp('Unverified', { verified: false });
    const map = await defaultMapOf(owner.agent);
    // Added while verified, then unverified (an email change)
    await prisma.user.update({ where: { id: unverified.user.id }, data: { emailVerified: true } });
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: unverified.email, role: 'EDITOR' });
    await prisma.user.update({ where: { id: unverified.user.id }, data: { emailVerified: false } });

    const to = (body) => owner.agent.post(`/api/maps/${map.id}/transfer`).send(body);
    expect((await to({ userId: outsider.user.id })).body.message).toBe('Only someone already on this map can become its owner. Add them first.');
    expect((await to({ userId: unverified.user.id })).body.message).toBe('The new owner needs an active account with a verified email address.');
    expect((await to({ userId: owner.user.id })).status).toBe(400);
    expect((await to({})).status).toBe(400);
    expect((await to({ userId: unverified.user.id, stayAsEditor: 'yes' })).status).toBe(400);
    expect((await prisma.travelMap.findUnique({ where: { id: map.id } })).ownerId).toBe(owner.user.id);
    // Someone with no role on the map can't even see it
    expect((await outsider.agent.post(`/api/maps/${map.id}/transfer`).send({ userId: outsider.user.id })).status).toBe(404);
    // And an unverified owner can't transfer
    const unverifiedMap = await defaultMapOf(unverified.agent);
    expect((await unverified.agent.post(`/api/maps/${unverifiedMap.id}/transfer`).send({ userId: owner.user.id })).status).toBe(403);
  });
});

describe('an admin transfers a map', () => {
  it('moves a map to any active account by address, with the same effects', async () => {
    const admin = await signUp('MapAdmin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    const gone = await signUp('LostEmail');
    const heir = await signUp('Heir', { verified: false });
    const map = await defaultMapOf(gone.agent);
    await gone.agent.put(`/api/maps/${map.id}/visits/IT`).send({ status: 'LIVED' });

    const move = (body) => admin.agent.post('/api/users/admin/transfer-map').send(body);
    // Not for ordinary users
    expect((await gone.agent.post('/api/users/admin/transfer-map').send({ mapId: map.id, toEmail: heir.email })).status).toBe(403);
    expect((await move({ mapId: map.id, toEmail: 'nobody@example.test' })).status).toBe(400);
    expect((await move({ mapId: map.id, toEmail: gone.email })).status).toBe(400);
    expect((await move({ mapId: '00000000-0000-4000-8000-000000000000', toEmail: heir.email })).status).toBe(404);

    const res = await move({ mapId: map.id, toEmail: heir.email.toUpperCase(), keepOldOwnerAsEditor: true });
    expect(res.status).toBe(200);
    expect(data(res).map).toMatchObject({ id: map.id, ownerId: heir.user.id, previousOwnerId: gone.user.id });
    // The heir had no free slot: 60 days' grace
    expect(data(res).map.graceUntil).toBeTruthy();
    const row = await prisma.travelMap.findUnique({ where: { id: map.id }, include: { members: true, visits: true } });
    expect(row).toMatchObject({ ownerId: heir.user.id, isDefault: false });
    expect(row.members.map((m) => [m.userId, m.role])).toEqual([[gone.user.id, 'EDITOR']]);
    expect(row.visits.map((v) => v.countryCode)).toEqual(['IT']);
    // The old owner has a new default map
    expect(await prisma.travelMap.count({ where: { ownerId: gone.user.id, isDefault: true } })).toBe(1);

    // Logged without any address
    const event = await vi.waitFor(async () => {
      const row = await prisma.appEvent.findFirst({ where: { action: 'Admin Transfer Success', targetId: heir.user.id } });
      expect(row).toMatchObject({ actorId: admin.user.id });
      return row;
    });
    expect(event.message).not.toMatch(/@/);

    // A deactivated account can't receive one
    await prisma.user.update({ where: { id: heir.user.id }, data: { isActive: false } });
    expect((await move({ mapId: map.id, toEmail: gone.email })).status).toBe(200);
    expect((await move({ mapId: map.id, toEmail: heir.email })).status).toBe(400);
  });
});
