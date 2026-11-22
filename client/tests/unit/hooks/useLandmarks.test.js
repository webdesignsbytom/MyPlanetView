// useLandmarks and useLandmarkPhotos: reference data fetched once a session
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getLandmarks } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getLandmarks: vi.fn() }));
vi.mock('@/utils/map/landmarkPhotos', () => ({ LANDMARK_PHOTOS: { 'eiffel-tower': { width: 480 } }, LICENCES: {} }));

const LANDMARKS = [
  { id: 'eiffel', countryCode: 'FR', latitude: 48.86, longitude: 2.29 },
  { id: 'big-ben', countryCode: 'GB', nation: 'XE', latitude: 51.5, longitude: -0.12 },
  { id: 'edinburgh', countryCode: 'GB', nation: 'XC', latitude: 55.95, longitude: -3.2 },
  { id: 'tanah-lot', countryCode: 'ID', latitude: -8.62, longitude: 115.09 },
  { id: 'borobudur', countryCode: 'ID', latitude: -7.61, longitude: 110.2 },
];

// The list is kept for the session (module variables): a fresh module each test
let useLandmarks;
let preloadLandmarks;
beforeEach(async () => {
  vi.resetAllMocks();
  getLandmarks.mockResolvedValue({ landmarks: LANDMARKS });
  vi.resetModules();
  ({ default: useLandmarks, preloadLandmarks } = await import('@/hooks/useLandmarks'));
});

const ids = (state) => state.landmarks.map((l) => l.id);

describe('useLandmarks', () => {
  it('gives every landmark when no country is asked for', async () => {
    const { result } = renderHook(() => useLandmarks(null));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ids(result.current)).toEqual(LANDMARKS.map((l) => l.id));
  });

  it('gives one country’s', async () => {
    const { result } = renderHook(() => useLandmarks('FR'));
    await waitFor(() => expect(ids(result.current)).toEqual(['eiffel']));
  });

  it('gives a UK nation the landmarks the server says are in it', async () => {
    const { result } = renderHook(() => useLandmarks('XC'));
    await waitFor(() => expect(ids(result.current)).toEqual(['edinburgh']));
  });

  it('gives a region its country’s landmarks inside it (Bali)', async () => {
    const { result } = renderHook(() => useLandmarks('XB'));
    await waitFor(() => expect(ids(result.current)).toEqual(['tanah-lot']));
  });

  it('asks once a session, and a country’s list keeps its identity', async () => {
    const first = renderHook(() => useLandmarks('FR'));
    await waitFor(() => expect(first.result.current.landmarks).toHaveLength(1));
    const second = renderHook(() => useLandmarks('FR'));
    // Already here: no loading in between
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.landmarks).toBe(first.result.current.landmarks);
    expect(getLandmarks).toHaveBeenCalledTimes(1);
  });

  it('asks nothing while disabled', () => {
    const { result } = renderHook(() => useLandmarks('FR', { enabled: false }));
    expect(result.current).toEqual({ landmarks: [], loading: false, error: null });
    expect(getLandmarks).not.toHaveBeenCalled();
  });

  it('says why they couldn’t be loaded, and asks again next time', async () => {
    getLandmarks.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'No response.' }));
    const { result } = renderHook(() => useLandmarks('FR'));
    await waitFor(() => expect(result.current.error).toBe('No response.'));
    const again = renderHook(() => useLandmarks('FR'));
    await waitFor(() => expect(ids(again.result.current)).toEqual(['eiffel']));
    expect(getLandmarks).toHaveBeenCalledTimes(2);
  });

  it('starts fetching early, and a failure there is quiet', async () => {
    getLandmarks.mockRejectedValueOnce(new Error('offline'));
    await expect(preloadLandmarks()).resolves.toBeUndefined();
    await preloadLandmarks();
    const { result } = renderHook(() => useLandmarks('FR'));
    expect(result.current.loading).toBe(false);
    expect(ids(result.current)).toEqual(['eiffel']);
  });
});

describe('useLandmarkPhotos', () => {
  it('has nothing in its first render, then the credits', async () => {
    const { default: useLandmarkPhotos } = await import('@/hooks/useLandmarkPhotos');
    const { result } = renderHook(() => useLandmarkPhotos());
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current?.LANDMARK_PHOTOS['eiffel-tower'].width).toBe(480));
  });

  it('loads them once, and a later list has them at once', async () => {
    const { default: useLandmarkPhotos, preloadLandmarkPhotos } = await import('@/hooks/useLandmarkPhotos');
    const pending = preloadLandmarkPhotos();
    expect(preloadLandmarkPhotos()).toBe(pending);
    await pending;
    expect(renderHook(() => useLandmarkPhotos()).result.current.LANDMARK_PHOTOS).toBeTruthy();
  });
});
