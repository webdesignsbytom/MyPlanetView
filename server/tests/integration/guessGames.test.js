// "Guess where I was" (docs/API.md "Guess where I was"; 23 Nov 2026): a map's editors make a game
// from its photos; anyone with its link plays, the server scores each guess (the answers never
// leave it first), and a finished play goes on the leaderboard under a name.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, signUp, uploadPhoto } from './helpers.js';

const { deleteUnnamedGuessPlays } = await import('../../src/domain/guessGames.js');

afterAll(cleanUp);

const COLOSSEUM = { latitude: 41.8902, longitude: 12.4922 };

describe('"Guess where I was"', () => {
  let owner;
  let stranger;
  let map;
  let rome;
  let paris;
  let tokyo;
  let hidden;
  let unplaced;
  let game;

  const upload = async (agent, mapId, body) => data(await uploadPhoto(agent, mapId, body)).photo;

  beforeAll(async () => {
    [owner, stranger] = await Promise.all([signUp('GuessOwner'), signUp('GuessStranger')]);
    map = await defaultMapOf(owner.agent);
    rome = await upload(owner.agent, map.id, { ...COLOSSEUM, caption: 'The Colosseum' });
    const colosseum = rome.landmarks.find((l) => l.name === 'Colosseum');
    expect((await owner.agent.patch(`/api/photos/${rome.id}/landmarks/${colosseum.id}`).send({ confirmed: true })).status).toBe(200);
    paris = await upload(owner.agent, map.id, { countryCode: 'FR', caption: 'Paris' });
    tokyo = await upload(owner.agent, map.id, { countryCode: 'JP' });
    hidden = await upload(owner.agent, map.id, { countryCode: 'ES' });
    expect((await owner.agent.patch(`/api/photos/${hidden.id}`).send({ hidden: true })).status).toBe(200);
    unplaced = await upload(owner.agent, map.id, {});
    expect(unplaced.countryCode).toBeNull();
  });

  it('an editor makes a game of 3 to 10 placed, visible photos of the map', async () => {
    const make = (body, agent = owner.agent) => agent.post(`/api/maps/${map.id}/guess-games`).send(body);
    expect((await make({ photoIds: [rome.id, paris.id] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id, paris.id, hidden.id] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id, paris.id, unplaced.id] })).status).toBe(400);
    expect((await make({ photoIds: [rome.id, paris.id, paris.id] })).status).toBe(400);
    // Someone not on the map can't see it
    expect((await make({ photoIds: [rome.id, paris.id, tokyo.id] }, stranger.agent)).status).toBe(404);

    const made = await make({ title: '  Where was I?  ', photoIds: [rome.id, paris.id, tokyo.id] });
    expect(made.status).toBe(201);
    game = data(made).game;
    expect(game).toMatchObject({ title: 'Where was I?', rounds: 3, plays: 0, best: null });
    expect(game.code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    // A title left out is the usual one
    const plain = data(await make({ photoIds: [tokyo.id, paris.id, rome.id] })).game;
    expect(plain.title).toBe('Guess where I was');

    const listed = data(await owner.agent.get(`/api/maps/${map.id}/guess-games`)).games;
    expect(listed.map((g) => g.id)).toEqual([plain.id, game.id]);
    expect((await stranger.agent.get(`/api/maps/${map.id}/guess-games`)).status).toBe(404);
  });

  it('an unverified editor can’t make one', async () => {
    const unverified = await signUp('GuessUnverified', { verified: false });
    const ownMap = await defaultMapOf(unverified.agent);
    expect((await unverified.agent.post(`/api/maps/${ownMap.id}/guess-games`).send({ photoIds: [] })).status).toBe(403);
  });

  it('anyone with the link opens it: the pictures and the board, never the answers', async () => {
    const res = await anon().get(`/api/guess/${game.code}`);
    expect(res.status).toBe(200);
    const { game: opened, leaderboard } = data(res);
    expect(opened).toMatchObject({ code: game.code, title: 'Where was I?', mapName: map.name, splitUk: true });
    expect(opened.rounds).toHaveLength(3);
    expect(opened.rounds.every((round) => Object.keys(round).join() === 'url' && round.url.includes('display-'))).toBe(true);
    const text = JSON.stringify(res.body);
    for (const secret of ['IT', 'FR', 'JP', 'Colosseum', 'Paris', rome.id]) expect(text.includes(`"${secret}"`)).toBe(false);
    expect(leaderboard).toEqual([]);
    // The code works however it's written; anything else finds nothing
    expect((await anon().get(`/api/guess/${game.code.replace(/-/g, '').toLowerCase()}`)).status).toBe(200);
    expect((await anon().get('/api/guess/ZZZZ-ZZZZ-ZZZZ')).status).toBe(404);
    expect((await anon().get('/api/guess/not-a-code')).status).toBe(404);
  });

  it('a play answers each photo once, in order, scored by the server', async () => {
    const started = await anon().post(`/api/guess/${game.code}/plays`);
    expect(started.status).toBe(201);
    const { playId } = data(started);
    const guess = (round, countryCode) => anon().post(`/api/guess/${game.code}/plays/${playId}/guesses`).send({ round, countryCode });

    // The Colosseum: right, with its landmark named
    const first = await guess(0, 'IT');
    expect(first.status).toBe(200);
    expect(data(first)).toEqual({
      correct: true,
      distanceKm: 0,
      points: 1000,
      answer: { countryCode: 'IT', countryName: 'Italy', landmarkName: 'Colosseum' },
      score: 1000,
      done: false,
    });
    // The same round again, a round ahead, or a place that isn't one: refused
    expect((await guess(0, 'IT')).status).toBe(409);
    expect((await guess(2, 'JP')).status).toBe(409);
    expect((await guess(1, 'ZZ')).status).toBe(400);
    expect((await guess(1, 'France')).status).toBe(400);

    // Paris, guessed as Italy: some points, by the distance between them
    const second = data(await guess(1, 'IT'));
    expect(second).toMatchObject({ correct: false, answer: { countryCode: 'FR', countryName: 'France', landmarkName: null }, done: false });
    expect(second.distanceKm).toBeGreaterThan(500);
    expect(second.points).toBeGreaterThan(0);
    expect(second.points).toBeLessThan(800);
    expect(second.score).toBe(1000 + second.points);

    const last = data(await guess(2, 'JP'));
    expect(last).toMatchObject({ correct: true, points: 1000, done: true, score: 2000 + second.points });
    expect((await guess(3, 'JP')).status).toBe(409);

    // On the board under a name, once
    const name = (body) => anon().patch(`/api/guess/${game.code}/plays/${playId}`).send(body);
    expect((await name({ name: '   ' })).status).toBe(400);
    const named = await name({ name: ' Jo ' });
    expect(named.status).toBe(200);
    expect(data(named)).toMatchObject({ rank: 1, leaderboard: [{ name: 'Jo', score: 2000 + second.points }] });
    expect((await name({ name: 'Jo again' })).status).toBe(409);

    // The editors see it counted
    const listed = data(await owner.agent.get(`/api/maps/${map.id}/guess-games`)).games.find((g) => g.id === game.id);
    expect(listed).toMatchObject({ plays: 1, best: { name: 'Jo', score: 2000 + second.points } });
  });

  it('only a finished play goes on the board, and another game’s play isn’t this one’s', async () => {
    const { playId } = data(await anon().post(`/api/guess/${game.code}/plays`));
    expect((await anon().patch(`/api/guess/${game.code}/plays/${playId}`).send({ name: 'Early' })).status).toBe(409);
    const other = data(await owner.agent.get(`/api/maps/${map.id}/guess-games`)).games.find((g) => g.id !== game.id);
    expect((await anon().post(`/api/guess/${other.code}/plays/${playId}/guesses`).send({ round: 0, countryCode: 'IT' })).status).toBe(404);
  });

  it('a photo hidden since drops out of the game', async () => {
    expect((await owner.agent.patch(`/api/photos/${tokyo.id}`).send({ hidden: true })).status).toBe(200);
    expect(data(await anon().get(`/api/guess/${game.code}`)).game.rounds).toHaveLength(2);
    expect((await owner.agent.patch(`/api/photos/${tokyo.id}`).send({ hidden: false })).status).toBe(200);
  });

  it('a map has 50 games at most', async () => {
    const existing = await prisma.guessGame.count({ where: { mapId: map.id } });
    await prisma.guessGame.createMany({
      data: Array.from({ length: 50 - existing }, (_, i) => ({ mapId: map.id, code: `CAP-${map.id.slice(0, 8)}-${i}`, title: 'Filler', photoIds: [rome.id] })),
    });
    const res = await owner.agent.post(`/api/maps/${map.id}/guess-games`).send({ photoIds: [rome.id, paris.id, tokyo.id] });
    expect(res.status).toBe(409);
    await prisma.guessGame.deleteMany({ where: { mapId: map.id, title: 'Filler' } });
  });

  it('plays never put on a board go after a week; named ones stay', async () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const gameRow = await prisma.guessGame.findFirst({ where: { mapId: map.id, title: 'Where was I?' } });
    const stale = await prisma.guessPlay.create({ data: { gameId: gameRow.id, points: [], createdAt: old } });
    const keptName = await prisma.guessPlay.create({ data: { gameId: gameRow.id, points: [5], score: 5, name: 'Kept', finishedAt: old, createdAt: old } });
    expect(await deleteUnnamedGuessPlays(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))).toBeGreaterThanOrEqual(1);
    expect(await prisma.guessPlay.findUnique({ where: { id: stale.id } })).toBeNull();
    expect(await prisma.guessPlay.findUnique({ where: { id: keptName.id } })).not.toBeNull();
  });

  it('only the map’s editors delete a game; then its link finds nothing', async () => {
    expect((await stranger.agent.delete(`/api/guess-games/${game.id}`)).status).toBe(404);
    expect((await anon().delete(`/api/guess-games/${game.id}`)).status).toBe(401);
    expect((await owner.agent.delete(`/api/guess-games/${game.id}`)).status).toBe(200);
    expect((await anon().get(`/api/guess/${game.code}`)).status).toBe(404);
    expect((await owner.agent.delete(`/api/guess-games/${game.id}`)).status).toBe(404);
  });
});
