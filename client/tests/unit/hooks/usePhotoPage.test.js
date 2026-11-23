import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import usePhotoPage, { photoPageCacheEntry, preloadPhotoPage, rememberEmptyPhotoPage } from '@/hooks/usePhotoPage';
import { getPhoto, getPhotoPage, movePhoto } from '@/api/travelApi';
import { clearPanelCache, recall } from '@/utils/data/panelCache';

vi.mock('@/api/travelApi', () => ({ getPhotoPage: vi.fn(), getPhoto: vi.fn(), movePhoto: vi.fn() }));

const photo = (id, extra = {}) => ({ id, countryCode: 'FR', ...extra });
const ids = (result) => result.current.photos.map((p) => p.id);
const FILTERS = { mapId: 'm1', country: 'FR' };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  clearPanelCache();
  getPhotoPage.mockResolvedValue({ photos: [photo('p1'), photo('p2'), photo('p3')], nextCursor: 'c1' });
});

afterEach(() => vi.useRealTimers());

describe('usePhotoPage: loading', () => {
  it('loads the first page with its filters', async () => {
    const { result } = renderHook(() => usePhotoPage({ ...FILTERS, display: true }));
    await waitFor(() => expect(ids(result)).toEqual(['p1', 'p2', 'p3']));
    expect(result.current.nextCursor).toBe('c1');
    expect(result.current.loading).toBe(false);
    expect(getPhotoPage).toHaveBeenCalledWith({
      mapId: 'm1',
      tripId: undefined,
      shareCode: undefined,
      country: 'FR',
      unplaced: false,
      limit: 30,
      display: true,
      cursor: null,
    });
  });

  it('adds the next page', async () => {
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(result.current.nextCursor).toBe('c1'));
    getPhotoPage.mockResolvedValueOnce({ photos: [photo('p4')], nextCursor: null });
    act(() => result.current.loadMore());
    await waitFor(() => expect(ids(result)).toEqual(['p1', 'p2', 'p3', 'p4']));
    expect(getPhotoPage.mock.calls.at(-1)[0].cursor).toBe('c1');
    act(() => result.current.loadMore());
    expect(getPhotoPage).toHaveBeenCalledTimes(2);
  });

  it('asks nothing while disabled', () => {
    const { result } = renderHook(() => usePhotoPage({ ...FILTERS, enabled: false }));
    expect(result.current.photos).toEqual([]);
    expect(getPhotoPage).not.toHaveBeenCalled();
  });

  it('says why the photos couldn’t be loaded', async () => {
    getPhotoPage.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Forbidden.' }));
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(result.current.error).toBe('Forbidden.'));
    expect(result.current.loading).toBe(false);
  });

  it('drops a slow reply for filters it no longer has', async () => {
    const slow = deferred();
    getPhotoPage.mockReturnValueOnce(slow.promise);
    const { result, rerender } = renderHook(({ country }) => usePhotoPage({ mapId: 'm1', country }), { initialProps: { country: 'FR' } });
    getPhotoPage.mockResolvedValueOnce({ photos: [photo('jp1', { countryCode: 'JP' })], nextCursor: null });
    rerender({ country: 'JP' });
    await waitFor(() => expect(ids(result)).toEqual(['jp1']));
    await act(async () => slow.resolve({ photos: [photo('fr9')], nextCursor: null }));
    expect(ids(result)).toEqual(['jp1']);
  });
});

