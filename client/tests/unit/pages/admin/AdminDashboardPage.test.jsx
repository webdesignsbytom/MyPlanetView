import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import { ADMIN_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The sections load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/AdminDashboardMainContainer', () => ({ default: () => <div data-section='dashboard' /> }));

describe('AdminDashboardPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<AdminDashboardPage />, { path: ADMIN_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-dashboard-heading');
    expect(document.getElementById('admin-dashboard-heading').tagName).toBe('H1');
    expect(headings()).toEqual(['Admin Dashboard']);
    expect(main.textContent).toContain('Head office');
  });

  it('holds its sections', () => {
    renderPage(<AdminDashboardPage />, { path: ADMIN_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const main = document.querySelector('main');
    expect(main.querySelector('[data-section="dashboard"]')).toBeTruthy();
  });

  it('is never indexed', async () => {
    renderPage(<AdminDashboardPage />, { path: ADMIN_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
