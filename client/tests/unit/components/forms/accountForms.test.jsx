import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginForm from '@/components/forms/LoginForm';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import ResetLostPasswordForm from '@/components/forms/ResetLostPasswordForm';
import ChangeEmailForm from '@/components/forms/ChangeEmailForm';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';
import ContactForm from '@/components/forms/ContactForm';
import { AuthContext } from '@/auth/AuthContext';
import client from '@/api/client';
import { PASSWORD_RULE } from '@/utils/regex/regex';
import { LOGIN_PAGE_URL, MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { RESET_PASSWORD_REQUEST_API, SUBMIT_CONTACT_FORM_API } from '@/utils/constants/apiRoutes';

const navigateToPage = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useNavigateToPage', () => ({ default: () => navigateToPage }));
vi.mock('@/api/client', () => ({ default: { post: vi.fn() } }));

const GOOD = 'Travel1!go';
const byId = (id) => document.getElementById(id);
const type = (id, value) => fireEvent.change(byId(id), { target: { name: byId(id).name || id, value } });
const press = async (el) => {
  await act(async () => {
    fireEvent.click(el);
  });
};
const formAlert = () => document.querySelector('form > [role="alert"]');

beforeEach(() => {
  navigateToPage.mockReset();
  client.post.mockReset();
  // requestAnimationFrame focus calls: after the render, as in a browser
  vi.stubGlobal('requestAnimationFrame', (fn) => setTimeout(fn, 0));
});

describe('LoginForm', () => {
  const open = ({ login = vi.fn().mockResolvedValue({ ok: true }), isAuthenticated = false, from } = {}) => {
    render(
      <AuthContext.Provider value={{ login, isAuthenticated }}>
        <MemoryRouter initialEntries={[{ pathname: LOGIN_PAGE_URL, state: from ? { from } : undefined }]}>
          <Routes>
            <Route path={LOGIN_PAGE_URL} element={<LoginForm />} />
            <Route path={MAP_PAGE_URL} element={<p>Map page</p>} />
            <Route path='/gifts' element={<p>Gifts page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    return { login };
  };

  it('says what each field needs before sending anything', async () => {
    const { login } = open();
    await press(screen.getByText('Sign in'));
    expect(byId('email-error').textContent).toBe('Enter the email address you signed up with.');
    expect(byId('password-error').textContent).toBe('Enter your password.');
    expect(document.activeElement).toBe(byId('email'));
    expect(login).not.toHaveBeenCalled();
    type('email', 'sam@example.com');
    expect(byId('email-error')).toBeNull();
  });

  it('signs in, keeping them logged in if asked, and goes to the map', async () => {
    const { login } = open();
    type('email', 'sam@example.com');
    type('password', 'secret');
    fireEvent.click(screen.getByLabelText('Keep me logged in'));
    await press(screen.getByText('Sign in'));
    expect(login).toHaveBeenCalledWith('sam@example.com', 'secret', true);
    expect(screen.getByText('Map page')).toBeTruthy();
  });

  it('goes back to the guarded page that sent them, and keeps it for sign-up', async () => {
    open({ from: '/gifts' });
    expect(screen.getByText('Sign up now!').getAttribute('href')).toBe(SIGN_UP_PAGE_URL);
    type('email', 'sam@example.com');
    type('password', 'secret');
    await press(screen.getByText('Sign in'));
    expect(screen.getByText('Gifts page')).toBeTruthy();
  });

  it('shows the server’s refusal and focuses the field it names', async () => {
    open({ login: vi.fn().mockResolvedValue({ ok: false, error: 'Invalid email or password' }) });
    type('email', 'sam@example.com');
    type('password', 'wrong');
    await press(screen.getByText('Sign in'));
    expect(formAlert().textContent).toBe('Invalid email or password');
    expect(document.activeElement).toBe(byId('email'));
    expect(byId('password').getAttribute('aria-invalid')).toBe('true');
  });

  it('sends someone already signed in on to the map', () => {
    open({ isAuthenticated: true });
    expect(screen.getByText('Map page')).toBeTruthy();
  });
});

describe('ForgotPasswordForm', () => {
  const open = () =>
    render(
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>,
    );

  it('asks for an address, then a full one, before sending', async () => {
    open();
    await press(screen.getByLabelText('Request a password reset link'));
    expect(byId('email-error').textContent).toBe('Please enter your email address');
    type('email', 'sam@');
    await press(screen.getByLabelText('Request a password reset link'));
    expect(byId('email-error').textContent).toBe('Please enter a full email address, like name@example.com');
    expect(client.post).not.toHaveBeenCalled();
  });

  it('sends the request and gives the same answer whether or not there’s an account', async () => {
    client.post.mockResolvedValue({});
    open();
    type('email', ' sam@example.com ');
    await press(screen.getByLabelText('Request a password reset link'));
    expect(client.post).toHaveBeenCalledWith(RESET_PASSWORD_REQUEST_API, { email: 'sam@example.com' }, false);
    const alert = formAlert();
    expect(alert.textContent).toBe('If an account exists for that email, a reset link has been sent.');
    expect(alert.getAttribute('aria-live')).toBe('polite');
    expect(document.activeElement).toBe(alert);
  });

  it('says why when the request fails', async () => {
    client.post.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many requests.' }));
    open();
    type('email', 'sam@example.com');
    await press(screen.getByLabelText('Request a password reset link'));
    expect(formAlert().textContent).toBe('Too many requests.');
    expect(formAlert().getAttribute('aria-live')).toBe('assertive');
  });
});

describe('ResetLostPasswordForm', () => {
  const open = ({ resetPassword = vi.fn().mockResolvedValue({ ok: true }), path = '/reset-password/u1/tok' } = {}) => {
    render(
      <AuthContext.Provider value={{ resetPassword }}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path='/reset-password/:userId/:token' element={<ResetLostPasswordForm />} />
            <Route path='/reset-password/:userId' element={<ResetLostPasswordForm />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    return { resetPassword };
  };

  it('refuses a weak password with the rule, and passwords that don’t match', async () => {
    const { resetPassword } = open();
    type('password', 'weak');
    await press(screen.getByLabelText('Set new password'));
    expect(formAlert().textContent).toBe(PASSWORD_RULE);
    expect(document.activeElement).toBe(byId('password'));
    type('password', GOOD);
    type('confirmPassword', 'Travel1!gone');
    await press(screen.getByLabelText('Set new password'));
    expect(formAlert().textContent).toBe('Passwords do not match. Please re-enter them.');
    expect(document.activeElement).toBe(byId('confirmPassword'));
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('needs the link’s token', async () => {
    const { resetPassword } = open({ path: '/reset-password/u1' });
    type('password', GOOD);
    type('confirmPassword', GOOD);
    await press(screen.getByLabelText('Set new password'));
    expect(formAlert().textContent).toBe('Invalid or missing reset link parameters.');
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('sets the new password, then counts down to the login page', async () => {
    vi.useFakeTimers();
    try {
      const { resetPassword } = open();
      type('password', GOOD);
      type('confirmPassword', GOOD);
      await press(screen.getByLabelText('Set new password'));
      expect(resetPassword).toHaveBeenCalledWith({ token: 'tok', password: GOOD });
      expect(formAlert().textContent).toBe('Your password has been updated. Redirecting to login… Redirecting in 5s…');
      for (let i = 0; i < 5; i += 1) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
      }
      expect(navigateToPage).toHaveBeenCalledWith(LOGIN_PAGE_URL);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the server’s refusal', async () => {
    open({ resetPassword: vi.fn().mockResolvedValue({ ok: false, error: 'The link has expired.' }) });
    type('password', GOOD);
    type('confirmPassword', GOOD);
    await press(screen.getByLabelText('Set new password'));
    expect(formAlert().textContent).toBe('The link has expired.');
  });

  it('describes each field by its hint and error once', async () => {
    open();
    type('password', 'weak');
    await press(screen.getByLabelText('Set new password'));
    const ids = byId('password').getAttribute('aria-describedby').split(' ');
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('ChangeEmailForm', () => {
  const open = ({ user = { email: 'sam@example.com', emailVerified: true }, changeEmail = vi.fn().mockResolvedValue({ ok: true }) } = {}) => {
    render(
      <AuthContext.Provider value={{ user, changeEmail }}>
        <ChangeEmailForm />
      </AuthContext.Provider>,
    );
    return { changeEmail };
  };

  it('shows the current address and checks the new one', async () => {
    const { changeEmail } = open();
    expect(screen.getByText('sam@example.com')).toBeTruthy();
    await press(screen.getByText('Change email'));
    expect(byId('newEmail-error').textContent).toBe('Enter your new email address.');
    type('newEmail', 'nope');
    await press(screen.getByText('Change email'));
    expect(byId('newEmail-error').textContent).toBe('Enter a valid email address.');
    type('newEmail', 'SAM@example.com');
    await press(screen.getByText('Change email'));
    expect(byId('newEmail-error').textContent).toBe('That is already your email address.');
    expect(changeEmail).not.toHaveBeenCalled();
  });

  it('a verified account confirms from its current address first', async () => {
    const { changeEmail } = open();
    expect(byId('newEmail-hint').textContent).toContain('confirm from your current address first');
    type('newEmail', ' New@Example.com ');
    await press(screen.getByText('Change email'));
    expect(changeEmail).toHaveBeenCalledWith({ newEmail: 'new@example.com' });
    expect(formAlert().textContent).toContain('sent a link to sam@example.com to confirm the change');
    expect(byId('newEmail').value).toBe('');
  });

  it('an unverified account goes straight to the new address', async () => {
    open({ user: { email: 'sam@example.com', emailVerified: false } });
    expect(byId('newEmail-hint').textContent).toBe("We'll send a link to the new address to confirm it.");
    type('newEmail', 'new@example.com');
    await press(screen.getByText('Change email'));
    expect(formAlert().textContent).toBe("If no other account uses new@example.com, we've sent a link to it. Your email changes once you click it.");
  });

  it('shows the server’s refusal', async () => {
    open({ changeEmail: vi.fn().mockResolvedValue({ ok: false, error: 'Try later.' }) });
    type('newEmail', 'new@example.com');
    await press(screen.getByText('Change email'));
    expect(formAlert().textContent).toBe('Try later.');
    await waitFor(() => expect(document.activeElement).toBe(formAlert()));
  });
});

describe('ChangePasswordForm', () => {
  const open = (changePassword = vi.fn().mockResolvedValue({ ok: true })) => {
    render(
      <AuthContext.Provider value={{ changePassword }}>
        <ChangePasswordForm />
      </AuthContext.Provider>,
    );
    return { changePassword };
  };

  it('marks each field that needs something, focusing the first', async () => {
    const { changePassword } = open();
    await press(screen.getByText('Change password'));
    expect(byId('currentPassword-error').textContent).toBe('Enter your current password.');
    expect(byId('newPassword-error').textContent).toBe(PASSWORD_RULE);
    expect(byId('confirmPassword-error')).toBeNull();
    expect(document.activeElement).toBe(byId('currentPassword'));
    type('currentPassword', GOOD);
    type('newPassword', GOOD);
    type('confirmPassword', 'other');
    await press(screen.getByText('Change password'));
    expect(byId('newPassword-error').textContent).toBe('Your new password must be different from your current one.');
    expect(byId('confirmPassword-error').textContent).toBe('Passwords do not match.');
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('changes it, signing out the other devices unless unticked', async () => {
    const { changePassword } = open();
    expect(screen.getByLabelText('Sign out of my other devices').checked).toBe(true);
    fireEvent.click(screen.getByLabelText('Sign out of my other devices'));
    type('currentPassword', 'Old1!pass');
    type('newPassword', GOOD);
    type('confirmPassword', GOOD);
    await press(screen.getByText('Change password'));
    expect(changePassword).toHaveBeenCalledWith({ currentPassword: 'Old1!pass', newPassword: GOOD, revokeOtherSessions: false });
    expect(formAlert().textContent).toBe('Your password has been updated.');
    expect(byId('newPassword').value).toBe('');
  });

  it('shows the server’s refusal', async () => {
    open(vi.fn().mockResolvedValue({ ok: false, error: 'Your current password is wrong.' }));
    type('currentPassword', 'Old1!pass');
    type('newPassword', GOOD);
    type('confirmPassword', GOOD);
    await press(screen.getByText('Change password'));
    expect(formAlert().textContent).toBe('Your current password is wrong.');
  });
});

describe('ContactForm', () => {
  it('says what each field needs and focuses the first', async () => {
    render(<ContactForm />);
    await press(screen.getByText('Send message'));
    expect(byId('name-error').textContent).toBe('Please tell us your name');
    expect(byId('email-error').textContent).toBe('Please add an email address so we can reply');
    expect(byId('message-error').textContent).toBe('Please write a message');
    expect(document.activeElement).toBe(byId('name'));
    type('email', 'sam@');
    await press(screen.getByText('Send message'));
    expect(byId('email-error').textContent).toBe('Please enter a full email address, like name@example.com');
    expect(client.post).not.toHaveBeenCalled();
  });

  it('sends the message, thanks them and empties the form', async () => {
    client.post.mockResolvedValue({});
    render(<ContactForm />);
    type('name', 'Sam');
    type('email', 'sam@example.com');
    type('message', 'Hello there');
    await press(screen.getByText('Send message'));
    expect(client.post).toHaveBeenCalledWith(SUBMIT_CONTACT_FORM_API, { name: 'Sam', email: 'sam@example.com', message: 'Hello there' }, false);
    expect(formAlert().textContent).toBe('Thanks, your message is on its way. We will reply by email.');
    expect(byId('message').value).toBe('');
  });

  it('shows the server’s own words for a 400, else a plain failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    client.post.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 400 }, friendlyMessage: 'That image has expired.' }));
    render(<ContactForm />);
    type('name', 'Sam');
    type('email', 'sam@example.com');
    type('message', 'Hello');
    await press(screen.getByText('Send message'));
    expect(formAlert().textContent).toBe('That image has expired.');
    client.post.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 500 }, friendlyMessage: 'Server broke.' }));
    await press(screen.getByText('Send message'));
    expect(formAlert().textContent).toBe('Your message could not be sent. Please try again.');
  });
});
