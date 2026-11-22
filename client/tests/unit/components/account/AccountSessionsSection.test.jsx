import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountSessionsSection from '@/components/account/AccountSessionsSection';
import { AuthContext } from '@/auth/AuthContext';

const open = (auth = {}) => {
  const value = { revokeOtherSessions: vi.fn(), logout: vi.fn(), ...auth };
  render(
    <AuthContext.Provider value={value}>
      <AccountSessionsSection />
    </AuthContext.Provider>,
  );
  return value;
};

describe('AccountSessionsSection', () => {
  it('signs out every other device and says so', async () => {
    let finish;
    const auth = open({ revokeOtherSessions: vi.fn(() => new Promise((resolve) => (finish = resolve))) });
    const button = screen.getByText('Sign out other devices');
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    finish({ ok: true });
    expect(await screen.findByText("You've been signed out everywhere else.")).toBeTruthy();
    expect(auth.revokeOtherSessions).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Sign out other devices').disabled).toBe(false);
  });

  it('says why the other devices couldn’t be signed out', async () => {
    open({ revokeOtherSessions: vi.fn().mockResolvedValue({ ok: false, error: 'Server error.' }) });
    fireEvent.click(screen.getByText('Sign out other devices'));
    expect((await screen.findByText('Server error.')).getAttribute('aria-live')).toBe('assertive');
  });

  it('logs out once, and stays "Logging out…" while it leaves the page', async () => {
    const auth = open({ logout: vi.fn().mockResolvedValue({ ok: true }) });
    const button = screen.getByText('Log out');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button.textContent).toBe('Logging out…');
    expect(button.getAttribute('aria-busy')).toBe('true');
    await waitFor(() => expect(auth.logout).toHaveBeenCalledTimes(1));
    expect(button.textContent).toBe('Logging out…');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says they’re still logged in when logging out fails', async () => {
    open({ logout: vi.fn().mockResolvedValue({ ok: false, error: 'You’re still logged in. Try again.' }) });
    fireEvent.click(screen.getByText('Log out'));
    expect(await screen.findByText('You’re still logged in. Try again.')).toBeTruthy();
    const button = screen.getByText('Log out');
    expect(button.getAttribute('aria-busy')).toBe('false');
  });
});
