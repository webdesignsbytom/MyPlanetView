import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TripMyMaps from '@/components/trips/TripMyMaps';
import { addTripToMap, getTrip, removeTripFromMap } from '@/api/travelApi';
import { forgetMapLists, myMaps } from '@/utils/map/mapListCache';

vi.mock('@/api/travelApi', () => ({ addTripToMap: vi.fn(), getTrip: vi.fn(), removeTripFromMap: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ myMaps: { peek: vi.fn(), load: vi.fn() }, forgetMapLists: vi.fn() }));

const MAPS = [
  { id: 'organiser-map', name: 'Tom’s map', role: 'EDITOR' },
  { id: 'mine', name: 'Charlie & Alex', role: 'OWNER' },
  { id: 'family', name: 'The Morgans', role: 'CO_OWNER' },
  { id: 'viewing', name: 'Jo’s map', role: 'VIEWER' },
  { id: 'work', name: 'Work trips', role: 'EDITOR' },
];
const TRIP = { id: 'stag', mapId: 'organiser-map', status: 'PLANNED', canAddToMyMap: true, onMyMaps: [] };

const show = (props = {}) => {
  const onTripChange = vi.fn();
  const view = render(<TripMyMaps trip={TRIP} userId='user-1' onTripChange={onTripChange} {...props} />);
  return { ...view, onTripChange };
};

