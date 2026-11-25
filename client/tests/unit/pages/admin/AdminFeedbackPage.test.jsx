import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AdminFeedbackPage from '@/pages/admin/AdminFeedbackPage';
import { ADMIN_FEEDBACK_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The list loads its own data from the admin API: the page's own part is the frame
vi.mock('@/components/admin/feedback/AdminFeedbackMainContainer', () => ({ default: () => <div data-section='feedback' /> }));

describe('AdminFeedbackPage', () => {
  it('has one main, labelled by its h1, holding the reports', () => {
    renderPage(<AdminFeedbackPage />, { path: ADMIN_FEEDBACK_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-feedback-page-heading');
    expect(headings()).toEqual(['Feedback']);
    expect(main.querySelector('[data-section="feedback"]')).toBeTruthy();
    expect(main.textContent).toContain('Problems, ideas and questions sent from the map');
  });

  it('is never indexed', async () => {
    renderPage(<AdminFeedbackPage />, { path: ADMIN_FEEDBACK_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
  });
});
