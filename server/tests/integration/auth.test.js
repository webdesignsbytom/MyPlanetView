// better-auth 1.7 against Postgres: the password rules, role and isActive read with
// the session on every request, change-email not telling whether an address is
// taken, and the database keeping each user to one default map.
import { afterAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, sentEmails, signUp, testEmail, trackUser } from './helpers.js';
import { PASSWORD_RULES_MESSAGE } from '../../src/utils/passwordRules.js';
import { ensureDefaultMap } from '../../src/services/travel/maps.js';
import { createMapInDB } from '../../src/domain/maps.js';
import { generateShareCode } from '../../src/utils/shareCodes.js';

afterAll(cleanUp);

describe('passwords', () => {
  it('are refused at sign-up when they break the rules', async () => {
    const email = testEmail('weak');
    const res = await anon().post('/api/auth/sign-up/email').send({ email, password: 'aaaaaaaa', name: 'Weak' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(PASSWORD_RULES_MESSAGE);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });

  it('are refused on change-password when they break the rules', async () => {
    const { agent } = await signUp('Changer');
    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'Integration-Test-Password-1', newPassword: 'nouppercase-1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(PASSWORD_RULES_MESSAGE);
  });
});

describe('the session user', () => {
  it('carries the role, re-read on every request: a promotion applies at once', async () => {
    const { agent, user } = await signUp('Promoted');
    expect((await agent.get('/api/users/admin/get-all-users')).status).toBe(403);

    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
    expect((await agent.get('/api/users/admin/get-all-users')).status).toBe(200);

    await prisma.user.update({ where: { id: user.id }, data: { role: 'USER' } });
    expect((await agent.get('/api/users/admin/get-all-users')).status).toBe(403);
  });

  it('carries isActive: a deactivation applies at once, even with the session left in place', async () => {
    const { agent, user } = await signUp('Deactivated');
    expect((await agent.get('/api/maps')).status).toBe(200);

    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
    const res = await agent.get('/api/maps');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('cannot be promoted through better-auth', async () => {
    const email = testEmail('climber');
    const res = await anon()
      .post('/api/auth/sign-up/email')
      .send({ email, password: 'Integration-Test-Password-1', name: 'Climber', role: 'DEVELOPER', isActive: false });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    trackUser(user.id);
    expect(user).toMatchObject({ role: 'USER', isActive: true });
  });
});

describe('changing the email to an address that has an account', () => {
  it('answers like any other change, and sends nothing', async () => {
    const taken = await signUp('Taken', { verified: true });
    const mover = await signUp('Mover', { verified: true });
    const before = sentEmails().length;

    const res = await mover.agent.post('/api/auth/change-email').send({ newEmail: taken.email });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sentEmails().slice(before)).toEqual([]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: mover.user.id } })).email).toBe(mover.email);
  });
});

describe('one default map per user', () => {
  it('holds when several requests make it at once', async () => {
    const { agent, user } = await signUp('Racer');
    // As if the sign-up hook had failed
    await prisma.travelMap.deleteMany({ where: { ownerId: user.id } });

    const made = await Promise.all(Array.from({ length: 5 }, () => ensureDefaultMap(user)));
    const defaults = await prisma.travelMap.findMany({ where: { ownerId: user.id, isDefault: true } });
    expect(defaults).toHaveLength(1);
    expect(new Set(made.map((m) => m.id))).toEqual(new Set([defaults[0].id]));
    expect(defaults[0].defaultForOwnerId).toBe(user.id);

    // The same through the API
    await prisma.travelMap.deleteMany({ where: { ownerId: user.id } });
    const lists = await Promise.all([agent.get('/api/maps'), agent.get('/api/maps'), agent.get('/api/maps')]);
    for (const res of lists) expect(res.status).toBe(200);
    expect(await prisma.travelMap.count({ where: { ownerId: user.id, isDefault: true } })).toBe(1);
    expect((await defaultMapOf(agent)).id).toBe(
      (await prisma.travelMap.findFirstOrThrow({ where: { ownerId: user.id, isDefault: true } })).id
    );
  });

  it('is enforced by the database', async () => {
    const { user } = await signUp('Doubled');
    const second = createMapInDB({
      ownerId: user.id,
      name: 'Second default',
      groupType: 'SOLO',
      isDefault: true,
      shareCode: generateShareCode(),
      travellers: [{ name: 'Me' }],
    });
    await expect(second).rejects.toMatchObject({ code: 'P2002' });

    // The flag and the column can't disagree (CHECK travel_map_default_owner)
    const map = await prisma.travelMap.findFirstOrThrow({ where: { ownerId: user.id, isDefault: true } });
    await expect(prisma.travelMap.update({ where: { id: map.id }, data: { isDefault: false } })).rejects.toThrow();
    await expect(
      prisma.travelMap.update({ where: { id: map.id }, data: { defaultForOwnerId: null } })
    ).rejects.toThrow();
    expect(await prisma.travelMap.findUniqueOrThrow({ where: { id: map.id } })).toMatchObject({
      isDefault: true,
      defaultForOwnerId: user.id,
    });
  });

  it('lets a map handed to an editor stop being a default (account deletion)', async () => {
    const owner = await signUp('Handing', { verified: true });
    const heir = await signUp('Heir', { verified: true });
    const map = await defaultMapOf(owner.agent);
    const add = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: heir.email, role: 'EDITOR' });
    expect(add.status).toBeLessThan(300);

    const res = await owner.agent.post('/api/auth/delete-user').send({ password: 'Integration-Test-Password-1' });
    expect(res.status).toBe(200);
    expect(await prisma.travelMap.findUniqueOrThrow({ where: { id: map.id } })).toMatchObject({
      ownerId: heir.user.id,
      isDefault: false,
      defaultForOwnerId: null,
    });
    const heirMaps = data(await heir.agent.get('/api/maps')).maps;
    expect(heirMaps.filter((m) => m.isDefault)).toHaveLength(1);
  });
});
