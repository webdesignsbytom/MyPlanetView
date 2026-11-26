import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import WhereNextPanel from '@/components/map/WhereNextPanel';
import useCountryGuides from '@/hooks/useCountryGuides';
import { withProviders } from './helpers';

vi.mock('@/hooks/useCountryGuides', () => ({ default: vi.fn() }));
vi.mock('@/utils/countries/countryPages', () => ({ COUNTRY_PAGES: [{ code: 'JP' }, { code: 'IS' }, { code: 'EG' }, { code: 'NO' }] }));
vi.mock('@/components/months/MonthLinks', () => ({ default: ({ months, lead }) => <p data-month-links={months.join(',')}>{lead}</p> }));

const months = (good) => Array.from({ length: 12 }, (_, m) => good[m] || 'avoid');
const GUIDES = [
  // November is month 10
  { code: 'JP', slug: 'japan', months: months({ 10: 'best', 3: 'best' }) },
  { code: 'IS', slug: 'iceland', months: months({ 5: 'best', 6: 'good' }) },
  { code: 'EG', slug: 'egypt', months: months({ 10: 'good' }) },
  { code: 'NO', slug: 'norway', months: months({}) },
];
const visits = (codes) => codes.map((countryCode) => ({ countryCode, status: 'WANT_TO_GO' }));
const open = (props) => {
  const onShowCountry = vi.fn();
  const result = render(withProviders(<WhereNextPanel onShowCountry={onShowCountry} onClose={() => {}} {...props} />));
  return { ...result, onShowCountry };
};

describe('WhereNextPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 23, 12));
    useCountryGuides.mockReturnValue(GUIDES);
  });
  afterEach(() => vi.useRealTimers());

  it('says what to do with nothing marked "Want to go"', () => {
    useCountryGuides.mockReturnValue([]);
    open({ visits: [{ countryCode: 'FR', status: 'VISITED' }] });
    expect(screen.getByText(/Nothing is marked “Want to go” yet/)).toBeTruthy();
  });

  it('waits for the guides it knows are coming', () => {
    useCountryGuides.mockReturnValue([]);
    open({ visits: visits(['JP']) });
    expect(screen.getByRole('status').textContent).toBe('Reading the country guides…');
  });

  it('lists what is good this month, then what comes up by month, then the rest', () => {
    const { container } = open({ visits: visits(['JP', 'IS', 'EG', 'NO', 'PE']) });
    expect(useCountryGuides).toHaveBeenCalledWith(['JP', 'IS', 'EG', 'NO', 'PE']);
    const now = container.querySelector('[aria-labelledby="where-next-now"]');
    expect(now.querySelector('h3').textContent).toBe('Good in November');
    const nowPlaces = [...now.querySelectorAll('[data-where-next]')].map((li) => li.getAttribute('data-where-next'));
    expect(nowPlaces).toEqual(['JP', 'EG']);
    expect(within(now.querySelector('[data-where-next="JP"]')).getByText('Best time')).toBeTruthy();
    expect(within(now.querySelector('[data-where-next="EG"]')).getByText('Good time')).toBeTruthy();
    const later = container.querySelector('[aria-labelledby="where-next-later"]');
    expect(later.querySelector('section').getAttribute('aria-label')).toBe('June');
    expect(later.querySelector('[data-where-next="IS"]')).not.toBeNull();
    expect(container.querySelector('[aria-labelledby="where-next-never"] [data-where-next="NO"]')).not.toBeNull();
    expect(container.querySelector('[aria-labelledby="where-next-no-guide"] [data-where-next="PE"]')).not.toBeNull();
    expect(container.querySelector('[data-month-links]').getAttribute('data-month-links')).toBe('11');
  });

  it('links each guide, and opens a place’s ticket on the map', () => {
    const { container, onShowCountry } = open({ visits: visits(['JP']) });
    const jp = container.querySelector('[data-where-next="JP"]');
    expect(jp.querySelector('a').getAttribute('href')).toBe('/countries/japan');
    expect(jp.textContent).toContain('Best: ');
    fireEvent.click(screen.getByText('Japan'));
    expect(onShowCountry).toHaveBeenCalledWith('JP');
  });

  // 24 Nov 2026, the user's wish
  it('opens with "Open passport", the list or not', () => {
    const { container, unmount } = open({ visits: visits(['JP']), passportHref: '/maps/m1/passport' });
    const link = container.querySelector('[data-passport-link]');
    expect(link.textContent).toBe('Open passport');
    expect(link.getAttribute('href')).toBe('/maps/m1/passport');
    expect(container.querySelector('[data-map-panel] a')).toBe(link);
    unmount();
    useCountryGuides.mockReturnValue([]);
    const empty = open({ visits: [], passportHref: '/shared/ABCD-EFGH-JKMN/passport' });
    expect(empty.container.querySelector('[data-passport-link]').getAttribute('href')).toBe('/shared/ABCD-EFGH-JKMN/passport');
  });

  it('has no passport link without one to go to', () => {
    const { container } = open({ visits: visits(['JP']) });
    expect(container.querySelector('[data-passport-link]')).toBeNull();
  });

  it('says when none is at its best this month', () => {
    open({ visits: visits(['IS']) });
    expect(screen.getByText('None of them is at its best this month.')).toBeTruthy();
  });
});
