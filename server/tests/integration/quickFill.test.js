// "Where have you been?" (docs/API.md "Countries visited"; 22 Nov 2026): ticking several
// countries at once, by the owner or a co-owner, before the email is verified too (a new
// account's map offers it first), only ever adding; and the setting that it was asked.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('ticking several countries at once', () => {
  let owner;
  let viewer;
  let map;
  const fill = (who, countryCodes) => who.agent.post(`/api/maps/${map.id}/visits/quick-fill`).send({ countryCodes });
  const statusOf = async (code) => (await prisma.countryVisit.findUnique({ where: { mapId_countryCode: { mapId: map.id, countryCode: code } } }))?.status ?? null;

  beforeAll(async () => {
    // Not verified yet: a new account opens its map before its address is
    owner = await signUp('QuickFillOwner', { verified: false });
    viewer = await signUp('QuickFillViewer');
    map = await defaultMapOf(owner.agent);
    await prisma.travelMap.update({ where: { id: map.id }, data: { splitUk: false } });
    await prisma.countryVisit.createMany({
      data: [
        { mapId: map.id, countryCode: 'IE', status: 'LIVED', source: 'MANUAL' },
        { mapId: map.id, countryCode: 'JP', status: 'WANT_TO_GO', source: 'MANUAL' },
      ],
    });
    await prisma.mapMember.create({ data: { mapId: map.id, userId: viewer.user.id, role: 'VIEWER' } });
  });

  it('marks them visited, a "want to go" too, never changing one lived in, and needs no verified email', async () => {
    const res = await fill(owner, ['FR', 'JP', 'IE', 'XC', 'FR']);
    expect(res.status).toBe(200);
    // France and Scotland (the UK, as this map doesn't split it) added, Japan turned visited
    expect(data(res)).toEqual({ added: 3 });
    expect(await statusOf('FR')).toBe('VISITED');
    expect(await statusOf('GB')).toBe('VISITED');
    expect(await statusOf('JP')).toBe('VISITED');
    expect(await statusOf('IE')).toBe('LIVED');
    expect(await statusOf('XC')).toBeNull();
  });

  it('is the owner’s or a co-owner’s, and wants known countries, 1 to 300', async () => {
    expect((await fill(viewer, ['ES'])).status).toBe(403);
    expect((await fill(owner, [])).status).toBe(400);
    expect((await fill(owner, ['ZZ'])).status).toBe(400);
    expect((await fill(owner, 'FR')).status).toBe(400);
    expect((await fill(owner, Array.from({ length: 301 }, () => 'FR'))).status).toBe(400);
  });

  it('remembers that the map asked, in the account’s map settings', async () => {
    const saved = await owner.agent.put('/api/users/map-settings').send({ mapSettings: { countriesAsked: true } });
    expect(saved.status).toBe(200);
    expect(JSON.stringify(data(await owner.agent.get('/api/users/map-settings')))).toContain('"countriesAsked":true');
  });
});
