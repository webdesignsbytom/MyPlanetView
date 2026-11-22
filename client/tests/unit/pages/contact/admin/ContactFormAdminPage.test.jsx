import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import ContactFormAdminPage from '@/pages/contact/admin/ContactFormAdminPage';
import { ADMIN_CONTACT_FORM_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../../renderPage';

// The forms load from the admin API: the page's own part is the frame
vi.mock('@/components/contact/admin/ContactFormDataSection', () => ({ default: () => <div data-section='contact-forms' /> }));

describe('ContactFormAdminPage', () => {
  it('has one main, labelled by its h1, holding the forms', () => {
    renderPage(<ContactFormAdminPage />, { path: ADMIN_CONTACT_FORM_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('admin-contact-forms-heading');
    expect(headings()).toEqual(['Admin - Contact Forms']);
    expect(main.querySelector('[data-section="contact-forms"]')).toBeTruthy();
  });

  it('is never indexed', async () => {
    renderPage(<ContactFormAdminPage />, { path: ADMIN_CONTACT_FORM_PAGE_URL, auth: signedIn({ role: 'ADMIN' }) });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
    expect(document.title).toMatch(/Contact Form Admin/);
  });
});
