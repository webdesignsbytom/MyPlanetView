// The account's own routes (who is signed in, removing the avatar) and the admin panel's
// user routes: one user by id, role changes, deactivating and reactivating. The rules are
// utils/userPermissions.js (unit tested in tests/adminUsers.test.js); here they're checked
// through the routes, with real sessions. The public bucket is the fake one from setup.js,
// as in media.test.js.
import { afterAll, describe, expect, it, vi } from 'vitest';
import { PASSWORD, anon, cleanUp, data, inBucket, prisma, signUp } from './helpers.js';

vi.mock('../../src/services/s3/s3public.js', async (importOriginal) => {
  const actual = await importOriginal();
  const send = (command) => globalThis.__fakeBucketSend(command);
  return { ...actual, default: { send } };
});

const PNG = { contentType: 'image/png', bytes: 2048 };

// An avatar row blocks deleting its MediaItem (onDelete: Restrict), so they go first
const userIds = new Set();
afterAll(async () => {
  await prisma.avatarMediaItem.deleteMany({ where: { userId: { in: [...userIds] } } });
  await cleanUp();
});

/** A signed-up user with a role (USER by default). */
async function withRole(label, role = 'USER') {
  const person = await signUp(label);
  userIds.add(person.user.id);
  if (role !== 'USER') person.user = await prisma.user.update({ where: { id: person.user.id }, data: { role } });
  return person;
}

/** An avatar as the account page sets it: presign, "PUT", confirm, save. Returns its key. */
async function setAvatar(agent) {
  const presign = await agent.post('/api/media-services/presign-url').send({ resource: 'avatar', filename: 'me.png', ...PNG });
  expect(presign.status).toBe(200);
  const { key } = presign.body;
  globalThis.__fakeR2.set(key, { bytes: PNG.bytes, contentType: PNG.contentType });
  expect((await agent.post('/api/media-services/confirm-upload').send({ key })).status).toBe(200);
  expect((await agent.post('/api/users/user/upload-or-change-avatar').send({ key })).status).toBe(200);
  return key;
}

const signIn = (email, password = PASSWORD) => anon().post('/api/auth/sign-in/email').send({ email, password });

describe('GET /api/users/user/get-logged-in-user', () => {
  const ME = '/api/users/user/get-logged-in-user';

  it('answers the signed-in user, and nothing about the account or its sessions', async () => {
    const me = await withRole('Myself');
    const res = await me.agent.get(ME);
    expect(res.status).toBe(200);
    const { user } = data(res);
    expect(Object.keys(user).sort()).toEqual(
      ['createdAt', 'email', 'emailVerified', 'id', 'image', 'isActive', 'name', 'role', 'updatedAt'].sort()
    );
    expect(user).toMatchObject({ id: me.user.id, email: me.email, name: 'Myself', role: 'USER', emailVerified: true, isActive: true, image: null });
  });

  it('works for an unverified account too', async () => {
    const fresh = await signUp('Fresh', { verified: false });
    const res = await fresh.agent.get(ME);
    expect(res.status).toBe(200);
    expect(data(res).user.emailVerified).toBe(false);
  });

  it('refuses a visitor (401) and a deactivated account (403)', async () => {
    expect((await anon().get(ME)).status).toBe(401);
    const gone = await withRole('Gone');
    await prisma.user.update({ where: { id: gone.user.id }, data: { isActive: false } });
    const res = await gone.agent.get(ME);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('DELETE /api/users/user/remove-avatar', () => {
  const REMOVE = '/api/users/user/remove-avatar';

  it('unlinks the avatar, clears the image, then deletes the file and its row', async () => {
    const me = await withRole('Avatar remover');
    const key = await setAvatar(me.agent);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: me.user.id } })).image).toBe(key);

    const res = await me.agent.delete(REMOVE);
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({ message: 'Avatar removed.' });
    expect(await prisma.avatarMediaItem.findUnique({ where: { userId: me.user.id } })).toBeNull();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: me.user.id } })).image).toBeNull();
    // The file goes after the response
    await vi.waitFor(async () => {
      expect(inBucket(key)).toBe(false);
      expect(await prisma.mediaItem.findUnique({ where: { key } })).toBeNull();
    });
  });

  it('deletes the old file when an avatar is replaced', async () => {
    const me = await withRole('Avatar changer');
    const first = await setAvatar(me.agent);
    const second = await setAvatar(me.agent);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: me.user.id } })).image).toBe(second);
    await vi.waitFor(() => expect(inBucket(first)).toBe(false));
    expect(inBucket(second)).toBe(true);
  });

  it('answers 200 with nothing to remove, and needs no verified email', async () => {
    const fresh = await signUp('No avatar', { verified: false });
    const res = await fresh.agent.delete(REMOVE);
    expect(res.status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: fresh.user.id } })).image).toBeNull();
  });

  it('needs a session', async () => {
    expect((await anon().delete(REMOVE)).status).toBe(401);
  });
});

