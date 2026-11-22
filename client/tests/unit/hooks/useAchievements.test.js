import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useAchievements from '@/hooks/useAchievements';
import { createGoal, deleteGoal, getBadges, getGoals, updateGoal } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({
  getBadges: vi.fn(),
  getGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

const goal = (id, extra = {}) => ({ id, kind: 'COUNTRY_COUNT', target: 10, ...extra });

beforeEach(() => {
  vi.resetAllMocks();
  getBadges.mockResolvedValue({ badges: [{ key: 'first-country' }], newlyEarned: [], travellers: [{ id: 't1' }] });
  getGoals.mockResolvedValue({ goals: [goal('g1')], newlyAchieved: [] });
});

afterEach(() => vi.useRealTimers());

describe('useAchievements', () => {
  it('loads the map’s badges and goals', async () => {
    const { result } = renderHook(() => useAchievements({ mapId: 'm1' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.badges).toEqual([{ key: 'first-country' }]);
    expect(result.current.goals).toEqual([goal('g1')]);
    expect(result.current.travellers).toEqual([{ id: 't1' }]);
    expect(getBadges).toHaveBeenCalledWith({ mapId: 'm1' });
    expect(getGoals).toHaveBeenCalledWith({ mapId: 'm1' });
  });

  it('reads through a share link when given its code', async () => {
    const { result } = renderHook(() => useAchievements({ mapId: 'm1', shareCode: 'ABC' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getBadges).toHaveBeenCalledWith({ shareCode: 'ABC' });
  });

  it('asks nothing while disabled', () => {
    renderHook(() => useAchievements({ mapId: 'm1', enabled: false }));
    expect(getBadges).not.toHaveBeenCalled();
  });

  it('collects what the server says is new, once, until dismissed', async () => {
    getBadges.mockResolvedValue({ badges: [], newlyEarned: ['ten-countries'] });
    getGoals.mockResolvedValue({ goals: [goal('g1'), goal('g2')], newlyAchieved: ['g2', 'gone'] });
    const { result } = renderHook(() => useAchievements({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.news).toHaveLength(2));
    expect(result.current.news).toEqual([
      { type: 'badge', key: 'ten-countries' },
      { type: 'goal', goal: goal('g2') },
    ]);
    act(() => result.current.dismissNews());
    expect(result.current.news).toEqual([]);
  });

  it('says why the lists couldn’t be loaded', async () => {
    getBadges.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Forbidden.' }));
    const { result } = renderHook(() => useAchievements({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.error).toBe('Forbidden.'));
    expect(result.current.loading).toBe(false);
  });

  it('checks once for a burst of changes, 1.2 seconds after the last', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAchievements({ mapId: 'm1' }));
    await act(async () => {});
    expect(getBadges).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.check();
      vi.advanceTimersByTime(1000);
      result.current.check();
      vi.advanceTimersByTime(1000);
      result.current.check();
    });
    await act(async () => vi.advanceTimersByTimeAsync(1199));
    expect(getBadges).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(getBadges).toHaveBeenCalledTimes(2);
  });

  it('adds, changes and removes goals in the list', async () => {
    const { result } = renderHook(() => useAchievements({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    createGoal.mockResolvedValue({ goal: goal('g2') });
    updateGoal.mockResolvedValue({ goal: goal('g1', { target: 20 }) });
    deleteGoal.mockResolvedValue({});
    await act(async () => result.current.addGoal({ kind: 'COUNTRY_COUNT', target: 10 }));
    expect(createGoal).toHaveBeenCalledWith('m1', { kind: 'COUNTRY_COUNT', target: 10 });
    await act(async () => result.current.editGoal('g1', { target: 20 }));
    expect(result.current.goals).toEqual([goal('g1', { target: 20 }), goal('g2')]);
    await act(async () => result.current.removeGoal('g2'));
    expect(deleteGoal).toHaveBeenCalledWith('g2');
    expect(result.current.goals).toEqual([goal('g1', { target: 20 })]);
  });

  it('never lets a load that was on its way replace a goal just added, but keeps its news', async () => {
    const { result } = renderHook(() => useAchievements({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let answer;
    getGoals.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    getBadges.mockResolvedValueOnce({ badges: [], newlyEarned: ['ten-countries'] });
    let reload;
    act(() => {
      reload = result.current.reload();
    });
    createGoal.mockResolvedValue({ goal: goal('g2') });
    await act(async () => result.current.addGoal({}));
    await act(async () => {
      answer({ goals: [goal('g1')], newlyAchieved: [] });
      await reload;
    });
    expect(result.current.goals.map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(result.current.news).toEqual([{ type: 'badge', key: 'ten-countries' }]);
  });
});
