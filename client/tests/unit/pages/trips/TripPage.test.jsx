import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import TripPage from '@/pages/trips/TripPage';
import { deleteTrip, getTrip } from '@/api/travelApi';
import { preloadPhotoPage } from '@/hooks/usePhotoPage';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { TRIP_PAGE_URL } from '@/utils/constants/routes';
import { elsewhere, headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ deleteTrip: vi.fn(), getTrip: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ preloadPhotoPage: vi.fn() }));
vi.mock('@/hooks/useMapSettings', () => ({ default: () => ({ settings: { style: 'old-map', showAntarctica: false } }) }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));
vi.mock('@/components/map/VerifyEmailBanner', () => ({ default: () => null }));
// The trip itself is TripView's own test's: a stand-in with its callbacks
vi.mock('@/components/trips/TripView', () => ({
  default: ({ trip, styleId, showAntarctica, onTripChange, onDelete, onLeft }) => (
    <section data-trip-view={trip.title} data-style={styleId} data-antarctica={String(showAntarctica)}>
      <h1>{trip.title}</h1>
      <button type='button' onClick={() => onTripChange({ title: 'Renamed' })}>
        Rename
      </button>
      <button type='button' onClick={onDelete}>
        Delete
      </button>
      <button type='button' onClick={onLeft}>
        Leave
      </button>
    </section>
  ),
}));

const TRIP = { id: 'trip-1', title: 'Italian summer', mapId: 'map-1', canOpenMap: true };
const open = () => renderPage(<TripPage />, { path: TRIP_PAGE_URL, at: '/trips/trip-1', auth: signedIn() });
const view = () => document.querySelector('[data-trip-view]');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TripPage', () => {
  it('has one main, busy with a loading state, and starts the photos with the trip', () => {
    getTrip.mockReturnValue(new Promise(() => {}));
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-busy')).toBe('true');
    expect(main.querySelector('[role="status"]').textContent).toContain('Opening the trip…');
    expect(headings()).toEqual(['Opening the trip']);
    expect(main.querySelector('h1').className).toContain('sr-only');
    expect(getTrip).toHaveBeenCalledWith('trip-1');
    expect(preloadPhotoPage).toHaveBeenCalledWith({ tripId: 'trip-1', display: true });
  });

  it('shows the trip in the viewer’s map style, its h1 the trip’s title', async () => {
    getTrip.mockResolvedValue({ trip: TRIP });
    open();
    await waitFor(() => expect(view()).toBeTruthy());
    expect(headings()).toEqual(['Italian summer']);
    expect(view().getAttribute('data-style')).toBe('old-map');
    expect(view().getAttribute('data-antarctica')).toBe('false');
    expect(onlyMain().main.getAttribute('aria-busy')).toBeNull();
    fireEvent.click(screen.getByText('Rename'));
    expect(headings()).toEqual(['Renamed']);
  });

  it('a trip that can’t be opened keeps an h1 and says why', async () => {
    getTrip.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Trip not shared with you.' }));
    open();
    expect(await screen.findByText('Trip not shared with you.')).toBeTruthy();
    expect(headings()).toEqual(['Trip not found']);
    expect(onlyMain().main.getAttribute('aria-busy')).toBeNull();
  });

  it('deleting the trip goes back to its map', async () => {
    getTrip.mockResolvedValue({ trip: TRIP });
    deleteTrip.mockResolvedValue({});
    open();
    fireEvent.click(await screen.findByText('Delete'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/maps/map-1'));
    expect(deleteTrip).toHaveBeenCalledWith('trip-1');
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('deleting a trip whose map you can’t open goes to your own map', async () => {
    getTrip.mockResolvedValue({ trip: { ...TRIP, canOpenMap: false } });
    deleteTrip.mockResolvedValue({});
    open();
    fireEvent.click(await screen.findByText('Delete'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/map'));
  });

  it('leaving the trip goes to your own map', async () => {
    getTrip.mockResolvedValue({ trip: TRIP });
    open();
    fireEvent.click(await screen.findByText('Leave'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/map'));
    expect(forgetMapLists).toHaveBeenCalled();
  });
});
