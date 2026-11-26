import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecapSlide from '@/components/recap/RecapSlide';
import RecapTag from '@/components/recap/RecapTag';
import YearRecapDialog from '@/components/recap/YearRecapDialog';
import { loadYearRecap } from '@/utils/recap/recap';
import { drawShareCard } from '@/utils/shareCard/drawShareCard';

vi.mock('@/utils/recap/recap', async (importOriginal) => ({ ...(await importOriginal()), loadYearRecap: vi.fn() }));
vi.mock('@/utils/shareCard/drawShareCard', () => ({ drawShareCard: vi.fn() }));

const MAP = { id: 'map-1', name: 'Charlie & Alex’s travels', splitUk: false };

const recap = (over = {}) => ({
  year: 2025,
  years: [2025, 2024],
  places: ['FR', 'IT'],
  countries: 2,
  continents: 1,
  specialPlaces: 0,
  newCountries: ['IT'],
  photos: 4,
  videos: 0,
  topCountries: [{ countryCode: 'FR', photos: 3 }],
  highlights: [{ id: 'p1', countryCode: 'FR', thumbUrl: 'https://img.example/p1.webp', caption: 'Paris at dusk' }, { id: 'p2', countryCode: 'IT', thumbUrl: 'https://img.example/p2.webp' }],
  stamps: { count: 3, landmarks: [{ id: 'l1', name: 'Eiffel Tower', countryCode: 'FR' }, { id: 'l2', name: 'Colosseum', countryCode: 'IT' }] },
  trips: [{ id: 't1', title: 'Italian summer', startDate: '2025-07-01', endDate: '2025-07-14' }],
  moments: 1,
  ...over,
});

const slide = (kind, data = recap()) => render(<RecapSlide kind={kind} recap={data} map={MAP} card={null} headingRef={{ current: null }} />);

beforeEach(() => {
  vi.clearAllMocks();
  drawShareCard.mockReturnValue(new Promise(() => {}));
});

