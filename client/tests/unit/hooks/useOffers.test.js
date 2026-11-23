// useOffers, and useGalleryOffers, which picks the cards from it
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useOffers from '@/hooks/useOffers';
import useGalleryOffers from '@/hooks/useGalleryOffers';
import { getOffers, offerClickUrl } from '@/api/offersApi';

vi.mock('@/api/offersApi', () => ({ getOffers: vi.fn(), offerClickUrl: vi.fn() }));

const offer = (id, extra = {}) => ({ id, kind: 'HOTELS', partner: 'Example', title: id, countryCode: null, placements: ['GALLERY', 'SLIDESHOW'], weight: 1, ...extra });
const OFFERS = [offer('general-1'), offer('general-2', { kind: 'TOURS' }), offer('france', { countryCode: 'FR' }), offer('desk', { placements: ['TRAVEL_DESK'] })];

beforeEach(() => {
  vi.resetAllMocks();
  getOffers.mockResolvedValue(OFFERS);
  offerClickUrl.mockImplementation((o, context) => `/go/${o.id}?${new URLSearchParams(context)}`);
});

describe('useOffers', () => {
  it('is loading from the start, then has the live offers', async () => {
    const { result } = renderHook(() => useOffers());
    expect(result.current).toEqual({ offers: [], loading: true, error: null });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.offers).toBe(OFFERS);
  });

  it('asks nothing while disabled', () => {
    const { result } = renderHook(() => useOffers({ enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(getOffers).not.toHaveBeenCalled();
  });

  it('says why they couldn’t be loaded', async () => {
    getOffers.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useOffers());
    await waitFor(() => expect(result.current.error).toBe('The travel offers could not be loaded.'));
    expect(result.current.offers).toEqual([]);
  });
});

describe('useGalleryOffers', () => {
  it('shows no cards when the gallery takes none (a paying viewer)', () => {
    const { result } = renderHook(() => useGalleryOffers({ every: null, slotKey: 'map:m1:FR', plannedTrip: null }));
    expect(result.current).toBeNull();
    expect(getOffers).not.toHaveBeenCalled();
  });

  it('waits for the planned trip’s places before choosing', async () => {
    const { result } = renderHook(() => useGalleryOffers({ every: 12, slotKey: 'map:m1:FR', plannedTrip: undefined }));
    await waitFor(() => expect(getOffers).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it('gives a card per slot, the same one every time, with its link', async () => {
    const { result } = renderHook(() => useGalleryOffers({ every: 12, slotKey: 'trip:t1', plannedTrip: null }));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.every).toBe(12);
    const card = result.current.cardAt(0);
    expect(['general-1', 'general-2']).toContain(card.offer.id);
    expect(result.current.cardAt(0).offer.id).toBe(card.offer.id);
    expect(card.href).toContain(`/go/${card.offer.id}`);
    expect(offerClickUrl.mock.calls.at(-1)[1].placement).toBe('GALLERY');
  });

  it('prefers the country being viewed', async () => {
    const { result } = renderHook(() => useGalleryOffers({ every: 12, slotKey: 'map:m1:FR', country: 'FR', plannedTrip: null }));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.cardAt(3).offer.id).toBe('france');
  });

  it('prefers the country most of the photos around the slot are in', async () => {
    const { result } = renderHook(() => useGalleryOffers({ every: 12, slotKey: 'map:m1', plannedTrip: null }));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.cardAt(1, [{ countryCode: 'FR' }, { countryCode: 'FR' }, { countryCode: 'JP' }]).offer.id).toBe('france');
  });

  it('uses the slideshow’s placement when asked', async () => {
    const { result } = renderHook(() => useGalleryOffers({ every: 12, slotKey: 's', placement: 'SLIDESHOW', plannedTrip: null }));
    await waitFor(() => expect(result.current).not.toBeNull());
    result.current.cardAt(0);
    expect(offerClickUrl.mock.calls.at(-1)[1].placement).toBe('SLIDESHOW');
  });

  it('has no card when no offer fits the placement', async () => {
    getOffers.mockResolvedValue([offer('desk', { placements: ['TRAVEL_DESK'] })]);
    const { result } = renderHook(() => useGalleryOffers({ every: 12, slotKey: 's', plannedTrip: null }));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.cardAt(0)).toBeNull();
  });
});
