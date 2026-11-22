import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminEventsPage from '@/pages/admin/AdminEventsPage';
import { ADMIN_EVENTS_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The sections load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/events/AdminEventsMainContainer', () => ({ default: () => <div data-section='events' /> }));

describe('AdminEventsPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<AdminEventsPage />, { path: ADMIN_EVENTS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-events-heading');
    expect(document.getElementById('admin-events-heading').tagName).toBe('H1');
    expect(headings()).toEqual(['Audit Log']);
    expect(main.textContent).toContain('Head office');
  });

  it('holds its sections', () => {
    renderPage(<AdminEventsPage />, { path: ADMIN_EVENTS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const main = document.querySelector('main');
    expect(main.querySelector('[data-section="events"]')).toBeTruthy();
  });

  it('is never indexed', async () => {
    renderPage(<AdminEventsPage />, { path: ADMIN_EVENTS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
