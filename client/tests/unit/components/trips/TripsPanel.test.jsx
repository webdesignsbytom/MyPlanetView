import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import TripsPanel from '@/components/trips/TripsPanel';
import { createStop } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ createStop: vi.fn() }));

const TRIPS = [
  { id: 't1', title: 'Italian summer', status: 'COMPLETED', startDate: '2025-07-01', endDate: '2025-07-10', stopCount: 2, photoCount: 4 },
  { id: 't2', title: 'Stag do', status: 'PLANNED', linked: true, canOpen: true, organiserMapName: 'Tom’s map' },
];
const TRAVELLERS = [{ id: 'a', name: 'Charlie' }];

function TripPage() {
  const { tripId } = useParams();
  return <p>Trip page {tripId}</p>;
}

const show = (props = {}) => {
  const handlers = { onCreate: vi.fn(), onClose: vi.fn(), ...props };
  const view = render(
    <MemoryRouter initialEntries={['/map']}>
      <Routes>
        <Route path='/map' element={<TripsPanel trips={TRIPS} travellers={TRAVELLERS} canEdit {...props} {...handlers} />} />
        <Route path='/trips/:tripId' element={<TripPage />} />
      </Routes>
    </MemoryRouter>,
  );
  return { ...view, ...handlers };
};

describe('TripsPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists the map’s trips, the group trips marked, with “Plan a new trip” for an editor', () => {
    const { container } = show();
    expect(container.querySelector('h2').textContent).toBe('Trips');
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(screen.getByText('From Tom’s map')).toBeTruthy();
    expect(screen.getByText('Plan a new trip')).toBeTruthy();
    expect(container.querySelector('a[href="/trips/t1"]')).toBeTruthy();
  });

  it('shows no plan button to a viewer, and no links on a share link', () => {
    const { container } = show({ canEdit: false, noLinks: true });
    expect(screen.queryByText('Plan a new trip')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });

  it('closes with its close stamp', () => {
    const { onClose } = show();
    fireEvent.click(screen.getByLabelText('Close Trips'));
    expect(onClose).toHaveBeenCalled();
  });

  it('says why an unverified editor cannot plan one', () => {
    show({ canEdit: false, locked: true });
    expect(screen.getByText('Verify your email address to plan a trip. The link is in the email we sent you.')).toBeTruthy();
    expect(screen.queryByText('Plan a new trip')).toBeNull();
  });

  it('opens an empty passport page with no trips: what a trip does, and a plan button for an editor', () => {
    show({ trips: [] });
    expect(screen.getByText('Where to next?')).toBeTruthy();
    expect(screen.getByText('Add its stops: countries, landmarks and places, with dates.')).toBeTruthy();
    fireEvent.click(screen.getByText('Plan a new trip'));
    expect(screen.getByLabelText(/^Title/).value).toBe('');
    expect(screen.queryByText('Where to next?')).toBeNull();
  });

  it('tells a viewer of an empty map that trips will show up here', () => {
    show({ trips: [], canEdit: false });
    expect(screen.getByText('No trips yet')).toBeTruthy();
    expect(screen.getByText('When trips are added to this map, they show up here.')).toBeTruthy();
    expect(screen.queryByText('Plan a new trip')).toBeNull();
  });

  it('creates a trip and opens its page', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 'new-trip' });
    show({ onCreate });
    fireEvent.click(screen.getByText('Plan a new trip'));
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Lisbon' } });
    fireEvent.click(screen.getByText('Create trip'));
    expect(await screen.findByText('Trip page new-trip')).toBeTruthy();
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Lisbon', travellerIds: ['a'] }));
    expect(createStop).not.toHaveBeenCalled();
  });

  it('cancels the new trip form', () => {
    show();
    fireEvent.click(screen.getByText('Plan a new trip'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByLabelText(/^Title/)).toBeNull();
    expect(screen.getByText('Plan a new trip')).toBeTruthy();
  });

  it('opens from a place’s ticket with the form titled “Trip to <place>”, and gives it that first stop', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 'fr-trip' });
    createStop.mockResolvedValue({ trip: {} });
    show({ planCountry: 'FR', onCreate });
    expect(screen.getByLabelText(/^Title/).value).toBe('Trip to France');
    expect(
      screen.getByText('A trip to France: it starts with France as its first stop, and you can add more on the trip’s page.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Create trip'));
    expect(await screen.findByText('Trip page fr-trip')).toBeTruthy();
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Trip to France' }));
    expect(createStop).toHaveBeenCalledWith('fr-trip', { countryCode: 'FR' });
  });

  it('gives a region’s trip its country as the stop, with the region’s name as the place', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 'bali-trip' });
    createStop.mockResolvedValue({ trip: {} });
    show({ planCountry: 'XB', onCreate });
    expect(screen.getByLabelText(/^Title/).value).toBe('Trip to Bali');
    fireEvent.click(screen.getByText('Create trip'));
    await waitFor(() => expect(createStop).toHaveBeenCalledWith('bali-trip', { countryCode: 'ID', placeName: 'Bali' }));
  });

  it('still opens the new trip when its first stop fails', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 'trip-x' });
    createStop.mockRejectedValue(new Error('offline'));
    show({ planCountry: 'JP', onCreate });
    fireEvent.click(screen.getByText('Create trip'));
    expect(await screen.findByText('Trip page trip-x')).toBeTruthy();
  });

  it('ignores a place to plan for someone who cannot edit', () => {
    show({ planCountry: 'FR', canEdit: false });
    expect(screen.queryByLabelText(/^Title/)).toBeNull();
  });

  it('takes a group trip off the map for its owner', async () => {
    const onRemoveLinked = vi.fn().mockResolvedValue();
    show({ onRemoveLinked });
    // Only the group trip offers it
    expect(screen.queryByLabelText('Take Italian summer off this map')).toBeNull();
    fireEvent.click(screen.getByLabelText('Take Stag do off this map'));
    expect(onRemoveLinked).toHaveBeenCalledWith('t2');
    await waitFor(() => expect(screen.getByLabelText('Take Stag do off this map').disabled).toBe(false));
  });

  it('says why a group trip could not be taken off', async () => {
    const onRemoveLinked = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not allowed.' }));
    show({ onRemoveLinked });
    fireEvent.click(screen.getByLabelText('Take Stag do off this map'));
    expect((await screen.findByRole('alert')).textContent).toBe('Not allowed.');
  });
});