describe('GET /api/users/admin/get-user-by-id/:userId', () => {
  const byId = (id) => `/api/users/admin/get-user-by-id/${id}`;

  it('shows an admin or a developer the safe view of a user', async () => {
    const admin = await withRole('Lookup admin', 'ADMIN');
    const developer = await withRole('Lookup developer', 'DEVELOPER');
    const target = await withRole('Looked up');
    for (const viewer of [admin, developer]) {
      const res = await viewer.agent.get(byId(target.user.id));
      expect(res.status).toBe(200);
      const { user } = data(res);
      expect(user).toMatchObject({ id: target.user.id, email: target.email, role: 'USER', isActive: true });
      // No sessions, accounts or password hashes
      expect(Object.keys(user).sort()).toEqual(
        ['createdAt', 'email', 'emailVerified', 'id', 'image', 'isActive', 'name', 'role', 'updatedAt'].sort()
      );
    }
  });

  it('refuses a visitor (401) and a plain user (403), and answers an unknown id with 404', async () => {
    const admin = await withRole('Lookup admin 2', 'ADMIN');
    const user = await withRole('Nosy');
    expect((await anon().get(byId(admin.user.id))).status).toBe(401);
    const refused = await user.agent.get(byId(admin.user.id));
    expect(refused.status).toBe(403);
    expect(refused.body.message).toBe('This action requires an admin or developer role.');
    expect((await admin.agent.get(byId('00000000-0000-4000-8000-000000000000'))).status).toBe(404);
  });
});

describe('PATCH /api/users/admin/change-user-role', () => {
  const change = (agent, body) => agent.patch('/api/users/admin/change-user-role').send(body);

  it('lets an admin promote a user (any casing), at once', async () => {
    const admin = await withRole('Role admin', 'ADMIN');
    const target = await withRole('Promoted');
    expect((await target.agent.get('/api/users/admin/get-all-users')).status).toBe(403);

    const res = await change(admin.agent, { userId: target.user.id, newRole: 'admin' });
    expect(res.status).toBe(200);
    expect(data(res).user).toMatchObject({ id: target.user.id, role: 'ADMIN' });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: target.user.id } })).role).toBe('ADMIN');
    // The next request already has the new role
    expect((await target.agent.get('/api/users/admin/get-all-users')).status).toBe(200);

    // And back
    expect((await change(admin.agent, { userId: target.user.id, newRole: 'USER' })).status).toBe(200);
    expect((await target.agent.get('/api/users/admin/get-all-users')).status).toBe(403);
  });

  it('refuses missing or unknown fields with 400 and an unknown user with 404', async () => {
    const admin = await withRole('Role admin 2', 'ADMIN');
    const target = await withRole('Role target');
    expect((await change(admin.agent, {})).status).toBe(400);
    expect((await change(admin.agent, { userId: target.user.id })).status).toBe(400);
    const badRole = await change(admin.agent, { userId: target.user.id, newRole: 'OWNER' });
    expect(badRole.status).toBe(400);
    expect(badRole.body.message).toBe('Role must be USER, ADMIN or DEVELOPER.');
    expect((await change(admin.agent, { userId: '00000000-0000-4000-8000-000000000000', newRole: 'ADMIN' })).status).toBe(404);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: target.user.id } })).role).toBe('USER');
  });

  it('keeps the developer role to developers, and nobody changes their own role', async () => {
    const admin = await withRole('Role admin 3', 'ADMIN');
    const developer = await withRole('Role developer', 'DEVELOPER');
    const target = await withRole('Role target 2');

    const grant = await change(admin.agent, { userId: target.user.id, newRole: 'DEVELOPER' });
    expect(grant.status).toBe(403);
    expect(grant.body.message).toBe('Only a developer can grant or remove the developer role.');
    const demoteDeveloper = await change(admin.agent, { userId: developer.user.id, newRole: 'USER' });
    expect(demoteDeveloper.status).toBe(403);
    expect(demoteDeveloper.body.message).toBe('Only a developer can manage developer accounts.');
    const self = await change(admin.agent, { userId: admin.user.id, newRole: 'USER' });
    expect(self.status).toBe(403);
    expect(self.body.message).toMatch(/your own role/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.user.id } })).role).toBe('ADMIN');

    // A developer may grant it, and take it away
    expect(data(await change(developer.agent, { userId: target.user.id, newRole: 'DEVELOPER' })).user.role).toBe('DEVELOPER');
    expect(data(await change(developer.agent, { userId: target.user.id, newRole: 'USER' })).user.role).toBe('USER');
  });

  it('refuses a plain user (403) and a visitor (401)', async () => {
    const user = await withRole('Climber');
    expect((await change(user.agent, { userId: user.user.id, newRole: 'ADMIN' })).status).toBe(403);
    expect((await change(anon(), { userId: user.user.id, newRole: 'ADMIN' })).status).toBe(401);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).role).toBe('USER');
  });
});

