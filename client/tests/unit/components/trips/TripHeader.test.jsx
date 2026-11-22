import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripHeader from '@/components/trips/TripHeader';
import { putTripTravellers, updateTrip } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ putTripTravellers: vi.fn(), updateTrip: vi.fn() }));

const TRIP = {
  id: 'trip-1',
  mapId: 'map-1',
  mapName: 'Charlie & Alex',
  canOpenMap: true,
  canDelete: true,
  title: 'Italian summer',
  description: 'Pasta.\nGelato.',
  status: 'COMPLETED',
  startDate: '2025-07-01',
  endDate: '2025-07-10',
  role: 'OWNER',
  travellers: [
    { id: 'a', name: 'Charlie' },
    { id: 'b', name: 'Alex' },
  ],
  travellerIds: ['a'],
};

const show = (props = {}) => {
  const handlers = { onChanged: vi.fn(), onShare: vi.fn(), onDelete: vi.fn() };
  const view = render(
    <MemoryRouter>
      <TripHeader trip={TRIP} canEdit {...handlers} {...props} />
    </MemoryRouter>,
  );
  return { ...view, ...handlers };
};

describe('TripHeader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('puts the title in the page’s h1 with its status, dates and stamp', () => {
    const { container } = show();
    const h1 = container.querySelector('h1#trip-title');
    expect(h1.textContent).toBe('Italian summer');
    expect(screen.getByText('Done · 1 Jul 2025 – 10 Jul 2025')).toBeTruthy();
    expect(container.textContent).toContain('done');
  });

  it('says what someone added to the trip may do', () => {
    show({ trip: { ...TRIP, role: 'VIEWER' }, canEdit: false });
    expect(screen.getByText('Done · 1 Jul 2025 – 10 Jul 2025 · You can view')).toBeTruthy();
  });

  it('links back to its map for someone who can open it, never through a share link', () => {
    const { container, unmount } = show();
    expect(container.querySelector('a').getAttribute('href')).toBe('/maps/map-1');
    expect(container.querySelector('a').textContent).toBe('Back to Charlie & Alex');
    unmount();
    const shared = show({ linkToMap: false });
    expect(shared.container.querySelector('a')).toBeNull();
    shared.unmount();
    const tripOnly = show({ trip: { ...TRIP, canOpenMap: false } });
    expect(tripOnly.container.querySelector('a')).toBeNull();
  });

  it('shows the notes and who went', () => {
    show();
    expect(screen.getByText(/Pasta\./)).toBeTruthy();
    expect(screen.getByText('Charlie').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Alex').getAttribute('aria-pressed')).toBe('false');
  });

  it('saves a change of who went', async () => {
    const updated = { ...TRIP, travellerIds: ['a', 'b'] };
    putTripTravellers.mockResolvedValue({ trip: updated });
    const { onChanged } = show();
    fireEvent.click(screen.getByText('Alex'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(putTripTravellers).toHaveBeenCalledWith('trip-1', ['a', 'b']);
  });

  it('says why a change of who went failed', async () => {
    putTripTravellers.mockRejectedValue(new Error('x'));
    show();
    fireEvent.click(screen.getByText('Alex'));
    expect((await screen.findByRole('alert')).textContent).toBe('That change could not be saved.');
  });

  it('shows only the chosen travellers, with no buttons, to a viewer', () => {
    show({ canEdit: false, onShare: null, onDelete: null });
    expect(screen.getByText('Charlie').tagName).toBe('SPAN');
    expect(screen.queryByText('Alex')).toBeNull();
    expect(screen.queryByText('Edit trip')).toBeNull();
    expect(screen.queryByText('Delete trip')).toBeNull();
  });

  it('has the Travel Desk first, then Edit, Share and Delete', () => {
    const { onShare, onDelete } = show({ travelDesk: <button type='button'>Travel Desk</button> });
    const labels = [...document.querySelectorAll('button')].map((b) => b.textContent).filter((t) => !['Charlie', 'Alex'].includes(t));
    expect(labels).toEqual(['Travel Desk', 'Edit trip', 'Share', 'Delete trip']);
    fireEvent.click(screen.getByText('Share'));
    expect(onShare).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Delete trip'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('offers no delete to someone added to the trip alone', () => {
    show({ trip: { ...TRIP, canDelete: false, role: 'EDITOR' } });
    expect(screen.getByText('Edit trip')).toBeTruthy();
    expect(screen.queryByText('Delete trip')).toBeNull();
  });

  it('says why an unverified editor’s controls are missing', () => {
    show({ canEdit: false, locked: true, onShare: null, onDelete: null });
    expect(screen.getByText(/Verify your email address to change this trip, its stops, moments or photos/)).toBeTruthy();
  });

  it('edits the trip in the same card, keeping the h1', async () => {
    const updated = { ...TRIP, title: 'Italian summer 2025' };
    updateTrip.mockResolvedValue({ trip: updated });
    const { container, onChanged } = show();
    fireEvent.click(screen.getByText('Edit trip'));
    expect(screen.getByText('Edit trip', { selector: 'h2' })).toBeTruthy();
    const title = await screen.findByLabelText(/^Title/);
    expect(title.value).toBe('Italian summer');
    // No traveller chips in the edit form
    expect(screen.queryByText('Charlie')).toBeNull();
    fireEvent.change(title, { target: { value: 'Italian summer 2025' } });
    fireEvent.click(screen.getByText('Save trip'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(updateTrip).toHaveBeenCalledWith('trip-1', expect.objectContaining({ title: 'Italian summer 2025', status: 'COMPLETED' }));
    expect(updateTrip.mock.calls[0][1]).not.toHaveProperty('travellerIds');
    await waitFor(() => expect(screen.queryByLabelText(/^Title/)).toBeNull());
    expect(container.querySelector('h1#trip-title')).toBeTruthy();
  });

  it('cancels editing', async () => {
    show();
    fireEvent.click(screen.getByText('Edit trip'));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByLabelText(/^Title/)).toBeNull();
    expect(screen.getByText('Edit trip')).toBeTruthy();
  });
});
