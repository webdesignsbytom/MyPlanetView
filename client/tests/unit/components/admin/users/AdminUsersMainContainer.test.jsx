import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminUsersMainContainer from '@/components/admin/users/AdminUsersMainContainer';
import { AuthContext } from '@/auth/AuthContext';
import client from '@/api/client';
import { getPlanGrants } from '@/api/plansApi';

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('@/api/plansApi', () => ({ createPlanGrant: vi.fn(), endPlanGrant: vi.fn(), getPlanGrants: vi.fn() }));

const ADMIN = { id: 'me', name: 'Alex Byrne', email: 'tom@example.com', role: 'ADMIN' };
const DEVELOPER = { ...ADMIN, role: 'DEVELOPER' };
const SAM = { id: 'u1', name: 'Sam Carter', email: 'sam@example.com', role: 'USER', isActive: true, emailVerified: true };
const PRIYA = { id: 'u2', name: 'Priya Nair', email: 'dev@example.com', role: 'DEVELOPER', isActive: true, emailVerified: true };
const ME = { ...ADMIN, isActive: true, emailVerified: true };

const answer = (users, total = users.length) => ({ data: { data: { users, total } } });
// The query string of the nth list request (1-based)
const query = (n) => new URLSearchParams(client.get.mock.calls[n - 1][0].split('?')[1]);
const lastQuery = () => query(client.get.mock.calls.length);

const page = (viewer = ADMIN) => {
  const view = render(
    <AuthContext.Provider value={{ user: viewer }}>
      <AdminUsersMainContainer />
    </AuthContext.Provider>,
  );
  return { ...view, button: (label) => view.container.querySelector(`[aria-label="${label}"]`) };
};

