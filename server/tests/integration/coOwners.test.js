// Co-owners (docs/API.md "Co-owners", 19 Nov 2026): one of a map's travellers with their own
// login and the owner's powers on that map, but deleting it, handing it over, paying for it
// and removing a co-owner. Invited by email; signing up from the invite's link verifies the
// address and makes them the traveller at once.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PASSWORD, anon, cleanUp, data, defaultMapOf, prisma, sentEmails, signUp, testEmail, trackUser } from './helpers.js';

afterAll(cleanUp);

const emailsTo = (to, template) => sentEmails().filter((e) => e.to === to && e.template === template);
const tokenOf = (email) => email.context.actionUrl.split('/').pop();

/** A couple's map: the owner's default map, made COUPLE, with a second traveller. */
async function coupleMap(owner, partnerName = 'Gigie') {
  const map = await defaultMapOf(owner.agent);
  expect((await owner.agent.patch(`/api/maps/${map.id}`).send({ groupType: 'COUPLE' })).status).toBe(200);
  const added = await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name: partnerName });
  expect(added.status).toBe(201);
  const travellers = data(await owner.agent.get(`/api/maps/${map.id}`)).map.travellers;
  return { map, partner: data(added).traveller, own: travellers.find((t) => t.id !== data(added).traveller.id) };
}

describe('inviting a co-owner who has no account', () => {
  let owner;
  let map;
  let partner;
  let own;
  const email = testEmail('gigie');

  beforeAll(async () => {
    owner = await signUp('Tom');
    ({ map, partner, own } = await coupleMap(owner));
  });

  it('needs a traveller, and one that is free', async () => {
    const url = `/api/maps/${map.id}/members`;
    expect((await owner.agent.post(url).send({ email, role: 'CO_OWNER' })).status).toBe(400);
    // The owner's own traveller is theirs
    expect((await owner.agent.post(url).send({ email, role: 'CO_OWNER', travellerId: own.id })).status).toBe(409);
  });

  it('sends an invite naming the traveller', async () => {
    const res = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email, role: 'CO_OWNER', travellerId: partner.id });
    expect(res.status).toBe(201);
    expect(data(res).invite).toMatchObject({ email, role: 'CO_OWNER', travellerId: partner.id, travellerName: 'Gigie' });
    await vi.waitFor(() => expect(emailsTo(email, 'shareEmail')).toHaveLength(1));
    expect(emailsTo(email, 'shareEmail')[0].context).toMatchObject({ isInvite: true, isCoOwner: true, travellerName: 'Gigie', canEdit: true });

    const sharing = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    expect(sharing.invites).toEqual([expect.objectContaining({ email, role: 'CO_OWNER', travellerName: 'Gigie' })]);
  });

  it('keeps a couple to one co-owner, and the invited traveller to its invite', async () => {
    const other = testEmail('other');
    const url = `/api/maps/${map.id}/members`;
    expect((await owner.agent.post(url).send({ email: other, role: 'CO_OWNER', travellerId: partner.id })).status).toBe(409);
    // The invited traveller can't be deleted while the invite waits
    expect((await owner.agent.delete(`/api/maps/${map.id}/travellers/${partner.id}`)).status).toBe(409);
  });

  it('shows the invite to whoever holds its link, signed out', async () => {
    const token = tokenOf(emailsTo(email, 'shareEmail')[0]);
    const res = await anon().get(`/api/invites/${token}`);
    expect(res.status).toBe(200);
    expect(data(res).invite).toMatchObject({ email, role: 'CO_OWNER', kind: 'map', id: map.id, invitedBy: 'Tom', travellerName: 'Gigie' });
    expect((await anon().get(`/api/invites/${'x'.repeat(40)}`)).status).toBe(404);
  });

  it('signs up from the link verified, as the co-owner and the traveller, with no second email', async () => {
    const token = tokenOf(emailsTo(email, 'shareEmail')[0]);
    const agent = anon();
    const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: 'Gigie', inviteToken: token });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    trackUser(user.id);
    expect(user.emailVerified).toBe(true);

    await vi.waitFor(async () => {
      const member = await prisma.mapMember.findUnique({ where: { mapId_userId: { mapId: map.id, userId: user.id } } });
      expect(member?.role).toBe('CO_OWNER');
    });
    expect((await prisma.traveller.findUnique({ where: { id: partner.id } })).userId).toBe(user.id);
    expect(emailsTo(email, 'userVerificationEmail')).toEqual([]);
    // Their own map too, as every account has
    expect(await prisma.travelMap.count({ where: { ownerId: user.id, isDefault: true } })).toBe(1);
    expect(data(await agent.get(`/api/maps/${map.id}`)).map.role).toBe('CO_OWNER');
    // The link is used up
    expect((await anon().get(`/api/invites/${token}`)).status).toBe(404);
  });
});

describe('signing up with an invite link for another address', () => {
  it('signs up as usual: unverified, with the verification email', async () => {
    const owner = await signUp('Inviter');
    const { map, partner } = await coupleMap(owner);
    const invited = testEmail('invited');
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: invited, role: 'CO_OWNER', travellerId: partner.id });
    await vi.waitFor(() => expect(emailsTo(invited, 'shareEmail')).toHaveLength(1));
    const token = tokenOf(emailsTo(invited, 'shareEmail')[0]);

    const someoneElse = testEmail('forwarded');
    const res = await anon().post('/api/auth/sign-up/email').send({ email: someoneElse, password: PASSWORD, name: 'Fwd', inviteToken: token });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: someoneElse } });
    trackUser(user.id);
    expect(user.emailVerified).toBe(false);
    await vi.waitFor(() => expect(emailsTo(someoneElse, 'userVerificationEmail')).toHaveLength(1));
    expect(await prisma.mapMember.count({ where: { mapId: map.id, userId: user.id } })).toBe(0);
  });
});

