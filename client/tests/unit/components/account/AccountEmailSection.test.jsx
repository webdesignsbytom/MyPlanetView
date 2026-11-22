import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountEmailSection from '@/components/account/AccountEmailSection';
import { AuthContext } from '@/auth/AuthContext';

const open = (user, auth = {}) => {
  const value = { user, resendVerificationEmail: vi.fn(), changeEmail: vi.fn(), ...auth };
  render(
    <AuthContext.Provider value={value}>
      <AccountEmailSection />
    </AuthContext.Provider>,
  );
  return value;
};

describe('AccountEmailSection', () => {
  it('says a verified address is verified, with no resend button', () => {
    open({ email: 'sam@example.com', emailVerified: true });
    expect(screen.getByText('Your email address is verified.')).toBeTruthy();
    expect(screen.queryByText('Resend verification email')).toBeNull();
    // The change-email form is underneath
    expect(screen.getByText('sam@example.com')).toBeTruthy();
    expect(screen.getByLabelText(/New email address/)).toBeTruthy();
  });

  it('sends the verification email again and says where', async () => {
    const auth = open({ email: 'sam@example.com', emailVerified: false }, { resendVerificationEmail: vi.fn().mockResolvedValue({ ok: true }) });
    expect(screen.getByText(/isn't verified yet/)).toBeTruthy();
    fireEvent.click(screen.getByText('Resend verification email'));
    const alert = await screen.findByText('Verification email sent to sam@example.com.');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.getAttribute('aria-live')).toBe('polite');
    expect(auth.resendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('says why when the email couldn’t be sent', async () => {
    open(
      { email: 'sam@example.com', emailVerified: false },
      { resendVerificationEmail: vi.fn().mockResolvedValue({ ok: false, error: 'Too many emails. Try later.' }) },
    );
    fireEvent.click(screen.getByText('Resend verification email'));
    const alert = await screen.findByText('Too many emails. Try later.');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
  });

  it('locks the button while sending', async () => {
    let finish;
    open(
      { email: 'sam@example.com', emailVerified: false },
      { resendVerificationEmail: vi.fn(() => new Promise((resolve) => (finish = resolve))) },
    );
    const button = screen.getByText('Resend verification email');
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Loading...');
    finish({ ok: true });
    await waitFor(() => expect(button.disabled).toBe(false));
  });
});