describe('AdminUsersMainContainer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.get.mockResolvedValue(answer([SAM, PRIYA, ME]));
  });

  it('asks for the first page of 20 and lists the users', async () => {
    const { container } = page();
    expect(await screen.findByText('Sam Carter')).toBeTruthy();
    expect(client.get.mock.calls[0][0].startsWith('/api/users/admin/get-all-users?')).toBe(true);
    expect(client.get.mock.calls[0][1]).toBe(true);
    expect(query(1).get('page')).toBe('1');
    expect(query(1).get('pageSize')).toBe('20');
    expect(query(1).has('search')).toBe(false);
    expect(container.querySelectorAll('article').length).toBe(3);
    expect(container.querySelector('[aria-label="List of users"]').getAttribute('aria-busy')).toBe('false');
  });

  it('is busy while the page loads', () => {
    client.get.mockReturnValue(new Promise(() => {}));
    const { container } = page();
    expect(container.querySelector('[aria-label="List of users"]').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('says why the list couldn’t load', async () => {
    client.get.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Server down.' }));
    page();
    expect(await screen.findByText('Server down.')).toBeTruthy();
  });

  it('says so when no user matches', async () => {
    client.get.mockResolvedValue(answer([]));
    page();
    expect(await screen.findByText('No users match these filters.')).toBeTruthy();
  });

  it('locks the admin’s own row, and a developer’s for an admin', async () => {
    const { container } = page();
    await screen.findByText('Sam Carter');
    expect(container.querySelector('#user-note-me').textContent).toBe('This is your account — manage it from your account page.');
    expect(container.querySelector('#user-note-u2').textContent).toBe('Only a developer can manage developer accounts.');
    expect(container.querySelector('#user-note-u1')).toBeNull();
    // An admin can't make anyone a developer
    expect([...container.querySelector('#user-role-u1').options].map((o) => o.value)).toEqual(['USER', 'ADMIN']);
    expect([...container.querySelector('#user-role-u2').options].map((o) => o.value)).toEqual(['USER', 'ADMIN', 'DEVELOPER']);
  });

  it('lets a developer manage developers and make them', async () => {
    const { container } = page(DEVELOPER);
    await screen.findByText('Sam Carter');
    expect(container.querySelector('#user-note-u2')).toBeNull();
    expect([...container.querySelector('#user-role-u1').options].map((o) => o.value)).toEqual(['USER', 'ADMIN', 'DEVELOPER']);
  });

  it('filters by role and status from the first page', async () => {
    const { container } = page();
    await screen.findByText('Sam Carter');
    fireEvent.change(container.querySelector('#user-role-filter'), { target: { value: 'ADMIN' } });
    await waitFor(() => expect(lastQuery().get('role')).toBe('ADMIN'));
    fireEvent.change(container.querySelector('#user-status-filter'), { target: { value: 'inactive' } });
    await waitFor(() => expect(lastQuery().get('status')).toBe('inactive'));
    expect(lastQuery().get('page')).toBe('1');
  });

  it('searches once the typing pauses, trimmed', async () => {
    page();
    await screen.findByText('Sam Carter');
    const calls = client.get.mock.calls.length;
    fireEvent.change(screen.getByLabelText('Search name or email'), { target: { value: '  sam ' } });
    expect(client.get.mock.calls.length).toBe(calls);
    await waitFor(() => expect(lastQuery().get('search')).toBe('sam'));
  });

  it('pages through the list', async () => {
    client.get.mockResolvedValue(answer([SAM], 45));
    page();
    expect(await screen.findByText('Page 1 of 3 (45 total)')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(lastQuery().get('page')).toBe('2'));
    expect(await screen.findByText('Page 2 of 3 (45 total)')).toBeTruthy();
  });

  it('saves a new role and shows the server’s copy of the user', async () => {
    client.patch.mockResolvedValue({ data: { data: { user: { ...SAM, role: 'ADMIN' } } } });
    const { container, button } = page();
    await screen.findByText('Sam Carter');
    fireEvent.change(container.querySelector('#user-role-u1'), { target: { value: 'ADMIN' } });
    fireEvent.click(button('Save role for Sam Carter'));
    expect(await screen.findByText('Sam Carter is now Admin.')).toBeTruthy();
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/change-user-role', { userId: 'u1', newRole: 'ADMIN' }, true);
    expect(container.querySelector('#user-heading-u1').closest('article').textContent).toContain('ADMIN');
  });

  it('says why an action failed', async () => {
    client.patch.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Not allowed.' }));
    const { container, button } = page();
    await screen.findByText('Sam Carter');
    fireEvent.change(container.querySelector('#user-role-u1'), { target: { value: 'ADMIN' } });
    fireEvent.click(button('Save role for Sam Carter'));
    expect(await screen.findByText('Not allowed.')).toBeTruthy();
  });

  it('asks before deactivating, then deactivates', async () => {
    client.patch.mockResolvedValue({ data: { data: { user: { ...SAM, isActive: false } } } });
    const { button } = page();
    await screen.findByText('Sam Carter');
    fireEvent.click(button('Deactivate Sam Carter'));
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Deactivate User');
    expect(dialog.textContent).toContain("Deactivate Sam Carter? They will be signed out everywhere and can't sign in until reactivated.");
    expect(client.patch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm'));
    expect(await screen.findByText('Sam Carter has been deactivated.')).toBeTruthy();
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/deactivate-user/u1', {}, true);
    expect(button('Reactivate Sam Carter')).toBeTruthy();
  });

  it('reactivates without asking', async () => {
    client.get.mockResolvedValue(answer([{ ...SAM, isActive: false }]));
    client.patch.mockResolvedValue({ data: { data: { user: SAM } } });
    const { button } = page();
    await screen.findByText('Sam Carter');
    fireEvent.click(button('Reactivate Sam Carter'));
    expect(await screen.findByText('Sam Carter has been reactivated.')).toBeTruthy();
    expect(client.patch).toHaveBeenCalledWith('/api/users/admin/reactivate-user/u1', {}, true);
  });

  it('asks before deleting, then deletes and reloads the page', async () => {
    client.delete.mockResolvedValue({});
    const { button } = page();
    await screen.findByText('Sam Carter');
    fireEvent.click(button('Delete user Sam Carter'));
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Permanently delete Sam Carter and their avatar? This cannot be undone.');
    const calls = client.get.mock.calls.length;
    fireEvent.click(screen.getByText('Confirm'));
    expect(await screen.findByText('Sam Carter has been deleted.')).toBeTruthy();
    expect(client.delete).toHaveBeenCalledWith('/api/users/admin/delete-user-by-id/u1', true);
    await waitFor(() => expect(client.get.mock.calls.length).toBe(calls + 1));
  });

  it('steps back a page when a delete empties it', async () => {
    client.get.mockResolvedValue(answer([SAM], 21));
    client.delete.mockResolvedValue({});
    const { button } = page();
    await screen.findByText('Page 1 of 2 (21 total)');
    fireEvent.click(screen.getByText('Next'));
    await screen.findByText('Page 2 of 2 (21 total)');
    fireEvent.click(button('Delete user Sam Carter'));
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => expect(lastQuery().get('page')).toBe('1'));
  });

  it('keeps the list when a delete fails', async () => {
    client.delete.mockRejectedValue(new Error('no'));
    const { button } = page();
    await screen.findByText('Sam Carter');
    const calls = client.get.mock.calls.length;
    fireEvent.click(button('Delete user Sam Carter'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(await screen.findByText('That action failed. Please try again.')).toBeTruthy();
    expect(client.get.mock.calls.length).toBe(calls);
  });

  it('opens a user’s memberships and closes them', async () => {
    getPlanGrants.mockResolvedValue({ plan: 'FREE', source: 'FREE', grants: [] });
    const { button } = page();
    await screen.findByText('Sam Carter');
    fireEvent.click(button('Membership for Sam Carter'));
    expect(await screen.findByText('Membership: Sam Carter')).toBeTruthy();
    expect(getPlanGrants).toHaveBeenCalledWith('u1');
    fireEvent.click(document.querySelector('[role="dialog"] [aria-label="Close"]'));
    expect(screen.queryByText('Membership: Sam Carter')).toBeNull();
  });
});
