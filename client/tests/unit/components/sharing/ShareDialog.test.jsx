import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShareDialog from '@/components/sharing/ShareDialog';
import { addMember, cancelInvite, getSharing, removeMember, resetShareLink, transferMap, updateMember, updateSharing } from '@/api/travelApi';
import { useAuth } from '@/auth/AuthContext';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { clearPanelCache, remember } from '@/utils/data/panelCache';

vi.mock('@/api/travelApi', () => ({
  addMember: vi.fn(),
  cancelInvite: vi.fn(),
  getSharing: vi.fn(),
  removeMember: vi.fn(),
  resetShareLink: vi.fn(),
  transferMap: vi.fn(),
  updateMember: vi.fn(),
  updateSharing: vi.fn(),
}));
vi.mock('@/auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));
// A map's slideshows are their own test's (MapShowsSection.test.jsx): here, where they show
vi.mock('@/components/shows/MapShowsSection', () => ({
  default: ({ mapId, locked }) => <section data-test-shows={mapId} data-locked={String(locked)} />,
}));

const SHARING = {
  owner: { name: 'Charlie', email: 'charlie@example.com' },
  members: [
    { userId: 'u2', name: 'Jo', email: 'jo@example.com', role: 'EDITOR' },
    { userId: 'u3', name: 'Alex', email: 'alex@example.com', role: 'CO_OWNER', travellerName: 'Alex' },
  ],
  invites: [{ id: 'i1', email: 'new@example.com', role: 'VIEWER', expiresAt: '2026-12-01' }],
  linkAccess: 'RESTRICTED',
  shareUrl: 'https://example.com/shared/ABCD',
  shareCode: 'ABCD-EFGH-JKMN',
};
const TRAVELLERS = [
  { id: 'tr1', name: 'Charlie', userId: 'u1' },
  { id: 'tr2', name: 'Alex', userId: 'u3' },
  { id: 'tr3', name: 'Mia' },
];

beforeEach(() => {
  vi.clearAllMocks();
  clearPanelCache();
  useAuth.mockReturnValue({ user: { id: 'u1', emailVerified: true } });
  getSharing.mockResolvedValue(SHARING);
});

const open = (props = {}) => {
  const handlers = { onLeft: vi.fn(), onTransferred: vi.fn(), onClose: vi.fn() };
  render(
    <ShareDialog resource='maps' id='m1' name='Our map' role='OWNER' travellers={TRAVELLERS} currentUserId='u1' {...handlers} {...props} />,
    { wrapper: MemoryRouter },
  );
  return handlers;
};
const loaded = () => screen.findByText('People with access');
// "General access" also names its section
const generalAccess = () => document.getElementById('general-access');
// The dialog opened over the share dialog
const topDialog = () => [...document.querySelectorAll('[role="dialog"]')].pop();

describe('ShareDialog', () => {
  it('loads the sharing settings and lists who has access', async () => {
    open();
    expect(screen.getByText('Share “Our map”')).toBeTruthy();
    expect(screen.getByText('Loading sharing settings…')).toBeTruthy();
    await loaded();
    expect(getSharing).toHaveBeenCalledWith('maps', 'm1');
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByLabelText('Role for Jo').value).toBe('EDITOR');
    expect(screen.getByText('Traveller: Alex')).toBeTruthy();
    expect(screen.getByText(/Invited as viewer/)).toBeTruthy();
    expect(generalAccess().value).toBe('RESTRICTED');
  });

  it('a map’s "On your website" asks for link access first, then gives the code (23 Nov 2026)', async () => {
    open();
    await loaded();
    expect(screen.getByText('On your website')).toBeTruthy();
    expect(screen.getByText(/Choose “Anyone with the link” above/)).toBeTruthy();
  });

  it('a map shared by link gives the code for a website; a trip has none', async () => {
    getSharing.mockResolvedValue({ ...SHARING, linkAccess: 'ANYONE_WITH_LINK' });
    open();
    await loaded();
    expect(screen.getByLabelText('Code for your website').value).toContain('/embed/ABCD-EFGH-JKMN');
  });

  it('a trip’s dialog has no "On your website"', async () => {
    getSharing.mockResolvedValue({ ...SHARING, linkAccess: 'ANYONE_WITH_LINK' });
    open({ resource: 'trips', id: 't1', name: 'Rome' });
    await loaded();
    expect(screen.queryByText('On your website')).toBeNull();
  });

  it('shows the settings it already has at once', () => {
    remember('sharing:maps:m1', SHARING);
    getSharing.mockReturnValue(new Promise(() => {}));
    open();
    expect(screen.getByText('People with access')).toBeTruthy();
  });

  it('says why the settings couldn’t be loaded', async () => {
    getSharing.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    open();
    expect(await screen.findByText('Offline.')).toBeTruthy();
  });

  it('offers a map’s roles with Co-owner, asking which of the free travellers', async () => {
    open();
    await loaded();
    const role = screen.getByLabelText('Role');
    expect([...role.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Viewer', 'Editor', 'Co-owner']);
    fireEvent.change(role, { target: { value: 'CO_OWNER' } });
    // Charlie and Alex have logins: only Mia is free
    const traveller = screen.getByLabelText('Which traveller is this?');
    expect([...traveller.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Mia']);
  });

  it('offers a trip only viewers and editors', async () => {
    open({ resource: 'trips' });
    await loaded();
    expect([...screen.getByLabelText('Role').querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Viewer', 'Editor']);
    expect(screen.queryByText('Make owner')).toBeNull();
  });

  it('adds someone, says so and reads the settings again', async () => {
    addMember.mockResolvedValue({});
    open();
    await loaded();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'EDITOR' } });
    fireEvent.click(screen.getByText('Share'));
    expect(await screen.findByText('Shared with sam@example.com. They’ve been emailed.')).toBeTruthy();
    expect(addMember).toHaveBeenCalledWith('maps', 'm1', { email: 'sam@example.com', role: 'EDITOR' });
    expect(getSharing).toHaveBeenCalledTimes(2);
  });

  it('shows the plan’s cap as the error', async () => {
    addMember.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'This map has 5 editors already.' }));
    open();
    await loaded();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'sam@example.com' } });
    fireEvent.click(screen.getByText('Share'));
    expect(await screen.findByText('This map has 5 editors already.')).toBeTruthy();
  });

  it('changes a member’s role and the link access', async () => {
    updateMember.mockResolvedValue({});
    updateSharing.mockResolvedValue({});
    open();
    await loaded();
    fireEvent.change(screen.getByLabelText('Role for Jo'), { target: { value: 'VIEWER' } });
    await waitFor(() => expect(updateMember).toHaveBeenCalledWith('maps', 'm1', 'u2', 'VIEWER'));
    await waitFor(() => expect(generalAccess().disabled).toBe(false));
    fireEvent.change(generalAccess(), { target: { value: 'ANYONE_WITH_LINK' } });
    await waitFor(() => expect(updateSharing).toHaveBeenCalledWith('maps', 'm1', 'ANYONE_WITH_LINK'));
  });

  it('asks before removing a member or cancelling an invite', async () => {
    removeMember.mockResolvedValue({});
    cancelInvite.mockResolvedValue({});
    open();
    await loaded();
    fireEvent.click(screen.getByLabelText('Remove Jo'));
    expect(screen.getByText('Remove Jo?')).toBeTruthy();
    fireEvent.click(screen.getByText('Remove'));
    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('maps', 'm1', 'u2'));
    await waitFor(() => expect(screen.queryByText('Remove Jo?')).toBeNull());
    fireEvent.click(screen.getByLabelText('Cancel the invite to new@example.com'));
    fireEvent.click(within(topDialog()).getByText('Cancel the invite', { selector: 'button, button *' }));
    await waitFor(() => expect(cancelInvite).toHaveBeenCalledWith('maps', 'm1', 'i1'));
  });

  it('makes a member the owner, forgetting the map lists', async () => {
    const map = { id: 'm1', name: 'Our map' };
    transferMap.mockResolvedValue({ map });
    const { onTransferred } = open();
    await loaded();
    fireEvent.click(screen.getByLabelText('Make Jo the owner'));
    expect(screen.getByText('Make Jo the owner?')).toBeTruthy();
    fireEvent.click(within(topDialog()).getByText('Make owner'));
    await waitFor(() => expect(onTransferred).toHaveBeenCalledWith({ stayed: true, map }));
    expect(transferMap).toHaveBeenCalledWith('m1', { userId: 'u2', stayAsEditor: true });
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('lets a co-owner manage, but never change or remove another co-owner, nor hand the map over', async () => {
    open({ role: 'CO_OWNER', currentUserId: 'u9' });
    await loaded();
    expect(screen.getByText('Charlie')).toBeTruthy();
    expect(screen.getByText('charlie@example.com')).toBeTruthy();
    expect(screen.getByLabelText('Role for Alex').disabled).toBe(true);
    expect(screen.queryByLabelText('Remove Alex')).toBeNull();
    expect(screen.getByLabelText('Remove Jo')).toBeTruthy();
    expect(screen.queryByText('Make owner')).toBeNull();
  });

  it('lets a co-owner leave from their own row', async () => {
    removeMember.mockResolvedValue({});
    const { onLeft } = open({ role: 'CO_OWNER', currentUserId: 'u3' });
    await loaded();
    fireEvent.click(screen.getByLabelText('Leave this map'));
    expect(screen.getByText('Leave this map?')).toBeTruthy();
    fireEvent.click(screen.getByText('Leave'));
    await waitFor(() => expect(onLeft).toHaveBeenCalled());
    expect(removeMember).toHaveBeenCalledWith('maps', 'm1', 'u3');
  });

  it('makes a new link after asking', async () => {
    resetShareLink.mockResolvedValue({});
    open();
    await loaded();
    fireEvent.click(screen.getByText('Reset link'));
    fireEvent.click(screen.getByText('Reset link'));
    expect(await screen.findByText('A new link is ready. The old one no longer works.')).toBeTruthy();
    expect(resetShareLink).toHaveBeenCalledWith('maps', 'm1');
  });

  describe('with an unverified email address', () => {
    beforeEach(() => useAuth.mockReturnValue({ user: { id: 'u1', emailVerified: false } }));

    it('locks every change but copying the link, and says why', async () => {
      open();
      await loaded();
      expect(screen.getByText(/need a verified email address/)).toBeTruthy();
      expect(screen.getByText('your account page').closest('a').getAttribute('href')).toBe('/account');
      expect(screen.queryByLabelText('Email address')).toBeNull();
      expect(screen.getByLabelText('Role for Jo').disabled).toBe(true);
      expect(screen.getByLabelText('Remove Jo').disabled).toBe(true);
      expect(generalAccess().disabled).toBe(true);
      expect(screen.queryByText('Make owner')).toBeNull();
      expect(screen.queryByText('Reset link')).toBeNull();
      expect(screen.getByText('Copy link').closest('button').disabled).toBe(false);
    });

    it('tells a viewer that leaving needs it too', () => {
      open({ role: 'VIEWER', currentUserId: 'u5' });
      expect(screen.getByText(/Leaving it needs a verified email address/)).toBeTruthy();
      expect(screen.queryByText('Remove me from this map')).toBeNull();
    });
  });

  it('tells an editor their role, letting them leave, and loads nothing', async () => {
    removeMember.mockResolvedValue({});
    const { onLeft } = open({ role: 'EDITOR', currentUserId: 'u2' });
    expect(screen.getByText(/You’re an editor on this map\. Only its owner and co-owners can change who has access\./)).toBeTruthy();
    expect(getSharing).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Remove me from this map'));
    await waitFor(() => expect(onLeft).toHaveBeenCalled());
    expect(removeMember).toHaveBeenCalledWith('maps', 'm1', 'u2');
  });

  it('tells a trip’s viewer only its owner manages it', () => {
    open({ resource: 'trips', role: 'VIEWER', currentUserId: 'u5' });
    expect(screen.getByText(/You’re a viewer on this trip\. Only its owner can change who has access\./)).toBeTruthy();
    expect(screen.getByText('Remove me from this trip')).toBeTruthy();
  });

  it('closes with Done', () => {
    const { onClose } = open({ role: 'VIEWER' });
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });
});

