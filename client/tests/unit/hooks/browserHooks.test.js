// The hooks that follow the browser: media queries, reduced motion, full screen, the map's
// theme on <html>, and the screen wake lock
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useFullscreen from '@/hooks/useFullscreen';
import useMapTheme from '@/hooks/useMapTheme';
import useMediaQuery from '@/hooks/useMediaQuery';
import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion';
import useWakeLock from '@/hooks/useWakeLock';

// A matchMedia whose answers the test changes, telling the listeners as a browser does
function fakeMatchMedia(initial = {}) {
  const matches = { ...initial };
  const listeners = new Map();
  const matchMedia = vi.fn((query) => ({
    get matches() {
      return Boolean(matches[query]);
    },
    addEventListener: (_type, fn) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query).add(fn);
    },
    removeEventListener: (_type, fn) => listeners.get(query)?.delete(fn),
  }));
  const set = (query, value) => {
    matches[query] = value;
    listeners.get(query)?.forEach((fn) => fn());
  };
  return { matchMedia, set, listeners };
}

describe('useMediaQuery', () => {
  it('is false where the browser can’t tell', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useMediaQuery('(min-width: 1024px)')).result.current).toBe(false);
  });

  it('follows the query as the window changes, and stops listening when gone', () => {
    const media = fakeMatchMedia({ '(min-width: 1024px)': true });
    vi.stubGlobal('matchMedia', media.matchMedia);
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);
    act(() => media.set('(min-width: 1024px)', false));
    expect(result.current).toBe(false);
    unmount();
    expect(media.listeners.get('(min-width: 1024px)').size).toBe(0);
  });
});

describe('usePrefersReducedMotion', () => {
  const QUERY = '(prefers-reduced-motion: reduce)';

  it('follows the system setting', () => {
    const media = fakeMatchMedia({ [QUERY]: false });
    vi.stubGlobal('matchMedia', media.matchMedia);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.set(QUERY, true));
    expect(result.current).toBe(true);
  });

  it('is false where the browser has no matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });
});

describe('useFullscreen', () => {
  let fullscreenElement = null;
  const root = document.documentElement;

  beforeEach(() => {
    fullscreenElement = null;
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    Object.defineProperty(document, 'fullscreenElement', { get: () => fullscreenElement, configurable: true });
    root.requestFullscreen = vi.fn(() => Promise.resolve());
    document.exitFullscreen = vi.fn(() => Promise.resolve());
  });

  afterEach(() => {
    delete document.fullscreenEnabled;
    delete document.fullscreenElement;
    delete root.requestFullscreen;
    delete document.exitFullscreen;
  });

  it('isn’t offered where pages can’t go full screen (an iPhone’s Safari)', () => {
    delete root.requestFullscreen;
    expect(renderHook(() => useFullscreen()).result.current.supported).toBe(false);
  });

  it('puts the whole page full screen, hiding the browser’s bars', () => {
    const { result } = renderHook(() => useFullscreen());
    expect(result.current.supported).toBe(true);
    act(() => result.current.toggle());
    expect(root.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' });
  });

  it('follows the browser, and leaves full screen when it’s on', () => {
    const { result } = renderHook(() => useFullscreen());
    act(() => {
      fullscreenElement = root;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.active).toBe(true);
    act(() => result.current.toggle());
    expect(document.exitFullscreen).toHaveBeenCalled();
    act(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.active).toBe(false);
  });

  it('ignores a refusal', async () => {
    root.requestFullscreen = vi.fn(() => Promise.reject(new Error('Not allowed')));
    const { result } = renderHook(() => useFullscreen());
    act(() => result.current.toggle());
    await Promise.resolve();
    expect(result.current.active).toBe(false);
  });
});

describe('useMapTheme', () => {
  const root = document.documentElement;
  afterEach(() => {
    root.removeAttribute('data-map-theme');
    root.removeAttribute('data-mono');
  });

  it.each(['starry', 'old-map'])('puts the %s style on <html> while mounted', (style) => {
    const { unmount } = renderHook(() => useMapTheme(style));
    expect(root.getAttribute('data-map-theme')).toBe(style);
    unmount();
    expect(root.hasAttribute('data-map-theme')).toBe(false);
  });

  it('marks Black and white with data-mono instead', () => {
    const { unmount } = renderHook(() => useMapTheme('mono'));
    expect(root.getAttribute('data-mono')).toBe('');
    expect(root.hasAttribute('data-map-theme')).toBe(false);
    unmount();
    expect(root.hasAttribute('data-mono')).toBe(false);
  });

  it.each([
    ['the animated sea', 'animated'],
    ['an unknown style (it opens as the animated sea)', 'galaxy'],
    ['no style yet', undefined],
  ])('sets nothing for %s', (_what, style) => {
    renderHook(() => useMapTheme(style));
    expect(root.hasAttribute('data-map-theme')).toBe(false);
    expect(root.hasAttribute('data-mono')).toBe(false);
  });

  it('swaps the style when it changes', () => {
    const { rerender } = renderHook(({ style }) => useMapTheme(style), { initialProps: { style: 'starry' } });
    rerender({ style: 'mono' });
    expect(root.hasAttribute('data-map-theme')).toBe(false);
    expect(root.hasAttribute('data-mono')).toBe(true);
  });
});

describe('useWakeLock', () => {
  let sentinels;
  const flush = () => act(async () => {});

  beforeEach(() => {
    sentinels = [];
    const request = vi.fn(async () => {
      const listeners = {};
      const sentinel = {
        release: vi.fn(async () => {}),
        addEventListener: (type, fn) => {
          listeners[type] = fn;
        },
        fire: (type) => listeners[type]?.(),
      };
      sentinels.push(sentinel);
      return sentinel;
    });
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } });
  });

  it('keeps the screen awake while active, and lets go when it stops', async () => {
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: true } });
    await flush();
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
    rerender({ active: false });
    expect(sentinels[0].release).toHaveBeenCalled();
  });

  it('asks nothing while inactive', async () => {
    renderHook(() => useWakeLock(false));
    await flush();
    expect(navigator.wakeLock.request).not.toHaveBeenCalled();
  });

  it('asks again when the tab shows after the browser let go', async () => {
    renderHook(() => useWakeLock(true));
    await flush();
    sentinels[0].fire('release');
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(2);
  });

  it('doesn’t ask again while it still holds the lock', async () => {
    renderHook(() => useWakeLock(true));
    await flush();
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1);
  });

  it('lets go of a lock that arrives after it was put away', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    unmount();
    await flush();
    expect(sentinels[0].release).toHaveBeenCalled();
  });

  it('carries on when the browser says no', async () => {
    navigator.wakeLock.request.mockRejectedValueOnce(new Error('battery saver'));
    renderHook(() => useWakeLock(true));
    await flush();
    expect(sentinels).toEqual([]);
  });

  it('does nothing where there is no wake lock', async () => {
    vi.stubGlobal('navigator', { ...navigator, wakeLock: undefined });
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
