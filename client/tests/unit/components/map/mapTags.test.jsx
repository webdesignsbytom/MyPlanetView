import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JoinedMapNote from '@/components/map/JoinedMapNote';
import VerifyEmailBanner from '@/components/map/VerifyEmailBanner';
import MapPlanBanner from '@/components/map/MapPlanBanner';
import { formatDay } from '@/utils/functions/dates';
import { authValue, withProviders } from './helpers';

// The luggage tags at the top left of the map

describe('JoinedMapNote', () => {
  const joined = { post: { joinedByInvite: true } };

  it('welcomes someone who signed up from an invite, as what they are on the map', () => {
    render(withProviders(<JoinedMapNote mapName='The Morgans' role='EDITOR' />, { route: '/maps/m', state: joined }));
    expect(screen.getByLabelText('Welcome').textContent).toContain('Welcome! You’re an editor of “The Morgans”.');
    fireEvent.click(screen.getByLabelText('Hide this note'));
    expect(screen.queryByLabelText('Welcome')).toBeNull();
  });

  it('shows nothing otherwise, or to the owner', () => {
    const { container } = render(withProviders(<JoinedMapNote mapName='M' role='VIEWER' />, { route: '/maps/m' }));
    expect(container.textContent).toBe('');
    const { container: owner } = render(withProviders(<JoinedMapNote mapName='M' role='OWNER' />, { route: '/maps/m', state: joined }));
    expect(owner.textContent).toBe('');
  });

  it('says "a viewer" for a role it doesn’t know', () => {
    render(withProviders(<JoinedMapNote mapName='M' role='SOMETHING' />, { route: '/maps/m', state: joined }));
    expect(screen.getByLabelText('Welcome').textContent).toContain('You’re a viewer of “M”');
  });
});

describe('VerifyEmailBanner', () => {
  const unverified = (overrides) => authValue({ user: { id: 'u', email: 'me@example.com', emailVerified: false }, ...overrides });

  it('shows only while the signed-in address is unverified', () => {
    expect(render(withProviders(<VerifyEmailBanner />, { auth: authValue() })).container.textContent).toBe('');
    expect(render(withProviders(<VerifyEmailBanner />, { auth: authValue({ user: null }) })).container.textContent).toBe('');
    render(withProviders(<VerifyEmailBanner />, { auth: unverified() }));
    expect(screen.getByLabelText('Verify your email').textContent).toContain('We sent a link to me@example.com.');
  });

  it('sends the link again and says it did', async () => {
    const auth = unverified();
    render(withProviders(<VerifyEmailBanner />, { auth }));
    fireEvent.click(screen.getByText('Send the link again'));
    expect(await screen.findByText('Sent. Check your inbox.')).toBeTruthy();
    expect(auth.resendVerificationEmail).toHaveBeenCalled();
  });

  it('says why the link didn’t send', async () => {
    const auth = unverified({ resendVerificationEmail: vi.fn(async () => ({ ok: false })) });
    render(withProviders(<VerifyEmailBanner />, { auth }));
    fireEvent.click(screen.getByText('Send the link again'));
    const said = await screen.findByText('That didn’t send. Try again.');
    expect(said.getAttribute('class')).toContain('text-status-critical');
  });

  it('closes for the rest of the visit', async () => {
    const { unmount } = render(withProviders(<VerifyEmailBanner />, { auth: unverified() }));
    fireEvent.click(screen.getByLabelText('Hide this reminder'));
    expect(screen.queryByLabelText('Verify your email')).toBeNull();
    expect(sessionStorage.getItem('mpv:verifyReminderClosed')).toBe('1');
    unmount();
    render(withProviders(<VerifyEmailBanner />, { auth: unverified() }));
    await waitFor(() => expect(screen.queryByLabelText('Verify your email')).toBeNull());
  });
});

describe('MapPlanBanner', () => {
  it('shows nothing for a map in good standing', () => {
    expect(render(<MapPlanBanner locked={false} inGrace={false} isOwner />).container.textContent).toBe('');
    // The grace note is the owner's alone
    expect(render(<MapPlanBanner inGrace graceUntil='2027-01-01' isOwner={false} />).container.textContent).toBe('');
  });

  it('tells the owner of a locked map they can pay for it', () => {
    const onPay = vi.fn();
    render(<MapPlanBanner locked isOwner onPay={onPay} />);
    expect(screen.getByLabelText('This map isn’t paid for').textContent).toContain('Pay for it as an extra map');
    fireEvent.click(screen.getByText('Pay for this map'));
    expect(onPay).toHaveBeenCalled();
  });

  it('tells an editor who can pay, with no button', () => {
    render(<MapPlanBanner locked isOwner={false} onPay={() => {}} />);
    expect(screen.getByLabelText('This map isn’t paid for').textContent).toContain('Its owner can pay for it');
    expect(screen.queryByText('Pay for this map')).toBeNull();
  });

  it('gives the owner of a handed-over map its grace date', () => {
    render(<MapPlanBanner inGrace graceUntil='2027-01-15' isOwner />);
    expect(screen.getByLabelText('A map handed to you').textContent).toContain(`until ${formatDay('2027-01-15')}`);
  });
});
