import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CountryIndexList from '@/components/countries/CountryIndexList';

// Jan–Mar good, Apr–Jun best, Jul–Aug avoid, Sep–Oct best, Nov–Dec good
const MONTHS = ['good', 'good', 'good', 'best', 'best', 'best', 'avoid', 'avoid', 'best', 'best', 'good', 'good'];

const page = (overrides) => ({ status: 'checked', summary: 'A summary.', months: MONTHS, ...overrides });

const PAGES = [
  page({ slug: 'peru', name: 'Peru', continent: 'South America', summary: 'Mountains and ruins.' }),
  page({ slug: 'italy', name: 'Italy', continent: 'Europe', status: 'draft' }),
  page({ slug: 'mexico', name: 'Mexico', continent: 'North America' }),
  page({ slug: 'france', name: 'France', continent: 'Europe' }),
];

const show = (pages = PAGES) =>
  render(
    <MemoryRouter>
      <CountryIndexList pages={pages} />
    </MemoryRouter>,
  );

describe('CountryIndexList', () => {
  it('gives each continent its own card, A to Z, with an id made from its name', () => {
    const { container } = show();
    const headings = [...container.querySelectorAll('h2')];
    expect(headings.map((h) => h.textContent)).toEqual(['Europe', 'North America', 'South America']);
    expect(headings.map((h) => h.id)).toEqual(['countries-europe', 'countries-north-america', 'countries-south-america']);
  });

  it('lists each continent’s countries as links to their guides, in the order given', () => {
    const { container } = show();
    const europe = container.querySelector('section[aria-labelledby="countries-europe"]');
    const links = [...europe.querySelectorAll('a')];
    expect(links.map((a) => a.textContent)).toEqual(['Italy', 'France']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/countries/italy', '/countries/france']);
  });

  it('tags a draft guide and leaves a checked one untagged', () => {
    const { container } = show();
    const items = container.querySelectorAll('section[aria-labelledby="countries-europe"] > div > ul > li');
    expect(within(items[0]).queryByText('Draft')).toBeTruthy();
    expect(within(items[1]).queryByText('Draft')).toBeNull();
  });

  it('shows each country’s summary, a compact strip hidden from screen readers and its months in words', () => {
    const { container } = show();
    const peru = container.querySelector('section[aria-labelledby="countries-south-america"] li');
    expect(within(peru).getByText('Mountains and ruins.')).toBeTruthy();
    const strip = peru.querySelector('ol');
    expect(strip.getAttribute('aria-hidden')).toBe('true');
    expect(strip.querySelectorAll('li').length).toBe(12);
    expect(peru.textContent).toContain('Best: Apr–Jun, Sep–Oct');
    expect(peru.textContent).toContain('Avoid: Jul–Aug');
  });

  it('draws nothing without pages', () => {
    const { container } = show([]);
    expect(container.innerHTML).toBe('');
  });
});
