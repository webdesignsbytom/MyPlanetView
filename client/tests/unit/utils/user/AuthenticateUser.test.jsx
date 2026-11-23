import React from 'react';
import { describe, expect, it } from 'vitest';
import { AuthenticateAdmin, AuthenticateDeveloper, AuthenticateUser } from '@/utils/user/AuthenticateUser';
import { HOME_PAGE_URL, LOGIN_PAGE_URL } from '@/utils/constants/routes';
import { authValue, elsewhere, renderPage, signedIn } from '../../pages/renderPage';

const Secret = () => <p data-secret>The secret page</p>;
const secret = () => document.querySelector('[data-secret]');

const guard = (Guard, { auth, at = '/account?billing=success#plan', props = {} } = {}) =>
  renderPage(
    <Guard {...props}>
      <Secret />
    </Guard>,
    { path: at.split(/[?#]/)[0], at, auth },
  );

describe('AuthenticateUser', () => {
  it('shows a spinner, not the page, while the session is still being read', () => {
    guard(AuthenticateUser, { auth: authValue({ loading: true }) });
    expect(secret()).toBeNull();
    const status = document.querySelector('[role="status"]');
    expect(status.textContent).toContain('Loading…');
    expect(elsewhere()).toBeNull();
  });

  it('sends a signed-out visitor to sign in, carrying the whole address back', () => {
    guard(AuthenticateUser, { auth: authValue() });
    expect(secret()).toBeNull();
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(LOGIN_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe('/account?billing=success#plan');
  });

  it('counts a session with no user as signed out', () => {
    guard(AuthenticateUser, { auth: authValue({ isAuthenticated: true, user: null }) });
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(LOGIN_PAGE_URL);
  });

  it('goes to its own redirect path when given one', () => {
    guard(AuthenticateUser, { auth: authValue(), props: { redirectPath: '/sign-up' } });
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/sign-up');
    expect(elsewhere().getAttribute('data-from')).toBe('/account?billing=success#plan');
  });

  it('shows the page to anyone signed in, whatever their role', () => {
    guard(AuthenticateUser, { auth: signedIn() });
    expect(secret().textContent).toBe('The secret page');
    expect(elsewhere()).toBeNull();
  });
});

describe('AuthenticateAdmin', () => {
  const at = '/admin/users?page=2';

  it('waits for the session with a spinner', () => {
    guard(AuthenticateAdmin, { at, auth: authValue({ loading: true }) });
    expect(secret()).toBeNull();
    expect(document.querySelector('[role="status"]')).toBeTruthy();
  });

  it('sends a signed-out visitor to sign in with state.from', () => {
    guard(AuthenticateAdmin, { at, auth: authValue() });
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(LOGIN_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe(at);
  });

  it('sends an ordinary user home, with no way back', () => {
    guard(AuthenticateAdmin, { at, auth: signedIn({ role: 'USER' }) });
    expect(secret()).toBeNull();
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(HOME_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe('');
  });

  it('lets admins and developers in', () => {
    guard(AuthenticateAdmin, { at, auth: signedIn({ role: 'ADMIN' }) });
    expect(secret()).toBeTruthy();
  });

  it('lets a developer in too', () => {
    guard(AuthenticateAdmin, { at, auth: signedIn({ role: 'DEVELOPER' }) });
    expect(secret()).toBeTruthy();
  });

  it('a user with no role at all is sent away', () => {
    guard(AuthenticateAdmin, { at, auth: signedIn({ role: undefined }) });
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(HOME_PAGE_URL);
  });
});

describe('AuthenticateDeveloper', () => {
  const at = '/admin/events';

  it('waits for the session with a spinner', () => {
    guard(AuthenticateDeveloper, { at, auth: authValue({ loading: true }) });
    expect(document.querySelector('[role="status"]')).toBeTruthy();
    expect(secret()).toBeNull();
  });

  it('sends a signed-out visitor to sign in with state.from', () => {
    guard(AuthenticateDeveloper, { at, auth: authValue() });
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(LOGIN_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe(at);
  });

  it('sends an admin who is not a developer home', () => {
    guard(AuthenticateDeveloper, { at, auth: signedIn({ role: 'ADMIN' }) });
    expect(secret()).toBeNull();
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(HOME_PAGE_URL);
  });

  it('goes to its own redirect path when given one', () => {
    guard(AuthenticateDeveloper, { at, auth: signedIn(), props: { redirectPath: '/account' } });
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/account');
  });

  it('lets a developer in', () => {
    guard(AuthenticateDeveloper, { at, auth: signedIn({ role: 'DEVELOPER' }) });
    expect(secret()).toBeTruthy();
  });
});
