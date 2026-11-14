// Sharing (Google Docs style) for maps and trips: members, invites, roles, links.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, sentEmails, signUp, testEmail, trackUser, uploadPhoto } from './helpers.js';
import request from 'supertest';

afterAll(cleanUp);

const shareEmailTo = (to) => sentEmails().filter((e) => e.to === to && e.template === 'shareEmail');

describe('people with access to a map', () => {
  let owner;
  let friend;
  let stranger;
  let map;

  beforeAll(async () => {
    owner = await signUp('Owner');
    friend = await signUp('Friend');
    stranger = await signUp('Stranger');
    map = await defaultMapOf(owner.agent);
  });

  it('adds an existing user as a viewer and emails them', async () => {
    const res = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: friend.email.toUpperCase(), role: 'VIEWER' });
    expect(res.status).toBe(201);
    expect(data(res).member).toMatchObject({ userId: friend.user.id, role: 'VIEWER', email: friend.email });
    await vi.waitFor(() => expect(shareEmailTo(friend.email)).toHaveLength(1));
    expect(shareEmailTo(friend.email)[0].context).toMatchObject({ isInvite: false, canEdit: false });

    const theirMaps = data(await friend.agent.get('/api/maps')).maps;
    expect(theirMaps.find((m) => m.id === map.id)).toMatchObject({ role: 'VIEWER', ownerName: 'Owner' });
    expect(data(await friend.agent.get(`/api/maps/${map.id}`)).map.role).toBe('VIEWER');
  });

  it('refuses bad input and sharing with yourself', async () => {
    const url = `/api/maps/${map.id}/members`;
    expect((await owner.agent.post(url).send({ email: 'not-an-email', role: 'VIEWER' })).status).toBe(400);
    expect((await owner.agent.post(url).send({ email: friend.email, role: 'OWNER' })).status).toBe(400);
    expect((await owner.agent.post(url).send({ email: owner.email, role: 'EDITOR' })).status).toBe(400);
  });

  it('lets a viewer look but not edit, and strangers not even look', async () => {
    expect((await friend.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED' })).status).toBe(403);
    expect((await friend.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Mine' })).status).toBe(403);
    expect((await friend.agent.patch(`/api/maps/${map.id}`).send({ name: 'Renamed' })).status).toBe(403);
    expect((await stranger.agent.get(`/api/maps/${map.id}`)).status).toBe(404);
    expect((await stranger.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED' })).status).toBe(404);
  });

  it('changes roles: an editor can edit content but not manage sharing', async () => {
    const promoted = await owner.agent.patch(`/api/maps/${map.id}/members/${friend.user.id}`).send({ role: 'EDITOR' });
    expect(promoted.status).toBe(200);
    expect(data(promoted).member.role).toBe('EDITOR');

    expect((await friend.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED' })).status).toBe(200);
    expect((await friend.agent.get(`/api/maps/${map.id}/sharing`)).status).toBe(403);
    expect((await friend.agent.post(`/api/maps/${map.id}/members`).send({ email: stranger.email, role: 'VIEWER' })).status).toBe(403);
    expect((await friend.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(403);
    expect((await friend.agent.delete(`/api/maps/${map.id}`)).status).toBe(403);
    expect((await stranger.agent.get(`/api/maps/${map.id}/sharing`)).status).toBe(404);

    expect((await owner.agent.patch(`/api/maps/${map.id}/members/${stranger.user.id}`).send({ role: 'EDITOR' })).status).toBe(404);
    expect((await owner.agent.patch(`/api/maps/${map.id}/members/${friend.user.id}`).send({ role: 'ADMIN' })).status).toBe(400);
  });

  it('lists who has access for the owner', async () => {
    const sharing = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    expect(sharing.linkAccess).toBe('RESTRICTED');
    expect(sharing.shareCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(sharing.shareUrl).toMatch(/\/shared\/[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(sharing.members).toEqual([expect.objectContaining({ userId: friend.user.id, role: 'EDITOR' })]);
  });

  it('lets a member leave, but not remove someone else', async () => {
    const third = await signUp('Third');
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: third.email, role: 'VIEWER' });
    expect((await friend.agent.delete(`/api/maps/${map.id}/members/${third.user.id}`)).status).toBe(403);

    expect((await third.agent.delete(`/api/maps/${map.id}/members/${third.user.id}`)).status).toBe(200);
    expect((await third.agent.get(`/api/maps/${map.id}`)).status).toBe(404);
    expect((await third.agent.delete(`/api/maps/${map.id}/members/${third.user.id}`)).status).toBe(404);
  });
});

describe('invites for people without an account', () => {
  it('invites by email, then the person accepts once their address is verified', async () => {
    const owner = await signUp('Inviter');
    const map = await defaultMapOf(owner.agent);
    const email = testEmail('newcomer');

    const res = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email, role: 'EDITOR' });
    expect(res.status).toBe(201);
    const invite = data(res).invite;
    expect(invite).toMatchObject({ email, role: 'EDITOR' });

    await vi.waitFor(() => expect(shareEmailTo(email)).toHaveLength(1));
    const { context } = shareEmailTo(email)[0];
    expect(context.isInvite).toBe(true);
    const token = context.actionUrl.split('/').pop();
    expect(token.length).toBeGreaterThanOrEqual(20);
    // Only the hash is stored
    const stored = await prisma.shareInvite.findUnique({ where: { id: invite.id } });
    expect(stored.tokenHash).not.toBe(token);

    expect(data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).invites).toEqual([expect.objectContaining({ id: invite.id, email })]);

    // They sign up: not verified yet, so no access and the invite can't be used
    const agent = request.agent((await import('../../src/server.js')).default).set('Origin', 'http://localhost:5173');
    const signUpRes = await agent.post('/api/auth/sign-up/email').send({ email, password: 'integration-test-password-1', name: 'Newcomer' });
    expect(signUpRes.status).toBe(200);
    const newcomer = await prisma.user.findUniqueOrThrow({ where: { email } });
    trackUser(newcomer.id);
    expect((await agent.get(`/api/maps/${map.id}`)).status).toBe(404);
    expect((await agent.post('/api/invites/accept').send({ token })).status).toBe(403);

    // Someone else, verified, can't use it either
    const other = await signUp('Other', { verified: true });
    expect((await other.agent.post('/api/invites/accept').send({ token })).status).toBe(403);

    // Verified: accepted, with the invited role
    await prisma.user.update({ where: { id: newcomer.id }, data: { emailVerified: true } });
    const accepted = await agent.post('/api/invites/accept').send({ token });
    expect(accepted.status).toBe(200);
    expect(data(accepted)).toEqual({ resource: 'map', id: map.id });
    expect(data(await agent.get(`/api/maps/${map.id}`)).map.role).toBe('EDITOR');

    // Used up, and gone from the pending list
    expect((await agent.post('/api/invites/accept').send({ token })).status).toBe(400);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).invites).toEqual([]);
    expect((await agent.post('/api/invites/accept').send({ token: 'x'.repeat(30) })).status).toBe(400);
  });

  it('invites to a trip only, and refuses an expired invite', async () => {
    const owner = await signUp('TripInviter');
    const map = await defaultMapOf(owner.agent);
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Patagonia' })).trip;
    const invitee = await signUp('TripInvitee', { verified: true });
    // An address with no account yet, so this makes an invite
    const email = testEmail('later');
    await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email, role: 'VIEWER' });
    await vi.waitFor(() => expect(shareEmailTo(email)).toHaveLength(1));
    const token = shareEmailTo(email)[0].context.actionUrl.split('/').pop();

    // Give the invitee that address (as if they'd signed up with it) and accept
    await prisma.user.update({ where: { id: invitee.user.id }, data: { email } });
    const accepted = await invitee.agent.post('/api/invites/accept').send({ token });
    expect(accepted.status).toBe(200);
    expect(data(accepted)).toEqual({ resource: 'trip', id: trip.id });
    expect(data(await invitee.agent.get(`/api/trips/${trip.id}`)).trip.role).toBe('VIEWER');
    expect((await invitee.agent.get(`/api/maps/${map.id}`)).status).toBe(404);

    // An expired invite is refused
    const staleEmail = testEmail('stale');
    const stale = data(await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: staleEmail, role: 'VIEWER' })).invite;
    await vi.waitFor(() => expect(shareEmailTo(staleEmail)).toHaveLength(1));
    const staleToken = shareEmailTo(staleEmail)[0].context.actionUrl.split('/').pop();
    await prisma.shareInvite.update({ where: { id: stale.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await prisma.user.update({ where: { id: invitee.user.id }, data: { email: staleEmail } });
    expect((await invitee.agent.post('/api/invites/accept').send({ token: staleToken })).status).toBe(400);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).invites).toEqual([]);
  });

  it('lets the owner cancel an invite', async () => {
    const owner = await signUp('Canceller');
    const map = await defaultMapOf(owner.agent);
    const invite = data(await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: testEmail('never'), role: 'VIEWER' })).invite;
    expect((await owner.agent.delete(`/api/maps/${map.id}/invites/${invite.id}`)).status).toBe(200);
    expect((await owner.agent.delete(`/api/maps/${map.id}/invites/${invite.id}`)).status).toBe(404);
  });
});

