import { afterEach, describe, expect, it, vi } from 'vitest';
import { onCookieSettings, openCookieSettings, readConsent, saveConsent } from '@/utils/analytics/consent';
import { COOKIE_POLICY_NAME } from '@/utils/constants/constants';

describe('readConsent', () => {
  it('is null before anyone has been asked', () => {
    expect(readConsent()).toBeNull();
  });

  it('reads a yes or a no that was saved', () => {
    saveConsent('granted');
    expect(readConsent()).toBe('granted');
    saveConsent('denied');
    expect(readConsent()).toBe('denied');
  });

  it('reads the old modal’s records as a yes, or as not asked', () => {
    localStorage.setItem(COOKIE_POLICY_NAME, JSON.stringify({ agreed: true }));
    expect(readConsent()).toBe('granted');
    localStorage.setItem(COOKIE_POLICY_NAME, JSON.stringify({ agreed: false }));
    expect(readConsent()).toBeNull();
  });

  it('treats an unreadable or strange record as not asked', () => {
    localStorage.setItem(COOKIE_POLICY_NAME, '{not json');
    expect(readConsent()).toBeNull();
    localStorage.setItem(COOKIE_POLICY_NAME, JSON.stringify({ analytics: 'maybe' }));
    expect(readConsent()).toBeNull();
    localStorage.setItem(COOKIE_POLICY_NAME, 'null');
    expect(readConsent()).toBeNull();
  });

  it('never assumes a yes when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(readConsent()).toBe('denied');
  });
});

describe('saveConsent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the choice with the policy version, the time and any details', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T09:00:00.000Z'));
    saveConsent('granted', { source: 'banner' });
    expect(JSON.parse(localStorage.getItem(COOKIE_POLICY_NAME))).toEqual({
      analytics: 'granted',
      version: '1.1.0',
      timestamp: '2026-11-22T09:00:00.000Z',
      source: 'banner',
    });
  });

  it('carries on quietly when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => saveConsent('denied')).not.toThrow();
  });
});

describe('the cookie settings event', () => {
  it('tells each listener when the footer asks, until it unsubscribes', () => {
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = onCookieSettings(first);
    const stopSecond = onCookieSettings(second);

    openCookieSettings();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    stopFirst();
    openCookieSettings();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    stopSecond();
  });
});
