// The country collections (docs/API.md "Badges and goals"; 24 Nov 2026, the user's wish):
// bronze, silver and gold for a quarter, half and all of a place's landmarks stamped in the
// passport, ticks and photos alike, listed with the badges for the places a map has started.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, data, defaultMapOf, signUp } from './helpers.js';

afterAll(cleanUp);

describe('country collections', () => {
  let owner;
  let viewer;
  let map;
  let malta;
  const badgesOf = async (who) => data(await who.agent.get(`/api/maps/${map.id}/badges`));
  const collection = (badges, place) => badges.filter((b) => b.group === 'collections' && b.place === place);
  const tick = (landmarkId) => owner.agent.put(`/api/maps/${map.id}/landmarks/${landmarkId}/been`);

  beforeAll(async () => {
    [owner, viewer] = await Promise.all([signUp('CollectOwner'), signUp('CollectViewer')]);
    map = await defaultMapOf(owner.agent);
    expect((await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' })).status).toBe(201);
    // Malta has three landmarks: bronze at one, silver at two, gold at three
    malta = data(await owner.agent.get('/api/landmarks?country=MT')).landmarks;
    expect(malta).toHaveLength(3);
  });

  it('lists nothing for a place not started, and the World Heritage tiers up to 250', async () => {
    const { badges } = await badgesOf(owner);
    expect(badges.filter((b) => b.group === 'collections')).toEqual([]);
    expect(badges.filter((b) => b.key.startsWith('unesco-')).map((b) => b.need)).toEqual([5, 25, 50, 100, 250]);
  });

  it('awards bronze for the first of three, and shows how far silver and gold are', async () => {
    expect((await tick(malta[0].id)).status).toBe(200);
    const { badges, newlyEarned } = await badgesOf(owner);
    expect(newlyEarned).toContain('collect-MT-bronze');
    expect(collection(badges, 'MT')).toEqual([
      { key: 'collect-MT-bronze', group: 'collections', place: 'MT', tier: 'bronze', have: 1, need: 1, earnedAt: expect.any(String) },
      { key: 'collect-MT-silver', group: 'collections', place: 'MT', tier: 'silver', have: 1, need: 2, earnedAt: null },
      { key: 'collect-MT-gold', group: 'collections', place: 'MT', tier: 'gold', have: 1, need: 3, earnedAt: null },
    ]);
  });

  it('awards silver and gold as the rest are stamped, each once', async () => {
    await tick(malta[1].id);
    await tick(malta[2].id);
    const first = await badgesOf(owner);
    expect(first.newlyEarned).toEqual(expect.arrayContaining(['collect-MT-silver', 'collect-MT-gold']));
    expect(collection(first.badges, 'MT').every((b) => b.earnedAt)).toBe(true);
    expect((await badgesOf(owner)).newlyEarned).toEqual([]);
  });

  it('keeps an award when a stamp goes, and shows a viewer the same without awarding', async () => {
    expect((await owner.agent.delete(`/api/maps/${map.id}/landmarks/${malta[2].id}/been`)).status).toBe(200);
    const { badges } = await badgesOf(owner);
    expect(collection(badges, 'MT').find((b) => b.tier === 'gold')).toMatchObject({ have: 3, need: 3, earnedAt: expect.any(String) });
    const forViewer = await badgesOf(viewer);
    expect(forViewer.newlyEarned).toEqual([]);
    expect(collection(forViewer.badges, 'MT').map((b) => b.key)).toEqual(['collect-MT-bronze', 'collect-MT-silver', 'collect-MT-gold']);
  });

  it('counts a UK landmark in its nation on a map that splits the UK', async () => {
    const scottish = data(await owner.agent.get('/api/landmarks?country=GB')).landmarks.find((l) => l.nation === 'XC');
    expect((await tick(scottish.id)).status).toBe(200);
    const { badges } = await badgesOf(owner);
    expect(collection(badges, 'XC').length).toBeGreaterThan(0);
    expect(collection(badges, 'GB')).toEqual([]);
    expect(collection(badges, 'XC').every((b) => b.have === 1)).toBe(true);
  });
});
