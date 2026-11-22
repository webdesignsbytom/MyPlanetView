import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StatsPanel from '@/components/map/StatsPanel';
import useLandmarks from '@/hooks/useLandmarks';
import { aboutKm, aboutMiles, worldShare } from '@/utils/map/travelStatWords';
import { withProviders } from './helpers';

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
    { travellerId: 't1', name: 'Charlie', countries: 10 },
    { travellerId: 't2', name: 'Alex', countries: 8 },
  ],
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
    expect(t['Distance travelled'][1]).toBe('Home and back, on completed trips');
    expect(t['Days away'][0]).toBe('0');
    expect(t.Regions[0]).toMatch(/^0 of/);
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
    const { container } = open({ ...calls, unplacedCount: 3, compareHref: '/compare?a=m1', passportHref: '/maps/m1/passport' });
    fireEvent.click(screen.getByText('Share a picture of my map'));
    fireEvent.click(screen.getByText('A poster of my map'));
    fireEvent.click(screen.getByText('Your year in travel'));
    fireEvent.click(screen.getByText('Badges and goals'));
    fireEvent.click(screen.getByText('Unplaced photos (3)'));
    for (const fn of Object.values(calls)) expect(fn).toHaveBeenCalled();
    const links = [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
      ['Compare with another map', '/compare?a=m1'],
      ['Passport: landmark stamps', '/maps/m1/passport'],
    ]);
  });

  it('offers none of them through a share link', () => {
    const { container } = open();
    expect(container.querySelectorAll('[data-map-panel] button').length).toBe(1); // the close stamp
    expect(container.querySelector('a')).toBeNull();
  });

  it('lists each traveller’s countries on a map with more than one', () => {
    open({ travellers: [{ id: 't1' }, { id: 't2' }] });
    expect(screen.getByText('Countries each, from completed trips')).toBeTruthy();
    expect(screen.getByText('Charlie').nextSibling.textContent).toBe('10');
    const { container } = open({ travellers: [{ id: 't1' }] });
    expect(container.textContent).not.toContain('Countries each');
  });
});
