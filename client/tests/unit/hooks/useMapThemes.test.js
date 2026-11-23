// useMapThemes and useThemeAlbum: a map's monthly photo themes and one theme's album
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useMapThemes from '@/hooks/useMapThemes';
import useThemeAlbum from '@/hooks/useThemeAlbum';
import { getMapThemes, getThemeAlbumPage } from '@/api/themesApi';

vi.mock('@/api/themesApi', () => ({ getMapThemes: vi.fn(), getThemeAlbumPage: vi.fn() }));

const THEMES = { current: { id: 'th1', count: 2 }, albums: [], entriesPerMap: 20 };
const photo = (id) => ({ id, caption: id });

function deferred() {
  let resolve;
  const promise = new Promise((res) => (resolve = res));
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  getMapThemes.mockResolvedValue(THEMES);
});

describe('useMapThemes', () => {
  it('loads a map’s themes', async () => {
    const { result } = renderHook(() => useMapThemes({ mapId: 'm1' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.themes).toBe(THEMES));
    expect(result.current.loading).toBe(false);
    expect(getMapThemes).toHaveBeenCalledWith({ mapId: 'm1', shareCode: null });
  });

  it('reads through a share link', async () => {
    const { result } = renderHook(() => useMapThemes({ shareCode: 'ABC' }));
    await waitFor(() => expect(result.current.themes).toBe(THEMES));
    expect(getMapThemes).toHaveBeenCalledWith({ mapId: null, shareCode: 'ABC' });
  });

  it('asks nothing while disabled', () => {
    const { result } = renderHook(() => useMapThemes({ mapId: 'm1', enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(getMapThemes).not.toHaveBeenCalled();
  });

  it('says why the theme couldn’t be loaded', async () => {
    getMapThemes.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMapThemes({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.error).toBe('The monthly theme could not be loaded.'));
    expect(result.current.themes).toBeNull();
  });

  it('reloads quietly, keeping the themes on screen meanwhile', async () => {
    const { result } = renderHook(() => useMapThemes({ mapId: 'm1' }));
    await waitFor(() => expect(result.current.themes).toBe(THEMES));
    const fresh = { ...THEMES, current: { id: 'th1', count: 3 } };
    getMapThemes.mockResolvedValue(fresh);
    let reload;
    act(() => {
      reload = result.current.reload();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.themes).toBe(THEMES);
    await act(async () => reload);
    expect(result.current.themes).toBe(fresh);
  });

  it('never lets a reload for the last map land on the next one', async () => {
    const { result, rerender } = renderHook(({ mapId }) => useMapThemes({ mapId }), { initialProps: { mapId: 'm1' } });
    await waitFor(() => expect(result.current.themes).toBe(THEMES));
    const late = deferred();
    getMapThemes.mockReturnValueOnce(late.promise);
    let reload;
    act(() => {
      reload = result.current.reload();
    });
    const second = { current: null, albums: [{ id: 'th0' }] };
    getMapThemes.mockResolvedValueOnce(second);
    rerender({ mapId: 'm2' });
    await waitFor(() => expect(result.current.themes).toBe(second));
    await act(async () => {
      late.resolve({ current: { id: 'stale' } });
      await reload;
    });
    expect(result.current.themes).toBe(second);
  });
});

describe('useThemeAlbum', () => {
  it('loads the album’s first page', async () => {
    getThemeAlbumPage.mockResolvedValue({ photos: [photo('p1'), photo('p2')], nextCursor: 'c1' });
    const { result } = renderHook(() => useThemeAlbum({ mapId: 'm1', themeId: 'th1' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    expect(result.current.nextCursor).toBe('c1');
    expect(getThemeAlbumPage).toHaveBeenCalledWith({ mapId: 'm1', shareCode: null }, 'th1', { limit: 30 });
  });

  it('adds the next page, without a photo twice', async () => {
    getThemeAlbumPage.mockResolvedValueOnce({ photos: [photo('p1'), photo('p2')], nextCursor: 'c1' });
    getThemeAlbumPage.mockResolvedValueOnce({ photos: [photo('p2'), photo('p3')], nextCursor: null });
    const { result } = renderHook(() => useThemeAlbum({ shareCode: 'ABC', themeId: 'th1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.photos.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']));
    expect(getThemeAlbumPage).toHaveBeenLastCalledWith({ mapId: null, shareCode: 'ABC' }, 'th1', { cursor: 'c1', limit: 30 });
    expect(result.current.nextCursor).toBeNull();
    // The last page: nothing more to ask for
    act(() => result.current.loadMore());
    expect(getThemeAlbumPage).toHaveBeenCalledTimes(2);
  });

  it('asks for one page at a time', async () => {
    getThemeAlbumPage.mockResolvedValueOnce({ photos: [photo('p1')], nextCursor: 'c1' });
    getThemeAlbumPage.mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useThemeAlbum({ mapId: 'm1', themeId: 'th1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(getThemeAlbumPage).toHaveBeenCalledTimes(2);
  });

  it('starts again on reload, dropping a page asked for before', async () => {
    getThemeAlbumPage.mockResolvedValueOnce({ photos: [photo('p1')], nextCursor: 'c1' });
    const late = deferred();
    getThemeAlbumPage.mockReturnValueOnce(late.promise);
    getThemeAlbumPage.mockResolvedValueOnce({ photos: [photo('p9')], nextCursor: null });
    const { result } = renderHook(() => useThemeAlbum({ mapId: 'm1', themeId: 'th1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.photos.map((p) => p.id)).toEqual(['p9']));
    await act(async () => late.resolve({ photos: [photo('p2')], nextCursor: null }));
    expect(result.current.photos.map((p) => p.id)).toEqual(['p9']);
  });

  it('takes a photo out, or changes one, at once', async () => {
    getThemeAlbumPage.mockResolvedValue({ photos: [photo('p1'), photo('p2')], nextCursor: null });
    const { result } = renderHook(() => useThemeAlbum({ mapId: 'm1', themeId: 'th1' }));
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    act(() => result.current.replacePhoto({ id: 'p2', caption: 'Rain' }));
    act(() => result.current.removePhoto('p1'));
    expect(result.current.photos).toEqual([{ id: 'p2', caption: 'Rain' }]);
  });

  it('says why the album or more photos couldn’t be loaded', async () => {
    getThemeAlbumPage.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useThemeAlbum({ mapId: 'm1', themeId: 'th1' }));
    await waitFor(() => expect(result.current.error).toBe('The album could not be loaded.'));
    getThemeAlbumPage.mockResolvedValueOnce({ photos: [photo('p1')], nextCursor: 'c1' });
    getThemeAlbumPage.mockRejectedValueOnce(new Error('x'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.photos).toHaveLength(1));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.error).toBe('More photos could not be loaded.'));
    expect(result.current.photos).toHaveLength(1);
  });
});
