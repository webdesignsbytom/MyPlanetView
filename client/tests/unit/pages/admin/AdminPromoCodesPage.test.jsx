import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminPromoCodesPage from '@/pages/admin/AdminPromoCodesPage';
import { ADMIN_PROMO_CODES_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The sections load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/promoCodes/AdminPromoCodesMainContainer', () => ({ default: () => <div data-section='promo-codes' /> }));

describe('AdminPromoCodesPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<AdminPromoCodesPage />, { path: ADMIN_PROMO_CODES_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-promo-codes-page-heading');
    expect(document.getElementById('admin-promo-codes-page-heading').tagName).toBe('H1');
    expect(headings()).toEqual(['Promo Codes']);
    expect(main.textContent).toContain('Head office');
  });

  it('holds its sections', () => {
    renderPage(<AdminPromoCodesPage />, { path: ADMIN_PROMO_CODES_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const main = document.querySelector('main');
    expect(main.querySelector('[data-section="promo-codes"]')).toBeTruthy();
    expect(main.textContent).toContain('Creators’ sign-up codes');
  });

  it('is never indexed', async () => {
    renderPage(<AdminPromoCodesPage />, { path: ADMIN_PROMO_CODES_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
