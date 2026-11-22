import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GOAL_MESSAGES } from '@/dev/mock/achievements';
import { HOME_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, patch, post, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const saved = () => JSON.parse(localStorage.getItem('mpvMockStore.v6'));

describe('badges', () => {
  it('lists a map’s badges for anyone on it, 404 for no role', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/badges`);
    expect(data.badges.find((b) => b.key === 'countries-5').earnedAt).not.toBeNull();
    expect(data.newlyEarned).toEqual([]);
    expect(data.travellers.map((t) => t.name)).toEqual(['Charlie', 'Alex']);
    expect((await get(`/api/maps/${TOM_MAP}/badges`)).status).toBe(404);
  });

  it('awards when the owner looks, saving the store on a GET; a viewer’s look awards nothing', async () => {
    db().badgeAwards = db().badgeAwards.filter((a) => a.badgeKey !== 'countries-1');
    expect((await get(`/api/maps/${SAM_MAP}/badges`)).data.newlyEarned).toEqual([]);
    localStorage.clear();
    const { data } = await get(`/api/maps/${HOME_MAP}/badges`);
    expect(data.newlyEarned).toEqual(['countries-1']);
    expect(saved().badgeAwards.some((a) => a.mapId === HOME_MAP && a.badgeKey === 'countries-1')).toBe(true);
  });

  it('shows a map’s badges through its share link, never a restricted one', async () => {
    expect((await get('/api/shared/samg-4pye-ar22/badges')).status).toBe(200);
    signOut();
    expect((await get('/api/shared/SAMG4PYEAR22/goals')).data.goals.map((g) => g.id)).toEqual(['goal-sam-asia']);
    expect((await get('/api/shared/K7QXM2PA9RTW/badges')).status).toBe(404);
    expect((await get('/api/shared/not-a-code/badges')).status).toBe(404);
    expect((await get('/api/shared/TRPTAK7SMR42/badges')).status).toBe(404);
  });
});

describe('goals', () => {
  it('lists the goals with their progress', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/goals`);
    expect(data.goals.map((g) => g.id)).toEqual(['goal-isles', 'goal-ten', 'goal-bucket']);
    expect((await get(`/api/maps/${TOM_MAP}/goals`)).status).toBe(404);
  });

  it('adds a goal for an editor, met at once if the map has it already', async () => {
    const { status, data } = await post(`/api/maps/${HOME_MAP}/goals`, { kind: 'COUNTRY_LIST', countryCodes: ['FR', 'IT'], title: 'Two' });
    expect(status).toBe(201);
    expect(data.goal).toMatchObject({ kind: 'COUNTRY_LIST', title: 'Two', progress: { have: 2, need: 2, met: true } });
    expect(data.goal.achievedAt).not.toBeNull();
  });

  it('refuses an incomplete goal, a viewer, and a 51st goal', async () => {
    expect((await post(`/api/maps/${HOME_MAP}/goals`, { kind: 'COUNTRY_COUNT' })).message).toBe(GOAL_MESSAGES.invalid);
    expect((await post(`/api/maps/${SAM_MAP}/goals`, { kind: 'COUNTRY_COUNT', target: 3 })).status).toBe(403);
    expect((await post(`/api/maps/${TOM_MAP}/goals`, { kind: 'COUNTRY_COUNT', target: 3 })).status).toBe(404);
    db().goals.push(...Array.from({ length: 47 }, (_, i) => ({ ...db().goals[0], id: `g${i}` })));
    expect((await post(`/api/maps/${HOME_MAP}/goals`, { kind: 'COUNTRY_COUNT', target: 3 })).message).toBe(GOAL_MESSAGES.full);
  });

  it('changes a goal, asking it to be met again when what it asks changes', async () => {
    const isles = db().goals.find((g) => g.id === 'goal-isles');
    expect((await patch('/api/goals/goal-isles', { title: 'The isles' })).data.goal.achievedAt).toBe(isles.achievedAt);
    const changed = await patch('/api/goals/goal-ten', { target: 50 });
    expect(changed.data.goal).toMatchObject({ target: 50, achievedAt: null, progress: { met: false } });
    expect((await patch('/api/goals/goal-ten', { kind: 'REGION' })).status).toBe(400);
    expect((await patch('/api/goals/goal-sam-asia', { title: 'x' })).status).toBe(403);
    expect((await patch('/api/goals/nope', { title: 'x' })).status).toBe(404);
  });

  it('deletes a goal for an editor only', async () => {
    expect((await del('/api/goals/goal-sam-asia')).status).toBe(403);
    expect((await del('/api/goals/goal-ten')).status).toBe(200);
    expect(db().goals.some((g) => g.id === 'goal-ten')).toBe(false);
  });
});
