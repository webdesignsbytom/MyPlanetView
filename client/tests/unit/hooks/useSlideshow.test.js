// useSlideshowPhotos and useSlideshowMoments: what a slideshow plays
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useSlideshowMoments from '@/hooks/useSlideshowMoments';
import useSlideshowPhotos from '@/hooks/useSlideshowPhotos';
import { getMomentPage, getPhotoPage } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getMomentPage: vi.fn(), getPhotoPage: vi.fn() }));

const photo = (id, extra = {}) => ({ id, ...extra });
const ids = (list) => list.map((item) => item.id);

beforeEach(() => vi.resetAllMocks());

describe('useSlideshowPhotos', () => {
  it('pages the photos with their display copies, skipping videos with nothing to play', async () => {
    getPhotoPage.mockResolvedValueOnce({
      photos: [photo('p1'), photo('v1', { kind: 'VIDEO' }), photo('v2', { kind: 'VIDEO', videoUrl: 'v2.m3u8' })],
      nextCursor: 'c1',
    });
    const { result } = renderHook(() => useSlideshowPhotos({ mapId: 'm1', country: 'FR', order: 'taken' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ids(result.current.photos)).toEqual(['p1', 'v2']);
    expect(result.current.complete).toBe(false);
    expect(getPhotoPage).toHaveBeenCalledWith({
      mapId: 'm1',
      tripId: undefined,
      shareCode: undefined,
      country: 'FR',
      order: 'taken',
      seed: undefined,
      display: true,
      limit: 30,
      cursor: null,
    });
    getPhotoPage.mockResolvedValueOnce({ photos: [photo('p2')], nextCursor: null });
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.complete).toBe(true));
    expect(ids(result.current.photos)).toEqual(['p1', 'v2', 'p2']);
    expect(getPhotoPage.mock.calls[1][0].cursor).toBe('c1');
  });

  it('asks for one page at a time', async () => {
    getPhotoPage.mockResolvedValueOnce({ photos: [photo('p1')], nextCursor: 'c1' });
    getPhotoPage.mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useSlideshowPhotos({ tripId: 't1', order: 'taken' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    act(() => result.current.loadMore());
    expect(getPhotoPage).toHaveBeenCalledTimes(2);
  });

  it('says the shuffle went stale when the server lost its place (a 400 on a later page)', async () => {
    getPhotoPage.mockResolvedValueOnce({ photos: [photo('p1')], nextCursor: 'c1' });
    getPhotoPage.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 400 } }));
    const { result } = renderHook(() => useSlideshowPhotos({ mapId: 'm1', order: 'shuffle', seed: 's1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.stale).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('says why the photos couldn’t be loaded otherwise', async () => {
    getPhotoPage.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 400 }, friendlyMessage: 'Bad seed.' }));
    const { result } = renderHook(() => useSlideshowPhotos({ mapId: 'm1', order: 'shuffle', seed: 's1' }));
    await waitFor(() => expect(result.current.error).toBe('Bad seed.'));
    expect(result.current.stale).toBe(false);
  });

  it('starts again from the first page on a new run', async () => {
    getPhotoPage.mockResolvedValue({ photos: [photo('p1')], nextCursor: null });
    const { result, rerender } = renderHook(({ run }) => useSlideshowPhotos({ shareCode: 'ABC', order: 'shuffle', seed: 's1', run }), {
      initialProps: { run: 0 },
    });
    await waitFor(() => expect(result.current.complete).toBe(true));
    rerender({ run: 1 });
    expect(result.current.photos).toEqual([]);
    await waitFor(() => expect(result.current.complete).toBe(true));
    expect(getPhotoPage).toHaveBeenCalledTimes(2);
    expect(getPhotoPage.mock.calls[1][0]).toMatchObject({ shareCode: 'ABC', seed: 's1', cursor: null });
  });
});

describe('useSlideshowMoments', () => {
  const moment = (id, happenedOn = '2020-01-01') => ({ id, happenedOn });

  it('gathers the dated moments, oldest first, leaving undated notes out', async () => {
    getMomentPage.mockResolvedValueOnce({ moments: [moment('a'), moment('note', null)], nextCursor: 'c1' });
    getMomentPage.mockResolvedValueOnce({ moments: [moment('b', '2021-01-01')], nextCursor: null });
    const { result } = renderHook(() => useSlideshowMoments({ source: { mapId: 'm1' }, country: 'FR' }));
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(ids(result.current.moments)).toEqual(['a', 'b']);
    expect(getMomentPage).toHaveBeenNthCalledWith(1, { mapId: 'm1', tripId: undefined, shareCode: undefined, country: 'FR', cursor: undefined, limit: 60 });
    expect(getMomentPage.mock.calls[1][0].cursor).toBe('c1');
  });

  it('stops after five pages', async () => {
    getMomentPage.mockResolvedValue({ moments: [moment('a')], nextCursor: 'more' });
    const { result } = renderHook(() => useSlideshowMoments({ source: { tripId: 't1' } }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(getMomentPage).toHaveBeenCalledTimes(5);
    expect(getMomentPage.mock.calls[0][0].country).toBeUndefined();
  });

  it('has none and is ready at once for a shuffled show', () => {
    const { result } = renderHook(() => useSlideshowMoments({ source: { mapId: 'm1' }, enabled: false }));
    expect(result.current).toEqual({ moments: [], ready: true });
    expect(getMomentPage).not.toHaveBeenCalled();
  });

  it('never stops the show when they can’t be loaded', async () => {
    getMomentPage.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSlideshowMoments({ source: { shareCode: 'ABC' } }));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.moments).toEqual([]);
  });
});
