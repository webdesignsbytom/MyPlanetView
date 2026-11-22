import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useMomentPage, { momentPageCacheEntry, preloadMomentPage, rememberEmptyMomentPage } from '@/hooks/useMomentPage';
import { getMomentPage } from '@/api/travelApi';
import { clearPanelCache, recall } from '@/utils/data/panelCache';

vi.mock('@/api/travelApi', () => ({ getMomentPage: vi.fn() }));

const moment = (id, happenedOn = null) => ({ id, happenedOn });
const ids = (result) => result.current.moments.map((m) => m.id);
const FILTERS = { mapId: 'm1', country: 'FR' };

beforeEach(() => {
  vi.resetAllMocks();
  clearPanelCache();
  getMomentPage.mockResolvedValue({ moments: [moment('a', '2019-05-01'), moment('c', '2021-01-01')], nextCursor: null });
});

describe('useMomentPage', () => {
  it('loads the first page with its filters', async () => {
    const { result } = renderHook(() => useMomentPage({ ...FILTERS, tripId: 't1' }));
    await waitFor(() => expect(ids(result)).toEqual(['a', 'c']));
    expect(getMomentPage).toHaveBeenCalledWith({ mapId: 'm1', tripId: 't1', shareCode: undefined, country: 'FR', limit: 30, cursor: null });
    expect(result.current.loading).toBe(false);
  });

  it('adds the next page, one at a time', async () => {
    getMomentPage.mockResolvedValueOnce({ moments: [moment('a', '2019-05-01')], nextCursor: '2019-05-01_a' });
    const { result } = renderHook(() => useMomentPage(FILTERS));
    await waitFor(() => expect(result.current.nextCursor).toBe('2019-05-01_a'));
    getMomentPage.mockResolvedValueOnce({ moments: [moment('b', '2020-01-01')], nextCursor: null });
    act(() => result.current.loadMore());
    await waitFor(() => expect(ids(result)).toEqual(['a', 'b']));
    expect(getMomentPage.mock.calls.at(-1)[0].cursor).toBe('2019-05-01_a');
  });

  it('asks nothing while disabled', () => {
    renderHook(() => useMomentPage({ ...FILTERS, enabled: false }));
    expect(getMomentPage).not.toHaveBeenCalled();
  });

  it('says why the moments couldn’t be loaded', async () => {
    getMomentPage.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMomentPage(FILTERS));
    await waitFor(() => expect(result.current.error).toBe('Moments could not be loaded.'));
  });

  it('puts a saved moment in its date order, undated last', async () => {
    const { result } = renderHook(() => useMomentPage(FILTERS));
    await waitFor(() => expect(result.current.moments).toHaveLength(2));
    act(() => result.current.saved(moment('b', '2020-06-01')));
    expect(ids(result)).toEqual(['a', 'b', 'c']);
    act(() => result.current.saved(moment('z')));
    // An edited moment moves to its new date
    act(() => result.current.saved(moment('a', '2022-01-01')));
    expect(ids(result)).toEqual(['b', 'c', 'a', 'z']);
  });

  it('loads the list again after a save when more pages are to come', async () => {
    getMomentPage.mockResolvedValue({ moments: [moment('a', '2019-05-01')], nextCursor: 'next' });
    const { result } = renderHook(() => useMomentPage(FILTERS));
    await waitFor(() => expect(result.current.nextCursor).toBe('next'));
    act(() => result.current.saved(moment('b', '2030-01-01')));
    await waitFor(() => expect(getMomentPage).toHaveBeenCalledTimes(2));
    expect(ids(result)).not.toContain('b');
  });

  it('takes a deleted moment out', async () => {
    const { result } = renderHook(() => useMomentPage(FILTERS));
    await waitFor(() => expect(result.current.moments).toHaveLength(2));
    act(() => result.current.removed('a'));
    expect(ids(result)).toEqual(['c']);
  });

  it('keeps the list in the panel cache, so it opens again at once', async () => {
    const first = renderHook(() => useMomentPage(FILTERS));
    await waitFor(() => expect(first.result.current.moments).toHaveLength(2));
    first.unmount();
    expect(recall(momentPageCacheEntry(FILTERS).key).moments).toHaveLength(2);
    getMomentPage.mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useMomentPage(FILTERS));
    expect(ids(result)).toEqual(['a', 'c']);
    expect(result.current.loading).toBe(false);
  });

  it('takes a preloaded first page instead of asking again', async () => {
    await preloadMomentPage(FILTERS);
    expect(getMomentPage).toHaveBeenCalledWith({ ...FILTERS, cursor: undefined, limit: 30 });
    const { result } = renderHook(() => useMomentPage(FILTERS));
    expect(ids(result)).toEqual(['a', 'c']);
  });

  it('opens a list the map says is empty without a spinner', () => {
    rememberEmptyMomentPage(FILTERS);
    getMomentPage.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMomentPage(FILTERS));
    expect(result.current.loading).toBe(false);
    expect(result.current.moments).toEqual([]);
  });
});
