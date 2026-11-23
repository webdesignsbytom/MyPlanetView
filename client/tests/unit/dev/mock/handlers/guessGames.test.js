// Mock mode's "Guess where I was" (dev/mock/handlers/guessGames.js): the server's rules over the store.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, db, del, freshStore, get, patch, post, registerAllRoutes, setVerified, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const CODE = 'GWHR-2WAS-7MAP';

describe('a map’s games', () => {
  it('lists the seeded game for its editors, with its best play', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/guess-games`);
    expect(data.games).toEqual([
      expect.objectContaining({ code: CODE, title: 'Guess where we were', rounds: 4, plays: 1, best: { name: 'Sam', score: 2980 } }),
    ]);
  });

  it('makes one of 3 to 10 placed, visible photos, for a verified editor', async () => {
    expect((await post(`/api/maps/${HOME_MAP}/guess-games`, { photoIds: ['photo-eiffel', 'photo-dam'] })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/guess-games`, { photoIds: ['photo-eiffel', 'photo-dam', 'photo-hidden'] })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/guess-games`, { photoIds: ['photo-eiffel', 'photo-dam', 'photo-bangkok'] })).status).toBe(400);
    const made = await post(`/api/maps/${HOME_MAP}/guess-games`, { title: '  ', photoIds: ['photo-dam', 'photo-eiffel', 'photo-colosseum'] });
    expect(made.status).toBe(201);
    expect(made.data.game).toMatchObject({ title: 'Guess where I was', rounds: 3, plays: 0, best: null });
    expect(made.data.game.code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    setVerified(false);
    expect((await post(`/api/maps/${HOME_MAP}/guess-games`, { photoIds: ['photo-dam', 'photo-eiffel', 'photo-colosseum'] })).status).toBe(403);
  });

  it('only the map’s editors see or delete them', async () => {
    // A map the test user only views (or isn't on)
    expect([403, 404]).toContain((await get(`/api/maps/${SAM_MAP}/guess-games`)).status);
    expect((await del('/api/guess-games/guess-home')).status).toBe(200);
    expect(db().guessGames).toHaveLength(0);
    expect(db().guessPlays).toHaveLength(0);
  });
});

describe('playing one by its link', () => {
  it('opens it for anyone, without the answers', async () => {
    signOut();
    const { data } = await get(`/api/guess/${CODE.replace(/-/g, '').toLowerCase()}`);
    expect(data.game).toMatchObject({ code: CODE, title: 'Guess where we were', mapName: "Charlie & Alex's travels" });
    expect(data.game.rounds).toHaveLength(4);
    expect(Object.keys(data.game.rounds[0])).toEqual(['url']);
    expect(data.leaderboard).toEqual([expect.objectContaining({ name: 'Sam', score: 2980 })]);
    expect((await get('/api/guess/ZZZZ-ZZZZ-ZZZZ')).status).toBe(404);
  });

  it('scores each round once, in order, and puts a finished play on the board', async () => {
    signOut();
    const { data: started } = await post(`/api/guess/${CODE}/plays`);
    const guess = (round, countryCode) => post(`/api/guess/${CODE}/plays/${started.playId}/guesses`, { round, countryCode });
    const first = await guess(0, 'FR');
    expect(first.data).toMatchObject({ correct: true, points: 1000, answer: { countryCode: 'FR', countryName: 'France', landmarkName: 'Eiffel Tower' }, done: false });
    expect((await guess(0, 'FR')).status).toBe(409);
    expect((await guess(1, 'NOPE')).status).toBe(400);
    const second = await guess(1, 'FR');
    expect(second.data).toMatchObject({ correct: false, answer: { countryCode: 'IT' } });
    expect(second.data.points).toBeGreaterThan(0);
    expect((await patch(`/api/guess/${CODE}/plays/${started.playId}`, { name: 'Early' })).status).toBe(409);
    await guess(2, 'NL');
    const last = await guess(3, 'ES');
    expect(last.data).toMatchObject({ correct: true, done: true, score: 3000 + second.data.points });
    expect((await patch(`/api/guess/${CODE}/plays/${started.playId}`, { name: '  ' })).status).toBe(400);
    const named = await patch(`/api/guess/${CODE}/plays/${started.playId}`, { name: 'Jo' });
    expect(named.data.rank).toBe(1);
    expect(named.data.leaderboard.map((row) => row.name)).toEqual(['Jo', 'Sam']);
  });
});