describe("a co-owner's powers", () => {
  let owner;
  let partner;
  let friend;
  let map;
  let partnerTraveller;
  let own;

  beforeAll(async () => {
    owner = await signUp('Owner');
    partner = await signUp('Partner');
    friend = await signUp('Friend');
    ({ map, partner: partnerTraveller, own } = await coupleMap(owner, 'Partner'));
    // A verified account becomes a co-owner at once, and its traveller
    const res = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: partner.email, role: 'CO_OWNER', travellerId: partnerTraveller.id });
    expect(res.status).toBe(201);
    expect(data(res).member).toMatchObject({ userId: partner.user.id, role: 'CO_OWNER', travellerId: partnerTraveller.id, travellerName: 'Partner' });
  });

  it('changes the map and shares it', async () => {
    expect((await partner.agent.patch(`/api/maps/${map.id}`).send({ name: 'Our travels' })).status).toBe(200);
    expect((await partner.agent.get(`/api/maps/${map.id}/sharing`)).status).toBe(200);
    expect((await partner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const added = await partner.agent.post(`/api/maps/${map.id}/members`).send({ email: friend.email, role: 'EDITOR' });
    expect(added.status).toBe(201);
    expect((await partner.agent.patch(`/api/maps/${map.id}/members/${friend.user.id}`).send({ role: 'VIEWER' })).status).toBe(200);
    // Never with the owner
    expect((await partner.agent.post(`/api/maps/${map.id}/members`).send({ email: owner.email, role: 'VIEWER' })).status).toBe(400);
  });

  it("can't delete the map, hand it over or make it their main map", async () => {
    expect((await partner.agent.delete(`/api/maps/${map.id}`)).status).toBe(403);
    expect((await partner.agent.post(`/api/maps/${map.id}/transfer`).send({ userId: friend.user.id })).status).toBe(403);
    expect((await partner.agent.post(`/api/maps/${map.id}/main`)).status).toBe(403);
  });

  it("keeps the travellers co-owners need", async () => {
    // The co-owner's own, and the owner's (a couple's map then has one)
    expect((await owner.agent.delete(`/api/maps/${map.id}/travellers/${partnerTraveller.id}`)).status).toBe(409);
    expect((await owner.agent.delete(`/api/maps/${map.id}/travellers/${own.id}`)).status).toBe(409);
  });

  it('never counts as an editor', async () => {
    const seats = await prisma.mapMember.count({ where: { mapId: map.id, role: 'EDITOR' } });
    expect(seats).toBe(0);
    for (let i = 0; i < 5; i++) {
      const res = await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: testEmail(`ed${i}`), role: 'EDITOR' });
      expect(res.status).toBe(201);
    }
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: testEmail('sixth'), role: 'EDITOR' })).status).toBe(409);
  });

  it('is only on maps, never a trip', async () => {
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ startDate: '2019-04-10', endDate: '2019-04-12', title: 'Lisbon' })).trip;
    const res = await owner.agent.post(`/api/trips/${trip.id}/members`).send({ email: friend.email, role: 'CO_OWNER', travellerId: own.id });
    expect(res.status).toBe(400);
  });

  it('leaves, and their traveller stays with no login', async () => {
    expect((await partner.agent.delete(`/api/maps/${map.id}/members/${partner.user.id}`)).status).toBe(200);
    expect((await prisma.traveller.findUnique({ where: { id: partnerTraveller.id } })).userId).toBeNull();
    expect((await partner.agent.get(`/api/maps/${map.id}`)).status).toBe(404);
  });
});

describe('a family with two co-owners', () => {
  it('only the owner takes a co-owner away', async () => {
    const owner = await signUp('Dad');
    const mum = await signUp('Mum');
    const teen = await signUp('Teen');
    const map = await defaultMapOf(owner.agent);
    await owner.agent.patch(`/api/maps/${map.id}`).send({ groupType: 'FAMILY' });
    const mumT = data(await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Mum' })).traveller;
    const teenT = data(await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Teen' })).traveller;
    const add = (agent, who, travellerId) =>
      agent.post(`/api/maps/${map.id}/members`).send({ email: who.email, role: 'CO_OWNER', travellerId });

    expect((await add(owner.agent, mum, mumT.id)).status).toBe(201);
    // A co-owner can add a co-owner
    expect((await add(mum.agent, teen, teenT.id)).status).toBe(201);
    // but not take one away, or lower their role
    expect((await mum.agent.patch(`/api/maps/${map.id}/members/${teen.user.id}`).send({ role: 'EDITOR' })).status).toBe(403);
    expect((await mum.agent.delete(`/api/maps/${map.id}/members/${teen.user.id}`)).status).toBe(403);
    // Three travellers: no room for a third co-owner
    const extra = await signUp('Extra');
    expect((await add(owner.agent, extra, teenT.id)).status).toBe(409);
    // The owner can
    expect((await owner.agent.patch(`/api/maps/${map.id}/members/${teen.user.id}`).send({ role: 'EDITOR' })).status).toBe(200);
  });
});

describe('handing a map to its co-owner', () => {
  it('swaps the two: the old owner stays as a co-owner', async () => {
    const owner = await signUp('Old');
    const partner = await signUp('New');
    const { map, partner: t } = await coupleMap(owner, 'New');
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: partner.email, role: 'CO_OWNER', travellerId: t.id });
    const res = await owner.agent.post(`/api/maps/${map.id}/transfer`).send({ userId: partner.user.id });
    expect(res.status).toBe(200);
    expect(data(res).map.role).toBe('CO_OWNER');
    expect(data(await partner.agent.get(`/api/maps/${map.id}`)).map.role).toBe('OWNER');
  });
});
