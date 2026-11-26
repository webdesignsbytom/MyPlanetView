import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { COOKIE_POLICY_NAME } from '@/utils/constants/constants';

// The cookie pop-up's answer, as what waits on it sees it (the map's tips: 26 Nov 2026,
// the audit). Each test loads the modules afresh, as the choice made this visit is kept
// in the module.
const fresh = async () => {
  vi.resetModules();
  const consent = await import('@/utils/analytics/consent');
  const { default: useCookieChoiceMade } = await import('@/hooks/useCookieChoiceMade');
  return { ...consent, useCookieChoiceMade };
};

beforeEach(() => localStorage.clear());

describe('cookieChoiceMade and onCookieChoice', () => {
  it('is false until the pop-up is answered, then tells each listener once', async () => {
    const { cookieChoiceMade, onCookieChoice, saveConsent } = await fresh();
    expect(cookieChoiceMade()).toBe(false);
    const listener = vi.fn();
    const stop = onCookieChoice(listener);
    saveConsent('granted');
    expect(cookieChoiceMade()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    saveConsent('denied');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('counts an answer on record from an earlier visit', async () => {
    localStorage.setItem(COOKIE_POLICY_NAME, JSON.stringify({ analytics: 'denied', version: '1.1.0' }));
    const { cookieChoiceMade } = await fresh();
    expect(cookieChoiceMade()).toBe(true);
  });

  it('counts an answer this visit when the record couldn’t be written', async () => {
    const { cookieChoiceMade, saveConsent } = await fresh();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    saveConsent('denied');
    setItem.mockRestore();
    expect(localStorage.getItem(COOKIE_POLICY_NAME)).toBeNull();
    expect(cookieChoiceMade()).toBe(true);
  });
});

describe('useCookieChoiceMade', () => {
  it('follows the answer as it’s given', async () => {
    const { saveConsent, useCookieChoiceMade } = await fresh();
    function Probe() {
      return <p data-answered={String(useCookieChoiceMade())} />;
    }
    const { container } = render(<Probe />);
    expect(container.querySelector('p').getAttribute('data-answered')).toBe('false');
    act(() => saveConsent('denied'));
    expect(container.querySelector('p').getAttribute('data-answered')).toBe('true');
  });
});
