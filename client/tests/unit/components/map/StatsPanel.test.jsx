import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StatsPanel from '@/components/map/StatsPanel';
import useLandmarks from '@/hooks/useLandmarks';
import { aboutKm, aboutMiles, worldShare } from '@/utils/map/travelStatWords';
import { withProviders } from './helpers';
import { DistanceUnitProvider } from '@/hooks/useDistanceUnit';

vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));

const STATS = {
  countries: 12,
  countriesInWorld: 226,
  continents: 4,
  specialPlaces: 1,
  regions: 2,
  photos: 40,
  landmarks: 9,
  trips: 3,
  daysAway: 1200,
  distanceKm: 23456,
  furthest: { countryCode: 'NZ', km: 18000 },
  homeCountryCode: 'GB',
  byTraveller: [
    { travellerId: 't1', name: 'Charlie', countries: 10, daysAway: 1200 },
    { travellerId: 't2', name: 'Alex', countries: 1, daysAway: 1 },
  ],
};

// Time away in more detail (23 Nov 2026)
const TIME = {
  longestTrip: { tripId: 'trip-1', title: 'Italian summer', days: 15 },
  daysByYear: [
    { year: 2026, days: 2 },
    { year: 2025, days: 40 },
  ],
  daysByPlace: ['IT', 'FR', 'ES', 'PT', 'DE', 'NL', 'BE', 'JP'].map((countryCode, i) => ({ countryCode, days: 20 - i })),
};

const tiles = (container) =>
  Object.fromEntries([...container.querySelectorAll('dl > div')].map((tile) => [tile.querySelector('dt').textContent, [...tile.querySelectorAll('dd')].map((d) => d.textContent)]));

const open = (props = {}) => render(withProviders(<StatsPanel stats={STATS} onClose={() => {}} {...props} />));

