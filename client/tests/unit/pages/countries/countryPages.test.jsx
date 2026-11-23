import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import CountriesIndexPage from '@/pages/countries/CountriesIndexPage';
import CountryPage from '@/pages/countries/CountryPage';
import { loadCountryIndex, loadCountryPage } from '@/utils/countries/countryPages';
import { headings, onlyMain, renderPage } from '../renderPage';

// The guides' partner cards and Travel Desk ask for the offers: none here
vi.mock('@/hooks/useOffers', () => ({ default: () => ({ offers: [], loading: false, error: null }) }));

// The real content, as the build loads it with the page (drafts too, as on the dev server)
describe('CountriesIndexPage', { timeout: 20000 }, () => {
  it('has one main, labelled by its h1 and described by its subtitle, and lists the guides', async () => {
    const pages = await loadCountryIndex();
    renderPage(<CountriesIndexPage pages={pages} />, { path: '/countries' });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('countries-title');
    expect(main.getAttribute('aria-describedby')).toBe('countries-subtitle');
    expect(headings()).toHaveLength(1);
    expect(document.getElementById('countries-title').tagName).toBe('H1');
    const france = [...main.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/countries/france');
    expect(france).toBeTruthy();
  });

  it('gives the index its title, canonical link and structured data', async () => {
    const pages = await loadCountryIndex();
    renderPage(<CountriesIndexPage pages={pages} />, { path: '/countries' });
    await waitFor(() => expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/countries$/));
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index,follow');
    expect(document.querySelector('script[type="application/ld+json"]')).toBeTruthy();
  });
});

describe('CountryPage', { timeout: 20000 }, () => {
  it('has one main, labelled by the country’s h1 and described by its summary, with every section', async () => {
    const page = await loadCountryPage('france');
    renderPage(<CountryPage page={page} />, { path: '/countries/france' });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('country-title');
    expect(main.getAttribute('aria-describedby')).toBe('country-summary');
    expect(headings()).toHaveLength(1);
    expect(document.getElementById('country-title').textContent).toContain('France');
    expect(document.getElementById('country-overview-heading').textContent).toBe('Overview');
    page.overview.forEach((paragraph) => expect(main.textContent).toContain(paragraph));
    // The month strip, in words
    expect(main.querySelector('ol[aria-label*="month by month"]').querySelectorAll('li').length).toBe(12);
  });

  it('beside the overview, the first landmark with a photo, credited', async () => {
    const page = await loadCountryPage('france');
    const featured = page.landmarks.find((landmark) => landmark.photo);
    renderPage(<CountryPage page={page} />, { path: '/countries/france' });
    expect(featured).toBeTruthy();
    expect(document.querySelector(`img[alt="${featured.name}, France"]`)).toBeTruthy();
  });

  it('a draft is never indexed; a checked guide is', async () => {
    const page = await loadCountryPage('france');
    const draft = renderPage(<CountryPage page={{ ...page, status: 'draft' }} />, { path: '/countries/france' });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow'));
    draft.unmount();
    renderPage(<CountryPage page={{ ...page, status: 'checked' }} />, { path: '/countries/france' });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index,follow'));
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toMatch(/\/countries\/france$/);
  });
});