describe('RecapSlide', () => {
  it('the cover names the year and the map', () => {
    const { container } = slide('cover');
    expect(container.querySelector('h3').textContent).toBe('2025');
    expect(container.textContent).toContain('Here’s 2025 on “Charlie & Alex’s travels”');
  });

  it('the places: counts, the new ones by name, and their posters', () => {
    const { container } = slide('places', recap({ specialPlaces: 1 }));
    expect(container.querySelector('h3').textContent).toBe('2 countries');
    expect(container.textContent).toContain('On 1 continent, and 1 special place. New this year: Italy.');
    const posters = container.querySelector('[aria-label="Posters of the places"]');
    expect([...posters.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['France', 'Italy']);
  });

  it('the photos: the count, the top country and a highlight from each', () => {
    const { container } = slide('photos', recap({ videos: 1 }));
    expect(container.querySelector('h3').textContent).toBe('4 photos and 1 video');
    expect(container.textContent).toContain('Most of them in France: 3.');
    const imgs = [...container.querySelectorAll('[aria-label="A photo from each country"] img')];
    expect(imgs.map((img) => img.getAttribute('alt'))).toEqual(['Paris at dusk', 'A photo from Italy']);
  });

  it('the stamps: each landmark and how many more', () => {
    const { container } = slide('stamps');
    expect(container.querySelector('h3').textContent).toBe('3 landmarks stamped');
    expect(container.textContent).toContain('Eiffel Tower, France');
    expect(container.textContent).toContain('And 1 more.');
  });

  it('the trips and moments', () => {
    const { container } = slide('trips');
    expect(container.querySelector('h3').textContent).toBe('1 trip and 1 moment');
    expect(container.textContent).toContain('Italian summer');
    expect(container.textContent).toContain('And 1 moment on the map’s timeline.');
  });

  it('a year of moments alone', () => {
    const { container } = slide('trips', recap({ trips: [], moments: 2 }));
    expect(container.querySelector('h3').textContent).toBe('2 moments');
  });

  it('the share slide holds the share card', () => {
    const { container } = render(<RecapSlide kind='share' recap={recap()} map={MAP} card={{ title: 'x', fileName: 'x.png' }} headingRef={{ current: null }} />);
    expect(container.querySelector('h3').textContent).toBe('Share your 2025');
    expect(screen.getByText('Making your picture…')).toBeTruthy();
  });
});

describe('YearRecapDialog', () => {
  const open = (props = {}) => render(<YearRecapDialog map={MAP} year={2025} onClose={vi.fn()} {...props} />);
  const stage = () => document.querySelector('[aria-roledescription="slide"]');

  it('gathers the year, then shows its slides one at a time, with Back and Next', async () => {
    loadYearRecap.mockResolvedValue(recap());
    open();
    expect(screen.getByText('Gathering your 2025…')).toBeTruthy();
    await waitFor(() => expect(stage()).toBeTruthy());
    expect(loadYearRecap).toHaveBeenCalledWith('map-1', 2025);
    // cover, places, photos, stamps, trips, share
    expect(stage().getAttribute('aria-label')).toBe('1 of 6');
    expect(screen.getByText('1 of 6')).toBeTruthy();
    const back = screen.getByText('Back').closest('button');
    expect(back.disabled).toBe(true);
    fireEvent.click(screen.getByText('Next'));
    expect(stage().querySelector('h3').textContent).toBe('2 countries');
    // Focus goes to the new slide's heading
    expect(document.activeElement).toBe(stage().querySelector('h3'));
    expect(back.disabled).toBe(false);
    fireEvent.click(back);
    expect(stage().querySelector('h3').textContent).toBe('2025');
  });

  it('the arrow keys move between slides, but not from a field or button', async () => {
    loadYearRecap.mockResolvedValue(recap());
    open();
    await waitFor(() => expect(stage()).toBeTruthy());
    fireEvent.keyDown(stage(), { key: 'ArrowRight' });
    fireEvent.keyDown(stage(), { key: 'ArrowRight' });
    expect(stage().getAttribute('aria-label')).toBe('3 of 6');
    fireEvent.keyDown(stage(), { key: 'ArrowLeft' });
    expect(stage().getAttribute('aria-label')).toBe('2 of 6');
    fireEvent.keyDown(screen.getByLabelText('Year'), { key: 'ArrowRight' });
    expect(stage().getAttribute('aria-label')).toBe('2 of 6');
    // Never past either end
    fireEvent.keyDown(stage(), { key: 'ArrowLeft' });
    fireEvent.keyDown(stage(), { key: 'ArrowLeft' });
    expect(stage().getAttribute('aria-label')).toBe('1 of 6');
  });

  // 24 Nov 2026, the user's wish: "offer both on the year card"
  it('offers the card’s map as the whole world or close up, the whole world first', async () => {
    loadYearRecap.mockResolvedValue(recap());
    open();
    await waitFor(() => expect(stage()).toBeTruthy());
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByText('Next'));
    expect(stage().querySelector('h3').textContent).toBe('Share your 2025');
    const world = screen.getByLabelText('Whole world');
    const close = screen.getByLabelText('Close up');
    expect(world.checked).toBe(true);
    expect(drawShareCard).toHaveBeenLastCalledWith(expect.objectContaining({ highlight: ['FR', 'IT'], mapView: 'world' }));
    fireEvent.click(close);
    expect(close.checked).toBe(true);
    expect(drawShareCard).toHaveBeenLastCalledWith(expect.objectContaining({ mapView: 'fit' }));
    fireEvent.click(world);
    expect(drawShareCard).toHaveBeenLastCalledWith(expect.objectContaining({ mapView: 'world' }));
  });

  it('offers no close-up when it would show the whole world anyway', async () => {
    loadYearRecap.mockResolvedValue(recap({ places: ['US', 'JP'] }));
    open();
    await waitFor(() => expect(stage()).toBeTruthy());
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByText('Next'));
    expect(stage().querySelector('h3').textContent).toBe('Share your 2025');
    expect(screen.queryByLabelText('Close up')).toBeNull();
    expect(document.querySelector('[data-recap-map-choice]')).toBeNull();
  });

  it('ends with Done on the share slide', async () => {
    loadYearRecap.mockResolvedValue(recap({ places: [], countries: 0, newCountries: [], stamps: { count: 0, landmarks: [] }, trips: [], moments: 0 }));
    const onClose = vi.fn();
    open({ onClose });
    await waitFor(() => expect(stage()).toBeTruthy());
    expect(stage().getAttribute('aria-label')).toBe('1 of 3');
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.queryByText('Next')).toBeNull();
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('another year starts from its first slide', async () => {
    loadYearRecap.mockImplementation((mapId, year) => Promise.resolve(recap({ year })));
    open();
    await waitFor(() => expect(stage()).toBeTruthy());
    fireEvent.click(screen.getByText('Next'));
    const select = screen.getByLabelText('Year');
    expect([...select.querySelectorAll('option')].map((o) => o.value)).toEqual(['2025', '2024']);
    fireEvent.change(select, { target: { value: '2024' } });
    await waitFor(() => expect(stage()?.querySelector('h3').textContent).toBe('2024'));
    expect(loadYearRecap).toHaveBeenLastCalledWith('map-1', 2024);
    expect(stage().getAttribute('aria-label')).toBe('1 of 6');
  });

  it('says when a year has nothing, and when it couldn’t be loaded', async () => {
    loadYearRecap.mockResolvedValue(recap({ places: [], photos: 0, videos: 0, trips: [], moments: 0 }));
    const first = open();
    expect(await screen.findByText(/Nothing on “Charlie & Alex’s travels” for 2025 yet\..*Choose another year above\./)).toBeTruthy();
    expect(screen.queryByText('Next')).toBeNull();
    first.unmount();
    loadYearRecap.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Recaps are resting.' }));
    open();
    expect((await screen.findByText('Recaps are resting.')).getAttribute('role')).toBe('alert');
  });
});

