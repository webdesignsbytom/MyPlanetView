import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TimelinePanel from '@/components/map/TimelinePanel';
import useMomentPage from '@/hooks/useMomentPage';
import { withProviders } from './helpers';

vi.mock('@/hooks/useMomentPage', () => ({ default: vi.fn() }));

const MOMENTS = [
  { id: 'm1', kind: 'ENGAGEMENT', title: 'Engaged', happenedOn: '2019-06-01', datePrecision: 'DAY', countryCode: 'FR', travellerIds: ['t1', 't2'] },
  { id: 'm2', kind: 'NOTE', title: 'A hidden one', happenedOn: '2021-02-01', datePrecision: 'MONTH', countryCode: 'JP', travellerIds: ['t2'], hidden: true },
  { id: 'm3', kind: 'NOTE', title: 'Undated', happenedOn: null, datePrecision: null, countryCode: 'PE', travellerIds: [] },
];
const TRIPS = [
  { id: 'tr1', title: 'Italian summer', startDate: '2019-06-01', endDate: '2019-06-20', status: 'COMPLETED', travellerIds: ['t1'] },
  { id: 'tr2', title: 'Stag do', startDate: '2022-05-01', endDate: null, status: 'PLANNED', linked: true, organiserMapName: 'Tom’s map', canOpen: false },
];
const list = (overrides = {}) => ({ moments: MOMENTS, nextCursor: null, loading: false, error: null, loadMore: vi.fn(), ...overrides });
const open = (props = {}) => {
  const onShowCountry = vi.fn();
  const result = render(withProviders(<TimelinePanel momentSource={{ mapId: 'map-1' }} trips={TRIPS} onShowCountry={onShowCountry} onClose={() => {}} {...props} />));
  const years = () => [...result.container.querySelectorAll('section h3')].map((h) => h.textContent);
  const items = () => [...result.container.querySelectorAll('ol > li')].map((li) => li.querySelector('span span').textContent);
  return { ...result, onShowCountry, years, items };
};

describe('TimelinePanel', () => {
  beforeEach(() => useMomentPage.mockReturnValue(list()));

  it('asks for the map’s moments 30 at a time', () => {
    open();
    expect(useMomentPage).toHaveBeenCalledWith({ mapId: 'map-1', limit: 30 });
  });

  it('puts moments and trips in date order under each year, a trip before its first day’s moments, undated last', () => {
    const { years, items } = open();
    expect(years()).toEqual(['2019', '2021', '2022', 'Undated']);
    expect(items()).toEqual(['Italian summer', 'Engaged', 'A hidden one', 'Stag do', 'Undated']);
    expect(screen.getByText('Hidden from viewers')).toBeTruthy();
  });

  it('opens a moment’s country, and a trip’s page when it can be opened', () => {
    const { container, onShowCountry } = open();
    fireEvent.click(screen.getByText('Engaged'));
    expect(onShowCountry).toHaveBeenCalledWith('FR');
    expect(container.querySelector('a').getAttribute('href')).toBe('/trips/tr1');
    // A group trip the viewer isn't on is no link
    expect(screen.getByText('Stag do').closest('a')).toBeNull();
    expect(container.textContent).toContain('Group trip from Tom’s map');
  });

  it('links no trip through a share link', () => {
    const { container } = open({ shareCode: 'ABCD-EFGH-JKMN' });
    expect(container.querySelector('a')).toBeNull();
  });

  it('tells one traveller’s story, without the group trips', () => {
    const { container, items } = open({ travellers: [{ id: 't1', name: 'Charlie' }, { id: 't2', name: 'Alex' }] });
    fireEvent.change(container.querySelector('select#timeline-traveller'), { target: { value: 't1' } });
    expect(items()).toEqual(['Italian summer', 'Engaged']);
    fireEvent.change(container.querySelector('select#timeline-traveller'), { target: { value: 't2' } });
    expect(items()).toEqual(['Engaged', 'A hidden one']);
  });

  it('says when one traveller has nothing yet', () => {
    useMomentPage.mockReturnValue(list({ moments: [] }));
    const { container } = open({ trips: [], travellers: [{ id: 't1', name: 'Charlie' }, { id: 't2', name: 'Alex' }] });
    fireEvent.change(container.querySelector('select'), { target: { value: 't2' } });
    expect(screen.getByText('Nothing for them yet.')).toBeTruthy();
  });

  it('holds back the trips after the last moment loaded while more are to come', () => {
    const page = list({ moments: MOMENTS.slice(0, 1), nextCursor: 'c2' });
    useMomentPage.mockReturnValue(page);
    const { items } = open();
    expect(items()).toEqual(['Italian summer', 'Engaged']);
    fireEvent.click(screen.getByText('Show more of the story'));
    expect(page.loadMore).toHaveBeenCalled();
  });

  it('shows a spinner while loading, and an error', () => {
    useMomentPage.mockReturnValue(list({ moments: [], loading: true, error: 'Offline.' }));
    open({ trips: [] });
    expect(screen.getByText('Loading the timeline…')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Offline.');
  });

  it('shows an empty passport page, with an editor’s ways in', () => {
    useMomentPage.mockReturnValue(list({ moments: [] }));
    const onOpenTool = vi.fn();
    open({ trips: [], canEdit: true, onOpenTool });
    expect(screen.getByText('Your story starts here')).toBeTruthy();
    fireEvent.click(screen.getByText('Choose a country'));
    fireEvent.click(screen.getByText('Go to Trips'));
    expect(onOpenTool.mock.calls).toEqual([['countries'], ['trips']]);
  });

  it('tells a viewer nothing is here yet', () => {
    useMomentPage.mockReturnValue(list({ moments: [] }));
    open({ trips: [] });
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    expect(screen.queryByText('Choose a country')).toBeNull();
  });
});
