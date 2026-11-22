import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TripStopList from '@/components/trips/TripStopList';
import { createStop, deleteStop, reorderStops, updateStop } from '@/api/travelApi';
import useLandmarks from '@/hooks/useLandmarks';

vi.mock('@/api/travelApi', () => ({ createStop: vi.fn(), deleteStop: vi.fn(), reorderStops: vi.fn(), updateStop: vi.fn() }));
vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));

const STOPS = [
  { id: 's1', countryCode: 'FR' },
  { id: 's2', countryCode: 'IT' },
  { id: 's3', countryCode: 'ES' },
];
const TRIP = { id: 'trip-1', stops: STOPS };

describe('TripStopList', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLandmarks.mockReturnValue({ landmarks: [] });
  });

  it('lists the stops in order on a card named Stops', () => {
    const { container } = render(<TripStopList trip={TRIP} canEdit={false} onChanged={vi.fn()} />);
    expect(container.querySelector('#trip-stops-heading').textContent).toBe('Stops');
    const names = [...container.querySelectorAll('ol > li')].map((li) => li.querySelector('.font-travel.text-lg.uppercase')?.textContent);
    expect(names).toEqual(['France', 'Italy', 'Spain']);
    expect(screen.queryByText('Add a stop')).toBeNull();
  });

  it('says there are none, and opens the new stop form at once for an editor', async () => {
    const { container } = render(<TripStopList trip={{ id: 'trip-1', stops: [] }} canEdit onChanged={vi.fn()} />);
    expect(screen.getByText('No stops yet.')).toBeTruthy();
    expect(container.querySelector('h3').textContent).toBe('Add a stop');
    // Not asked for, so focus stays where it was
    expect(document.activeElement).toBe(document.body);
    expect(await screen.findByLabelText(/^Country/)).toBeTruthy();
  });

  it('swaps two stops when one moves, and hands back the trip', async () => {
    const updated = { ...TRIP, stops: [STOPS[1], STOPS[0], STOPS[2]] };
    reorderStops.mockResolvedValue({ trip: updated });
    const onChanged = vi.fn();
    render(<TripStopList trip={TRIP} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByLabelText('Move stop 1, France down'), { detail: 1 });
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(reorderStops).toHaveBeenCalledWith('trip-1', ['s2', 's1', 's3']);
  });

  it('says why a change failed', async () => {
    reorderStops.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Try again.' }));
    const onChanged = vi.fn();
    render(<TripStopList trip={TRIP} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByLabelText('Move stop 3, Spain up'), { detail: 1 });
    expect((await screen.findByRole('alert')).textContent).toBe('Try again.');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('removes a stop, then puts focus on the next one’s Edit', async () => {
    const updated = { ...TRIP, stops: [STOPS[0], STOPS[2]] };
    deleteStop.mockResolvedValue({ trip: updated });
    const onChanged = vi.fn();
    const { rerender } = render(<TripStopList trip={TRIP} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByLabelText('Remove stop 2, Italy'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(deleteStop).toHaveBeenCalledWith('trip-1', 's2');
    rerender(<TripStopList trip={updated} canEdit onChanged={onChanged} />);
    await waitFor(() => expect(document.activeElement.getAttribute('aria-label')).toBe('Edit stop 2, Spain'));
  });

  it('puts focus on “Add a stop” when the last stop goes', async () => {
    deleteStop.mockResolvedValue({ trip: { id: 'trip-1', stops: [] } });
    render(<TripStopList trip={{ id: 'trip-1', stops: [STOPS[0]] }} canEdit onChanged={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Remove stop 1, France'));
    await waitFor(() => expect(document.activeElement.textContent).toBe('Add a stop'));
  });

  it('saves an edited stop', async () => {
    const updated = { ...TRIP };
    updateStop.mockResolvedValue({ trip: updated });
    const onChanged = vi.fn();
    render(<TripStopList trip={TRIP} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByLabelText('Edit stop 1, France'));
    fireEvent.change(await screen.findByLabelText('Town or place'), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Save stop'));
    await waitFor(() => expect(updateStop).toHaveBeenCalledWith('trip-1', 's1', expect.objectContaining({ countryCode: 'FR', placeName: 'Paris' })));
    expect(onChanged).toHaveBeenCalledWith(updated);
  });

  it('adds a stop from its own form card, and hands focus back to the button on closing', async () => {
    const updated = { ...TRIP, stops: [...STOPS, { id: 's4', countryCode: 'PT' }] };
    createStop.mockResolvedValue({ trip: updated });
    const onChanged = vi.fn();
    const { container } = render(<TripStopList trip={TRIP} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByText('Add a stop'));
    // Asked for: focus on the card's title
    expect(document.activeElement).toBe(container.querySelector('h3'));
    const country = await screen.findByLabelText(/^Country/);
    expect(country.id).toBe('new-stop-country');
    fireEvent.change(country, { target: { value: 'PT' } });
    fireEvent.click(screen.getByText('Add stop'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(createStop).toHaveBeenCalledWith('trip-1', expect.objectContaining({ countryCode: 'PT' }));
    fireEvent.click(screen.getByLabelText('Close the new stop form'));
    expect(document.activeElement.textContent).toBe('Add a stop');
  });
});
