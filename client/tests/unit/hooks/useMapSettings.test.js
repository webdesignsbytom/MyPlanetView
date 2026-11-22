import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useMapSettings from '@/hooks/useMapSettings';
import { getMapSettings, putMapSettings } from '@/api/travelApi';
import { DEFAULT_MAP_SETTINGS, MAP_SETTINGS_STORAGE_KEY } from '@/utils/map/mapSettings';

vi.mock('@/api/travelApi', () => ({ getMapSettings: vi.fn(), putMapSettings: vi.fn() }));

const stored = () => JSON.parse(localStorage.getItem(MAP_SETTINGS_STORAGE_KEY));
const flush = () => act(async () => {});

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  getMapSettings.mockResolvedValue({ mapSettings: null });
  putMapSettings.mockResolvedValue({});
});

afterEach(() => vi.useRealTimers());

describe('useMapSettings', () => {
  it('starts from the defaults in a fresh browser', () => {
    expect(renderHook(() => useMapSettings()).result.current.settings).toEqual(DEFAULT_MAP_SETTINGS);
  });

  it('starts from this browser’s copy, cleaned', () => {
    localStorage.setItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify({ style: 'starry', showGrid: false, junk: 1, mapType: 'nope' }));
    const { settings } = renderHook(() => useMapSettings()).result.current;
    expect(settings).toEqual({ ...DEFAULT_MAP_SETTINGS, style: 'starry', showGrid: false });
  });

  it('survives a broken copy', () => {
    localStorage.setItem(MAP_SETTINGS_STORAGE_KEY, '{not json');
    expect(renderHook(() => useMapSettings()).result.current.settings).toEqual(DEFAULT_MAP_SETTINGS);
  });

  it('signed out: keeps a change in this browser only', async () => {
    const { result } = renderHook(() => useMapSettings());
    act(() => result.current.updateSetting('showGrid', false));
    expect(result.current.settings.showGrid).toBe(false);
    expect(stored().showGrid).toBe(false);
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(getMapSettings).not.toHaveBeenCalled();
    expect(putMapSettings).not.toHaveBeenCalled();
  });

  it('signed in: the profile’s settings win, and are kept in this browser for next time', async () => {
    localStorage.setItem(MAP_SETTINGS_STORAGE_KEY, JSON.stringify({ style: 'starry' }));
    getMapSettings.mockResolvedValue({ mapSettings: { style: 'old-map' } });
    const { result } = renderHook(() => useMapSettings({ remote: true }));
    expect(result.current.settings.style).toBe('starry');
    await flush();
    expect(result.current.settings.style).toBe('old-map');
    expect(stored().style).toBe('old-map');
    expect(putMapSettings).not.toHaveBeenCalled();
  });

  it('keeps the same settings object when the profile says the same', async () => {
    getMapSettings.mockResolvedValue({ mapSettings: { ...DEFAULT_MAP_SETTINGS } });
    const { result } = renderHook(() => useMapSettings({ remote: true }));
    const first = result.current.settings;
    await flush();
    expect(result.current.settings).toBe(first);
  });

  it('a change made before the profile’s answer wins over it', async () => {
    let answer;
    getMapSettings.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { result } = renderHook(() => useMapSettings({ remote: true }));
    act(() => result.current.updateSetting('style', 'starry'));
    await act(async () => answer({ mapSettings: { style: 'old-map' } }));
    expect(result.current.settings.style).toBe('starry');
  });

  it('saves to the profile a moment after the last change, once for a burst', async () => {
    const { result } = renderHook(() => useMapSettings({ remote: true }));
    await flush();
    act(() => result.current.updateSetting('showGrid', false));
    await act(async () => vi.advanceTimersByTimeAsync(500));
    act(() => result.current.updateSetting('sunAndMoon', false));
    await act(async () => vi.advanceTimersByTimeAsync(799));
    expect(putMapSettings).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(putMapSettings).toHaveBeenCalledTimes(1);
    expect(putMapSettings).toHaveBeenCalledWith(expect.objectContaining({ showGrid: false, sunAndMoon: false }));
  });

  it('still saves a change waiting when the page is left', async () => {
    const { result, unmount } = renderHook(() => useMapSettings({ remote: true }));
    await flush();
    act(() => result.current.updateSetting('showTips', false));
    unmount();
    expect(putMapSettings).toHaveBeenCalledTimes(1);
    expect(putMapSettings.mock.calls[0][0].showTips).toBe(false);
  });

  it('keeps the browser’s copy when saving to the profile fails', async () => {
    putMapSettings.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useMapSettings({ remote: true }));
    await flush();
    act(() => result.current.updateSetting('showGrid', false));
    await act(async () => vi.advanceTimersByTimeAsync(800));
    expect(stored().showGrid).toBe(false);
  });

  it('cleans a bad value out of a change', () => {
    const { result } = renderHook(() => useMapSettings());
    act(() => result.current.updateSetting('style', 'galaxy'));
    expect(result.current.settings.style).toBe('animated');
  });
});
