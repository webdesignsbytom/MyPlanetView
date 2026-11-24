// The supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish): a paying
// member's plan on the banner of their maps, for everyone who opens them, share links too, on
// unless the owner turns it off in their map settings.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('the supporter badge', () => {
  let owner;
  let viewer;
  let map;
  let shareCode;
  const supporterFor = async (who) => data(await who.agent.get(`/api/maps/${map.id}`)).map.supporter;
  const sharedSupporter = async () => data(await anon().get(`/api/shared/${shareCode}`)).map.supporter;

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('BadgeOwner'), signUp('BadgeViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    ({ shareCode } = await prisma.travelMap.findUnique({ where: { id: map.id }, select: { shareCode: true } }));
  });

  it('is nothing while the owner is on Economy', async () => {
    expect(await supporterFor(owner)).toBeNull();
    expect(await supporterFor(viewer)).toBeNull();
    expect(await sharedSupporter()).toBeNull();
  });

  it('shows the owner’s paid plan to everyone, share links too', async () => {
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    const badge = { plan: 'PREMIUM', name: 'First Class', shown: true };
    expect(await supporterFor(owner)).toEqual(badge);
    expect(await supporterFor(viewer)).toEqual(badge);
    expect(await sharedSupporter()).toEqual(badge);
  });

  it('turned off by the owner, goes from everyone else; the owner still has it, not shown', async () => {
    expect((await owner.agent.put('/api/users/map-settings').send({ mapSettings: { showSupporterBadge: false } })).status).toBe(200);
    expect(await supporterFor(owner)).toEqual({ plan: 'PREMIUM', name: 'First Class', shown: false });
    expect(await supporterFor(viewer)).toBeNull();
    expect(await sharedSupporter()).toBeNull();
    // A viewer's own switch changes nothing on someone else's map
    expect((await viewer.agent.put('/api/users/map-settings').send({ mapSettings: { showSupporterBadge: true } })).status).toBe(200);
    expect(await supporterFor(viewer)).toBeNull();
  });

  it('comes back when turned on, and is the account’s plan, even on a free extra map', async () => {
    await owner.agent.put('/api/users/map-settings').send({ mapSettings: { showSupporterBadge: true } });
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    expect(await sharedSupporter()).toEqual({ plan: 'REGULAR', name: 'Business', shown: true });
    // A second map: one of the account's free Economy maps
    const second = data(await owner.agent.post('/api/maps').send({ name: 'Weekends away', groupType: 'SOLO', travellers: [{ name: 'Me' }] })).map;
    expect(second.tier).toBe('ECONOMY');
    expect(second.supporter).toEqual({ plan: 'REGULAR', name: 'Business', shown: true });
  });
});
