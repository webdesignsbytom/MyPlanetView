import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripCountdownTag from '@/components/trips/TripCountdownTag';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
import useCountryGuides from '@/hooks/useCountryGuides';

vi.mock('@/hooks/usePlannedTripPlace', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useCountryGuides', () => ({ default: vi.fn() }));
vi.mock('@/components/offers/TravelDesk', () => ({
  default: ({ countryCodes, trip }) => <span data-travel-desk={countryCodes.join(',')} data-trip={trip?.tripId} />,
}));

const JAPAN = { stops: [{ countryCode: 'JP', destination: 'Japan' }], tripId: 'trip-jp' };
// March good, April and May best
const GUIDE = { code: 'JP', name: 'Japan', months: ['avoid', 'avoid', 'good', 'best', 'best', 'avoid', 'avoid', 'avoid', 'avoid', 'good', 'good', 'avoid'] };
const trip = (over = {}) => ({ id: 'trip-jp', title: 'Japan in spring', status: 'PLANNED', startDate: '2027-03-13', ...over });

const show = (trips) => render(<MemoryRouter><TripCountdownTag trips={trips} /></MemoryRouter>);

describe('TripCountdownTag', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Midday on 1 March 2027, in the viewer's own time zone
    vi.setSystemTime(new Date(2027, 2, 1, 12));
    usePlannedTripPlace.mockReturnValue(JAPAN);
    useCountryGuides.mockReturnValue([GUIDE]);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the days to the soonest planned trip, with when to go and the desk', () => {
    const { container } = show([trip({ id: 'later', title: 'Later', startDate: '2027-08-01' }), trip(), trip({ id: 'done', status: 'COMPLETED', startDate: '2027-03-05' })]);
    const tag = container.querySelector('[data-trip-countdown]');
    expect(tag.getAttribute('aria-label')).toBe('Your next trip');
    expect(tag.tagName).toBe('SECTION');
    expect(screen.getByText('12 days until Japan in spring')).toBeTruthy();
    expect(screen.getByText('March is a good time for Japan; the best is April to May.')).toBeTruthy();
    expect(screen.getByText('Open the trip').getAttribute('href')).toBe('/trips/trip-jp');
    expect(container.querySelector('[data-travel-desk]').getAttribute('data-travel-desk')).toBe('JP');
    // The place and the guide are asked for the trip it shows, only while it shows
    expect(usePlannedTripPlace).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-jp' }), { enabled: true });
    expect(useCountryGuides).toHaveBeenCalledWith(['JP'], { enabled: true });
  });

  it('says a trip starting today starts today, and one day ahead in the singular', () => {
    const { unmount } = show([trip({ startDate: '2027-03-01' })]);
    expect(screen.getByText('Japan in spring starts today')).toBeTruthy();
    unmount();
    show([trip({ startDate: '2027-03-02' })]);
    expect(screen.getByText('1 day until Japan in spring')).toBeTruthy();
  });

  it('shows nothing with no planned trip, a past one or one over a year away', () => {
    const { container, rerender } = show([]);
    expect(container.innerHTML).toBe('');
    rerender(<MemoryRouter><TripCountdownTag trips={[trip({ startDate: '2027-02-28' })]} /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
    rerender(<MemoryRouter><TripCountdownTag trips={[trip({ startDate: '2028-03-02' })]} /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
    rerender(<MemoryRouter><TripCountdownTag trips={[trip({ startDate: null })]} /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
  });

  it('shows a trip a whole year ahead', () => {
    show([trip({ startDate: '2028-02-29' })]);
    expect(screen.getByText('365 days until Japan in spring')).toBeTruthy();
  });

  it('leaves out the link to a group trip the viewer cannot open', () => {
    show([trip({ canOpen: false })]);
    expect(screen.queryByText('Open the trip')).toBeNull();
  });

  it('puts the link and the desk in two columns across the tag, the desk in the bottom right', () => {
    const { container, unmount } = show([trip()]);
    const actions = container.querySelector('[data-trip-countdown-actions]');
    expect(actions.className).toContain('grid-cols-2');
    expect(actions.className).toContain('col-span-2');
    // The row is the tag's last, under the close stamp
    expect(actions.parentElement.lastElementChild).toBe(actions);
    const [link, desk] = actions.children;
    expect(link.textContent).toBe('Open the trip');
    expect(desk.hasAttribute('data-trip-countdown-desk')).toBe(true);
    expect(desk.className).toContain('col-start-2');
    expect(desk.className).toContain('justify-self-end');
    unmount();

    // With no link, the desk keeps its corner
    const alone = show([trip({ canOpen: false })]);
    const onlyDesk = alone.container.querySelector('[data-trip-countdown-actions]');
    expect(onlyDesk.children).toHaveLength(1);
    expect(onlyDesk.firstElementChild.className).toContain('col-start-2');
  });

  it('has no row of actions with neither the link nor the desk', () => {
    usePlannedTripPlace.mockReturnValue(null);
    useCountryGuides.mockReturnValue([]);
    const { container } = show([trip({ canOpen: false })]);
    expect(container.querySelector('[data-trip-countdown-actions]')).toBeNull();
  });

  it('has no desk or month line while the place is unknown', () => {
    usePlannedTripPlace.mockReturnValue(null);
    useCountryGuides.mockReturnValue([]);
    const { container } = show([trip()]);
    expect(container.querySelector('[data-travel-desk]')).toBeNull();
    expect(container.textContent).not.toContain('time for');
    expect(useCountryGuides).toHaveBeenCalledWith([], { enabled: false });
  });

  it('closes for the day, and comes back on another day or for another trip', () => {
    const { container, unmount } = show([trip()]);
    fireEvent.click(screen.getByLabelText('Close: your next trip'));
    expect(container.querySelector('[data-trip-countdown]')).toBeNull();
    expect(sessionStorage.getItem('mpv:tripCountdownClosed')).toBe('trip-jp:2027-03-01');
    unmount();

    // The same trip the same day: still closed, and its place isn't asked for
    usePlannedTripPlace.mockClear();
    const again = show([trip()]);
    expect(again.container.querySelector('[data-trip-countdown]')).toBeNull();
    expect(usePlannedTripPlace).toHaveBeenLastCalledWith(expect.anything(), { enabled: false });
    again.unmount();

    // Another trip
    const other = show([trip({ id: 'trip-2' })]);
    expect(other.container.querySelector('[data-trip-countdown]')).toBeTruthy();
    other.unmount();

    // The next day
    vi.setSystemTime(new Date(2027, 2, 2, 9));
    show([trip()]);
    expect(screen.getByText('11 days until Japan in spring')).toBeTruthy();
  });
});
