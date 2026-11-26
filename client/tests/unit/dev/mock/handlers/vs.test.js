// Mock mode's Vs mode (docs/API.md "Vs mode"): the server's routes over the store
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM, SAM_MAP, USER, db, del, freshStore, get, patch, post, registerAllRoutes, setVerified, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const SEEDED = 'vs-friends';
const row = (group, name) => group.members.find((m) => m.name === name);

describe('the comparisons you’re in', () => {
  it('lists them, and 401 signed out', async () => {
    const { data } = await get('/api/vs');
    expect(data).toEqual({
      groups: [{ id: SEEDED, title: 'Who has travelled most?', memberCount: 3, youStartedIt: true, hasMap: true }],
      perUserLimit: 30,
      memberLimit: 8,
    });
    signOut();
    expect((await get('/api/vs')).status).toBe(401);
  });

  it('compares everyone with medals: names and numbers only', async () => {
    const { group } = (await get(`/api/vs/${SEEDED}`)).data;
    expect(group).toMatchObject({ title: 'Who has travelled most?', joinCode: 'VS22-FRND-8MAX', youStartedIt: true, memberLimit: 8 });
    expect(group.myMap).toEqual({ id: HOME_MAP, name: "Charlie & Alex's travels" });
    expect(group.members.map((m) => m.name)).toEqual(['Charlie Reid', 'Sam Rivers', 'Jo Patel']);
    expect(row(group, 'Charlie Reid')).toMatchObject({ isYou: true, startedIt: true, counting: true, gold: 10, place: 1 });
    expect(row(group, 'Charlie Reid').values).toMatchObject({ countries: 20, flights: 26, oneShots: 5 });
    expect(row(group, 'Sam Rivers')).toMatchObject({ silver: 8, place: 2 });
    // A tie shares the medal: Sam and Jo have one landmark each
    expect(row(group, 'Sam Rivers').medals.landmarks).toBe('silver');
    expect(row(group, 'Jo Patel').medals.landmarks).toBe('silver');
    expect(row(group, 'Jo Patel').medals.flights).toBeNull();
    expect(JSON.stringify(group.members)).not.toMatch(/map-sam|map-jo|mock-sam|mock-jo/);
  });

  it('answers 404 to anyone not in it', async () => {
    expect((await get('/api/vs/vs-sams-crew')).status).toBe(404);
    expect((await get('/api/vs/nope')).status).toBe(404);
  });
});

describe('starting and joining', () => {
  it('starts one counting a map of yours, with the usual title when none is given', async () => {
    expect((await post('/api/vs', { mapId: SAM_MAP })).status).toBe(400);
    const { status, data } = await post('/api/vs', { title: '  The Gang <b>', mapId: HOME_MAP });
    expect(status).toBe(201);
    expect(data.group).toMatchObject({ title: 'The Gang', youStartedIt: true });
    expect(data.group.joinCode).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    expect(data.group.members).toEqual([expect.objectContaining({ name: 'Charlie Reid', place: 1, gold: 0 })]);
    expect((await post('/api/vs', { mapId: HOME_MAP })).data.group.title).toBe('Who has travelled most?');
  });

  it('shows a link to anyone, and joins with a map you own or edit', async () => {
    signOut();
    expect((await get('/api/vs/join/samcrw22vs88')).data.group).toEqual({
      id: 'vs-sams-crew',
      title: 'Sam’s crew',
      startedBy: 'Sam Rivers',
      memberCount: 2,
      memberLimit: 8,
      full: false,
      youAreIn: false,
    });
    expect((await post('/api/vs/join/SAMCRW22VS88', { mapId: HOME_MAP })).status).toBe(401);
  });

  it('joins once, refuses a map you only view, a full one and unverified', async () => {
    expect((await post('/api/vs/join/SAMCRW22VS88', { mapId: SAM_MAP })).status).toBe(400);
    expect((await post('/api/vs/join/SAMCRW22VS88', { mapId: HOME_MAP })).status).toBe(201);
    expect((await post('/api/vs/join/SAMCRW22VS88', { mapId: HOME_MAP })).status).toBe(200);
    expect(db().vsMembers.filter((m) => m.groupId === 'vs-sams-crew' && m.userId === USER)).toHaveLength(1);
    expect((await get('/api/vs/join/SAMCRW22VS88')).data.group.youAreIn).toBe(true);

    db().vsMembers = db().vsMembers.filter((m) => !(m.groupId === 'vs-sams-crew' && m.userId === USER));
    db().vsMembers.push(...Array.from({ length: 6 }, (_, i) => ({ groupId: 'vs-sams-crew', userId: `friend-${i}`, mapId: null, joinedAt: 'x' })));
    expect((await get('/api/vs/join/SAMCRW22VS88')).data.group.full).toBe(true);
    expect((await post('/api/vs/join/SAMCRW22VS88', { mapId: HOME_MAP })).status).toBe(409);

    setVerified(false);
    expect((await post('/api/vs', { mapId: HOME_MAP })).status).toBe(403);
  });
});

describe('your map, leaving and the starter’s changes', () => {
  it('counts nothing for a map you no longer have, until you pick another', async () => {
    db().vsMembers.find((m) => m.groupId === SEEDED && m.userId === SAM).mapId = 'map-gone';
    const { group } = (await get(`/api/vs/${SEEDED}`)).data;
    expect(row(group, 'Sam Rivers')).toMatchObject({ counting: false, values: null, place: null });
    expect((await patch(`/api/vs/${SEEDED}/me`, { mapId: SAM_MAP })).status).toBe(400);
    expect((await patch(`/api/vs/${SEEDED}/me`, { mapId: HOME_MAP })).status).toBe(200);
  });

  it('is the starter’s to rename, re-link and delete; anyone else leaves', async () => {
    expect((await patch(`/api/vs/${SEEDED}`, {})).status).toBe(400);
    expect((await patch(`/api/vs/${SEEDED}`, { title: 'Gang of three' })).data.group.title).toBe('Gang of three');
    const relinked = (await post(`/api/vs/${SEEDED}/reset-link`)).data.group;
    expect(relinked.joinCode).not.toBe('VS22-FRND-8MAX');
    expect((await get('/api/vs/join/VS22FRND8MAX')).status).toBe(404);
    expect((await del(`/api/vs/${SEEDED}/me`)).status).toBe(409);

    // In Sam's, the test user isn't the starter
    await post('/api/vs/join/SAMCRW22VS88', { mapId: HOME_MAP });
    expect((await patch('/api/vs/vs-sams-crew', { title: 'Mine' })).status).toBe(403);
    expect((await del('/api/vs/vs-sams-crew')).status).toBe(403);
    expect((await del('/api/vs/vs-sams-crew/me')).status).toBe(200);
    expect((await get('/api/vs/vs-sams-crew')).status).toBe(404);

    expect((await del(`/api/vs/${SEEDED}`)).status).toBe(200);
    expect(db().vsMembers.some((m) => m.groupId === SEEDED)).toBe(false);
    expect((await get('/api/vs')).data.groups).toEqual([]);
  });
});
