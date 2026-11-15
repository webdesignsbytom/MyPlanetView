// Adding or changing content needs a verified email address; setting up the map and the
// account doesn't (routes/*.js, middleware/auth.js requireVerifiedEmail).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

const contactKeys = new Set();

afterAll(async () => {
  await prisma.mediaItem.deleteMany({ where: { key: { in: [...contactKeys] } } });
  await cleanUp();
});

const NEEDS_VERIFIED = /verify your email address to add to your map/i;
const PNG = { contentType: 'image/png', bytes: 2048 };

describe('an account whose email is not verified yet', () => {
  let user;
  let map;

  beforeAll(async () => {
    user = await signUp('Newcomer', { verified: false });
    map = await defaultMapOf(user.agent);
  });

  it('can set up its map, as the welcome page does, and change its own settings', async () => {
    const { agent } = user;
    expect((await agent.patch(`/api/maps/${map.id}`).send({ name: 'Our map', groupType: 'COUPLE' })).status).toBe(200);
    const added = await agent.post(`/api/maps/${map.id}/travellers`).send({ name: 'Sam', birthCountryCode: 'GB' });
    expect(added.status).toBe(201);
    const traveller = data(added).traveller;
    expect((await agent.patch(`/api/maps/${map.id}/travellers/${traveller.id}`).send({ favouriteCountryCode: 'JP' })).status).toBe(200);
    expect((await agent.delete(`/api/maps/${map.id}/travellers/${traveller.id}`)).status).toBe(200);
    expect((await agent.put('/api/users/map-settings').send({ mapSettings: { style: 'galaxy' } })).status).toBe(200);
  });

  it('can read its map, its stats and its sharing settings', async () => {
    const { agent } = user;
    expect((await agent.get('/api/maps')).status).toBe(200);
    expect((await agent.get(`/api/maps/${map.id}`)).status).toBe(200);
    expect((await agent.get(`/api/maps/${map.id}/stats`)).status).toBe(200);
    expect((await agent.get(`/api/maps/${map.id}/trips`)).status).toBe(200);
    expect((await agent.get(`/api/maps/${map.id}/photos`)).status).toBe(200);
    expect((await agent.get(`/api/maps/${map.id}/sharing`)).status).toBe(200);
  });

  it('gets 403 with a clear message for every change to content, and nothing is written', async () => {
    const { agent } = user;
    const attempts = [
      agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED' }),
      agent.delete(`/api/maps/${map.id}/visits/FR`),
      agent.post('/api/maps').send({ name: 'Second map', groupType: 'SOLO' }),
      agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Paris' }),
      agent.post(`/api/maps/${map.id}/photos/presign`).send({ files: [] }),
      agent.post(`/api/maps/${map.id}/photos`).send({}),
      agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' }),
      agent.post(`/api/maps/${map.id}/sharing/reset-link`),
      agent.post(`/api/maps/${map.id}/members`).send({ email: 'friend@example.test', role: 'VIEWER' }),
      agent.delete(`/api/maps/${map.id}`),
      agent.post('/api/users/user/upload-or-change-avatar').send({ key: 'x' }),
      agent.post('/api/media-services/presign-url').send({ resource: 'avatar', filename: 'me.png', ...PNG }),
    ];
    for (const res of await Promise.all(attempts)) {
      expect(res.status, `${res.req.method} ${res.req.path}`).toBe(403);
      expect(res.body.message).toMatch(NEEDS_VERIFIED);
    }

    expect(await prisma.countryVisit.count({ where: { mapId: map.id } })).toBe(0);
    expect(await prisma.trip.count({ where: { mapId: map.id } })).toBe(0);
    expect(await prisma.travelMap.count({ where: { ownerId: user.user.id } })).toBe(1);
    const stored = await prisma.travelMap.findUniqueOrThrow({ where: { id: map.id } });
    expect(stored.linkAccess).toBe('RESTRICTED');
  });

  it('can still attach an image to the contact form, like a visitor', async () => {
    const res = await user.agent.post('/api/media-services/presign-url').send({ resource: 'contact', filename: 'shot.png', ...PNG });
    expect(res.status).toBe(200);
    contactKeys.add(res.body.key);
  });

  it("gets the same 403 for someone else's trip or photo id, or one that doesn't exist", async () => {
    const other = await signUp('Elsewhere');
    const otherMap = await defaultMapOf(other.agent);
    const trip = data(await other.agent.post(`/api/maps/${otherMap.id}/trips`).send({ title: 'Lisbon' })).trip;
    const missing = '00000000-0000-4000-8000-000000000000';
    for (const res of [
      await user.agent.patch(`/api/trips/${trip.id}`).send({ title: 'Mine now' }),
      await user.agent.patch(`/api/trips/${missing}`).send({ title: 'Nothing' }),
      await user.agent.delete(`/api/photos/${missing}`),
    ]) {
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(NEEDS_VERIFIED);
    }
  });

  it('can add content once the address is verified', async () => {
    await prisma.user.update({ where: { id: user.user.id }, data: { emailVerified: true } });
    expect((await user.agent.put(`/api/maps/${map.id}/visits/FR`).send({ status: 'VISITED' })).status).toBe(200);
    expect((await user.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Paris' })).status).toBe(201);
  });
});
