import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import { ADMIN_USERS_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The sections load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/users/AdminUsersMainContainer', () => ({ default: () => <div data-section='users' /> }));
vi.mock('@/components/admin/users/AdminTransferMapCard', () => ({ default: () => <div data-section='transfer' /> }));

describe('AdminUsersPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<AdminUsersPage />, { path: ADMIN_USERS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-users-heading');
    expect(document.getElementById('admin-users-heading').tagName).toBe('H1');
    expect(headings()).toEqual(['User Admin']);
    expect(main.textContent).toContain('Head office');
  });

  it('holds its sections', () => {
    renderPage(<AdminUsersPage />, { path: ADMIN_USERS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const main = document.querySelector('main');
    // The users, then transferring a map
    const sections = [...main.querySelectorAll('[data-section]')].map((el) => el.getAttribute('data-section'));
    expect(sections).toEqual(['users', 'transfer']);
  });

  it('is never indexed', async () => {
    renderPage(<AdminUsersPage />, { path: ADMIN_USERS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
