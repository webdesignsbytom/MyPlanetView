import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripView from '@/components/trips/TripView';
import TripMiniMap from '@/components/trips/TripMiniMap';
import TripMoments from '@/components/trips/TripMoments';
import TripPhotosSection from '@/components/trips/TripPhotosSection';
import useSplitUk from '@/hooks/useSplitUk';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import useMomentPage from '@/hooks/useMomentPage';
import usePhotoPage from '@/hooks/usePhotoPage';
import useGalleryOffers from '@/hooks/useGalleryOffers';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
import WorldMap from '@/components/map/WorldMap';
import MomentList from '@/components/moments/MomentList';
import { createTraveller, getTrip } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ createTraveller: vi.fn(), getTrip: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useMomentPage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useGalleryOffers', () => ({ default: vi.fn() }));
vi.mock('@/hooks/usePlannedTripPlace', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useMapViewport', () => ({ default: vi.fn(() => ({})) }));
vi.mock('@/components/map/WorldMap', () => ({ default: vi.fn(({ label }) => <svg data-world-map aria-label={label} />) }));
vi.mock('@/components/map/MapBackground', () => ({ default: () => null }));
vi.mock('@/components/moments/MomentList', () => ({
  default: vi.fn(({ onOpenPhoto, emptyText }) => (
    <div data-moment-list>
      {emptyText}
      <button type='button' onClick={() => onOpenPhoto({ id: 'ph1' }, { photos: [{ id: 'ph1' }] })}>
        Open a moment photo
      </button>
    </div>
  )),
}));
vi.mock('@/components/photos/PhotoViewer', () => ({
  default: ({ photoId, canEdit, locked, list }) => (
    <div data-photo-viewer={photoId} data-can-edit={String(Boolean(canEdit))} data-locked={String(Boolean(locked))} data-list={JSON.stringify(list)} />
  ),
}));
vi.mock('@/components/photos/PrintDownload', () => ({ default: ({ scope }) => <div data-print-download={scope.tripId} /> }));
vi.mock('@/components/photos/PhotoUploader', () => ({ default: ({ tripId, defaultCountryCode }) => <div data-uploader={tripId} data-country={defaultCountryCode} /> }));
vi.mock('@/components/map/lazyMapPanels', () => ({
  Slideshow: ({ title, adEvery }) => <div data-slideshow={title} data-ad-every={adEvery} />,
  ShareDialog: ({ resource, id }) => <div data-share-dialog={`${resource}:${id}`} />,
}));
vi.mock('@/components/offers/TravelDesk', () => ({ default: ({ countryCodes }) => <div data-travel-desk={countryCodes.join(',')} /> }));
// TripView's own children are tested on their own; here, what it gives each
vi.mock('@/components/trips/TripHeader', () => ({
  default: ({ canEdit, locked, onShare, onDelete, travelDesk }) => (
    <header data-trip-header data-can-edit={String(canEdit)} data-locked={String(locked)}>
      {onShare ? (
        <button type='button' onClick={onShare}>
          Share the trip
        </button>
      ) : null}
      {onDelete ? (
        <button type='button' onClick={onDelete}>
          Delete the trip
        </button>
      ) : null}
      {travelDesk}
    </header>
  ),
}));
vi.mock('@/components/trips/TripStopList', () => ({ default: ({ canEdit }) => <div data-stop-list={String(canEdit)} /> }));
vi.mock('@/components/trips/TripMyMaps', () => ({ default: ({ locked }) => <div data-my-maps={String(locked)} /> }));

const TRIP = {
  id: 't1',
  mapId: 'm1',
  title: 'Italian summer',
  status: 'COMPLETED',
  role: 'OWNER',
  canDelete: true,
  stops: [
    { id: 's1', countryCode: 'IT', position: 0 },
    { id: 's2', countryCode: 'FR', position: 1 },
  ],
  travellers: [{ id: 'tr1', name: 'Charlie' }],
};
const pageOf = (photos, extra = {}) => ({
  photos,
  loading: false,
  error: null,
  nextCursor: null,
  loadMore: vi.fn(),
  movePhoto: vi.fn(() => Promise.resolve()),
  addPhotos: vi.fn(),
  replacePhoto: vi.fn(),
  removePhoto: vi.fn(),
  ...extra,
});
const PHOTOS = [
  { id: 'p1', caption: 'Rome', thumbUrl: '/1.jpg' },
  { id: 'p2', caption: 'Nice', thumbUrl: '/2.jpg' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useMustVerifyEmail.mockReturnValue(false);
  useMomentPage.mockReturnValue({ moments: [] });
  usePhotoPage.mockReturnValue(pageOf(PHOTOS));
  useGalleryOffers.mockReturnValue(null);
  usePlannedTripPlace.mockReturnValue(null);
});

describe('TripMiniMap', () => {
  it('draws the trip’s countries and numbered stops, named as a route', () => {
    const { container } = render(<TripMiniMap trip={TRIP} />);
    expect(screen.getByLabelText('Route map: Italy, then France')).toBeTruthy();
    const props = WorldMap.mock.lastCall[0];
    expect(props.visitsByCode).toEqual({ IT: 'VISITED', FR: 'VISITED' });
    expect(props.stops).toBe(TRIP.stops);
    expect(props.panZoom).toBe(false);
    expect(container.querySelector('[data-map-style="animated"]').className).toContain('aspect-[2000/1037.2]');
  });

  it('marks a planned trip’s countries as “want to go”, and says when there are no stops', () => {
    render(<TripMiniMap trip={{ ...TRIP, status: 'PLANNED', stops: [] }} />);
    expect(screen.getByLabelText('Italian summer: no stops yet')).toBeTruthy();
    render(<TripMiniMap trip={{ ...TRIP, status: 'PLANNED' }} />);
    expect(WorldMap.mock.lastCall[0].visitsByCode).toEqual({ IT: 'WANT_TO_GO', FR: 'WANT_TO_GO' });
  });

  it('follows the viewer’s Antarctica setting unless the trip stops there', () => {
    const { container, rerender } = render(<TripMiniMap trip={TRIP} showAntarctica={false} />);
    expect(WorldMap.mock.lastCall[0].showAntarctica).toBe(false);
    expect(container.querySelector('[data-map-style]').className).toContain('aspect-[2000/873.6]');
    rerender(<TripMiniMap trip={{ ...TRIP, stops: [{ id: 's', countryCode: 'AQ' }] }} showAntarctica={false} />);
    expect(WorldMap.mock.lastCall[0].showAntarctica).toBe(true);
  });

  it('draws the Black and white style in greys', () => {
    const { container } = render(<TripMiniMap trip={TRIP} styleId='mono' />);
    expect(container.querySelector('[data-map-style="mono"]').className).toContain('grayscale');
  });
});

describe('TripMoments', () => {
  it('lists the trip’s moments for its editors, with its photos and travellers in the form', () => {
    render(<TripMoments trip={TRIP} canEdit onTripChange={() => {}} />);
    expect(screen.getByText('Moments')).toBeTruthy();
    expect(useMomentPage).toHaveBeenCalledWith({ tripId: 't1' });
    const props = MomentList.mock.lastCall[0];
    expect(props.canEdit).toBe(true);
    expect(props.showCountry).toBe(true);
    expect(props.form).toMatchObject({ mapId: 'm1', tripId: 't1', defaultCountryCode: 'IT', photoSource: { tripId: 't1' } });
    expect(typeof props.form.onAddTraveller).toBe('function');
  });

  it('shows a share link’s moments, read only', () => {
    render(<TripMoments trip={TRIP} canEdit shareCode='ABCD' onTripChange={() => {}} />);
    expect(useMomentPage).toHaveBeenCalledWith({ shareCode: 'ABCD' });
    expect(MomentList.mock.lastCall[0].canEdit).toBe(false);
  });

  it('lets only the map’s editors add a baby, then reads the trip again', async () => {
    createTraveller.mockResolvedValue({ traveller: { id: 'baby' } });
    getTrip.mockResolvedValue({ trip: { ...TRIP, title: 'Fresh' } });
    const onTripChange = vi.fn();
    render(<TripMoments trip={TRIP} canEdit onTripChange={onTripChange} />);
    const traveller = await MomentList.mock.lastCall[0].form.onAddTraveller({ name: 'Mia', birthCountryCode: 'IT' });
    expect(traveller).toEqual({ id: 'baby' });
    expect(createTraveller).toHaveBeenCalledWith('m1', { name: 'Mia', birthCountryCode: 'IT' });
    expect(onTripChange).toHaveBeenCalledWith({ ...TRIP, title: 'Fresh' });
    render(<TripMoments trip={{ ...TRIP, canDelete: false }} canEdit onTripChange={() => {}} />);
    expect(MomentList.mock.lastCall[0].form.onAddTraveller).toBeUndefined();
  });

  // 23 Nov 2026: day by day, once the trip has a start date
  it('lays the moments out day by day on a dated trip, the days a level above the moments', () => {
    render(<TripMoments trip={{ ...TRIP, startDate: '2025-07-02', endDate: '2025-07-16' }} canEdit onTripChange={() => {}} />);
    const props = MomentList.mock.lastCall[0];
    expect(props.headingLevel).toBe(4);
    const days = props.groupMoments([{ id: 'm', title: 'Safari', happenedOn: '2025-07-04', datePrecision: 'DAY' }]);
    expect(days.map((d) => d.title)).toEqual(['Day 3 · Friday 4 July 2025']);
    expect(props.emptyText).toContain('a safari, a hike, a meal');

    render(<TripMoments trip={TRIP} canEdit onTripChange={() => {}} />);
    expect(MomentList.mock.lastCall[0].groupMoments).toBeNull();
    expect(MomentList.mock.lastCall[0].headingLevel).toBe(3);
  });

  it('opens a moment’s photo over its moment’s photos', () => {
    render(<TripMoments trip={TRIP} canEdit={false} onTripChange={() => {}} />);
    fireEvent.click(screen.getByText('Open a moment photo'));
    expect(document.querySelector('[data-photo-viewer="ph1"]').getAttribute('data-list')).toBe('{"photos":[{"id":"ph1"}]}');
  });
});

describe('TripPhotosSection', () => {
  const section = (props = {}) => render(<TripPhotosSection trip={TRIP} canEdit {...props} />, { wrapper: MemoryRouter });

  it('lists the trip’s photos with their screen-sized copies, and opens one in the viewer', () => {
    section();
    expect(usePhotoPage).toHaveBeenCalledWith({ tripId: 't1', display: true });
    fireEvent.click(screen.getByLabelText('Open Nice'));
    const viewer = document.querySelector('[data-photo-viewer="p2"]');
    expect(viewer.getAttribute('data-can-edit')).toBe('true');
    expect(viewer.getAttribute('data-list')).toBe('{"filters":{"tripId":"t1","display":true}}');
  });

  it('gives editors Add photos, the uploader starting on the first stop’s country', { timeout: 20000 }, async () => {
    section();
    fireEvent.click(screen.getByText('Add photos'));
    expect(screen.getByText('Add photos to Italian summer')).toBeTruthy();
    await waitFor(() => expect(document.querySelector('[data-uploader="t1"]').getAttribute('data-country')).toBe('IT'), { timeout: 10000 });
  });

  it('says a locked map takes no photos', () => {
    section({ trip: { ...TRIP, uploadRules: { locked: true } } });
    expect(screen.queryByText('Add photos')).toBeNull();
  });

  it('offers rearranging and the download to editors only', () => {
    section();
    expect(screen.getByText('Rearrange photos')).toBeTruthy();
    expect(document.querySelector('[data-print-download="t1"]')).toBeTruthy();
  });

  it('lets an unverified editor download but not change anything', () => {
    section({ canEdit: false, locked: true });
    expect(screen.queryByText('Add photos')).toBeNull();
    expect(screen.queryByText('Rearrange photos')).toBeNull();
    expect(document.querySelector('[data-print-download]')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Open Rome'));
    expect(document.querySelector('[data-photo-viewer]').getAttribute('data-locked')).toBe('true');
  });

  it('shows a share link’s photos with no editing or download', () => {
    section({ canEdit: false, shareCode: 'ABCD' });
    expect(usePhotoPage).toHaveBeenCalledWith({ shareCode: 'ABCD', display: true });
    expect(screen.queryByText('Add photos')).toBeNull();
    expect(document.querySelector('[data-print-download]')).toBeNull();
    fireEvent.click(screen.getByLabelText('Open Rome'));
    expect(document.querySelector('[data-photo-viewer]').getAttribute('data-can-edit')).toBe('false');
  });

  it('plays the trip’s slideshow, with its offer every', () => {
    section({ trip: { ...TRIP, ads: { every: 12 } } });
    fireEvent.click(screen.getByLabelText('Slideshow of Italian summer'));
    const show = document.querySelector('[data-slideshow]');
    expect(show.getAttribute('data-slideshow')).toBe('Slideshow: Italian summer');
    expect(show.getAttribute('data-ad-every')).toBe('12');
    expect(useGalleryOffers.mock.lastCall[0]).toMatchObject({ every: 12, slotKey: 'trip:t1' });
  });

  it('has no slideshow without photos', () => {
    usePhotoPage.mockReturnValue(pageOf([]));
    section();
    expect(screen.getByText('No photos from this trip yet.')).toBeTruthy();
    expect(screen.queryByLabelText('Slideshow of Italian summer')).toBeNull();
  });
});

describe('TripView', () => {
  const view = (props = {}) => render(<TripView trip={TRIP} onTripChange={() => {}} currentUser={{ id: 'u1' }} {...props} />, { wrapper: MemoryRouter });

  it('lays out the trip, editable by its editors', () => {
    view({ onDelete: vi.fn() });
    expect(document.querySelector('[data-trip-header]').getAttribute('data-can-edit')).toBe('true');
    expect(document.querySelector('[data-stop-list]').getAttribute('data-stop-list')).toBe('true');
    expect(screen.getByLabelText('Route map: Italy, then France')).toBeTruthy();
    expect(document.querySelector('[data-travel-desk]').getAttribute('data-travel-desk')).toBe('IT,FR');
  });

  it('gives the UK’s nations to everything under it when the map splits the UK', () => {
    let seen = null;
    const Probe = () => {
      seen = useSplitUk();
      return null;
    };
    WorldMap.mockImplementationOnce(() => <Probe />);
    view({ trip: { ...TRIP, splitUk: true } });
    expect(seen).toBe(true);
  });

  it('locks an unverified editor, saying why where the controls would be', () => {
    useMustVerifyEmail.mockReturnValue(true);
    view();
    const header = document.querySelector('[data-trip-header]');
    expect(header.getAttribute('data-can-edit')).toBe('false');
    expect(header.getAttribute('data-locked')).toBe('true');
  });

  it('only views through a share link', () => {
    view({ shareCode: 'ABCD', currentUser: null });
    expect(document.querySelector('[data-trip-header]').getAttribute('data-can-edit')).toBe('false');
    expect(screen.queryByText('Share the trip')).toBeNull();
  });

  it('opens the share dialog for a signed-in viewer', async () => {
    view();
    fireEvent.click(screen.getByText('Share the trip'));
    await waitFor(() => expect(document.querySelector('[data-share-dialog="trips:t1"]')).toBeTruthy());
  });

  it('asks before deleting the trip, and says why it failed', async () => {
    const onDelete = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not yours to delete.' }));
    view({ onDelete });
    fireEvent.click(screen.getByText('Delete the trip'));
    expect(screen.getByText('Delete “Italian summer” and its stops? Its photos stay on the map.')).toBeTruthy();
    fireEvent.click(screen.getByText('Keep it'));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Delete the trip'));
    fireEvent.click(screen.getByText('Yes, delete the trip'));
    expect(await screen.findByText('Not yours to delete.')).toBeTruthy();
  });

  it('shows “On your maps” for a group trip the viewer could add', () => {
    const { unmount } = view();
    expect(document.querySelector('[data-my-maps]')).toBeNull();
    unmount();
    view({ trip: { ...TRIP, canAddToMyMap: true } });
    expect(document.querySelector('[data-my-maps]').getAttribute('data-my-maps')).toBe('false');
  });
});
