import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminGiftsPage from '@/pages/admin/AdminGiftsPage';
import { ADMIN_GIFTS_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The cards load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/gifts/AdminGiftsMainContainer', () => ({ default: () => <div data-section='gifts' /> }));

describe('AdminGiftsPage', () => {
  it('has one main, labelled by its h1, holding the gifts and referrals', () => {
    renderPage(<AdminGiftsPage />, { path: ADMIN_GIFTS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-gifts-page-heading');
    expect(headings()).toEqual(['Gifts and Referrals']);
    expect(main.querySelector('[data-section="gifts"]')).toBeTruthy();
    expect(main.textContent).toContain('Gift codes bought and redeemed');
  });

  it('is never indexed', async () => {
    renderPage(<AdminGiftsPage />, { path: ADMIN_GIFTS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