describe('StatsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLandmarks.mockReturnValue({ landmarks: [] });
  });

  it('says so when there are no statistics', () => {
    open({ stats: null });
    expect(screen.getByText('No statistics yet.')).toBeTruthy();
  });

  it('shows every count, out of the most there can be', () => {
    const { container } = open();
    const t = tiles(container);
    expect(t.Countries).toEqual(['12']);
    expect(t['Of the world']).toEqual([worldShare(12, 226), '12 of 226 countries']);
    expect(t.Continents).toEqual(['4 of 7']);
    expect(t['Special places']).toEqual(['1 of 5']);
    expect(t.Regions[0]).toMatch(/^2 of \d+$/);
    expect(t.Photos).toEqual(['40']);
    expect(t.Landmarks).toEqual(['9']);
    expect(t['Days away']).toEqual(['1,200', 'On completed trips']);
    expect(t['Distance travelled']).toEqual([`${aboutKm(23456)} km`, `About ${aboutMiles(23456)}`]);
    expect(t['Furthest from home'][0]).toBe('New Zealand');
    expect(t['Furthest from home'][1]).toBe(`About ${aboutKm(18000)} km from the United Kingdom`);
  });

  it('leaves out the world share and the furthest place when it has none, and explains no distance', () => {
    const { container } = open({ stats: { ...STATS, countriesInWorld: 0, furthest: null, distanceKm: 0, daysAway: undefined, regions: undefined } });
    const t = tiles(container);
    expect(t['Of the world']).toBeUndefined();
    expect(t['Furthest from home']).toBeUndefined();
    expect(t['Distance travelled'][1]).toBe('Home and back, to everywhere you’ve been');
    expect(t['Days away'][0]).toBe('0');
    expect(t.Regions[0]).toMatch(/^0 of/);
  });

  // 24 Nov 2026, the user's wish: "Americans in miles always", and what the distance is like
  it('says what the distance travelled is like, and nothing for none', () => {
    const { container } = open();
    expect(container.querySelector('[data-distance-comparison]').textContent).toBe('23,500 km is further than every branch of the Great Wall of China.');
    const none = open({ stats: { ...STATS, distanceKm: 0 } });
    expect(none.container.querySelector('[data-distance-comparison]')).toBeNull();
  });

  it('writes the distances in miles on a map shown in miles, the kilometres under them', () => {
    const { container } = render(
      withProviders(
        <DistanceUnitProvider value='miles'>
          <StatsPanel stats={STATS} onClose={() => {}} />
        </DistanceUnitProvider>,
      ),
    );
    const t = tiles(container);
    expect(t['Distance travelled']).toEqual(['14,600 miles', 'About 23,500 km']);
    expect(t['Furthest from home'][1]).toBe('About 11,200 miles from the United Kingdom');
    expect(container.querySelector('[data-distance-comparison]').textContent).toBe('14,600 miles is further than every branch of the Great Wall of China.');
  });

  it('counts the landmarks been to and the World Heritage Sites among them', () => {
    useLandmarks.mockReturnValue({
      landmarks: [
        { id: 'a', isUnesco: true },
        { id: 'b', isUnesco: false },
        { id: 'c', isUnesco: true },
      ],
    });
    const { container } = open({ collected: { stamped: new Set(['a']), ticked: new Set(['b']) } });
    expect(useLandmarks).toHaveBeenCalledWith(null, { enabled: true });
    const t = tiles(container);
    expect(t['Landmarks been to']).toEqual(['2 of 3']);
    expect(t['World Heritage Sites']).toEqual(['1 of 2']);
    expect(t.Landmarks).toBeUndefined();
  });

  it('offers each way on that it is given', () => {
    const calls = { onShareCard: vi.fn(), onPoster: vi.fn(), onYearRecap: vi.fn(), onShowBadges: vi.fn(), onShowUnplaced: vi.fn() };
    const { container } = open({ ...calls, unplacedCount: 3, compareHref: '/compare?a=m1', vsHref: '/vs', passportHref: '/maps/m1/passport' });
    fireEvent.click(screen.getByText('Share a picture of my map'));
    fireEvent.click(screen.getByText('A poster of my map'));
    fireEvent.click(screen.getByText('Your year in travel'));
    fireEvent.click(screen.getByText('Badges and goals'));
    fireEvent.click(screen.getByText('Unplaced photos (3)'));
    for (const fn of Object.values(calls)) expect(fn).toHaveBeenCalled();
    const links = [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
      ['Compare with another map', '/compare?a=m1'],
      ['Vs mode: compare with friends', '/vs'],
      ['Passport: landmark stamps', '/maps/m1/passport'],
    ]);
  });

  it('offers none of them through a share link', () => {
    const { container } = open();
    // The close stamp, and the collector's counts' "to go" list (not an action)
    const actions = [...container.querySelectorAll('[data-map-panel] button')].filter((b) => !b.closest('[data-collector-counts]'));
    expect(actions).toHaveLength(1);
    expect(container.querySelector('a')).toBeNull();
  });

  it('lists each traveller’s countries and days away on a map with more than one', () => {
    open({ travellers: [{ id: 't1' }, { id: 't2' }] });
    expect(screen.getByText('Each traveller, from completed trips')).toBeTruthy();
    expect(screen.getByText('Charlie').nextSibling.textContent).toBe('10 countries · 1,200 days');
    expect(screen.getByText('Alex').nextSibling.textContent).toBe('1 country · 1 day');
    const { container } = open({ travellers: [{ id: 't1' }] });
    expect(container.textContent).not.toContain('Each traveller');
  });

  // 23 Nov 2026: the share of a life away, for editors with a date of birth
  it('adds each traveller’s share of their life away when the stats carry one', () => {
    const byTraveller = [
      { travellerId: 't1', name: 'Charlie', countries: 10, daysAway: 1200, lifeAwayShare: 9.4 },
      { travellerId: 't2', name: 'Alex', countries: 2, daysAway: 3, lifeAwayShare: 0 },
      { travellerId: 't3', name: 'Mia', countries: 0, daysAway: 0, lifeAwayShare: 0 },
      { travellerId: 't4', name: 'Jo', countries: 1, daysAway: 5, lifeAwayShare: null },
    ];
    open({ stats: { ...STATS, byTraveller }, travellers: byTraveller.map((t) => ({ id: t.travellerId })) });
    expect(screen.getByText('Charlie').nextSibling.textContent).toBe('10 countries · 1,200 days · 9.4% of their life');
    expect(screen.getByText('Alex').nextSibling.textContent).toBe('2 countries · 3 days · under 0.1% of their life');
    // Never away yet, or no date of birth: no share
    expect(screen.getByText('Mia').nextSibling.textContent).toBe('0 countries · 0 days');
    expect(screen.getByText('Jo').nextSibling.textContent).toBe('1 country · 5 days');
  });

  it('names the longest trip, and lists the days away each year and in each country, six then all', () => {
    const { container } = open({ stats: { ...STATS, ...TIME } });
    expect(tiles(container)['Longest trip']).toEqual(['15 days', 'Italian summer']);

    const years = container.querySelector('[data-days-by-year]');
    expect(years.querySelector('h3').textContent).toBe('Days away each year');
    expect([...years.querySelectorAll('li')].map((li) => li.querySelector('span').textContent)).toEqual(['20262 days', '202540 days']);
    // The bars: the biggest the full width, a short stay still showing
    const bars = [...years.querySelectorAll('li [aria-hidden] span')].map((bar) => bar.style.width);
    expect(bars).toEqual(['5%', '100%']);

    const places = container.querySelector('[data-days-by-place]');
    const names = () => [...places.querySelectorAll('li')].map((li) => li.querySelector('span span').textContent);
    expect(names()).toEqual(['Italy', 'France', 'Spain', 'Portugal', 'Germany', 'Netherlands']);
    const more = screen.getByText('Show all 8');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(names()).toHaveLength(8);
    expect(names().at(-1)).toBe('Japan');
    fireEvent.click(screen.getByText('Show fewer'));
    expect(names()).toHaveLength(6);
  });

  // Collector's counts (24 Nov 2026, the user's wish): a counter beside the map's own
  it('counts the UN member states been to, the ones to go opening their countries', () => {
    const onOpenCountry = vi.fn();
    const visits = [
      { countryCode: 'FR', status: 'VISITED' },
      { countryCode: 'GL', status: 'VISITED' },
    ];
    const { container } = open({ stats: { ...STATS, unCountries: 1 }, visits, onOpenCountry });
    const counts = container.querySelector('[data-collector-counts]');
    expect(counts.textContent).toContain('1 of 193');
    fireEvent.click(screen.getByText('Show the 192 to go'));
    fireEvent.click(counts.querySelector('[data-un-to-go="DE"] button'));
    expect(onOpenCountry).toHaveBeenCalledWith('DE');
  });

  it('shows none of the time away when no trip has dates', () => {
    const { container } = open({ stats: { ...STATS, longestTrip: null, daysByYear: [], daysByPlace: [] } });
    expect(tiles(container)['Longest trip']).toBeUndefined();
    expect(container.querySelector('[data-days-by-year]')).toBeNull();
    expect(container.querySelector('[data-days-by-place]')).toBeNull();
  });
});
