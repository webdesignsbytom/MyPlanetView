import { createElement } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDay, formatDayRange, toDateInput } from '@/utils/functions/dates';
import { plural } from '@/utils/functions/plural';
import { runWithConcurrencyLimit } from '@/utils/functions/runWithConcurrencyLimit';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/functions/safeStorage';
import useScrollToTopOnRouteChange from '@/utils/functions/scrollToTop';

describe('dates', () => {
  it('writes a day as people read it, a date-only value as that calendar day', () => {
    expect(formatDay('2026-11-14')).toBe('14 Nov 2026');
    expect(formatDay('2026-11-14T23:30:00.000Z')).toBe('14 Nov 2026');
    expect(formatDay('2026-01-01')).toBe('1 Jan 2026');
  });

  it('writes nothing for no date or a bad one', () => {
    expect(formatDay('')).toBe('');
    expect(formatDay(null)).toBe('');
    expect(formatDay('not a date')).toBe('');
  });

  it('writes a range, one day once, or whichever end there is', () => {
    expect(formatDayRange('2026-06-01', '2026-06-14')).toBe('1 Jun 2026 – 14 Jun 2026');
    expect(formatDayRange('2026-06-01', '2026-06-01')).toBe('1 Jun 2026');
    expect(formatDayRange(null, '2026-06-14')).toBe('14 Jun 2026');
    expect(formatDayRange('2026-06-01', null)).toBe('1 Jun 2026');
    expect(formatDayRange(null, null)).toBe('');
  });

  it('gives a date input its YYYY-MM-DD', () => {
    expect(toDateInput('2026-11-14T09:30:00.000Z')).toBe('2026-11-14');
    expect(toDateInput('2026-11-14')).toBe('2026-11-14');
    expect(toDateInput(null)).toBe('');
  });
});

describe('plural', () => {
  it('counts one and many, with an -s or a word of its own', () => {
    expect(plural(1, 'country', 'countries')).toBe('1 country');
    expect(plural(3, 'country', 'countries')).toBe('3 countries');
    expect(plural(0, 'photo')).toBe('0 photos');
    expect(plural(1, 'photo')).toBe('1 photo');
  });
});

describe('runWithConcurrencyLimit', () => {
  it('runs every item, never more at once than the limit, and keeps the results in order', async () => {
    let running = 0;
    let most = 0;
    const worker = async (item, index) => {
      running += 1;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, item));
      running -= 1;
      return `${index}:${item}`;
    };
    const results = await runWithConcurrencyLimit(2, [15, 1, 8, 2, 5], worker);
    expect(results).toEqual(['0:15', '1:1', '2:8', '3:2', '4:5']);
    expect(most).toBe(2);
  });

  it('copes with fewer items than the limit, and with none', async () => {
    const worker = vi.fn(async (item) => item * 2);
    expect(await runWithConcurrencyLimit(10, [1, 2], worker)).toEqual([2, 4]);
    expect(await runWithConcurrencyLimit(4, [], worker)).toEqual([]);
    expect(worker).toHaveBeenCalledTimes(2);
  });

  it('fails when a worker fails', async () => {
    await expect(runWithConcurrencyLimit(2, [1, 2], async (item) => {
      if (item === 2) throw new Error('nope');
      return item;
    })).rejects.toThrow('nope');
  });
});

describe('safeStorage', () => {
  it('reads, writes and removes in local or session storage', () => {
    setStoredItem('a', '1');
    setStoredItem('b', '2', 'sessionStorage');
    expect(getStoredItem('a')).toBe('1');
    expect(localStorage.getItem('a')).toBe('1');
    expect(getStoredItem('b', 'sessionStorage')).toBe('2');
    expect(getStoredItem('b')).toBeNull();
    removeStoredItem('a');
    removeStoredItem('b', 'sessionStorage');
    expect(getStoredItem('a')).toBeNull();
    expect(getStoredItem('b', 'sessionStorage')).toBeNull();
  });

  it('never throws when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
    expect(getStoredItem('a')).toBeNull();
    expect(() => setStoredItem('a', '1')).not.toThrow();
    expect(() => removeStoredItem('a')).not.toThrow();
  });
});

describe('useScrollToTopOnRouteChange', () => {
  let scrollTo;

  beforeEach(() => {
    scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback(0);
      return 1;
    });
  });

  const renderAt = (path, options) =>
    renderHook(
      () => {
        useScrollToTopOnRouteChange(options);
        return useNavigate();
      },
      { wrapper: ({ children }) => createElement(MemoryRouter, { initialEntries: [path] }, children) },
    );

  it('leaves the first page (a back or forward) to the browser’s own scroll restoration', () => {
    // jsdom's history has no scrollRestoration: give it one, as browsers have
    Object.defineProperty(window.history, 'scrollRestoration', { value: 'manual', writable: true, configurable: true });
    try {
      renderAt('/about');
      expect(scrollTo).not.toHaveBeenCalled();
      expect(window.history.scrollRestoration).toBe('auto');
    } finally {
      delete window.history.scrollRestoration;
    }
  });

  it('jumps to the top on a new page', () => {
    const { result } = renderAt('/about');
    act(() => result.current('/pricing'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('scrolls smoothly when asked', () => {
    const { result } = renderAt('/about', { smooth: true });
    act(() => result.current('/faq?x=1'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('leaves an in-page anchor to the browser', () => {
    const { result } = renderAt('/about');
    act(() => result.current('/user-agreements#privacy-policy'));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
