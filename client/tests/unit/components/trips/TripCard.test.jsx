import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripCard from '@/components/trips/TripCard';

const TRIP = {
  id: 'trip-1',
  title: 'Italian summer',
  status: 'PLANNED',
  startDate: '2027-06-01',
  endDate: '2027-06-10',
  stopCount: 2,
  photoCount: 1,
};

const show = (props = {}) => render(<MemoryRouter><ul><TripCard trip={TRIP} {...props} /></ul></MemoryRouter>);

describe('TripCard', () => {
  it('links to the trip, with its status, dates, stops and photos', () => {
    const { container } = show();
    const link = container.querySelector('a');
    expect(link.getAttribute('href')).toBe('/trips/trip-1');
    expect(link.textContent).toContain('Italian summer');
    expect(screen.getByText('Planning · 1 Jun 2027 – 10 Jun 2027 · 2 stops · 1 photo')).toBeTruthy();
  });

  it('counts nothing as no stops and no photos, and leaves out missing dates', () => {
    show({ trip: { id: 't', title: 'Someday', status: 'COMPLETED' } });
    expect(screen.getByText('Done · 0 stops · 0 photos')).toBeTruthy();
  });

  it('is not a link for a share-link visitor', () => {
    const { container } = show({ noLink: true });
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('Italian summer')).toBeTruthy();
  });

  it('shows the cover photo when there is one, else the compass', () => {
    const { container, unmount } = show({ trip: { ...TRIP, coverThumbUrl: 'https://img/cover.webp' } });
    expect(container.querySelector('img').getAttribute('src')).toBe('https://img/cover.webp');
    unmount();
    const again = show();
    expect(again.container.querySelector('img')).toBeNull();
    expect(again.container.textContent).toContain('🧭');
  });

  it('shows a subtitle on an own trip', () => {
    show({ subtitle: 'Shared with you' });
    expect(screen.getByText('Shared with you')).toBeTruthy();
  });

  it('marks a group trip and names the map it comes from, in place of the subtitle', () => {
    show({ trip: { ...TRIP, linked: true, organiserMapName: 'The Morgans', canOpen: true }, subtitle: 'Not shown' });
    expect(screen.getByText('Group trip')).toBeTruthy();
    expect(screen.getByText('From The Morgans')).toBeTruthy();
    expect(screen.queryByText('Not shown')).toBeNull();
  });

  it('shows only the title, dates, status and countries of a group trip the viewer is not on', () => {
    const { container } = show({ trip: { ...TRIP, linked: true, canOpen: false, organiserMapName: 'Tom', countryCodes: ['IT', 'FR'] } });
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('Planning · 1 Jun 2027 – 10 Jun 2027 · Italy, France')).toBeTruthy();
    expect(container.textContent).not.toContain('stops');
  });

  it('offers to take a group trip off the map, and is busy while it does', () => {
    const onRemove = vi.fn();
    const { rerender } = show({ onRemove });
    const button = screen.getByLabelText('Take Italian summer off this map');
    expect(button.textContent).toBe('Take it off this map');
    fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
    rerender(<MemoryRouter><ul><TripCard trip={TRIP} onRemove={onRemove} removing /></ul></MemoryRouter>);
    const busy = screen.getByLabelText('Take Italian summer off this map');
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
  });

  it('has no remove button without onRemove', () => {
    show();
    expect(screen.queryByText('Take it off this map')).toBeNull();
  });
});