// A map's slideshows of chosen photos, each with its own link (25 Nov 2026): its editors'
describe('ShareDialog: the map’s slideshows', () => {
  const shows = () => document.querySelector('[data-test-shows]');

  it('lists them for the owner and an editor of a map, locked until the email is verified', async () => {
    open();
    await loaded();
    expect(shows().getAttribute('data-test-shows')).toBe('m1');
    expect(shows().getAttribute('data-locked')).toBe('false');
  });

  it('lists them for an editor, who can’t change who has access', () => {
    useAuth.mockReturnValue({ user: { id: 'u2', emailVerified: false } });
    open({ role: 'EDITOR', currentUserId: 'u2' });
    expect(shows().getAttribute('data-locked')).toBe('true');
  });

  it('not for a viewer, nor on a trip', async () => {
    const { unmount } = render(<ShareDialog resource='maps' id='m1' name='Our map' role='VIEWER' currentUserId='u1' onClose={() => {}} />, { wrapper: MemoryRouter });
    expect(shows()).toBeNull();
    unmount();
    render(<ShareDialog resource='trips' id='t1' name='Lisbon' role='OWNER' currentUserId='u1' onClose={() => {}} />, { wrapper: MemoryRouter });
    await loaded();
    expect(shows()).toBeNull();
  });
});
