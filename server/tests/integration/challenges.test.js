// Friends challenges (docs/API.md, "Friends challenges"): a measure counted between two
// dates among friends who join by a link, each counting a map they own or edit. The
// leaderboard shows names and counts only; anyone not in a challenge gets a 404.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';
import { CHALLENGE_LIMITS } from '../../src/utils/challenges.js';
import { monthStart } from '../../src/utils/themes.js';
import { generateShareCode } from '../../src/utils/shareCodes.js';

// Every date is relative to today, so the tests don't age: `day(-200)` is 200 days ago
const DAY_MS = 24 * 60 * 60 * 1000;
const day = (offset) => new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10);
const at = (offset) => `${day(offset)}T12:00:00.000Z`;
// Ended yesterday, after a little over a year
const PAST = { startsOn: day(-400), endsOn: day(-1) };
// A year back to a year on: running now (730 days, the longest a challenge may be)
const SPAN = { startsOn: day(-365), endsOn: day(364) };

afterAll(async () => {
  await prisma.photoTheme.deleteMany({ where: { month: monthStart(), title: 'Challenge test theme' } });
  await cleanUp();
});

describe('friends challenges', () => {
  let ann;
  let bo;
  let cy;
  let di;
  let annMap;
  let boMap;
  let challenge;
  let code;

  beforeAll(async () => {
    ann = await signUp('ChAnn');
    bo = await signUp('ChBo');
    cy = await signUp('ChCy');
    di = await signUp('ChDi');
    annMap = await defaultMapOf(ann.agent);
    boMap = await defaultMapOf(bo.agent);
    // Cy edits Ann's map
    await ann.agent.post(`/api/maps/${annMap.id}/members`).send({ email: cy.email, role: 'EDITOR' });
    // Ann: France first 700 days ago, then Portugal, Spain and France again within the year
    await uploadPhoto(ann.agent, annMap.id, { countryCode: 'FR', takenAt: at(-700) });
    await uploadPhoto(ann.agent, annMap.id, { countryCode: 'PT', takenAt: at(-200) });
    await uploadPhoto(ann.agent, annMap.id, { countryCode: 'ES', takenAt: at(-150) });
    await uploadPhoto(ann.agent, annMap.id, { countryCode: 'FR', takenAt: at(-100) });
    // Bo: Italy within the year, Greece today (after the ended challenge's last day)
    await uploadPhoto(bo.agent, boMap.id, { countryCode: 'IT', takenAt: at(-180) });
    await uploadPhoto(bo.agent, boMap.id, { countryCode: 'GR', takenAt: at(0) });
  });

  it('lets someone start one, counting a map of theirs', async () => {
    const body = { title: 'Most countries this year', measure: 'COUNTRIES', ...PAST, target: 3, mapId: annMap.id };
    expect((await ann.agent.post('/api/challenges').send({ ...body, mapId: boMap.id })).status).toBe(400);
    expect((await ann.agent.post('/api/challenges').send({ ...body, endsOn: day(-401) })).status).toBe(400);
    expect((await ann.agent.post('/api/challenges').send({ ...body, endsOn: day(400) })).status).toBe(400);
    expect((await anon().post('/api/challenges').send(body)).status).toBe(401);
    const unverified = await signUp('ChUnverified', { verified: false });
    expect((await unverified.agent.post('/api/challenges').send(body)).status).toBe(403);

    const res = await ann.agent.post('/api/challenges').send(body);
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    challenge = data(res).challenge;
    code = challenge.joinCode;
    expect(challenge).toMatchObject({ title: 'Most countries this year', measure: 'COUNTRIES', ...PAST, target: 3, status: 'ENDED', youStartedIt: true });
    expect(code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    expect(challenge.myMap).toMatchObject({ id: annMap.id });
    // Portugal, Spain and France (its second photo): three countries with a photo in the dates
    expect(challenge.members).toEqual([{ name: 'ChAnn', count: 3, rank: 1, reachedTarget: true, counting: true, isYou: true, startedIt: true }]);
  });

  it('shows anyone with the link enough to decide, and nobody else’s name', async () => {
    const res = await anon().get(`/api/challenges/join/${code}`);
    expect(res.status).toBe(200);
    expect(data(res).challenge).toEqual(
      expect.objectContaining({ title: 'Most countries this year', startedBy: 'ChAnn', memberCount: 1, youAreIn: false, full: false }),
    );
    expect(data(res).challenge).not.toHaveProperty('members');
    expect(data(res).challenge).not.toHaveProperty('joinCode');
    expect((await anon().get('/api/challenges/join/AAAA-AAAA-AAAA')).status).toBe(404);
    expect((await anon().get('/api/challenges/join/nonsense')).status).toBe(404);
  });

  it('can’t be joined once it has ended', async () => {
    expect((await bo.agent.post(`/api/challenges/join/${code}`).send({ mapId: boMap.id })).status).toBe(409);
  });

  describe('a running challenge', () => {
    let running;

    beforeAll(async () => {
      // From a year ago to a year on: today is inside it
      const res = await ann.agent.post('/api/challenges').send({ title: 'New countries', measure: 'NEW_COUNTRIES', ...SPAN, mapId: annMap.id });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      running = data(res).challenge;
    });

    it('takes people who join with a map of theirs; never someone else’s map', async () => {
      const join = (agent, mapId) => agent.post(`/api/challenges/join/${running.joinCode}`).send({ mapId });
      expect((await join(di.agent, annMap.id)).status).toBe(400);
      expect((await join(anon(), boMap.id)).status).toBe(401);
      const joined = await join(bo.agent, boMap.id);
      expect(joined.status, JSON.stringify(joined.body)).toBe(201);
      expect((await join(bo.agent, boMap.id)).status).toBe(200);
      // An editor can count the map they edit
      expect((await join(cy.agent, annMap.id)).status).toBe(201);
    });

    it('counts new countries: a first photo there in the dates', async () => {
      const board = data(await bo.agent.get(`/api/challenges/${running.id}`)).challenge.members;
      // Ann: Portugal, Spain (France's first photo was 700 days ago); Bo: Italy and Greece
      expect(board.map((m) => [m.name, m.count, m.rank])).toEqual([
        ['ChAnn', 2, 1],
        ['ChBo', 2, 1],
        ['ChCy', 2, 1],
      ]);
      // Names and counts only: no map, id or place of anyone
      for (const row of board) expect(Object.keys(row).sort()).toEqual(['count', 'counting', 'isYou', 'name', 'rank', 'reachedTarget', 'startedIt']);
      expect(board.find((m) => m.isYou).name).toBe('ChBo');
    });

    it('stops counting a map once it isn’t theirs', async () => {
      await ann.agent.delete(`/api/maps/${annMap.id}/members/${cy.user.id}`);
      const board = data(await cy.agent.get(`/api/challenges/${running.id}`)).challenge.members;
      expect(board.find((m) => m.isYou)).toMatchObject({ count: 0, counting: false });
      // Picking one of their own maps counts again
      const cyMap = await defaultMapOf(cy.agent);
      const picked = data(await cy.agent.patch(`/api/challenges/${running.id}/me`).send({ mapId: cyMap.id })).challenge;
      expect(picked.myMap.id).toBe(cyMap.id);
      expect(picked.members.find((m) => m.isYou)).toMatchObject({ count: 0, counting: true });
    });

    it('is nobody else’s business: a 404 for anyone not in it', async () => {
      expect((await di.agent.get(`/api/challenges/${running.id}`)).status).toBe(404);
      expect((await di.agent.patch(`/api/challenges/${running.id}`).send({ title: 'Mine' })).status).toBe(404);
    });

    it('lists the caller’s challenges with their own count', async () => {
      const { challenges } = data(await ann.agent.get('/api/challenges'));
      expect(challenges.map((c) => c.id).sort()).toEqual([challenge.id, running.id].sort());
      expect(challenges.find((c) => c.id === running.id)).toMatchObject({ myCount: 2, memberCount: 3, counting: true, youStartedIt: true, status: 'RUNNING' });
    });

    it('lets only the starter change it; its measure never changes', async () => {
      expect((await bo.agent.patch(`/api/challenges/${running.id}`).send({ title: 'Mine' })).status).toBe(403);
      expect((await ann.agent.patch(`/api/challenges/${running.id}`).send({ measure: 'COUNTRIES' })).status).toBe(400);
      const changed = data(await ann.agent.patch(`/api/challenges/${running.id}`).send({ title: 'New countries, us three', target: 2 })).challenge;
      expect(changed).toMatchObject({ title: 'New countries, us three', target: 2 });
      expect(changed.members.filter((m) => m.reachedTarget).map((m) => m.name)).toEqual(['ChAnn', 'ChBo']);
    });

    it('gives a new link on a reset; the old one stops working', async () => {
      const old = running.joinCode;
      const fresh = data(await ann.agent.post(`/api/challenges/${running.id}/reset-link`)).challenge.joinCode;
      expect(fresh).not.toBe(old);
      expect((await anon().get(`/api/challenges/join/${old}`)).status).toBe(404);
      expect((await anon().get(`/api/challenges/join/${fresh}`)).status).toBe(200);
      running.joinCode = fresh;
    });

    it('lets people leave, but not the starter, who deletes it instead', async () => {
      expect((await bo.agent.delete(`/api/challenges/${running.id}/me`)).status).toBe(200);
      expect((await bo.agent.get(`/api/challenges/${running.id}`)).status).toBe(404);
      expect((await ann.agent.delete(`/api/challenges/${running.id}/me`)).status).toBe(409);
      expect((await cy.agent.delete(`/api/challenges/${running.id}`)).status).toBe(403);
    });
  });

  it('counts landmarks stamped and photos entered in the monthly themes', async () => {
    const photo = data(await uploadPhoto(di.agent, (await defaultMapOf(di.agent)).id, { countryCode: 'FR', takenAt: at(-10) })).photo;
    const eiffel = data(await di.agent.get('/api/landmarks?country=FR')).landmarks.find((l) => l.name === 'Eiffel Tower');
    expect((await di.agent.post(`/api/photos/${photo.id}/landmarks`).send({ landmarkId: eiffel.id })).status).toBe(201);
    const theme = await prisma.photoTheme.upsert({
      where: { month: monthStart() },
      create: { month: monthStart(), title: 'Challenge test theme' },
      update: {},
    });
    expect((await di.agent.put(`/api/photos/${photo.id}/themes/${theme.id}`)).status).toBeLessThan(300);

    const diMap = (await defaultMapOf(di.agent)).id;
    for (const [measure, count] of [
      ['LANDMARKS', 1],
      ['THEME_PHOTOS', 1],
    ]) {
      const made = data(await di.agent.post('/api/challenges').send({ title: measure, measure, ...SPAN, mapId: diMap })).challenge;
      expect(made.members[0].count, measure).toBe(count);
      await di.agent.delete(`/api/challenges/${made.id}`);
    }
  });

  it('holds 30 challenges a person at most', async () => {
    const eve = await signUp('ChEve');
    const eveMap = await defaultMapOf(eve.agent);
    for (let i = 0; i < CHALLENGE_LIMITS.perUser; i += 1) {
      await prisma.friendChallenge.create({
        data: {
          title: `Filler ${i}`,
          measure: 'COUNTRIES',
          startsOn: new Date(day(-10)),
          endsOn: new Date(day(10)),
          joinCode: generateShareCode(),
          createdById: eve.user.id,
          entries: { create: { userId: eve.user.id, mapId: eveMap.id } },
        },
      });
    }
    const open = data(await ann.agent.get('/api/challenges')).challenges.find((c) => c.status === 'RUNNING');
    const link = data(await ann.agent.get(`/api/challenges/${open.id}`)).challenge.joinCode;
    const res = await eve.agent.post(`/api/challenges/join/${link}`).send({ mapId: eveMap.id });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/30 challenges/);
    await prisma.friendChallenge.deleteMany({ where: { createdById: eve.user.id } });
  });

  it('goes for everyone when the starter deletes it', async () => {
    const open = data(await ann.agent.get('/api/challenges')).challenges.find((c) => c.status === 'RUNNING');
    expect((await ann.agent.delete(`/api/challenges/${open.id}`)).status).toBe(200);
    expect((await cy.agent.get(`/api/challenges/${open.id}`)).status).toBe(404);
    expect(await prisma.friendChallengeEntry.count({ where: { challengeId: open.id } })).toBe(0);
  });
});
