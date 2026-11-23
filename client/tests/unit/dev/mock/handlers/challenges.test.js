import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, JO, SAM, SAM_MAP, USER, db, del, freshStore, get, patch, post, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const SEEDED = 'challenge-two-years';
const day = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const good = () => ({ title: 'Most new countries', measure: 'NEW_COUNTRIES', startsOn: day(0), endsOn: day(90), target: 5, mapId: HOME_MAP });
/** The seeded challenge, but running whatever today is (its counts stay the same). */
const keepRunning = () => Object.assign(db().challenges[0], { endsOn: '2099-12-31' });
const leaveSeeded = () => {
  db().challengeEntries = db().challengeEntries.filter((e) => e.userId !== USER);
};

describe('the challenges you’re in', () => {
  it('lists them with your count, and 401 signed out', async () => {
    const { data } = await get('/api/challenges');
    expect(data.perUserLimit).toBe(30);
    expect(data.challenges).toEqual([expect.objectContaining({ id: SEEDED, memberCount: 3, myCount: 2, counting: true, youStartedIt: false })]);
    signOut();
    expect((await get('/api/challenges')).status).toBe(401);
  });

  it('shows one’s leaderboard: the test user 2, Jo 1, Sam 0, names and counts only', async () => {
    const { data } = await get(`/api/challenges/${SEEDED}`);
    expect(data.challenge.joinCode).toBe('CHA2-YR5R-DTRP');
    expect(data.challenge.members).toEqual([
      { name: 'Charlie Reid', count: 2, rank: 1, reachedTarget: false, counting: true, isYou: true, startedIt: false },
      { name: 'Jo Patel', count: 1, rank: 2, reachedTarget: false, counting: true, isYou: false, startedIt: false },
      { name: 'Sam Rivers', count: 0, rank: 3, reachedTarget: false, counting: true, isYou: false, startedIt: true },
    ]);
    expect(data.challenge.myMap).toEqual({ id: HOME_MAP, name: "Charlie & Alex's travels" });
  });

  it('answers 404 to anyone not in it', async () => {
    leaveSeeded();
    expect((await get(`/api/challenges/${SEEDED}`)).status).toBe(404);
    expect((await get('/api/challenges/nope')).status).toBe(404);
  });
});

describe('starting one', () => {
  it('starts a challenge counting one of your maps', async () => {
    const { status, data } = await post('/api/challenges', good());
    expect(status).toBe(201);
    expect(data.challenge).toMatchObject({ title: 'Most new countries', status: 'RUNNING', youStartedIt: true, memberLimit: 50 });
    expect(data.challenge.joinCode).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
  });

  it('refuses a bad challenge, a map you only view, and a 31st challenge', async () => {
    expect((await post('/api/challenges', { ...good(), title: '' })).message).toMatch(/^Check the challenge/);
    expect((await post('/api/challenges', { ...good(), endsOn: day(-1) })).message).toMatch(/^The last day must be/);
    expect((await post('/api/challenges', { ...good(), mapId: SAM_MAP })).message).toMatch(/^Choose one of your maps/);
    db().challengeEntries.push(...Array.from({ length: 29 }, (_, i) => ({ challengeId: `c${i}`, userId: USER, mapId: HOME_MAP, joinedAt: 'x' })));
    expect((await post('/api/challenges', good())).status).toBe(409);
  });
});

