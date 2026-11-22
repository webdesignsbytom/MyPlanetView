import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import MaintenancePage from '@/pages/maintenance/MaintenancePage';
import { MAINTENANCE_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

describe('MaintenancePage', () => {
  it('has one main, labelled by its h1 and described by its subtitle', () => {
    renderPage(<MaintenancePage />, { path: MAINTENANCE_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('maintenance-heading');
    expect(main.getAttribute('aria-describedby')).toBe('maintenance-subtitle');
    expect(headings()).toEqual(["We'll be back soon!"]);
    expect(document.getElementById('maintenance-subtitle').textContent).toBe('Our site is currently undergoing scheduled maintenance.');
    expect(main.textContent).toContain('Thank you for your patience.');
  });

  it('has no footer, and is never indexed', async () => {
    renderPage(<MaintenancePage />, { path: MAINTENANCE_PAGE_URL });
    expect(document.querySelector('footer')).toBeNull();
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex,nofollow'));
  });
});