describe('share links', () => {
  let owner;
  let editor;
  let map;
  let code;
  let visiblePhoto;
  let hiddenPhoto;
  let otherMapPhoto;

  beforeAll(async () => {
    owner = await signUp('Linker');
    editor = await signUp('LinkEditor');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Visible trip' });
    visiblePhoto = data(await uploadPhoto(owner.agent, map.id, { latitude: 48.8575, longitude: 2.2952 })).photo;
    hiddenPhoto = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'IT' })).photo;
    await owner.agent.patch(`/api/photos/${hiddenPhoto.id}`).send({ hidden: true });

    const other = await signUp('OtherLinker');
    const otherMap = await defaultMapOf(other.agent);
    otherMapPhoto = data(await uploadPhoto(other.agent, otherMap.id, { countryCode: 'JP' })).photo;

    code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
  });

  it('is closed to anonymous visitors while access is restricted', async () => {
    expect((await anon().get(`/api/shared/${code}`)).status).toBe(404);
    expect((await anon().get(`/api/shared/${code}/photos`)).status).toBe(404);
    expect((await anon().get('/api/shared/NOT-A-CODE')).status).toBe(404);
  });

  it('opens read-only to anyone once "anyone with the link" is on', async () => {
    const on = await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    expect(on.status).toBe(200);
    expect(data(on).linkAccess).toBe('ANYONE_WITH_LINK');
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'PUBLIC' })).status).toBe(400);

    // Any spelling of the code works: lower case, no dashes
    const res = await anon().get(`/api/shared/${code.replace(/-/g, '').toLowerCase()}`);
    expect(res.status).toBe(200);
    const shared = data(res);
    expect(shared).toMatchObject({ resource: 'map', id: map.id, role: 'VIEWER' });
    expect(shared.map.travellers.every((t) => !('userId' in t))).toBe(true);
    expect(shared.trips.map((t) => t.title)).toEqual(['Visible trip']);
    expect(shared.map.stats.photos).toBe(1);

    // A signed-in member keeps their own role through the link
    expect(data(await editor.agent.get(`/api/shared/${code}`)).role).toBe('EDITOR');
  });

  it('lets link visitors browse only visible photos of this map, without GPS or originals', async () => {
    const page = data(await anon().get(`/api/shared/${code}/photos`));
    expect(page.photos.map((p) => p.id)).toEqual([visiblePhoto.id]);
    expect(page.photos[0]).not.toHaveProperty('latitude');

    const opened = data(await anon().get(`/api/shared/${code}/photos/${visiblePhoto.id}`)).photo;
    expect(opened.displayUrl).toContain('X-Amz-Signature=');
    expect(opened).not.toHaveProperty('originalUrl');
    expect(opened).not.toHaveProperty('latitude');

    expect((await anon().get(`/api/shared/${code}/photos/${hiddenPhoto.id}`)).status).toBe(404);
    expect((await anon().get(`/api/shared/${code}/photos/${otherMapPhoto.id}`)).status).toBe(404);
    expect((await anon().get(`/api/shared/${code}/photos/not-a-uuid`)).status).toBe(404);
  });

  it('gives link visitors nothing outside /shared', async () => {
    expect((await anon().get(`/api/maps/${map.id}`)).status).toBe(401);
    expect((await anon().get(`/api/photos/${visiblePhoto.id}`)).status).toBe(401);
  });

  it('kills the old link when it is reset', async () => {
    const reset = await owner.agent.post(`/api/maps/${map.id}/sharing/reset-link`);
    expect(reset.status).toBe(200);
    const newCode = data(reset).shareCode;
    expect(newCode).not.toBe(code);
    expect((await anon().get(`/api/shared/${code}`)).status).toBe(404);
    expect((await anon().get(`/api/shared/${code}/photos/${visiblePhoto.id}`)).status).toBe(404);
    expect((await anon().get(`/api/shared/${newCode}`)).status).toBe(200);
    expect((await editor.agent.post(`/api/maps/${map.id}/sharing/reset-link`)).status).toBe(403);
  });
});