describe('usePhotoPage: the panel cache', () => {
  it('keeps the list, so it opens again at once while a quiet refresh loads behind it', async () => {
    const first = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(first.result.current.photos).toHaveLength(3));
    first.unmount();
    expect(recall(photoPageCacheEntry(FILTERS).key).photos).toHaveLength(3);
    const quiet = deferred();
    getPhotoPage.mockReturnValueOnce(quiet.promise);
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    expect(ids(result)).toEqual(['p1', 'p2', 'p3']);
    expect(result.current.loading).toBe(false);
    await act(async () => quiet.resolve({ photos: [photo('p0'), photo('p1')], nextCursor: null }));
    expect(ids(result)).toEqual(['p0', 'p1']);
  });

  it('keeps the kept list when the quiet refresh fails, with no error', async () => {
    const first = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(first.result.current.photos).toHaveLength(3));
    first.unmount();
    getPhotoPage.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await act(async () => {});
    expect(ids(result)).toEqual(['p1', 'p2', 'p3']);
    expect(result.current.error).toBeNull();
  });

  it('uses a kept list as it is with refresh off (the photo viewer)', async () => {
    const first = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(first.result.current.photos).toHaveLength(3));
    getPhotoPage.mockClear();
    const { result } = renderHook(() => usePhotoPage({ ...FILTERS, refresh: false }));
    expect(ids(result)).toEqual(['p1', 'p2', 'p3']);
    await act(async () => {});
    expect(getPhotoPage).not.toHaveBeenCalled();
  });

  it('takes the first page a preload started instead of asking again', async () => {
    const page = deferred();
    getPhotoPage.mockReturnValueOnce(page.promise);
    preloadPhotoPage(FILTERS);
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await act(async () => page.resolve({ photos: [photo('pre')], nextCursor: null }));
    expect(ids(result)).toEqual(['pre']);
    expect(getPhotoPage).toHaveBeenCalledTimes(1);
  });

  it('opens a list the map says is empty without a spinner', () => {
    rememberEmptyPhotoPage(FILTERS);
    getPhotoPage.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    expect(result.current.loading).toBe(false);
    expect(result.current.photos).toEqual([]);
  });

  it('never stands a page without screen-sized copies in for one that wants them', async () => {
    const first = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(first.result.current.photos).toHaveLength(3));
    const pending = deferred();
    getPhotoPage.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => usePhotoPage({ ...FILTERS, display: true }));
    expect(result.current.photos).toEqual([]);
    expect(result.current.loading).toBe(true);
  });
});

describe('usePhotoPage: changes', () => {
  it('replaces, removes and adds photos without a refetch', async () => {
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(result.current.photos).toHaveLength(3));
    act(() => result.current.replacePhoto({ id: 'p2', caption: 'Seine' }));
    act(() => result.current.removePhoto('p3'));
    act(() => result.current.addPhotos([photo('new'), { ...photo('p1'), caption: 'again' }]));
    expect(result.current.photos).toEqual([photo('new'), { ...photo('p1'), caption: 'again' }, { ...photo('p2'), caption: 'Seine' }]);
    expect(getPhotoPage).toHaveBeenCalledTimes(1);
  });

  it('moves a photo at once, then saves where it went', async () => {
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(result.current.photos).toHaveLength(3));
    const saving = deferred();
    movePhoto.mockReturnValue(saving.promise);
    let move;
    act(() => {
      move = result.current.movePhoto('p3', 'p1', 'country');
    });
    expect(ids(result)).toEqual(['p1', 'p3', 'p2']);
    expect(movePhoto).toHaveBeenCalledWith('p3', { gallery: 'country', afterId: 'p1' });
    await act(async () => {
      saving.resolve({});
      await move;
    });
    await act(async () => result.current.movePhoto('p2', null, 'country'));
    expect(ids(result)).toEqual(['p2', 'p1', 'p3']);
  });

  it('loads the list again when the move is refused, and passes the error on', async () => {
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await waitFor(() => expect(result.current.photos).toHaveLength(3));
    movePhoto.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Forbidden.' }));
    await act(async () => expect(result.current.movePhoto('p3', null, 'country')).rejects.toMatchObject({ friendlyMessage: 'Forbidden.' }));
    await waitFor(() => expect(ids(result)).toEqual(['p1', 'p2', 'p3']));
    expect(getPhotoPage.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('usePhotoPage: videos being converted', () => {
  it('asks about a converting video again until it is ready', async () => {
    vi.useFakeTimers();
    getPhotoPage.mockResolvedValue({ photos: [photo('v1', { kind: 'VIDEO', videoState: 'PROCESSING' }), photo('p1')], nextCursor: null });
    getPhoto.mockResolvedValueOnce({ photo: photo('v1', { kind: 'VIDEO', videoState: 'PROCESSING' }) });
    getPhoto.mockResolvedValueOnce({ photo: photo('v1', { kind: 'VIDEO', videoState: 'READY', videoUrl: 'x.m3u8' }) });
    const { result } = renderHook(() => usePhotoPage(FILTERS));
    await act(async () => vi.advanceTimersByTimeAsync(0));
    await act(async () => vi.advanceTimersByTimeAsync(4999));
    expect(getPhoto).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(getPhoto).toHaveBeenCalledWith('v1');
    expect(result.current.photos[0].videoState).toBe('PROCESSING');
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(result.current.photos[0].videoState).toBe('READY');
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(getPhoto).toHaveBeenCalledTimes(2);
  });

  it('never asks through a share link', async () => {
    vi.useFakeTimers();
    getPhotoPage.mockResolvedValue({ photos: [photo('v1', { kind: 'VIDEO', videoState: 'PROCESSING' })], nextCursor: null });
    renderHook(() => usePhotoPage({ shareCode: 'ABC' }));
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(getPhoto).not.toHaveBeenCalled();
  });
});
