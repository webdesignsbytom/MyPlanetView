import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';

vi.mock('@/api/client', () => ({ default: { get: vi.fn() } }));

// The request is kept in a module variable: a fresh module for each test
let boot;
beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  boot = await import('@/auth/bootSession');
});

describe('bootSession', () => {
  it('asks nobody when this browser has no session', () => {
    expect(boot.startSessionRequest()).toBeNull();
    expect(client.get).not.toHaveBeenCalled();
    expect(boot.takeSessionRequest()).toBeNull();
  });

  it('starts the session request once when the flag is set, with the cookie', () => {
    localStorage.setItem(boot.IS_LOGGED_IN_KEY, 'true');
    const reply = Promise.resolve({ data: { data: { user: { id: 'u1' } } } });
    client.get.mockReturnValue(reply);
    const first = boot.startSessionRequest();
    const second = boot.startSessionRequest();
    expect(first).toBe(reply);
    expect(second).toBe(first);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith('/api/users/user/get-logged-in-user', true);
  });

  it('hands the request over once', () => {
    localStorage.setItem('isLoggedIn', 'true');
    client.get.mockReturnValue(Promise.resolve({}));
    const request = boot.startSessionRequest();
    expect(boot.takeSessionRequest()).toBe(request);
    expect(boot.takeSessionRequest()).toBeNull();
  });

  it('only counts the flag when it says "true"', () => {
    localStorage.setItem('isLoggedIn', 'false');
    expect(boot.startSessionRequest()).toBeNull();
    expect(client.get).not.toHaveBeenCalled();
  });

  it('never leaves a failure unhandled before someone takes it', async () => {
    localStorage.setItem('isLoggedIn', 'true');
    const failure = Promise.reject(new Error('offline'));
    client.get.mockReturnValue(failure);
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    boot.startSessionRequest();
    await new Promise((resolve) => setTimeout(resolve, 10));
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    await expect(boot.takeSessionRequest()).rejects.toThrow('offline');
  });
});
