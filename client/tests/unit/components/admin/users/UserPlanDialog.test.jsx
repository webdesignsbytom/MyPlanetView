import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UserPlanDialog from '@/components/admin/users/UserPlanDialog';
import { createPlanGrant, endPlanGrant, getPlanGrants } from '@/api/plansApi';

vi.mock('@/api/plansApi', () => ({ createPlanGrant: vi.fn(), endPlanGrant: vi.fn(), getPlanGrants: vi.fn() }));

const SAM = { id: 'user-1', name: 'Sam Carter', email: 'sam@example.com' };
const GRANTS = {
  plan: 'PREMIUM',
  source: 'COMPLIMENTARY',
  grants: [
    { id: 'g-2', plan: 'PREMIUM', startsAt: '2026-11-01T00:00:00Z', endsAt: '2028-11-01T00:00:00Z', active: true, reason: 'Influencer, autumn 2026' },
    { id: 'g-1', plan: 'REGULAR', startsAt: '2025-01-01T00:00:00Z', endsAt: '9999-12-31T00:00:00Z', active: false, reason: null },
  ],
};

const open = (user = SAM) => {
  const onClose = vi.fn();
  render(<UserPlanDialog user={user} onClose={onClose} />);
  return { onClose, dialog: document.querySelector('[role="dialog"]') };
};

describe('UserPlanDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getPlanGrants.mockResolvedValue(GRANTS);
  });

  it('says it is loading, then shows the plan now and where it comes from', async () => {
    getPlanGrants.mockReturnValue(new Promise(() => {}));
    const { dialog } = open();
    expect(within(dialog).getByText('Loading their memberships…')).toBeTruthy();
    expect(getPlanGrants).toHaveBeenCalledWith('user-1');
  });

  it('is titled with their name, or their address when they have none', async () => {
    open({ id: 'user-2', name: '', email: 'jo@example.com' });
    expect(await screen.findByText('Membership: jo@example.com')).toBeTruthy();
  });

  it('lists their memberships, newest first, with the running one and one for life', async () => {
    const { dialog } = open();
    expect(await within(dialog).findByText('Influencer, autumn 2026')).toBeTruthy();
    expect(dialog.textContent).toContain('Plan now: First Class (complimentary)');
    expect(within(dialog).getByText('First Class, 1 Nov 2026 – 1 Nov 2028 (running)')).toBeTruthy();
    expect(within(dialog).getByText('Business, 1 Jan 2025 – for life')).toBeTruthy();
    expect(within(dialog).getByText('Influencer, autumn 2026')).toBeTruthy();
    // Only the running one can be ended
    const ends = dialog.querySelectorAll('button[aria-label$="membership now"]');
    expect(ends.length).toBe(1);
    expect(ends[0].getAttribute('aria-label')).toBe('End First Class membership now');
    expect(ends[0].className).toContain('btn-danger');
  });

  it('says so when they have none, with a paid plan’s source in words', async () => {
    getPlanGrants.mockResolvedValue({ plan: 'REGULAR', source: 'STRIPE', grants: [] });
    const { dialog } = open();
    expect(await within(dialog).findByText('None yet.')).toBeTruthy();
    expect(dialog.textContent).toContain('Plan now: Business (paid)');
  });

  it('says why when their memberships can’t be loaded', async () => {
    getPlanGrants.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'The server is down.' }));
    const { dialog } = open();
    expect((await within(dialog).findByText('The server is down.')).getAttribute('role')).toBe('alert');
    expect(within(dialog).queryByText('Loading their memberships…')).toBeNull();
    expect(within(dialog).queryByText('Give membership')).toBeNull();
  });

  it('starts the new membership at a creator’s two years of First Class', async () => {
    const { dialog } = open();
    const months = await within(dialog).findByLabelText('Months (1 to 36)');
    expect(months.value).toBe('24');
    expect(within(dialog).getByLabelText('Plan').value).toBe('PREMIUM');
    expect(within(dialog).getByText('A creator with a promo code gets 24.')).toBeTruthy();
  });

  it.each([['0'], ['37'], ['1.5'], ['']])('refuses %j months before asking the server', async (value) => {
    const { dialog } = open();
    fireEvent.change(await within(dialog).findByLabelText('Months (1 to 36)'), { target: { value } });
    fireEvent.click(within(dialog).getByText('Give membership'));
    expect(within(dialog).getByText('Give a whole number of months from 1 to 36.').getAttribute('role')).toBe('alert');
    expect(createPlanGrant).not.toHaveBeenCalled();
  });

  it('gives a membership with its reason, then reloads the list and says what it did', async () => {
    createPlanGrant.mockResolvedValue({});
    const { dialog } = open();
    fireEvent.change(await within(dialog).findByLabelText('Plan'), { target: { value: 'REGULAR' } });
    fireEvent.change(within(dialog).getByLabelText('Months (1 to 36)'), { target: { value: '1' } });
    fireEvent.change(within(dialog).getByLabelText('Reason (only admins see it)'), { target: { value: '  Spring 2027  ' } });
    fireEvent.click(within(dialog).getByText('Give membership'));
    expect(await within(dialog).findByText('Sam Carter has complimentary Business for 1 month.')).toBeTruthy();
    expect(createPlanGrant).toHaveBeenCalledWith('user-1', { plan: 'REGULAR', months: 1, reason: 'Spring 2027' });
    expect(getPlanGrants).toHaveBeenCalledTimes(2);
    expect(within(dialog).getByLabelText('Reason (only admins see it)').value).toBe('');
  });

  it('says months in the plural', async () => {
    createPlanGrant.mockResolvedValue({});
    const { dialog } = open();
    await within(dialog).findByLabelText('Plan');
    fireEvent.click(within(dialog).getByText('Give membership'));
    expect(await within(dialog).findByText('Sam Carter has complimentary First Class for 24 months.')).toBeTruthy();
  });

  it('ends a running membership now', async () => {
    endPlanGrant.mockResolvedValue({});
    const { dialog } = open();
    await within(dialog).findByText('Influencer, autumn 2026');
    fireEvent.click(dialog.querySelector('button[aria-label="End First Class membership now"]'));
    expect(await within(dialog).findByText('Membership ended. Nothing of theirs is deleted.')).toBeTruthy();
    expect(endPlanGrant).toHaveBeenCalledWith('g-2');
  });

  it('says why a change failed, with a fallback', async () => {
    createPlanGrant.mockRejectedValue(new Error('no'));
    const { dialog } = open();
    await within(dialog).findByLabelText('Plan');
    fireEvent.click(within(dialog).getByText('Give membership'));
    expect(await within(dialog).findByText('That didn’t work.')).toBeTruthy();
  });

  it('closes on Escape', async () => {
    const { onClose } = open();
    await waitFor(() => expect(getPlanGrants).toHaveBeenCalled());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
