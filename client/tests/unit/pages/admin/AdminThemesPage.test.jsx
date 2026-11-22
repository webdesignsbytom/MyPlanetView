import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminThemesPage from '@/pages/admin/AdminThemesPage';
import { ADMIN_THEMES_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The sections load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/themes/AdminThemesMainContainer', () => ({ default: () => <div data-section='themes' /> }));

describe('AdminThemesPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<AdminThemesPage />, { path: ADMIN_THEMES_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-themes-page-heading');
    expect(document.getElementById('admin-themes-page-heading').tagName).toBe('H1');
    expect(headings()).toEqual(['Photo Themes']);
    expect(main.textContent).toContain('Head office');
  });

  it('holds its sections', () => {
    renderPage(<AdminThemesPage />, { path: ADMIN_THEMES_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const main = document.querySelector('main');
    expect(main.querySelector('[data-section="themes"]')).toBeTruthy();
    expect(main.textContent).toContain('One theme a month, written ahead');
  });

  it('is never indexed', async () => {
    renderPage(<AdminThemesPage />, { path: ADMIN_THEMES_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
