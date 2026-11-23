import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import InviteAcceptPage from '@/pages/invite/InviteAcceptPage';
import { acceptInvite, getInvite } from '@/api/travelApi';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { INVITE_PAGE_URL } from '@/utils/constants/routes';
import { authValue, elsewhere, headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ acceptInvite: vi.fn(), getInvite: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));

const AT = '/invite/tok-1';
const open = (auth = authValue()) => renderPage(<InviteAcceptPage />, { path: INVITE_PAGE_URL, at: AT, auth });
const status = (code) => Object.assign(new Error(String(code)), { response: { status: code } });

const invite = (over = {}) => ({ email: 'gigie@example.com', invitedBy: 'Tom', role: 'CO_OWNER', kind: 'map', name: 'Tom & Gigie’s travels', id: 'map-9', travellerName: 'Gigie', ...over });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('InviteAcceptPage', () => {
  it('has one main, labelled by its h1', () => {
    getInvite.mockReturnValue(new Promise(() => {}));
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('invite-heading');
    expect(headings()).toEqual(['You’ve been invited']);
  });

  it('while the session is read, shows a loading state and asks nothing', () => {
    open(authValue({ loading: true }));
    expect(document.querySelector('main [role="status"]').textContent).toContain('Accepting the invite…');
    expect(getInvite).not.toHaveBeenCalled();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it('signed out: says what the invite is for, then sign up carries it along', async () => {
    getInvite.mockResolvedValue({ invite: invite({ offer: { plan: 'PREMIUM', planName: 'First Class' } }) });
    open();
    expect(await screen.findByText('Tom invited you to be a co-owner of the map “Tom & Gigie’s travels”, as Gigie.')).toBeTruthy();
    expect(getInvite).toHaveBeenCalledWith('tok-1');
    expect(document.querySelector('[data-testid="invite-offer"]').textContent).toContain('First Class at half price');
    expect(document.querySelector('main').textContent).toContain('Create a free account with gigie@example.com');
    fireEvent.click(screen.getByText('Create an account'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/sign-up');
    const state = JSON.parse(elsewhere().textContent);
    expect(state).toEqual({ from: AT, invite: { token: 'tok-1', email: 'gigie@example.com', name: 'Gigie', kind: 'map', id: 'map-9' } });
  });

  it('signed out: sign in comes back here', async () => {
    getInvite.mockResolvedValue({ invite: invite() });
    open();
    fireEvent.click(await screen.findByText('Sign in'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/login');
    expect(elsewhere().getAttribute('data-from')).toBe(AT);
  });

  it('signed out with a used or unknown invite: says so, and still offers both', async () => {
    getInvite.mockRejectedValue(status(404));
    open();
    expect(await screen.findByText(/This invite has expired or has already been used\. If you’ve already joined, sign in\./)).toBeTruthy();
    expect(screen.getByText('Create an account')).toBeTruthy();
    expect(document.querySelector('main').textContent).toContain('Sign in to see what’s been shared with you.');
  });

  it('signed in: accepts it once and opens the map or the trip', async () => {
    acceptInvite.mockResolvedValue({ resource: 'map', id: 'map-9' });
    const first = open(signedIn());
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/maps/map-9'));
    expect(acceptInvite).toHaveBeenCalledTimes(1);
    expect(acceptInvite).toHaveBeenCalledWith('tok-1');
    expect(forgetMapLists).toHaveBeenCalled();
    expect(getInvite).not.toHaveBeenCalled();
    first.unmount();
    acceptInvite.mockResolvedValue({ resource: 'trip', id: 'trip-3' });
    open(signedIn());
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/trips/trip-3'));
  });

  it('signed in: explains a refusal', async () => {
    acceptInvite.mockRejectedValue(status(403));
    const first = open(signedIn());
    expect(await screen.findByText(/This invite was sent to a different email address/)).toBeTruthy();
    expect(document.querySelector('main [role="status"]')).toBeNull();
    first.unmount();
    acceptInvite.mockRejectedValue(status(400));
    const second = open(signedIn());
    expect(await screen.findByText(/This invite has expired or has already been used\. Ask the person/)).toBeTruthy();
    second.unmount();
    acceptInvite.mockRejectedValue(Object.assign(status(500), { friendlyMessage: 'Server trouble.' }));
    open(signedIn());
    expect(await screen.findByText('Server trouble.')).toBeTruthy();
  });
});
