import { createElement, Suspense } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Stand-ins for the pages' code: the real pages would pull in the whole app
vi.mock('@/pages/about/AboutPage', () => ({ default: () => createElement('p', null, 'About page') }));
vi.mock('@/pages/contact/ContactPage', () => {
  throw new Error('The chunk could not be downloaded');
});
vi.mock('@/pages/countries/CountryPage', () => ({ default: ({ page }) => createElement('p', null, `Guide to ${page.code}`) }));
vi.mock('@/pages/countries/CountriesIndexPage', () => ({ default: ({ pages }) => createElement('p', null, `${pages.length} guides`) }));
vi.mock('@/pages/months/MonthPage', () => ({ default: ({ page }) => createElement('p', null, `Month ${page.slug}`) }));

import {
  AboutPage,
  COUNTRY_GUIDE_PAGES,
  CountriesIndexPage,
  MONTH_GUIDE_PAGES,
  SelectLabPage,
  preloadPage,
} from '@/utils/navigation/lazyPages';
import { COUNTRY_PAGES } from '@/utils/countries/countryPages';
import { MONTH_PAGES } from '@/utils/months/monthPages';

const inSuspense = (Page) => createElement(Suspense, { fallback: createElement('p', null, 'Loading…') }, createElement(Page));

describe('lazyPages', () => {
  it('gives every lazy page a preload', () => {
    expect(typeof AboutPage.preload).toBe('function');
    for (const { Page } of [...COUNTRY_GUIDE_PAGES, ...MONTH_GUIDE_PAGES]) expect(typeof Page.preload).toBe('function');
  });

  it('draws a page straight away, with no loading screen, once its code is preloaded', async () => {
    await preloadPage('/about');
    await act(async () => {
      render(inSuspense(AboutPage));
    });
    expect(screen.getByText('About page')).toBeTruthy();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('never fails a preload, even when the code can’t be downloaded', async () => {
    await expect(preloadPage('/contact')).resolves.toBeUndefined();
  });

  it('does nothing for a path with no lazy page', async () => {
    await expect(preloadPage('/trips/abc')).resolves.toBeUndefined();
    await expect(preloadPage('/')).resolves.toBeUndefined();
  });

  it('routes one guide page per country page, with its content handed in', { timeout: 20000 }, async () => {
    expect(COUNTRY_GUIDE_PAGES.map(({ slug, path }) => [slug, path])).toEqual(COUNTRY_PAGES.map(({ slug }) => [slug, `/countries/${slug}`]));
    const first = COUNTRY_GUIDE_PAGES[0];
    await act(async () => {
      render(inSuspense(first.Page));
    });
    const code = COUNTRY_PAGES.find((page) => page.slug === first.slug).code;
    await waitFor(() => expect(screen.getByText(`Guide to ${code}`)).toBeTruthy());
  });

  it('hands the index its rows', { timeout: 20000 }, async () => {
    expect(CountriesIndexPage).not.toBeNull();
    await act(async () => {
      render(inSuspense(CountriesIndexPage));
    });
    await waitFor(() => expect(screen.getByText(`${COUNTRY_PAGES.length} guides`)).toBeTruthy());
  });

  it('routes one page per month page', { timeout: 20000 }, async () => {
    expect(MONTH_GUIDE_PAGES.map(({ path }) => path)).toEqual(MONTH_PAGES.map(({ slug }) => `/where-to-go/${slug}`));
    if (!MONTH_GUIDE_PAGES.length) return;
    await act(async () => {
      render(inSuspense(MONTH_GUIDE_PAGES[0].Page));
    });
    await waitFor(() => expect(screen.getByText(`Month ${MONTH_GUIDE_PAGES[0].slug}`)).toBeTruthy());
  });

  it('has the dropdown lab in development only', () => {
    expect(SelectLabPage === null).toBe(!import.meta.env.DEV);
  });
});
