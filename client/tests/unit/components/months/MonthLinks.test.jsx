import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MonthLinks from '@/components/months/MonthLinks';

// The month pages this build has: drafts too, as on the dev server (utils/months/monthPages.js
// keeps only the checked ones for links), listed out of order
const { pages } = vi.hoisted(() => ({
  pages: [
    { month: 9, slug: 'september', status: 'checked' },
    { month: 1, slug: 'january', status: 'checked' },
    { month: 4, slug: 'april', status: 'draft' },
    { month: 6, slug: 'june', status: 'checked' },
  ],
}));
vi.mock('virtual:month-pages', () => ({ MONTH_PAGES: pages, HAS_MONTH_PAGES: true, loadMonthPage: vi.fn() }));

const show = (props) =>
  render(
    <MemoryRouter>
      <MonthLinks lead='Where to go, by month:' {...props} />
    </MemoryRouter>,
  );

const links = (container) => [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);

describe('MonthLinks', () => {
  it('links every published month in calendar order, never a draft', () => {
    const { container } = show();
    expect(links(container)).toEqual([
      ['January', '/where-to-go/january'],
      ['June', '/where-to-go/june'],
      ['September', '/where-to-go/september'],
    ]);
  });

  it('is a navigation landmark with its lead line', () => {
    const { container } = show();
    const nav = container.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Where to go, month by month');
    expect(nav.querySelector('p').textContent).toBe('Where to go, by month:');
  });

  it('links only the months asked for, among the published ones', () => {
    const { container } = show({ months: [4, 6, 9] });
    expect(links(container)).toEqual([
      ['June', '/where-to-go/june'],
      ['September', '/where-to-go/september'],
    ]);
  });

  it('draws nothing when none of the months asked for is published', () => {
    const { container } = show({ months: [4, 12] });
    expect(container.innerHTML).toBe('');
  });
});
