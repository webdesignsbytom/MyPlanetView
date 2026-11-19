// Badges and goals (docs/API.md, "Badges and goals"): counted from the map, awarded as the
// owner or an editor loads them, never taken back; goals checked, capped and kept per map.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp } from './helpers.js';

afterAll(cleanUp);

describe('badges and goals', () => {
  let owner;
  let viewer;
  let stranger;
  let map;

  const mark = (code, status = 'VISITED') => owner.agent.put(`/api/maps/${map.id}/visits/${code}`).send({ status });
  const badgesOf = async (agent) => {
    const res = await agent.get(`/api/maps/${map.id}/badges`);
    expect(res.status).toBe(200);
    return data(res);
  };
  const badge = (result, key) => result.badges.find((b) => b.key === key);

  beforeAll(async () => {
    owner = await signUp('BadgeOwner');
    viewer = await signUp('BadgeViewer');
    stranger = await signUp('BadgeStranger');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
  });

  it('awards badges when the owner loads them, once', async () => {
    expect((await badgesOf(owner.agent)).newlyEarned).toEqual([]);
    for (const code of ['FR', 'DK', 'NO', 'SE']) expect((await mark(code)).status).toBe(200);
    const first = await badgesOf(owner.agent);
    expect(first.newlyEarned).toEqual(expect.arrayContaining(['countries-1', 'continent-europe', 'region-scandinavia']));
    expect(badge(first, 'region-scandinavia')).toMatchObject({ have: 3, need: 3, earnedAt: expect.any(String) });
    expect(badge(first, 'countries-5')).toMatchObject({ have: 4, need: 5, earnedAt: null });
    expect((await badgesOf(owner.agent)).newlyEarned).toEqual([]);
    expect(await prisma.badgeAward.count({ where: { mapId: map.id } })).toBe(first.newlyEarned.length);
  });

  it("shows a viewer the progress but leaves the awarding to the map's editors", async () => {
    await mark('IT');
    const seen = await badgesOf(viewer.agent);
    expect(seen.newlyEarned).toEqual([]);
    expect(badge(seen, 'countries-5')).toMatchObject({ have: 5, earnedAt: null });
    expect((await badgesOf(owner.agent)).newlyEarned).toEqual(['countries-5']);
    expect((await stranger.agent.get(`/api/maps/${map.id}/badges`)).status).toBe(404);
  });

  it('never takes a badge back', async () => {
    expect((await owner.agent.delete(`/api/maps/${map.id}/visits/SE`)).status).toBe(200);
    expect(badge(await badgesOf(owner.agent), 'region-scandinavia')).toMatchObject({ have: 3, need: 3, earnedAt: expect.any(String) });
  });

  it('adds goals with their progress, and marks one met as achieved', async () => {
    const count = await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_COUNT', target: 3, title: 'Three for now' });
    expect(count.status).toBe(201);
    expect(data(count).goal).toMatchObject({ kind: 'COUNTRY_COUNT', target: 3, title: 'Three for now', achievedAt: expect.any(String), progress: { have: 3, need: 3, met: true } });

    const list = await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_LIST', countryCodes: ['JP', 'XN', 'FR'] });
    expect(data(list).goal).toMatchObject({ achievedAt: null, progress: { have: 1, need: 3, done: ['FR'] } });

    const region = await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'REGION', region: 'scandinavia', deadline: '2030-12-31' });
    // With a deadline a country counts by its photo or its visit's date: Denmark and Norway,
    // marked today, count; Sweden was unmarked above (19 Nov 2026, the user's decision)
    expect(data(region).goal).toMatchObject({ deadline: '2030-12-31', progress: { have: 2, need: 3, missed: false } });

    for (const body of [{ kind: 'COUNTRY_COUNT' }, { kind: 'REGION', region: 'atlantis' }, { kind: 'COUNTRY_LIST', countryCodes: ['ZZ'] }]) {
      expect((await owner.agent.post(`/api/maps/${map.id}/goals`).send(body)).status).toBe(400);
    }
    expect((await viewer.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_COUNT', target: 1 })).status).toBe(403);
    expect((await stranger.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_COUNT', target: 1 })).status).toBe(404);
  });

  it('asks again when what a goal asks for changes, and keeps it through a new title', async () => {
    const { goals } = data(await owner.agent.get(`/api/maps/${map.id}/goals`));
    const goal = goals.find((g) => g.kind === 'COUNTRY_COUNT');
    const renamed = data(await owner.agent.patch(`/api/goals/${goal.id}`).send({ title: 'Three!' })).goal;
    expect(renamed.achievedAt).toBe(goal.achievedAt);
    // France, Denmark, Norway and Italy (Sweden was unmarked above)
    const raised = await owner.agent.patch(`/api/goals/${goal.id}`).send({ target: 10 });
    expect(data(raised).goal).toMatchObject({ target: 10, achievedAt: null, progress: { have: 4, need: 10, met: false } });
    expect((await owner.agent.patch(`/api/goals/${goal.id}`).send({ kind: 'REGION' })).status).toBe(400);
    expect((await viewer.agent.patch(`/api/goals/${goal.id}`).send({ target: 1 })).status).toBe(403);
    expect((await stranger.agent.delete(`/api/goals/${goal.id}`)).status).toBe(404);
  });

  it('announces a goal reached once, even to two loads at the same moment', async () => {
    const goal = data(await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_LIST', countryCodes: ['PE'] })).goal;
    expect(goal.achievedAt).toBeNull();
    await mark('PE');
    const both = await Promise.all([owner.agent.get(`/api/maps/${map.id}/goals`), owner.agent.get(`/api/maps/${map.id}/goals`)]);
    const announced = both.flatMap((res) => data(res).newlyAchieved).filter((id) => id === goal.id);
    expect(announced).toEqual([goal.id]);
    for (const res of both) expect(data(res).goals.find((g) => g.id === goal.id).achievedAt).not.toBeNull();
    await owner.agent.delete(`/api/goals/${goal.id}`);
  });

  it('lets viewers and a map link see goals, without awarding', async () => {
    await mark('JP');
    const forViewer = data(await viewer.agent.get(`/api/maps/${map.id}/goals`));
    expect(forViewer.newlyAchieved).toEqual([]);
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    for (const what of ['goals', 'badges']) {
      const res = await anon().get(`/api/shared/${shareCode}/${what}`);
      expect(res.status, what).toBe(200);
    }
    expect(data(await anon().get(`/api/shared/${shareCode}/goals`)).newlyAchieved).toEqual([]);
  });

  it('keeps at most 50 goals on a map, and deletes one', async () => {
    const existing = await prisma.goal.count({ where: { mapId: map.id } });
    await prisma.goal.createMany({
      data: [...Array(50 - existing)].map(() => ({ mapId: map.id, kind: 'COUNTRY_COUNT', target: 1 })),
    });
    expect((await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_COUNT', target: 2 })).status).toBe(409);
    const [goal] = data(await owner.agent.get(`/api/maps/${map.id}/goals`)).goals;
    expect((await owner.agent.delete(`/api/goals/${goal.id}`)).status).toBe(200);
    expect((await owner.agent.post(`/api/maps/${map.id}/goals`).send({ kind: 'COUNTRY_COUNT', target: 2 })).status).toBe(201);
  });

  it('refuses a goal whose fields break its kind, in the database too', async () => {
    await expect(prisma.goal.create({ data: { mapId: map.id, kind: 'REGION', target: 3 } })).rejects.toThrow();
  });
});

describe('travellers’ badges', () => {
  it('gives each person the travel badges of the completed trips they were on, dated by the trip', async () => {
    const owner = await signUp('TravBadgeOwner');
    const map = await defaultMapOf(owner.agent);
    await owner.agent.patch(`/api/maps/${map.id}`).send({ groupType: 'FAMILY' });
    const add = async (name) => data(await owner.agent.post(`/api/maps/${map.id}/travellers`).send({ name })).traveller;
    const ann = await add('Ann');
    const bo = await add('Bo');
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon', startDate: '2025-03-01', endDate: '2025-03-08' })).trip;
    await owner.agent.put(`/api/trips/${trip.id}/travellers`).send({ travellerIds: [ann.id] });
    await owner.agent.post(`/api/trips/${trip.id}/stops`).send({ countryCode: 'PT' });

    const of = async (traveller, key) => {
      const { travellers } = data(await owner.agent.get(`/api/maps/${map.id}/badges`));
      return travellers.find((t) => t.id === traveller.id)?.badges.find((b) => b.key === key);
    };
    // A planned trip counts for nobody yet
    expect(await of(ann, 'countries-1')).toMatchObject({ have: 0, earned: false, earnedOn: null });
    await owner.agent.patch(`/api/trips/${trip.id}`).send({ status: 'COMPLETED' });
    expect(await of(ann, 'countries-1')).toMatchObject({ have: 1, earned: true, earnedOn: '2025-03-08' });
    expect(await of(ann, 'continent-europe')).toMatchObject({ earned: true });
    // Bo wasn't on it; and only travel badges are per person
    expect(await of(bo, 'countries-1')).toMatchObject({ have: 0, earned: false });
    expect(await of(ann, 'photos-100')).toBeUndefined();
  });
});
