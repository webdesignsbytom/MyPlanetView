import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CountryPageHeader from '@/components/countries/CountryPageHeader';
import CountryPagePoster from '@/components/countries/CountryPagePoster';
import { CompanyName } from '@/utils/constants/constants';

const MONTHS = ['good', 'good', 'good', 'best', 'best', 'best', 'avoid', 'avoid', 'best', 'best', 'good', 'good'];

const page = (overrides = {}) => ({
  code: 'FR',
  slug: 'france',
  name: 'France',
  summary: 'Cafés, castles and coast.',
  stamp: ['Bonjour', 'Paris'],
  lastChecked: '2026-11-16',
  whenToGo: { months: MONTHS },
  ...overrides,
});

const show = (props) =>
  render(
    <MemoryRouter>
      <CountryPageHeader page={page(props)} />
    </MemoryRouter>,
  );

describe('CountryPageHeader', () => {
  it('makes the country’s name the page’s one h1, under the site’s kicker', () => {
    const { container } = show();
    const headings = container.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].id).toBe('country-title');
    expect(headings[0].textContent).toBe('France');
    expect(screen.getByText(`${CompanyName} · Country guide`)).toBeTruthy();
    expect(container.querySelector('#country-summary').textContent).toBe('Cafés, castles and coast.');
  });

  it('leads back to the countries index in its breadcrumb trail, the country itself not a link', () => {
    const { container } = show();
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    expect(nav.querySelector('a').getAttribute('href')).toBe('/countries');
    expect(nav.querySelector('a').textContent).toBe('Countries');
    expect(nav.querySelector('[aria-current="page"]').textContent).toBe('France');
    // The trail as structured data, from the same list
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]').textContent);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((item) => item.name)).toEqual(['Countries', 'France']);
  });

  it('gives the best months in short and the day it was last checked', () => {
    const { container } = show();
    const values = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(values).toEqual(['Apr–Jun, Sep–Oct', '16 November 2026']);
  });

  it('says so when no month stands out or it was never checked', () => {
    const { container } = show({ lastChecked: null, whenToGo: { months: Array(12).fill('good') } });
    const values = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(values).toEqual(['No month stands out', 'Not yet']);
  });

  it('carries the stamp’s words, hidden from screen readers', () => {
    const { container } = show();
    const stamp = container.querySelector('span[aria-hidden="true"].rounded-full');
    expect([...stamp.children].map((span) => span.textContent)).toEqual(['Bonjour', 'Paris']);
  });

  it('shows the country’s travel poster', () => {
    show();
    expect(screen.getByAltText('Travel poster of France')).toBeTruthy();
  });
});

describe('CountryPagePoster', () => {
  it('loads the poster first, as AVIF with a WebP fallback', () => {
    const { container } = render(<CountryPagePoster code='FR' name='France' />);
    const img = screen.getByAltText('Travel poster of France');
    expect(img.getAttribute('src')).toMatch(/visitCountryPosters\/fr-paris-riverside-800\.webp$/);
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
    const source = container.querySelector('source');
    expect(source.getAttribute('type')).toBe('image/avif');
    expect(source.getAttribute('srcset')).toMatch(/fr-paris-riverside-800\.avif$/);
  });

  it('shows the "poster coming soon" card for a place without one', () => {
    render(<CountryPagePoster code='ZZ' name='Nowhere' />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Nowhere: travel poster coming soon');
    expect(screen.queryByAltText('Travel poster of Nowhere')).toBeNull();
  });
});