describe('deactivating and reactivating a user', () => {
  const deactivate = (agent, id) => agent.patch(`/api/users/admin/deactivate-user/${id}`);
  const reactivate = (agent, id) => agent.patch(`/api/users/admin/reactivate-user/${id}`);

  it('ends every session of the account, and it can no longer sign in until reactivated', async () => {
    const admin = await withRole('Status admin', 'ADMIN');
    const target = await withRole('Deactivated');
    // A second session, from another device
    expect((await signIn(target.email)).status).toBe(200);
    expect(await prisma.session.count({ where: { userId: target.user.id } })).toBe(2);

    const res = await deactivate(admin.agent, target.user.id);
    expect(res.status).toBe(200);
    expect(data(res).user).toMatchObject({ id: target.user.id, isActive: false });
    expect(await prisma.session.count({ where: { userId: target.user.id } })).toBe(0);
    // The old cookie leads nowhere
    expect((await target.agent.get('/api/maps')).status).toBe(401);

    const refused = await signIn(target.email);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toMatch(/deactivated/i);
    expect(await prisma.session.count({ where: { userId: target.user.id } })).toBe(0);

    const back = await reactivate(admin.agent, target.user.id);
    expect(back.status).toBe(200);
    expect(data(back).user.isActive).toBe(true);
    expect((await signIn(target.email)).status).toBe(200);
    expect(await prisma.session.count({ where: { userId: target.user.id } })).toBe(1);
  });

  it('follows the admin rules: not yourself, a developer only by a developer, an unknown id 404', async () => {
    const admin = await withRole('Status admin 2', 'ADMIN');
    const developer = await withRole('Status developer', 'DEVELOPER');
    const otherDeveloper = await withRole('Status developer 2', 'DEVELOPER');

    const self = await deactivate(admin.agent, admin.user.id);
    expect(self.status).toBe(403);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.user.id } })).isActive).toBe(true);
    expect((await deactivate(admin.agent, developer.user.id)).status).toBe(403);
    expect((await reactivate(admin.agent, developer.user.id)).status).toBe(403);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: developer.user.id } })).isActive).toBe(true);

    expect((await deactivate(developer.agent, otherDeveloper.user.id)).status).toBe(200);
    expect((await reactivate(developer.agent, otherDeveloper.user.id)).status).toBe(200);

    expect((await deactivate(admin.agent, '00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await reactivate(admin.agent, '00000000-0000-4000-8000-000000000000')).status).toBe(404);
  });

  it('refuses a plain user (403) and a visitor (401)', async () => {
    const user = await withRole('Status user');
    const target = await withRole('Status target');
    expect((await deactivate(user.agent, target.user.id)).status).toBe(403);
    expect((await reactivate(user.agent, target.user.id)).status).toBe(403);
    expect((await deactivate(anon(), target.user.id)).status).toBe(401);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: target.user.id } })).isActive).toBe(true);
    expect(await prisma.session.count({ where: { userId: target.user.id } })).toBe(1);
  });
});
