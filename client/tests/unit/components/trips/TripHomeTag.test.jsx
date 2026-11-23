import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripHomeTag from '@/components/trips/TripHomeTag';
import { HOME_CLOSED_KEY } from '@/utils/trips/tripHome';

const trip = (over = {}) => ({ id: 'trip-jp', title: 'Japan in spring', status: 'COMPLETED', startDate: '2027-03-10', endDate: '2027-03-20', ...over });

const show = (trips, props = {}, at = '/maps/m1') =>
  render(
    <MemoryRouter initialEntries={[at]}>
      <TripHomeTag trips={trips} onSharePicture={vi.fn()} {...props} />
    </MemoryRouter>,
  );
const tag = () => document.querySelector('[data-trip-home]');

describe('TripHomeTag', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    // Midday on 21 March 2027, the day after the trip, in the viewer's own time zone
    vi.setSystemTime(new Date(2027, 2, 21, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('welcomes them home the day after, with a picture to share and the map’s link', () => {
    const onSharePicture = vi.fn();
    const onShareLink = vi.fn();
    show([trip()], { onSharePicture, onShareLink });
    expect(screen.getByRole('region', { name: 'Welcome home' })).toBeTruthy();
    expect(tag().getAttribute('data-trip-home')).toBe('trip-jp');
    expect(screen.getByText('Welcome home from Japan in spring!')).toBeTruthy();
    expect(tag().textContent).toContain('or your map’s link');
    fireEvent.click(screen.getByText('Share a picture'));
    expect(onSharePicture).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-jp' }));
    fireEvent.click(screen.getByText('Send my map’s link'));
    expect(onShareLink).toHaveBeenCalled();
  });

  it('offers only the picture to someone who can’t open the sharing dialog', () => {
    show([trip()], { onShareLink: null });
    expect(screen.getByText('Share a picture')).toBeTruthy();
    expect(screen.queryByText('Send my map’s link')).toBeNull();
    expect(tag().textContent).not.toContain('map’s link');
  });

  it('shows nothing while the trip is still going, or two weeks after', () => {
    show([trip({ endDate: '2027-03-21' })]);
    expect(tag()).toBeNull();
    vi.setSystemTime(new Date(2027, 3, 5, 12));
    show([trip()]);
    expect(tag()).toBeNull();
  });

  it('closed, stays away for good', () => {
    const { unmount } = show([trip()]);
    fireEvent.click(screen.getByLabelText('Close: welcome home'));
    expect(tag()).toBeNull();
    expect(JSON.parse(localStorage.getItem(HOME_CLOSED_KEY))).toEqual(['trip-jp']);
    unmount();
    show([trip()]);
    expect(tag()).toBeNull();
  });

  it('the email’s link (?home=) shows its trip even after it was closed, until closed again', () => {
    localStorage.setItem(HOME_CLOSED_KEY, JSON.stringify(['trip-jp']));
    show([trip({ endDate: '2027-03-01' })], {}, '/maps/m1?home=trip-jp');
    expect(tag().getAttribute('data-trip-home')).toBe('trip-jp');
    fireEvent.click(screen.getByLabelText('Close: welcome home'));
    expect(tag()).toBeNull();
  });

  it('closes for now when storage is blocked', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    show([trip()]);
    fireEvent.click(screen.getByLabelText('Close: welcome home'));
    expect(tag()).toBeNull();
    setItem.mockRestore();
  });
});
