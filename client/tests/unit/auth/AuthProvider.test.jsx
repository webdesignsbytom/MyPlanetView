import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import client from '@/api/client';
import { AuthProvider } from '@/auth/AuthProvider';
import { useAuth } from '@/auth/AuthContext';
import { startSessionRequest } from '@/auth/bootSession';
import { presignAndUpload } from '@/utils/media/uploadViaMediaService';
import { clearPanelCache } from '@/utils/data/panelCache';

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('@/utils/media/uploadViaMediaService', () => ({ presignAndUpload: vi.fn() }));
vi.mock('@/utils/data/panelCache', () => ({ clearPanelCache: vi.fn() }));

const SESSION = '/api/users/user/get-logged-in-user';
const sam = { id: 'u1', email: 'sam@example.com', name: 'Sam', emailVerified: true };
const session = (user) => ({ data: { data: { user } } });
const httpError = (status, friendlyMessage = 'Failed.') => Object.assign(new Error('x'), { friendlyMessage, response: { status } });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let auth;
let path;
function Probe() {
  auth = useAuth();
  path = useLocation().pathname;
  return <p data-testid='who'>{auth.user?.name || 'nobody'}</p>;
}

async function renderAuth() {
  render(
    <MemoryRouter initialEntries={['/account']}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(auth.loading).toBe(false));
}

async function signedIn(user = sam) {
  localStorage.setItem('isLoggedIn', 'true');
  client.get.mockResolvedValueOnce(session(user));
  await renderAuth();
  expect(auth.user).toEqual(user);
}

// Runs one of the context's actions and hands back what it answered
async function run(action) {
  let result;
  await act(async () => {
    result = await action();
  });
  return result;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAuth', () => {
  it('needs the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within <AuthProvider>');
  });
});

