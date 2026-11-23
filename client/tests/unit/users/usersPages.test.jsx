import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { authValue, elsewhere, headings, onlyMain, renderPage } from '../pages/renderPage';
import { FORGOT_PASS_PAGE_URL, LOGIN_PAGE_URL, RESET_PASS_PAGE_URL, SIGN_UP_PAGE_URL, VERIFY_EMAIL_PAGE_URL } from '@/utils/constants/routes';
import LoginPage from '@/users/login/LoginPage';
import RegisterPage from '@/users/register/RegisterPage';
import ForgettenPasswordPage from '@/users/password/ForgettenPasswordPage';
import ResetLostPasswordPage from '@/users/password/ResetLostPasswordPage';
import VerifyEmailPage from '@/users/verify/VerifyEmailPage';

// The sign-in pages (src/users/): each a boarding-pass ticket with one <main> named by its
// heading, and its form inside. The forms themselves are tested in components/forms.
describe('the sign-in pages', () => {
  const pages = [
    ['/login', LoginPage, LOGIN_PAGE_URL, 'Welcome back', 'Login form'],
    ['/sign-up', RegisterPage, SIGN_UP_PAGE_URL, /^Join /, null],
    ['/forgot-password', ForgettenPasswordPage, FORGOT_PASS_PAGE_URL, 'Forgotten your password?', null],
    ['/reset-password', ResetLostPasswordPage, RESET_PASS_PAGE_URL, 'Choose a new password', null],
  ];

  it.each(pages)('%s has one <main>, named by its h1, with its form', (_, Page, path, title) => {
    const at = path.replace(':userId', 'user-1').replace(':token', 'token-1');
    const { container } = renderPage(<Page />, { path, at });
    const { count, main, id } = onlyMain(container);
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    const [h1] = headings(container);
    if (title instanceof RegExp) expect(h1).toMatch(title);
    else expect(h1).toBe(title);
    expect(document.getElementById(main.getAttribute('aria-labelledby')).tagName).toBe('H1');
    expect(main.querySelector('form')).toBeTruthy();
  });

  it('labels the login form for screen readers', () => {
    renderPage(<LoginPage />, { path: LOGIN_PAGE_URL });
    expect(document.querySelector('section[aria-label="Login form"] form')).toBeTruthy();
  });
});

describe('VerifyEmailPage', () => {
  const PATH = VERIFY_EMAIL_PAGE_URL;
  const linkFor = (search = '') => `${PATH.replace(/:\w+/g, (param) => (param === ':uniqueString' ? 'token-1' : 'user-1'))}${search}`;

  // Going on scrolls to the top (useNavigateToPage), which jsdom doesn't do
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks the link once and says it is verifying meanwhile', async () => {
    let settle;
    const verifyEmail = vi.fn(() => new Promise((resolve) => (settle = resolve)));
    const { container } = renderPage(<VerifyEmailPage />, { path: PATH, at: linkFor(), auth: authValue({ verifyEmail }) });
    expect(headings(container)).toEqual(['Verifying your email address']);
    expect(onlyMain(container).main.getAttribute('aria-busy')).toBe('true');
    await act(async () => settle({ ok: false }));
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith('token-1');
  });

  it('says the email is verified, then goes to the account page when signed in', async () => {
    vi.useFakeTimers();
    const verifyEmail = vi.fn().mockResolvedValue({ ok: true, signedIn: true });
    const { container } = renderPage(<VerifyEmailPage />, { path: PATH, at: linkFor(), auth: authValue({ verifyEmail }) });
    await act(async () => {});
    expect(headings(container)).toEqual(['Email verified']);
    expect(screen.getByText('Your email has been verified successfully.')).toBeTruthy();
    expect(screen.getByText(/Redirecting in 5s/)).toBeTruthy();
    expect(screen.getByText('Go to Account')).toBeTruthy();
    for (let second = 0; second < 5; second += 1) await act(async () => vi.advanceTimersByTime(1000));
    // useNavigateToPage goes 300 ms after it's asked
    await act(async () => vi.advanceTimersByTime(300));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/account');
  });

  it('goes to the login page instead when the verify left them signed out', async () => {
    vi.useFakeTimers();
    const verifyEmail = vi.fn().mockResolvedValue({ ok: true, signedIn: false });
    renderPage(<VerifyEmailPage />, { path: PATH, at: linkFor(), auth: authValue({ verifyEmail }) });
    await act(async () => {});
    expect(screen.getByText('Go to Login')).toBeTruthy();
    for (let second = 0; second < 5; second += 1) await act(async () => vi.advanceTimersByTime(1000));
    // useNavigateToPage goes 300 ms after it's asked
    await act(async () => vi.advanceTimersByTime(300));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/login');
  });

  it('words an email change being confirmed from the old address', async () => {
    const verifyEmail = vi.fn().mockResolvedValue({ ok: true, signedIn: true });
    const { container } = renderPage(<VerifyEmailPage />, { path: PATH, at: linkFor('?change=confirm'), auth: authValue({ verifyEmail }) });
    await waitFor(() => expect(headings(container)).toEqual(['Change confirmed']));
    expect(screen.getByText(/your email changes once you click it/)).toBeTruthy();
  });

  it('says a bad link failed, as an alert, and can try again', async () => {
    const verifyEmail = vi.fn().mockResolvedValue({ ok: false });
    const { container } = renderPage(<VerifyEmailPage />, { path: PATH, at: linkFor(), auth: authValue({ verifyEmail }) });
    await waitFor(() => expect(headings(container)).toEqual(['Email verification failed']));
    const alert = container.querySelector('[role="alert"]');
    expect(alert.textContent).toMatch(/invalid or expired/);
    verifyEmail.mockResolvedValue({ ok: true, signedIn: false });
    fireEvent.click(screen.getByLabelText('Retry email verification'));
    await waitFor(() => expect(headings(container)).toEqual(['Email verified']));
    expect(verifyEmail).toHaveBeenCalledTimes(2);
  });

  it('puts focus on the heading as the state changes, for screen readers', async () => {
    const verifyEmail = vi.fn().mockResolvedValue({ ok: false });
    renderPage(<VerifyEmailPage />, { path: PATH, at: linkFor(), auth: authValue({ verifyEmail }) });
    await waitFor(() => expect(document.activeElement?.id).toBe('verify-email-heading'));
  });
});