describe('RecapTag', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const at = (iso) => vi.useFakeTimers({ toFake: ['Date'], now: new Date(iso) });

  it('in December offers this year’s recap once there is something, and opens it', async () => {
    at('2026-12-10T12:00:00Z');
    loadYearRecap.mockResolvedValue(recap({ year: 2026 }));
    const onOpen = vi.fn();
    const { container } = render(<RecapTag mapId='map-1' onOpen={onOpen} />);
    await waitFor(() => expect(container.querySelector('[data-recap-tag]')).toBeTruthy());
    expect(loadYearRecap).toHaveBeenCalledWith('map-1', 2026);
    expect(container.querySelector('[data-recap-tag]').getAttribute('aria-label')).toBe('Your 2026 in travel');
    fireEvent.click(screen.getByText('See your year'));
    expect(onOpen).toHaveBeenCalledWith(2026);
  });

  it('in January it is last year’s', async () => {
    at('2027-01-05T12:00:00Z');
    loadYearRecap.mockResolvedValue(recap({ year: 2026 }));
    const { container } = render(<RecapTag mapId='map-1' onOpen={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-recap-tag]')).toBeTruthy());
    expect(loadYearRecap).toHaveBeenCalledWith('map-1', 2026);
  });

  it('shows nothing out of season, or for an empty year', async () => {
    at('2026-11-22T12:00:00Z');
    const out = render(<RecapTag mapId='map-1' onOpen={() => {}} />);
    expect(loadYearRecap).not.toHaveBeenCalled();
    expect(out.container.innerHTML).toBe('');
    out.unmount();
    at('2026-12-10T12:00:00Z');
    loadYearRecap.mockResolvedValue(recap({ places: [], photos: 0, videos: 0, trips: [], moments: 0 }));
    const { container } = render(<RecapTag mapId='map-1' onOpen={() => {}} />);
    await act(async () => {});
    expect(container.innerHTML).toBe('');
  });

  it('closes for the visit', async () => {
    at('2026-12-10T12:00:00Z');
    loadYearRecap.mockResolvedValue(recap({ year: 2026 }));
    const first = render(<RecapTag mapId='map-1' onOpen={() => {}} />);
    await waitFor(() => expect(first.container.querySelector('[data-recap-tag]')).toBeTruthy());
    fireEvent.click(first.container.querySelector('button[aria-label="Close: your 2026 in travel"]'));
    expect(first.container.querySelector('[data-recap-tag]')).toBeNull();
    expect(sessionStorage.getItem('mpv:recapTagClosed')).toBe('1');
    first.unmount();
    loadYearRecap.mockClear();
    render(<RecapTag mapId='map-1' onOpen={() => {}} />);
    expect(loadYearRecap).not.toHaveBeenCalled();
  });
});
