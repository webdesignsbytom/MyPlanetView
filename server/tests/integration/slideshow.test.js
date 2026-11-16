// The slideshows' photo orders (docs/API.md, "Slideshows"): oldest taken first, a shuffle
// fixed by its seed, and the DISPLAY copy on request; viewers never get hidden photos.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('slideshow orders', () => {
  let owner;
  let viewer;
  let map;
  const ids = {};

  const list = async (agent, query) => {
    const res = await agent.get(`/api/maps/${map.id}/photos?${query}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return data(res);
  };
  const allPages = async (agent, query) => {
    const seen = [];
    let cursor = null;
    do {
      const page = await list(agent, `${query}${cursor ? `&cursor=${cursor}` : ''}`);
      seen.push(...page.photos.map((p) => p.id));
      cursor = page.nextCursor;
    } while (cursor);
    return seen;
  };

  beforeAll(async () => {
    owner = await signUp('ShowOwner');
    viewer = await signUp('ShowViewer');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    const taken = { a: '2024-08-01T10:00:00.000Z', b: '2019-02-01T10:00:00.000Z', c: '2022-05-01T10:00:00.000Z', d: null };
    for (const [name, takenAt] of Object.entries(taken)) {
      ids[name] = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PT', takenAt })).photo.id;
    }
  });

  it('plays oldest taken first; a photo with no date goes by when it was uploaded', async () => {
    expect(await allPages(owner.agent, 'order=taken&limit=2')).toEqual([ids.b, ids.c, ids.a, ids.d]);
    // Changing the date moves it; taking the date away puts it back at its upload time
    await owner.agent.patch(`/api/photos/${ids.a}`).send({ takenAt: '2010-01-01T00:00:00.000Z' });
    expect(await allPages(owner.agent, 'order=taken')).toEqual([ids.a, ids.b, ids.c, ids.d]);
    await owner.agent.patch(`/api/photos/${ids.a}`).send({ takenAt: null });
    expect((await allPages(owner.agent, 'order=taken')).slice(0, 2)).toEqual([ids.b, ids.c]);
  });

  it('sends the display copy only when asked', async () => {
    const plain = (await list(owner.agent, 'order=taken')).photos[0];
    expect(plain).not.toHaveProperty('displayUrl');
    const shown = (await list(owner.agent, 'order=taken&display=1')).photos[0];
    expect(shown).toMatchObject({ thumbUrl: expect.any(String), displayUrl: expect.any(String) });
  });

  it('shuffles the same way for the same seed, every photo once', async () => {
    const one = await allPages(owner.agent, 'order=shuffle&seed=12345&limit=3');
    expect([...one].sort()).toEqual(Object.values(ids).sort());
    expect(await allPages(owner.agent, 'order=shuffle&seed=12345&limit=1')).toEqual(one);
  });

  it('refuses an unknown order or a shuffle without a seed', async () => {
    for (const query of ['order=random', 'order=shuffle', 'order=shuffle&seed=0', 'display=yes']) {
      expect((await owner.agent.get(`/api/maps/${map.id}/photos?${query}`)).status, query).toBe(400);
    }
    const missing = '00000000-0000-4000-8000-000000000000';
    expect((await owner.agent.get(`/api/maps/${map.id}/photos?order=shuffle&seed=5&cursor=${missing}`)).status).toBe(400);
  });

  it('never plays a hidden photo to a viewer or a share link', async () => {
    await owner.agent.patch(`/api/photos/${ids.c}`).send({ hidden: true });
    expect(await allPages(viewer.agent, 'order=taken')).not.toContain(ids.c);
    expect(await allPages(viewer.agent, 'order=shuffle&seed=7')).not.toContain(ids.c);
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = data(await anon().get(`/api/shared/${shareCode}/photos?order=taken&display=1`));
    expect(shared.photos.map((p) => p.id)).not.toContain(ids.c);
    expect(shared.photos[0].displayUrl).toEqual(expect.any(String));
  });
});
