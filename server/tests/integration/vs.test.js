// Vs mode (26 Nov 2026, the user's wish: "connect to another account and have all your stats and
// badges compared. Able to add multiple people. Gold silver bronze ratings for top people";
// docs/API.md "Vs mode"): friends join by a link, each with a map that counts, and see everyone's
// numbers and medals; at most 8 people (the user's decision). Numbers and names only.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp } from './helpers.js';

afterAll(cleanUp);

describe('Vs mode', () => {
  let ann;
  let ben;
  let cat;
  let dan;
  let maps;
  let group;
  let code;

  const visit = (person, countryCodes) => person.agent.post(`/api/maps/${maps[person.name].id}/visits/quick-fill`).send({ countryCodes });
  const detail = async (person, id = group.id) => data(await person.agent.get(`/api/vs/${id}`)).group;
  const row = (g, name) => g.members.find((m) => m.name === name);

  beforeAll(async () => {
    [ann, ben, cat, dan] = await Promise.all([signUp('VsAnn'), signUp('VsBen'), signUp('VsCat'), signUp('VsDan')]);
    maps = {};
    for (const person of [ann, ben, cat, dan]) maps[person.name] = await defaultMapOf(person.agent);
    expect((await visit(ann, ['FR', 'IT', 'ES'])).status).toBe(200);
    expect((await visit(ben, ['FR', 'IT', 'ES', 'JP', 'PE'])).status).toBe(200);
  });

  it('starts one with the starter in it, counting a map of theirs', async () => {
    expect((await ann.agent.post('/api/vs').send({ mapId: maps.VsBen.id })).status).toBe(400);
    expect((await ann.agent.post('/api/vs').send({ mapId: 'nope' })).status).toBe(400);
    const unverified = await signUp('VsUnverified', { verified: false });
    expect((await unverified.agent.post('/api/vs').send({ mapId: (await defaultMapOf(unverified.agent)).id })).status).toBe(403);

    const res = await ann.agent.post('/api/vs').send({ title: '  The Gang ', mapId: maps.VsAnn.id });
    expect(res.status).toBe(201);
    group = data(res).group;
    code = group.joinCode;
    expect(group).toMatchObject({ title: 'The Gang', youStartedIt: true, myMap: { id: maps.VsAnn.id }, memberLimit: 8 });
    expect(code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    expect(group.categories).toEqual(['countries', 'unCountries', 'continents', 'landmarks', 'worldHeritage', 'oneShots', 'badges', 'flights', 'daysAway', 'distanceKm']);
    expect(group.members).toEqual([expect.objectContaining({ name: 'VsAnn', isYou: true, startedIt: true, counting: true, place: 1, gold: 0 })]);
    expect(group.members[0].values).toMatchObject({ countries: 3, unCountries: 3, continents: 1 });
    // Alone, no medals yet
    expect(Object.values(group.members[0].medals).every((m) => m === null)).toBe(true);
  });

  it('shows its link to anyone: its title, who started it and how many are in, nothing else', async () => {
    const res = await anon().get(`/api/vs/join/${code.replace(/-/g, '').toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(data(res).group).toEqual({ id: group.id, title: 'The Gang', startedBy: 'VsAnn', memberCount: 1, memberLimit: 8, full: false, youAreIn: false });
    expect((await anon().get('/api/vs/join/ZZZZ-ZZZZ-ZZZZ')).status).toBe(404);
    expect((await anon().post(`/api/vs/join/${code}`).send({ mapId: maps.VsAnn.id })).status).toBe(401);
  });

  it('lets friends join with their own map, and compares everyone with medals', async () => {
    expect((await cat.agent.post(`/api/vs/join/${code}`).send({ mapId: maps.VsAnn.id })).status).toBe(400);
    expect((await ben.agent.post(`/api/vs/join/${code}`).send({ mapId: maps.VsBen.id })).status).toBe(201);
    // Joining again changes nothing
    expect((await ben.agent.post(`/api/vs/join/${code}`).send({ mapId: maps.VsBen.id })).status).toBe(200);
    expect((await cat.agent.post(`/api/vs/join/${code}`).send({ mapId: maps.VsCat.id })).status).toBe(201);

    const seen = await detail(ben);
    expect(seen.members.map((m) => m.name)).toEqual(['VsAnn', 'VsBen', 'VsCat']);
    expect(row(seen, 'VsBen')).toMatchObject({ isYou: true, startedIt: false, values: { countries: 5, continents: 3 } });
    expect(row(seen, 'VsBen').medals).toMatchObject({ countries: 'gold', continents: 'gold' });
    expect(row(seen, 'VsAnn').medals).toMatchObject({ countries: 'silver', continents: 'silver' });
    // Nothing gives no medal
    expect(row(seen, 'VsCat').medals.countries).toBeNull();
    expect(row(seen, 'VsBen').place).toBe(1);
    expect(row(seen, 'VsAnn').place).toBe(2);
    // Numbers and names only: never a map's or a person's id
    const text = JSON.stringify(seen.members);
    for (const secret of [maps.VsAnn.id, maps.VsBen.id, ann.user.id, ben.user.id]) expect(text).not.toContain(secret);
    expect(seen.myMap).toEqual({ id: maps.VsBen.id, name: maps.VsBen.name });

    // Someone not in it can't see it
    expect((await dan.agent.get(`/api/vs/${group.id}`)).status).toBe(404);
    expect((await ben.agent.get('/api/vs/not-a-group')).status).toBe(404);
    const preview = data(await ben.agent.get(`/api/vs/join/${code}`)).group;
    expect(preview).toMatchObject({ memberCount: 3, youAreIn: true });
  });

  it('lists the comparisons someone is in', async () => {
    const { groups } = data(await ben.agent.get('/api/vs'));
    expect(groups).toEqual([{ id: group.id, title: 'The Gang', memberCount: 3, youStartedIt: false, hasMap: true }]);
  });

  it('holds 8 people at most', async () => {
    const more = await Promise.all([1, 2, 3, 4, 5].map((n) => signUp(`VsMore${n}`)));
    for (const person of more.slice(0, 4)) {
      expect((await person.agent.post(`/api/vs/join/${code}`).send({ mapId: (await defaultMapOf(person.agent)).id })).status).toBe(201);
    }
    expect(data(await anon().get(`/api/vs/join/${code}`)).group).toMatchObject({ memberCount: 7, full: false });
    expect((await dan.agent.post(`/api/vs/join/${code}`).send({ mapId: maps.VsDan.id })).status).toBe(201);
    expect(data(await anon().get(`/api/vs/join/${code}`)).group).toMatchObject({ memberCount: 8, full: true });
    const ninth = more[4];
    expect((await ninth.agent.post(`/api/vs/join/${code}`).send({ mapId: (await defaultMapOf(ninth.agent)).id })).status).toBe(409);
    expect((await detail(ann)).members).toHaveLength(8);
  });

  it('counts nothing for someone whose map is gone, until they pick another', async () => {
    const spare = data(await cat.agent.post('/api/maps').send({ name: 'Spare', groupType: 'SOLO', travellers: [{ name: 'Cat' }] })).map;
    expect((await cat.agent.patch(`/api/vs/${group.id}/me`).send({ mapId: spare.id })).status).toBe(200);
    expect((await cat.agent.patch(`/api/vs/${group.id}/me`).send({ mapId: maps.VsAnn.id })).status).toBe(400);
    expect((await cat.agent.delete(`/api/maps/${spare.id}`)).status).toBe(200);
    const seen = await detail(cat);
    expect(row(seen, 'VsCat')).toMatchObject({ counting: false, values: null, place: null });
    expect(seen.myMap).toBeNull();
    expect((await cat.agent.patch(`/api/vs/${group.id}/me`).send({ mapId: maps.VsCat.id })).status).toBe(200);
    expect(row(await detail(cat), 'VsCat').counting).toBe(true);
  });

  it('is the starter’s to rename, re-link and delete; anyone else may leave', async () => {
    expect((await ben.agent.patch(`/api/vs/${group.id}`).send({ title: 'Mine now' })).status).toBe(403);
    expect((await ann.agent.patch(`/api/vs/${group.id}`).send({})).status).toBe(400);
    expect(data(await ann.agent.patch(`/api/vs/${group.id}`).send({ title: 'Gang of eight' })).group.title).toBe('Gang of eight');

    expect((await ben.agent.post(`/api/vs/${group.id}/reset-link`)).status).toBe(403);
    const relinked = data(await ann.agent.post(`/api/vs/${group.id}/reset-link`)).group;
    expect(relinked.joinCode).not.toBe(code);
    expect((await anon().get(`/api/vs/join/${code}`)).status).toBe(404);

    expect((await ann.agent.delete(`/api/vs/${group.id}/me`)).status).toBe(409);
    expect((await ben.agent.delete(`/api/vs/${group.id}/me`)).status).toBe(200);
    expect((await ben.agent.get(`/api/vs/${group.id}`)).status).toBe(404);

    expect((await cat.agent.delete(`/api/vs/${group.id}`)).status).toBe(403);
    expect((await ann.agent.delete(`/api/vs/${group.id}`)).status).toBe(200);
    expect((await ann.agent.get(`/api/vs/${group.id}`)).status).toBe(404);
    expect(data(await ann.agent.get('/api/vs')).groups).toEqual([]);
  });
});