describe('AuthProvider: reading the session', () => {
  it('starts signed out, and asks nobody when this browser has no session', async () => {
    await renderAuth();
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('reads the session when the browser has the flag, and keeps the flag', async () => {
    await signedIn();
    expect(auth.isAuthenticated).toBe(true);
    expect(client.get).toHaveBeenCalledWith(SESSION, true);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
    expect(screen.getByTestId('who').textContent).toBe('Sam');
  });

  it('takes the request started at boot instead of asking again', async () => {
    localStorage.setItem('isLoggedIn', 'true');
    client.get.mockResolvedValueOnce(session(sam));
    startSessionRequest();
    await renderAuth();
    expect(auth.user).toEqual(sam);
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('ends the session when the server answers with no user', async () => {
    localStorage.setItem('isLoggedIn', 'true');
    client.get.mockResolvedValueOnce(session(null));
    await renderAuth();
    expect(auth.user).toBeNull();
    expect(localStorage.getItem('isLoggedIn')).toBeNull();
  });

  it('ends the session on a 401', async () => {
    localStorage.setItem('isLoggedIn', 'true');
    client.get.mockRejectedValueOnce(httpError(401));
    await renderAuth();
    expect(auth.user).toBeNull();
    expect(localStorage.getItem('isLoggedIn')).toBeNull();
  });

  it.each([
    ['a server error', httpError(500)],
    ['no answer at all', Object.assign(new Error('Network Error'), { request: {} })],
  ])('keeps the flag after %s at boot, so the next load asks again', async (_what, error) => {
    localStorage.setItem('isLoggedIn', 'true');
    client.get.mockRejectedValueOnce(error);
    await renderAuth();
    expect(auth.user).toBeNull();
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('keeps a signed-in person signed in when a later read fails', async () => {
    await signedIn();
    client.get.mockRejectedValueOnce(httpError(503, 'Down.'));
    expect(await run(() => auth.refresh({ silent: true }))).toEqual({ ok: false, error: 'Down.' });
    expect(auth.user).toEqual(sam);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('never lets an older, slower answer replace a newer one', async () => {
    await signedIn();
    const older = deferred();
    const newer = deferred();
    client.get.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    let first;
    let second;
    act(() => {
      first = auth.refresh({ silent: true });
      second = auth.refresh({ silent: true });
    });
    await act(async () => {
      newer.resolve(session({ ...sam, name: 'Sam (new)' }));
      await second;
    });
    expect(auth.user.name).toBe('Sam (new)');
    await act(async () => {
      older.resolve(session({ ...sam, name: 'Sam (old)' }));
      await first;
    });
    expect(auth.user.name).toBe('Sam (new)');
  });

  it('never lets an older 401 sign out a newer session', async () => {
    await signedIn();
    const older = deferred();
    const newer = deferred();
    client.get.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    let first;
    let second;
    act(() => {
      first = auth.refresh({ silent: true });
      second = auth.refresh({ silent: true });
    });
    await act(async () => {
      newer.resolve(session(sam));
      await second;
    });
    await act(async () => {
      older.reject(httpError(401));
      await first;
    });
    expect(auth.user).toEqual(sam);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('shows the loading state for a read that isn’t silent', async () => {
    await signedIn();
    const reply = deferred();
    client.get.mockReturnValueOnce(reply.promise);
    let read;
    act(() => {
      read = auth.refresh();
    });
    expect(auth.loading).toBe(true);
    await act(async () => {
      reply.resolve(session(sam));
      await read;
    });
    expect(auth.loading).toBe(false);
  });
});

describe('AuthProvider: re-reading while unverified', () => {
  const unverified = { ...sam, emailVerified: false };
  const at = (time) => vi.setSystemTime(new Date(`2026-11-22T10:${time}Z`));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at('00:00');
  });

  it('reads the session again on focus, at most every 10 seconds', async () => {
    await signedIn(unverified);
    client.get.mockResolvedValue(session(unverified));
    at('00:05');
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(client.get).toHaveBeenCalledTimes(1);
    at('00:11');
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(client.get).toHaveBeenCalledTimes(2);
    // The ten seconds start again from that read
    at('00:15');
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it('lifts the lock once another tab has verified the address', async () => {
    await signedIn(unverified);
    client.get.mockResolvedValueOnce(session(sam));
    at('00:30');
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    await waitFor(() => expect(auth.user.emailVerified).toBe(true));
  });

  it('doesn’t read while the tab is hidden', async () => {
    await signedIn(unverified);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    at('01:00');
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('never re-reads for a verified account', async () => {
    await signedIn(sam);
    at('05:00');
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(client.get).toHaveBeenCalledTimes(1);
  });
});

describe('AuthProvider: logging out', () => {
  it('clears the state only once the server has answered, then goes home', async () => {
    await signedIn();
    const answer = deferred();
    client.post.mockReturnValueOnce(answer.promise);
    let out;
    act(() => {
      out = auth.logout();
    });
    expect(auth.user).toEqual(sam);
    await act(async () => {
      answer.resolve({});
      await out;
    });
    expect(client.post).toHaveBeenCalledWith('/api/auth/sign-out', {}, true);
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('isLoggedIn')).toBeNull();
    await waitFor(() => expect(path).toBe('/'));
  });

  it('stays signed in, and says so, when logging out fails', async () => {
    await signedIn();
    client.post.mockRejectedValueOnce(httpError(500));
    const result = await run(() => auth.logout());
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/still logged in/);
    expect(auth.user).toEqual(sam);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('counts a 401 as already logged out', async () => {
    await signedIn();
    client.post.mockRejectedValueOnce(httpError(401));
    expect(await run(() => auth.logout())).toEqual({ ok: true });
    expect(auth.user).toBeNull();
  });

  it('empties the panel cache whenever the account changes: signing in, and signing out', async () => {
    await signedIn();
    expect(clearPanelCache).toHaveBeenCalledTimes(1);
    client.post.mockResolvedValueOnce({});
    await run(() => auth.logout());
    expect(clearPanelCache).toHaveBeenCalledTimes(2);
  });

  it('keeps the panel cache when nobody signs in or out', async () => {
    await renderAuth();
    expect(clearPanelCache).not.toHaveBeenCalled();
  });

  it('keeps the panel cache when the same account is read again', async () => {
    await signedIn();
    client.get.mockResolvedValueOnce(session({ ...sam, name: 'Sam again' }));
    await run(() => auth.refresh({ silent: true }));
    expect(clearPanelCache).toHaveBeenCalledTimes(1);
  });
});

describe('AuthProvider: account actions', () => {
  it('signs in, then reads the session', async () => {
    await renderAuth();
    client.post.mockResolvedValueOnce({});
    client.get.mockResolvedValueOnce(session(sam));
    expect(await run(() => auth.login('sam@example.com', 'secret12', false))).toEqual({ ok: true, user: sam });
    expect(client.post).toHaveBeenCalledWith('/api/auth/sign-in/email', { email: 'sam@example.com', password: 'secret12', rememberMe: false }, true);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('remembers the sign-in by default', async () => {
    await renderAuth();
    client.post.mockResolvedValueOnce({});
    client.get.mockResolvedValueOnce(session(sam));
    await run(() => auth.login('sam@example.com', 'secret12'));
    expect(client.post.mock.calls[0][1].rememberMe).toBe(true);
  });

  it('says why signing in failed', async () => {
    await renderAuth();
    client.post.mockRejectedValueOnce(httpError(401, 'Invalid email or password'));
    expect(await run(() => auth.login('sam@example.com', 'wrong'))).toEqual({ ok: false, error: 'Invalid email or password' });
    expect(auth.user).toBeNull();
    expect(auth.loading).toBe(false);
  });

  it('signs up with the name, and a promo code or invite token only when given', async () => {
    await renderAuth();
    client.post.mockResolvedValue({});
    client.get.mockResolvedValue(session(sam));
    await run(() => auth.register({ email: 'sam@example.com', password: 'secret12', username: 'Sam' }));
    await run(() => auth.register({ email: 'sam@example.com', password: 'secret12', username: 'Sam', promoCode: 'SAMTRAVELS', inviteToken: 'tok' }));
    expect(client.post.mock.calls[0]).toEqual(['/api/auth/sign-up/email', { email: 'sam@example.com', password: 'secret12', name: 'Sam' }, true]);
    expect(client.post.mock.calls[1][1]).toEqual({ email: 'sam@example.com', password: 'secret12', name: 'Sam', promoCode: 'SAMTRAVELS', inviteToken: 'tok' });
    expect(auth.user).toEqual(sam);
  });

  it('says why signing up failed', async () => {
    await renderAuth();
    client.post.mockRejectedValueOnce(httpError(400, "That code isn't valid."));
    expect(await run(() => auth.register({ email: 'a@b.co', password: 'x', username: 'A' }))).toEqual({ ok: false, error: "That code isn't valid." });
  });

  it('resets a password without the session cookie', async () => {
    await renderAuth();
    client.post.mockResolvedValueOnce({});
    expect(await run(() => auth.resetPassword({ token: 't1', password: 'newpass12' }))).toEqual({ ok: true });
    expect(client.post).toHaveBeenCalledWith('/api/auth/reset-password', { token: 't1', newPassword: 'newpass12' }, false);
  });

  it('verifies an email address, then reads the session quietly', async () => {
    await renderAuth();
    client.get.mockResolvedValueOnce({}).mockResolvedValueOnce(session(sam));
    expect(await run(() => auth.verifyEmail('a b'))).toEqual({ ok: true, signedIn: true });
    expect(client.get.mock.calls[0]).toEqual(['/api/auth/verify-email?token=a%20b', true]);
    expect(auth.user).toEqual(sam);
  });

  it('says when verifying failed', async () => {
    await renderAuth();
    client.get.mockRejectedValueOnce(httpError(400, 'Invalid token'));
    expect(await run(() => auth.verifyEmail('bad'))).toEqual({ ok: false, error: 'Invalid token' });
  });

  it('sends the verification email to the signed-in address', async () => {
    await signedIn();
    client.post.mockResolvedValueOnce({});
    expect(await run(() => auth.resendVerificationEmail())).toEqual({ ok: true });
    expect(client.post).toHaveBeenCalledWith('/api/auth/send-verification-email', { email: 'sam@example.com' }, true);
  });

  it('changes the email address and the password', async () => {
    await signedIn();
    client.post.mockResolvedValue({});
    await run(() => auth.changeEmail({ newEmail: 'new@example.com' }));
    await run(() => auth.changePassword({ currentPassword: 'old', newPassword: 'newpass12' }));
    expect(client.post.mock.calls[0]).toEqual(['/api/auth/change-email', { newEmail: 'new@example.com' }, true]);
    expect(client.post.mock.calls[1]).toEqual(['/api/auth/change-password', { currentPassword: 'old', newPassword: 'newpass12', revokeOtherSessions: false }, true]);
  });

  it('says why changing the password failed', async () => {
    await signedIn();
    client.post.mockRejectedValueOnce(httpError(400, 'Invalid password'));
    expect(await run(() => auth.changePassword({ currentPassword: 'x', newPassword: 'y' }))).toEqual({ ok: false, error: 'Invalid password' });
  });

  it('updates the name and reads the session again', async () => {
    await signedIn();
    client.post.mockResolvedValueOnce({});
    client.get.mockResolvedValueOnce(session({ ...sam, name: 'Samantha' }));
    await run(() => auth.updateName('Samantha'));
    expect(client.post).toHaveBeenCalledWith('/api/auth/update-user', { name: 'Samantha' }, true);
    expect(auth.user.name).toBe('Samantha');
  });

  it('uploads a new avatar, then saves its key', async () => {
    await signedIn();
    presignAndUpload.mockResolvedValueOnce({ key: 'avatars/u1/a.webp' });
    client.post.mockResolvedValueOnce({});
    client.get.mockResolvedValueOnce(session(sam));
    const file = new File(['x'], 'me.png', { type: 'image/png' });
    expect(await run(() => auth.updateAvatar(file))).toEqual({ ok: true });
    expect(presignAndUpload).toHaveBeenCalledWith({ resource: 'avatar', file, filename: 'me.png' });
    expect(client.post).toHaveBeenCalledWith('/api/users/user/upload-or-change-avatar', { key: 'avatars/u1/a.webp' }, true);
  });

  it('says when the avatar couldn’t be uploaded', async () => {
    await signedIn();
    presignAndUpload.mockRejectedValueOnce(new Error('too big'));
    expect(await run(() => auth.updateAvatar(new File(['x'], 'me.png')))).toEqual({ ok: false, error: 'Unable to update your avatar.' });
  });

  it('removes the avatar', async () => {
    await signedIn();
    client.delete.mockResolvedValueOnce({});
    client.get.mockResolvedValueOnce(session(sam));
    expect(await run(() => auth.removeAvatar())).toEqual({ ok: true });
    expect(client.delete).toHaveBeenCalledWith('/api/users/user/remove-avatar', true);
  });

  it('signs out the other devices', async () => {
    await signedIn();
    client.post.mockResolvedValueOnce({});
    expect(await run(() => auth.revokeOtherSessions())).toEqual({ ok: true });
    expect(client.post).toHaveBeenCalledWith('/api/auth/revoke-other-sessions', {}, true);
  });

  it('deletes the account with its password, then goes home signed out', async () => {
    await signedIn();
    client.post.mockResolvedValueOnce({});
    expect(await run(() => auth.deleteAccount('secret12'))).toEqual({ ok: true });
    expect(client.post).toHaveBeenCalledWith('/api/auth/delete-user', { password: 'secret12' }, true);
    expect(auth.user).toBeNull();
    expect(localStorage.getItem('isLoggedIn')).toBeNull();
    await waitFor(() => expect(path).toBe('/'));
  });

  it('keeps the account when deleting it fails', async () => {
    await signedIn();
    client.post.mockRejectedValueOnce(httpError(400, 'Invalid password'));
    expect(await run(() => auth.deleteAccount('wrong'))).toEqual({ ok: false, error: 'Invalid password' });
    expect(auth.user).toEqual(sam);
  });
});