describe('TripMyMaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    myMaps.peek.mockReturnValue(null);
    myMaps.load.mockResolvedValue(MAPS);
  });

  it('explains what adding does, and loads your maps only once “Add to my map” is pressed', async () => {
    show();
    expect(screen.getByText(/Add this trip to a map of your own/)).toBeTruthy();
    const add = screen.getByText('Add to my map');
    expect(add.getAttribute('aria-expanded')).toBe('false');
    expect(myMaps.load).not.toHaveBeenCalled();
    fireEvent.click(add);
    expect(add.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Loading your maps…')).toBeTruthy();
    expect(await screen.findByText('Charlie & Alex')).toBeTruthy();
    expect(myMaps.load).toHaveBeenCalledWith('user-1');
  });

  it('offers the maps you own, co-own or edit, never the trip’s own map or one you only view', async () => {
    show();
    fireEvent.click(screen.getByText('Add to my map'));
    await screen.findByText('Charlie & Alex');
    expect(screen.getByLabelText('Add to Charlie & Alex')).toBeTruthy();
    expect(screen.getByLabelText('Add to The Morgans')).toBeTruthy();
    expect(screen.getByLabelText('Add to Work trips')).toBeTruthy();
    expect(screen.queryByText('Jo’s map')).toBeNull();
    expect(screen.queryByText('Tom’s map')).toBeNull();
  });

  it('shows the maps kept from before at once', () => {
    myMaps.peek.mockReturnValue(MAPS);
    show();
    fireEvent.click(screen.getByText('Add to my map'));
    expect(screen.getByLabelText('Add to Work trips')).toBeTruthy();
  });

  it('says a map already shows it', async () => {
    show({ trip: { ...TRIP, onMyMaps: [{ mapId: 'mine', name: 'Charlie & Alex', canRemove: true }] } });
    fireEvent.click(screen.getByText('Add to my map'));
    await screen.findByLabelText('Add to Work trips');
    expect(screen.getByText('Already on it')).toBeTruthy();
    expect(screen.queryByLabelText('Add to Charlie & Alex')).toBeNull();
  });

  it('adds a planned trip to a map, forgets the map lists and says its countries come later', async () => {
    const updated = { ...TRIP, onMyMaps: [{ mapId: 'mine', name: 'Charlie & Alex', canRemove: true }] };
    addTripToMap.mockResolvedValue({ trip: updated });
    const { onTripChange } = show();
    fireEvent.click(screen.getByText('Add to my map'));
    fireEvent.click(await screen.findByLabelText('Add to Charlie & Alex'));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Added to Charlie & Alex. Its countries are marked there once the trip is done.',
    );
    expect(addTripToMap).toHaveBeenCalledWith('stag', 'mine');
    expect(forgetMapLists).toHaveBeenCalled();
    expect(onTripChange).toHaveBeenCalledWith(updated);
    // The list closes
    expect(screen.getByText('Add to my map').getAttribute('aria-expanded')).toBe('false');
  });

  it('says a completed trip’s countries are marked at once', async () => {
    addTripToMap.mockResolvedValue({ trip: TRIP });
    show({ trip: { ...TRIP, status: 'COMPLETED' } });
    fireEvent.click(screen.getByText('Add to my map'));
    fireEvent.click(await screen.findByLabelText('Add to Work trips'));
    expect((await screen.findByRole('status')).textContent).toBe('Added to Work trips, with its countries marked there.');
  });

  it('says why adding failed', async () => {
    addTripToMap.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'That map is locked.' }));
    show();
    fireEvent.click(screen.getByText('Add to my map'));
    fireEvent.click(await screen.findByLabelText('Add to Work trips'));
    expect((await screen.findByRole('alert')).textContent).toBe('That map is locked.');
  });

  it('says when your maps could not be loaded', async () => {
    myMaps.load.mockRejectedValue(new Error('offline'));
    show();
    fireEvent.click(screen.getByText('Add to my map'));
    expect((await screen.findByRole('alert')).textContent).toBe('Your maps could not be loaded.');
    expect(screen.queryByText('Loading your maps…')).toBeNull();
  });

  it('lists the maps showing it, and takes it off one you may', async () => {
    const onMyMaps = [
      { mapId: 'mine', name: 'Charlie & Alex', canRemove: true },
      { mapId: 'family', name: 'The Morgans', canRemove: false },
    ];
    removeTripFromMap.mockResolvedValue({});
    getTrip.mockResolvedValue({ trip: { ...TRIP, onMyMaps: onMyMaps.slice(1) } });
    const { container, onTripChange } = show({ trip: { ...TRIP, onMyMaps } });
    expect(container.querySelector('ul[aria-label="Your maps showing this trip"]').children.length).toBe(2);
    expect(screen.queryByLabelText('Take it off The Morgans')).toBeNull();
    fireEvent.click(screen.getByLabelText('Take it off Charlie & Alex'));
    expect((await screen.findByRole('status')).textContent).toBe('Taken off Charlie & Alex. The countries it marked there stay.');
    expect(removeTripFromMap).toHaveBeenCalledWith('stag', 'mine');
    expect(getTrip).toHaveBeenCalledWith('stag');
    expect(forgetMapLists).toHaveBeenCalled();
    expect(onTripChange).toHaveBeenCalledWith({ ...TRIP, onMyMaps: onMyMaps.slice(1) });
  });

  it('says why taking it off failed', async () => {
    removeTripFromMap.mockRejectedValue(new Error('x'));
    show({ trip: { ...TRIP, onMyMaps: [{ mapId: 'mine', name: 'Charlie & Alex', canRemove: true }] } });
    fireEvent.click(screen.getByLabelText('Take it off Charlie & Alex'));
    expect((await screen.findByRole('alert')).textContent).toBe('The trip could not be taken off that map.');
  });

  it('is locked for an unverified email: no adding, no taking off, and says why', () => {
    show({ locked: true, trip: { ...TRIP, onMyMaps: [{ mapId: 'mine', name: 'Charlie & Alex', canRemove: true }] } });
    expect(screen.getByText(/Verify your email address to add this trip to your maps/)).toBeTruthy();
    expect(screen.queryByText('Add to my map')).toBeNull();
    expect(screen.queryByLabelText('Take it off Charlie & Alex')).toBeNull();
  });

  it('has no add button where the trip can’t be added', async () => {
    show({ trip: { ...TRIP, canAddToMyMap: false } });
    expect(screen.queryByText('Add to my map')).toBeNull();
    await waitFor(() => expect(myMaps.load).not.toHaveBeenCalled());
  });
});