describe('sharing one trip', () => {
  it('shares a trip by link and by person without exposing the rest of the map', async () => {
    const owner = await signUp('TripOwner');
    const friend = await signUp('TripFriend');
    const map = await defaultMapOf(owner.agent);
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Iceland' })).trip;
    await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Secret' });
    const inTrip = data(await uploadPhoto(owner.agent, map.id, { tripId: trip.id, countryCode: 'IS' })).photo;
    const notInTrip = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'NO' })).photo;

    const sharing = data(await owner.agent.get(`/api/trips/${trip.id}/sharing`));
    expect(sharing.members).toEqual([]);
    await owner.agent.patch(`/api/trips/${trip.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });

    const shared = data(await anon().get(`/api/shared/${sharing.shareCode}`));
    expect(shared).toMatchObject({ resource: 'trip', id: trip.id, role: 'VIEWER' });
    expect(shared.trip.title).toBe('Iceland');
    const photos = data(await anon().get(`/api/shared/${sharing.shareCode}/photos`)).photos;
    expect(photos.map((p) => p.id)).toEqual([inTrip.id]);
    expect((await anon().get(`/api/shared/${sharing.shareCode}/photos/${notInTrip.id}`)).status).toBe(404);

    // Shared with a person as viewer: they see the trip, can't edit it or manage its sharing
    expect((await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: friend.email, role: 'VIEWER' })).status).toBe(201);
    expect(data(await friend.agent.get(`/api/trips/${trip.id}`)).trip.role).toBe('VIEWER');
    expect((await friend.agent.patch(`/api/trips/${trip.id}`).send({ title: 'Mine' })).status).toBe(403);
    expect((await friend.agent.get(`/api/trips/${trip.id}/sharing`)).status).toBe(403);
    expect((await friend.agent.get(`/api/maps/${map.id}`)).status).toBe(404);

    // They leave the trip
    expect((await friend.agent.delete(`/api/trips/${trip.id}/members/${friend.user.id}`)).status).toBe(200);
    expect((await friend.agent.get(`/api/trips/${trip.id}`)).status).toBe(404);
  });
});
