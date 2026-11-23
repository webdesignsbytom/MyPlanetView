// Planned trips on the map (docs/API.md "Planned trips on the map"; 22 Nov 2026, the user's
// wish): the map's trip list gives its own trips their stops' places, which the map outlines
// for the planned ones; never through a share link, which would tell anyone with it where the
// map's people are going.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('planned trips on the map', () => {
  let owner;
  let viewer;
  let map;
  let trip;

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('PlannedOwner'), signUp('PlannedViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Japan and Korea', startDate: '2027-04-01', endDate: '2027-04-15' })).trip;
    for (const countryCode of ['JP', 'KR', 'JP']) {
      expect((await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode })).status).toBe(201);
    }
  });

  const listed = async (who) => data(await who.agent.get(`/api/maps/${map.id}/trips`)).trips.find((t) => t.id === trip.id);

  it('gives the map’s own trips their places, each once in stop order, to anyone on the map', async () => {
    expect(await listed(owner)).toMatchObject({ status: 'PLANNED', countryCodes: ['JP', 'KR'], linked: false });
    expect((await listed(viewer)).countryCodes).toEqual(['JP', 'KR']);
    // A trip with no stops has none
    const empty = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ startDate: '2019-04-10', endDate: '2019-04-12', title: 'Somewhere' })).trip;
    expect((await listed(owner)).countryCodes).toEqual(['JP', 'KR']);
    expect(data(await owner.agent.get(`/api/maps/${map.id}/trips`)).trips.find((t) => t.id === empty.id).countryCodes).toEqual([]);
  });

  it('never gives them through a share link', async () => {
    expect((await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' })).status).toBe(200);
    const { shareCode } = await prisma.travelMap.findUnique({ where: { id: map.id }, select: { shareCode: true } });
    const shared = data(await anon().get(`/api/shared/${shareCode}`)).trips.find((t) => t.id === trip.id);
    expect(shared).toBeTruthy();
    expect(shared.countryCodes).toBeUndefined();
  });
});
