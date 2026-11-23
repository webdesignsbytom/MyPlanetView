import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MonthBestList from '@/components/months/MonthBestList';
import MonthMoreList from '@/components/months/MonthMoreList';
import MonthNav from '@/components/months/MonthNav';
import MonthPageHeader from '@/components/months/MonthPageHeader';
import { CompanyName } from '@/utils/constants/constants';

const inRouter = (element) => render(<MemoryRouter>{element}</MemoryRouter>);

const pick = (over = {}) => ({
  code: 'FR',
  slug: 'france',
  name: 'France',
  status: 'checked',
  season: 'Spring: mild days and fewer crowds.',
  festivals: [],
  ...over,
});

describe('MonthBestList', () => {
  it('lists each country with its guide link, season and festivals that month', () => {
    const { container } = inRouter(
      <MonthBestList
        label='May'
        picks={[
          pick({ festivals: [{ name: 'Cannes Film Festival', place: 'Cannes', when: 'mid-May' }, { name: 'Fête de la Nature', when: 'late May' }] }),
          pick({ code: 'ZZ', slug: 'nowhere', name: 'Nowhere', season: null, status: 'draft' }),
        ]}
      />,
    );
    expect(container.querySelector('#month-best-heading').textContent).toBe('At their best in May');
    const items = container.querySelectorAll('#month-best-heading ~ * > li, ul.grid > li');
    expect(items.length).toBeGreaterThan(0);
    const france = within(container).getByText('France');
    expect(france.closest('a').getAttribute('href')).toBe('/countries/france');
    expect(container.textContent).toContain('Spring: mild days and fewer crowds.');
    const festivals = container.querySelector('[aria-label="Festivals in France in May"]');
    const lines = [...festivals.querySelectorAll('li')].map((li) => li.textContent);
    expect(lines).toEqual(['Cannes Film Festival, Cannes: mid-May', 'Fête de la Nature: late May']);
  });

  it('shows the poster where there is one, a blank card where not, and tags drafts', () => {
    const { container } = inRouter(
      <MonthBestList label='May' picks={[pick(), pick({ code: 'ZZ', slug: 'nowhere', name: 'Nowhere', status: 'draft', season: null })]} />,
    );
    const [france, nowhere] = container.querySelectorAll('li.grid');
    expect(france.querySelector('img')).toBeTruthy();
    expect(france.textContent).not.toContain('Draft');
    expect(nowhere.querySelector('img')).toBeNull();
    expect(nowhere.querySelector('span[aria-hidden="true"]')).toBeTruthy();
    expect(nowhere.textContent).toContain('Draft');
    // No festivals: no festival list
    expect(container.querySelector('[aria-label="Festivals in Nowhere in May"]')).toBeNull();
  });
});

describe('MonthMoreList', () => {
  it('lists the good countries with their season line', () => {
    const { container } = inRouter(
      <MonthMoreList title='Also good in May' titleId='month-good-heading' kind='good' picks={[pick({ code: 'IT', slug: 'italy', name: 'Italy', season: 'Warm.' })]} />,
    );
    expect(container.querySelector('#month-good-heading').textContent).toBe('Also good in May');
    const link = within(container).getByText('Italy').closest('a');
    expect(link.getAttribute('href')).toBe('/countries/italy');
    expect(container.textContent).toContain('Warm.');
    expect(container.textContent).not.toContain('Draft');
  });

  it('names a region with its country and its own line, and tags a draft', () => {
    const { container } = inRouter(
      <MonthMoreList
        title='Regions at their best'
        titleId='month-regions-heading'
        kind='regions'
        picks={[
          pick({ code: 'US', slug: 'united-states', name: 'United States', region: 'Hawaii', text: 'Dry and sunny.', status: 'draft' }),
          pick({ code: 'US', slug: 'united-states', name: 'United States', region: 'Alaska', text: 'Long days.' }),
        ]}
      />,
    );
    const links = [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
      ['Hawaii, United States', '/countries/united-states'],
      ['Alaska, United States', '/countries/united-states'],
    ]);
    expect(container.textContent).toContain('Dry and sunny.');
    expect(container.textContent).toContain('Long days.');
    expect(container.querySelectorAll('li')[0].textContent).toContain('Draft');
    expect(container.querySelectorAll('li')[1].textContent).not.toContain('Draft');
  });
});

describe('MonthNav', () => {
  const months = [
    { month: 1, slug: 'january' },
    { month: 5, slug: 'may' },
    { month: 12, slug: 'december' },
  ];

  it('links every other month and names the current one without a link', () => {
    const { container } = inRouter(<MonthNav months={months} current={5} />);
    const list = container.querySelector('[aria-label="Where to go, month by month"]');
    const items = [...list.querySelectorAll('li')];
    expect(items.map((li) => li.textContent)).toEqual(['January', 'May', 'December']);
    expect(items[0].querySelector('a').getAttribute('href')).toBe('/where-to-go/january');
    expect(items[2].querySelector('a').getAttribute('href')).toBe('/where-to-go/december');
    expect(items[1].querySelector('a')).toBeNull();
    expect(items[1].querySelector('[aria-current="page"]').textContent).toBe('May');
    expect(container.querySelector('#month-nav-heading').textContent).toBe('Other months');
  });
});

describe('MonthPageHeader', () => {
  const page = (over = {}) => ({
    month: 5,
    slug: 'may',
    summary: 'Late spring: long days before the summer crowds.',
    lastChecked: '2026-11-16',
    picks: { best: [pick(), pick({ code: 'IT' })], good: [pick({ code: 'ES' })] },
    ...over,
  });

  it('has the page’s one h1, the summary, the counts and the day it was checked', () => {
    const { container } = inRouter(<MonthPageHeader page={page()} />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toBe('Where to go in May');
    expect(h1s[0].id).toBe('month-title');
    expect(container.querySelector('#month-summary').textContent).toBe('Late spring: long days before the summer crowds.');
    expect(container.textContent).toContain(`${CompanyName} · Month by month`);
    const dds = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(dds).toEqual(['2 countries, and 1 more good', '16 November 2026']);
  });

  it('has a trail back to the countries and to itself', () => {
    const { container } = inRouter(<MonthPageHeader page={page()} />);
    const hrefs = [...container.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/countries');
  });

  it('says one country in the singular, and "Not yet" with no check date', () => {
    const { container } = inRouter(<MonthPageHeader page={page({ lastChecked: null, picks: { best: [pick()], good: [] } })} />);
    const dds = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(dds).toEqual(['1 country, and 0 more good', 'Not yet']);
  });
});
