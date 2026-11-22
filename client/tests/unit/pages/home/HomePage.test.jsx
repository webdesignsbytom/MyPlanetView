import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import HomePage from '@/pages/home/HomePage';
import { HOME_PAGE_URL } from '@/utils/constants/routes';
import { homeHero } from '@/utils/data/homeData';
import { headings, onlyMain, renderPage } from '../renderPage';

describe('HomePage', () => {
  it('has one main, labelled by the hero’s h1 (the art’s own words)', () => {
    renderPage(<HomePage />, { path: HOME_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('home-heading');
    expect(headings()).toEqual([homeHero.title]);
    // The tagline is text too, for search engines and screen readers
    expect(main.textContent).toContain(homeHero.tagline);
  });

  it('uses the full home title and its structured data, indexed', async () => {
    renderPage(<HomePage />, { path: HOME_PAGE_URL });
    await waitFor(() => expect(document.title).toMatch(/Your Private Travel Map and Photos/));
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index,follow');
    // Two schemas: the home page and the website
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBeGreaterThanOrEqual(2);
  });

  it('draws the site nav beside it', () => {
    renderPage(<HomePage />, { path: HOME_PAGE_URL });
    expect(document.querySelector('nav')).toBeTruthy();
  });
});
