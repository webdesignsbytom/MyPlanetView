import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import Error404 from '@/pages/error/Error404';
import { CONTACT_PAGE_URL, FAQ_PAGE_URL, HOME_PAGE_URL } from '@/utils/constants/routes';
import { elsewhere, headings, onlyMain, renderPage } from '../renderPage';

describe('Error404', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<Error404 />, { path: '/not-a-page' });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('error-404-heading');
    expect(main.getAttribute('aria-describedby')).toBe('error-404-subtitle');
    expect(headings()).toEqual(['Error 404']);
    expect(main.textContent).toContain('Page not found');
  });

  it('offers the three ways back', () => {
    renderPage(<Error404 />, { path: '/not-a-page' });
    const links = [...document.querySelector('nav[aria-label="Ways back"]').querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([HOME_PAGE_URL, FAQ_PAGE_URL, CONTACT_PAGE_URL]);
    expect(links.map((a) => a.textContent.trim())).toEqual(['Back to the home page', 'Read the FAQ', 'Contact us']);
  });

  it('the FAQ link goes there', () => {
    renderPage(<Error404 />, { path: '/not-a-page' });
    const faq = [...document.querySelectorAll('nav[aria-label="Ways back"] a')].find((a) => a.textContent.includes('FAQ'));
    fireEvent.click(faq);
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(FAQ_PAGE_URL);
  });

  it('shows the lost cat and is never indexed', async () => {
    renderPage(<Error404 />, { path: '/not-a-page' });
    expect(document.querySelector('img[alt="A funny and cute lost cat for the error page."]')).toBeTruthy();
    await waitFor(() => {
      const robots = [...document.head.querySelectorAll('meta[name="robots"]')].map((m) => m.getAttribute('content'));
      expect(robots.every((content) => content.replace(/\s/g, '') === 'noindex,nofollow')).toBe(true);
    });
  });
});
