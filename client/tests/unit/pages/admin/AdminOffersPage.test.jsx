import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminOffersPage from '@/pages/admin/AdminOffersPage';
import { ADMIN_OFFERS_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The sections load their own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/offers/AdminOffersMainContainer', () => ({ default: () => <div data-section='offers' /> }));

describe('AdminOffersPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<AdminOffersPage />, { path: ADMIN_OFFERS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-offers-page-heading');
    expect(document.getElementById('admin-offers-page-heading').tagName).toBe('H1');
    expect(headings()).toEqual(['Travel Offers']);
    expect(main.textContent).toContain('Head office');
  });

  it('holds its sections', () => {
    renderPage(<AdminOffersPage />, { path: ADMIN_OFFERS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const main = document.querySelector('main');
    expect(main.querySelector('[data-section="offers"]')).toBeTruthy();
    expect(main.textContent).toContain('Partner offers on the cards and the Travel Desk');
  });

  it('is never indexed', async () => {
    renderPage(<AdminOffersPage />, { path: ADMIN_OFFERS_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
