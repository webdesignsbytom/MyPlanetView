import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CountryWhenToGo from '@/components/countries/CountryWhenToGo';
import { RATING_MEANINGS } from '@/utils/countries/countryContent';

// The published month pages: April and July (MonthLinks shows only the guide's best months among them)
vi.mock('@/utils/months/monthPages', () => ({
  CHECKED_MONTH_PAGES: [
    { month: 4, slug: 'april', status: 'checked' },
    { month: 7, slug: 'july', status: 'checked' },
  ],
}));

const MONTHS = ['good', 'good', 'good', 'best', 'best', 'best', 'avoid', 'avoid', 'best', 'best', 'good', 'good'];

const festivalPhoto = { width: 640, height: 360, author: 'A. Snapper', licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0', file: 'Bastille Day.jpg' };

const whenToGo = (overrides = {}) => ({
  stripLabel: 'For Paris and the north.',
  months: MONTHS,
  seasons: [
    { name: 'Spring', months: [3, 4, 5], text: 'Mild and green.' },
    { name: 'Winter', months: [12, 1, 2], text: 'Cold and grey.' },
  ],
  weather: 'Mild in the north, hot in the south.',
  festivals: [
    { name: 'Bastille Day', key: 'bastille-day', when: '14 July', place: 'Everywhere', text: 'Fireworks.', photo: festivalPhoto },
    { name: 'Fête de la Musique', key: 'fete', when: '21 June', text: 'Music in the streets.' },
  ],
  regions: [
    { name: 'The south', months: ['good', 'good', 'good', 'best', 'best', 'avoid', 'avoid', 'avoid', 'best', 'best', 'good', 'good'], text: 'Hotter.' },
    { name: 'The Alps', text: 'Ski in winter.' },
  ],
  ...overrides,
});

const show = (overrides) =>
  render(
    <MemoryRouter>
      <CountryWhenToGo name='France' whenToGo={whenToGo(overrides)} />
    </MemoryRouter>,
  );

describe('CountryWhenToGo', () => {
  it('shows the strip’s label and the month strip, named for the country', () => {
    const { container } = show();
    expect(container.querySelector('#country-when-heading').textContent).toBe('When to go');
    expect(within(container).getByText('For Paris and the north.')).toBeTruthy();
    const strip = container.querySelector('ol[aria-label="France, month by month"]');
    expect(strip.querySelectorAll('li').length).toBe(12);
  });

  it('explains every rating in words', () => {
    const { container } = show();
    const legend = container.querySelector('dl');
    expect([...legend.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(['Best', 'Good', 'Avoid']);
    expect([...legend.querySelectorAll('dd')].map((dd) => dd.textContent)).toEqual([
      RATING_MEANINGS.best,
      RATING_MEANINGS.good,
      RATING_MEANINGS.avoid,
    ]);
  });

  it('links the published month pages of its best months only', () => {
    const { container } = show();
    const nav = container.querySelector('nav[aria-label="Where to go, month by month"]');
    expect(within(nav).getByText('Where else is at its best in France’s best months:')).toBeTruthy();
    expect([...nav.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')])).toEqual([['April', '/where-to-go/april']]);
  });

  it('leaves the strip’s label out when there is none', () => {
    const { container } = show({ stripLabel: '' });
    expect(within(container).queryByText('For Paris and the north.')).toBeNull();
  });

  it('gives each season its months in words', () => {
    const { container } = show();
    const seasons = container.querySelectorAll('[aria-labelledby="country-seasons-heading"] li');
    expect(seasons[0].textContent).toContain('Spring (March to May)');
    expect(seasons[0].textContent).toContain('Mild and green.');
    expect(seasons[1].textContent).toContain('Winter (December to February)');
  });

  it('says the weather, and lists the festivals with when and where, a photo where there is one', () => {
    const { container } = show();
    expect(container.querySelector('[aria-labelledby="country-weather-heading"] p').textContent).toBe('Mild in the north, hot in the south.');
    const festivals = container.querySelectorAll('[aria-labelledby="country-festivals-heading"] li');
    expect(festivals[0].textContent).toContain('14 July · Everywhere');
    expect(festivals[0].querySelector('img').getAttribute('src')).toMatch(/festivalPhotos\/bastille-day-640\.webp$/);
    expect(within(festivals[0]).getByText('A. Snapper')).toBeTruthy();
    expect(festivals[1].textContent).toContain('21 June');
    expect(festivals[1].textContent).not.toContain('·');
    expect(festivals[1].querySelector('figure')).toBeNull();
  });

  it('shows how the regions differ, with a strip in words where a region has its months', () => {
    const { container } = show();
    const regions = container.querySelectorAll('[aria-labelledby="country-regions-heading"] > ul > li');
    expect(regions.length).toBe(2);
    expect(regions[0].querySelector('ol').getAttribute('aria-hidden')).toBe('true');
    expect(regions[0].textContent).toContain('Best: Apr–May, Sep–Oct');
    expect(regions[0].textContent).toContain('Avoid: Jun–Aug');
    expect(regions[1].querySelector('ol')).toBeNull();
    expect(regions[1].textContent).toContain('Ski in winter.');
  });

  it('has no regions section when the content gives none', () => {
    const { container } = show({ regions: undefined });
    expect(container.querySelector('#country-regions-heading')).toBeNull();
  });
});
