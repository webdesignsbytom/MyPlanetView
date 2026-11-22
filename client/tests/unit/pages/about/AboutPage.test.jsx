import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import AboutPage from '@/pages/about/AboutPage';
import { ABOUT_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

describe('AboutPage', () => {
  it('has one main, labelled by its h1 and described by its subtitle', () => {
    renderPage(<AboutPage />, { path: ABOUT_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('about-title');
    expect(main.getAttribute('aria-describedby')).toBe('about-subtitle');
    expect(document.getElementById('about-title').tagName).toBe('H1');
    expect(document.getElementById('about-subtitle')).toBeTruthy();
    expect(headings()).toHaveLength(1);
  });

  it('gives the page its title and canonical link, indexed', async () => {
    renderPage(<AboutPage />, { path: ABOUT_PAGE_URL });
    await waitFor(() => expect(document.title).toMatch(/About/i));
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toMatch(/\/about$/);
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^index/);
  });
});
