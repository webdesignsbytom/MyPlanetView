import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminOverviewSection from '@/components/admin/overview/AdminOverviewSection';
import { getAdminOverview } from '@/api/adminApi';

vi.mock('@/api/adminApi', () => ({ getAdminOverview: vi.fn() }));

const OVERVIEW = {
  accounts: { total: 1234, verified: 1000, deactivated: 3, new: { day: 4, week: 30, month: 120 } },
  maps: 1500,
  trips: 2200,
  photos: { photos: 48000, videos: 12 },
  storageBytes: 12_300_000_000,
  members: { paying: { REGULAR: 40, PREMIUM: 9 }, trialing: 5, pastDue: 1, complimentary: { REGULAR: 2, PREMIUM: 3 }, forLife: 2 },
  gifts: { paid: 7, redeemed: 4, refunded: 1, waiting: 2 },
  referrals: { CREDIT: 6, GRANT: 2, CAPPED: 0 },
  feedbackNew: 5,
  jobs: [
    { job: 'cleanup', name: 'Nightly clean-up', time: '04:00 UTC', lastRunAt: '2026-11-26T04:00:05.000Z', level: 'INFO', problems: [], warnings: [], summary: {}, late: false },
    {
      job: 'emails',
      name: 'Daily emails',
      time: '08:00 UTC',
      lastRunAt: '2026-11-26T08:00:02.000Z',
      level: 'ERROR',
      problems: ['Resend’s sending quota was reached'],
      warnings: [],
      summary: {},
      late: false,
    },
  ],
};

const show = () =>
  render(
    <MemoryRouter>
      <AdminOverviewSection />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getAdminOverview.mockResolvedValue({ overview: OVERVIEW });
});

describe('AdminOverviewSection', () => {
  it('shows the site’s numbers', async () => {
    const { container } = show();
    await waitFor(() => expect(container.querySelector('[data-overview-tile="Accounts"]')).not.toBeNull());
    const tile = (label) => container.querySelector(`[data-overview-tile="${label}"]`).textContent;
    expect(tile('Accounts')).toContain('1,234');
    expect(tile('Accounts')).toContain('New: 4 today, 30 this week, 120 in 30 days');
    expect(tile('Photos')).toContain('48,000');
    expect(tile('Photos')).toContain('12 GB stored');
    expect(tile('Paying members')).toContain('49');
    expect(tile('Paying members')).toContain('5 on a free month');
    expect(tile('Given a plan')).toContain('2 for life');
    expect(tile('Gifts')).toContain('2 waiting');
    expect(tile('Referral rewards')).toContain('8');
    expect(tile('New feedback')).toContain('5');
    expect(screen.getByText('Look up a gift code').getAttribute('href')).toBe('/admin/gifts');
    expect(screen.getByText('Read the feedback').getAttribute('href')).toBe('/admin/feedback');
  });

  it('flags a daily job that had a problem, with what went wrong', async () => {
    const { container } = show();
    await waitFor(() => expect(container.querySelector('[data-overview-job="emails"]')).not.toBeNull());
    const emails = container.querySelector('[data-overview-job="emails"]');
    expect(emails.querySelector('[data-job-state]').getAttribute('data-job-state')).toBe('critical');
    expect(emails.textContent).toContain('Had a problem');
    expect(emails.textContent).toContain('Resend’s sending quota was reached');
    expect(emails.textContent).toContain('Last run: 26 Nov 2026, 08:00 UTC');
    expect(container.querySelector('[data-overview-job="cleanup"]').textContent).toContain('Ran fine');
  });

  it('lists the yearly chores due first, under To do, and nothing when none is', async () => {
    getAdminOverview.mockResolvedValue({
      overview: { ...OVERVIEW, reminders: [{ key: 'magneticPoles', title: 'Move the magnetic poles', text: 'Their pins are still at 2025’s positions.' }] },
    });
    const { container, unmount } = show();
    await waitFor(() => expect(container.querySelector('[data-overview-reminder="magneticPoles"]')).not.toBeNull());
    expect(screen.getByRole('heading', { name: 'To do' })).toBeTruthy();
    const reminder = container.querySelector('[data-overview-reminder="magneticPoles"]');
    expect(reminder.textContent).toContain('Move the magnetic poles');
    expect(reminder.textContent).toContain('2025’s positions');
    // Before the numbers
    expect(reminder.compareDocumentPosition(container.querySelector('[data-overview-tile="Accounts"]')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    unmount();
    getAdminOverview.mockResolvedValue({ overview: { ...OVERVIEW, reminders: [] } });
    const none = show();
    await waitFor(() => expect(none.container.querySelector('[data-overview-tile="Accounts"]')).not.toBeNull());
    expect(none.container.querySelector('[data-overview-reminder]')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'To do' })).toBeNull();
  });

  it('says when it can’t load, and loads again on Reload', async () => {
    getAdminOverview.mockRejectedValueOnce({ friendlyMessage: 'Server down.' });
    show();
    expect((await screen.findByRole('alert')).textContent).toBe('Server down.');
    fireEvent.click(screen.getByLabelText('Reload the overview'));
    await waitFor(() => expect(getAdminOverview).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