describe('joining by the link', () => {
  it('shows the challenge to anyone with the link', async () => {
    signOut();
    const { data } = await get('/api/challenges/join/cha2-yr5r-dtrp');
    expect(data.challenge).toMatchObject({ title: 'Two years on the road', startedBy: 'Sam Rivers', memberCount: 3, full: false, youAreIn: false });
    expect((await get('/api/challenges/join/NOPE')).status).toBe(404);
  });

  it('joins with a map you own or edit, and joining again changes nothing', async () => {
    keepRunning();
    leaveSeeded();
    expect((await post('/api/challenges/join/CHA2YR5RDTRP', { mapId: SAM_MAP })).status).toBe(400);
    const joined = await post('/api/challenges/join/CHA2YR5RDTRP', { mapId: HOME_MAP });
    expect(joined.status).toBe(201);
    expect((await post('/api/challenges/join/CHA2YR5RDTRP', { mapId: HOME_MAP })).status).toBe(200);
    expect(db().challengeEntries.filter((e) => e.userId === USER)).toHaveLength(1);
  });

  it('refuses an ended challenge, a full one, and signed out', async () => {
    leaveSeeded();
    db().challenges[0].endsOn = day(-1);
    expect((await post('/api/challenges/join/CHA2YR5RDTRP', { mapId: HOME_MAP })).message).toBe('This challenge has ended.');
    keepRunning();
    db().challengeEntries.push(...Array.from({ length: 48 }, (_, i) => ({ challengeId: SEEDED, userId: `u${i}`, mapId: null, joinedAt: 'x' })));
    expect((await post('/api/challenges/join/CHA2YR5RDTRP', { mapId: HOME_MAP })).status).toBe(409);
    signOut();
    expect((await post('/api/challenges/join/CHA2YR5RDTRP', { mapId: HOME_MAP })).status).toBe(401);
  });
});

describe('the starter’s changes, and leaving', () => {
  it('lets only the starter change, re-link or delete it', async () => {
    expect((await patch(`/api/challenges/${SEEDED}`, { title: 'Mine' })).status).toBe(403);
    expect((await post(`/api/challenges/${SEEDED}/reset-link`)).status).toBe(403);
    expect((await del(`/api/challenges/${SEEDED}`)).status).toBe(403);
    const { data } = await post('/api/challenges', good());
    const id = data.challenge.id;
    expect((await patch(`/api/challenges/${id}`, { title: 'Renamed' })).data.challenge.title).toBe('Renamed');
    expect((await patch(`/api/challenges/${id}`, { measure: 'LANDMARKS' })).message).toBe("What a challenge counts can't change once it's made.");
    const code = data.challenge.joinCode;
    expect((await post(`/api/challenges/${id}/reset-link`)).data.challenge.joinCode).not.toBe(code);
    expect((await del(`/api/challenges/${id}`)).body).toEqual({ status: 'success', message: 'Challenge deleted.' });
    expect(db().challengeEntries.some((e) => e.challengeId === id)).toBe(false);
  });

  it('changes the map that counts for you, then leaves', async () => {
    expect((await patch(`/api/challenges/${SEEDED}/me`, { mapId: SAM_MAP })).status).toBe(400);
    db().mapMembers.push({ mapId: SAM_MAP, userId: USER, role: 'EDITOR' });
    db().mapMembers = db().mapMembers.filter((m) => !(m.mapId === SAM_MAP && m.role === 'VIEWER' && m.userId === USER));
    expect((await patch(`/api/challenges/${SEEDED}/me`, { mapId: SAM_MAP })).data.challenge.myMap.id).toBe(SAM_MAP);
    expect((await del(`/api/challenges/${SEEDED}/me`)).status).toBe(200);
    expect(db().challengeEntries.some((e) => e.userId === USER)).toBe(false);
  });

  it('keeps the starter from leaving their own', async () => {
    const { data } = await post('/api/challenges', good());
    expect((await del(`/api/challenges/${data.challenge.id}/me`)).status).toBe(409);
  });

  it('counts nothing for someone whose map no longer counts', async () => {
    db().challengeEntries.find((e) => e.userId === JO).mapId = null;
    const members = (await get(`/api/challenges/${SEEDED}`)).data.challenge.members;
    expect(members.find((m) => m.name === 'Jo Patel')).toMatchObject({ count: 0, counting: false });
    expect(SAM).toBe('mock-sam');
  });
});
