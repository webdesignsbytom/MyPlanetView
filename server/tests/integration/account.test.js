// Deleting an account: shared maps pass to the longest-standing editor, the
// person's uploads go everywhere, and their unshared maps go. Also the account
// checks around better-auth: the delete password, names, and changing the email.
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  PASSWORD,
  anon,
  cleanUp,
  data,
  defaultMapOf,
  inBucket,
  prisma,
  sentEmails,
  signUp,
  testEmail,
  trackUser,
  uploadPhoto,
} from './helpers.js';

afterAll(cleanUp);

const photoKeys = async (photoId) =>
  (await prisma.photoVariant.findMany({ where: { photoId }, include: { media: true } })).map((v) => v.media.key);

describe('deleting an account', () => {
  it('hands shared maps to the longest-standing editor and removes the rest', async () => {
    // Verified: sharers need it, and only verified accounts are added directly
    const leaver = await signUp('Leaver', { verified: true });
    const viewer = await signUp('EarlyViewer', { verified: true });
    const firstEditor = await signUp('FirstEditor', { verified: true });
    const secondEditor = await signUp('SecondEditor', { verified: true });
    const elsewhere = await signUp('Elsewhere', { verified: true });

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
    const target = await signUp('Target', { verified: true });
    const sleepy = await signUp('Sleepy', { verified: true });
    const active = await signUp('Active', { verified: true });
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
    const owner = await signUp('Keeper', { verified: true });
    const onlyEditor = await signUp('OnlyEditor', { verified: true });
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

  it('needs a password at all: a fresh session alone is not enough', async () => {
    const user = await signUp('NoPassword');
    for (const body of [{}, { password: '' }, { token: 'anything' }, { callbackURL: '/' }]) {
      const res = await user.agent.post('/api/auth/delete-user').send(body);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/password/i);
    }
    expect(await prisma.user.findUnique({ where: { id: user.user.id } })).not.toBeNull();
  });
});

describe('account names', () => {
  it('cleans the name at sign-up: one line, no control characters, 80 at most', async () => {
    const email = testEmail('named');
    const res = await anon()
      .post('/api/auth/sign-up/email')
      .send({ email, password: PASSWORD, name: `  Evil\r\nBcc: x@example.test\u{202E}${'y'.repeat(200)}` });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    trackUser(user.id);
    expect(user.name).not.toMatch(/[\r\n\u{202E}]/u);
    expect(user.name.startsWith('Evil Bcc: x@example.test y')).toBe(true);
    expect(user.name).toHaveLength(80);
  });

  it('refuses a sign-up whose name is only spaces or control characters', async () => {
    const email = testEmail('blank');
    const res = await anon().post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: ' \r\n\t ' });
    expect(res.status).toBe(400);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });

  it('cleans a new name the same way', async () => {
    const user = await signUp('Renamer');
    expect((await user.agent.post('/api/auth/update-user').send({ name: ' New\nName ' })).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).name).toBe('New Name');
    expect((await user.agent.post('/api/auth/update-user').send({ name: '\u0000' })).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).name).toBe('New Name');
  });
});

describe('changing the email address', () => {
  const emailsTo = (to, template) => sentEmails().filter((e) => e.to === to && e.template === template);
  const tokenOf = (link) => new URL(link).pathname.split('/').pop();

  it('asks the current address first when it is verified, then the new one', async () => {
    const user = await signUp('Mover', { verified: true });
    const newEmail = testEmail('moved');

    expect((await user.agent.post('/api/auth/change-email').send({ newEmail })).status).toBe(200);
    await vi.waitFor(() => expect(emailsTo(user.email, 'userChangeEmailConfirmation')).toHaveLength(1));
    const [confirm] = emailsTo(user.email, 'userChangeEmailConfirmation');
    expect(confirm.kind).toBe('change-email');
    expect(confirm.context).toMatchObject({ email: user.email, newEmail });
    expect(confirm.context.confirmationUrl).toMatch(/\?change=confirm$/);
    // Nothing goes to the new address yet, and the email hasn't changed
    expect(emailsTo(newEmail, 'userVerificationEmail')).toEqual([]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).email).toBe(user.email);

    // Confirmed from the current address: the new one gets the usual verification link
    expect((await user.agent.get(`/api/auth/verify-email?token=${tokenOf(confirm.context.confirmationUrl)}`)).status).toBe(200);
    await vi.waitFor(() => expect(emailsTo(newEmail, 'userVerificationEmail')).toHaveLength(1));
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).email).toBe(user.email);

    // Clicking that one makes the change
    const [verify] = emailsTo(newEmail, 'userVerificationEmail');
    expect((await user.agent.get(`/api/auth/verify-email?token=${tokenOf(verify.context.confirmationUrl)}`)).status).toBe(200);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).toMatchObject({ email: newEmail, emailVerified: true });
  });

  it('sends an unverified account straight to the new address', async () => {
    const user = await signUp('NewMover', { verified: false });
    const newEmail = testEmail('fresh');
    expect((await user.agent.post('/api/auth/change-email').send({ newEmail })).status).toBe(200);
    await vi.waitFor(() => expect(emailsTo(newEmail, 'userVerificationEmail')).toHaveLength(1));
    expect(emailsTo(user.email, 'userChangeEmailConfirmation')).toEqual([]);
  });
});
