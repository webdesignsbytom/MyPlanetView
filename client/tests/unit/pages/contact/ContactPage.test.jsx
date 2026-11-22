import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import ContactPage from '@/pages/contact/ContactPage';
import { CONTACT_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

describe('ContactPage', () => {
  it('has one main, labelled by the postcard’s h1', () => {
    renderPage(<ContactPage />, { path: CONTACT_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('contact-title');
    expect(main.getAttribute('aria-describedby')).toBe('contact-subtitle');
    expect(headings()).toEqual(['Contact us']);
  });

  it('holds the contact form and the other ways to reach us', async () => {
    renderPage(<ContactPage />, { path: CONTACT_PAGE_URL });
    expect(document.querySelector('main form')).toBeTruthy();
    expect(document.getElementById('contact-blurb-title').textContent).toBe('Get in touch');
    await waitFor(() => expect(document.title).toMatch(/Contact/));
  });
});
