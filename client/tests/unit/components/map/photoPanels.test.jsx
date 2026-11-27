import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MapPhotosPanel from '@/components/map/MapPhotosPanel';
import UnplacedPhotosPanel from '@/components/map/UnplacedPhotosPanel';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
// The grid and the album viewer have tests of their own: stand-ins that show what they got
vi.mock('@/components/photos/PhotoGrid', () => ({
  default: (props) => (
    <div data-grid data-empty={props.emptyText} data-has-more={String(props.hasMore)} data-movable={String(Boolean(props.onMove))}>
      {props.photos.map((photo) => (
        <button key={photo.id} type='button' onClick={() => props.onOpen(photo)}>
          {props.caption ? props.caption(photo) : photo.id}
        </button>
      ))}
      {props.onMove ? (
        <button type='button' onClick={() => props.onMove('p2', 'p1')}>
          Move
        </button>
      ) : null}
    </div>
  ),
}));
vi.mock('@/components/photos/PhotoAlbumViewer', () => ({
  default: (props) => (
    <div data-album-index={props.index}>
      <button type='button' onClick={() => props.onIndex(props.index + 1)}>
        Next photo
      </button>
      <button type='button' onClick={props.onClose}>
        Close album
      </button>
    </div>
  ),
}));

const page = (overrides = {}) => ({
  photos: [
    { id: 'p1', countryCode: 'FR' },
    { id: 'p2', countryCode: null },
  ],
  loading: false,
  error: null,
  nextCursor: 'c2',
  loadMore: vi.fn(),
  reload: vi.fn(),
  movePhoto: vi.fn(),
  ...overrides,
});

describe('MapPhotosPanel', () => {
  it('lists the map’s photos with their country, newest first, a page at a time', () => {
    const photos = page();
    usePhotoPage.mockReturnValue(photos);
    const { container } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onClose={() => {}} />);
    expect(usePhotoPage.mock.calls[0][0]).toMatchObject({ mapId: 'map-1' });
    expect(screen.getByText('France')).toBeTruthy();
    expect(screen.getByText('No country yet')).toBeTruthy();
    expect(container.querySelector('[data-grid]').getAttribute('data-has-more')).toBe('true');
    expect(container.querySelector('[data-grid]').getAttribute('data-empty')).toBe('No photos on this map yet.');
    expect(document.querySelector('[data-map-panel]').getAttribute('class')).toContain('lg:w-[76vw]');
    expect(screen.queryByText('Add photos')).toBeNull();
  });

  // 27 Nov 2026, the user's wish: centred and better looking than a small spinner at the top
  it('while its first page loads, fills the panel with a passport page saying so, under its buttons', () => {
    usePhotoPage.mockReturnValue(page({ photos: [], loading: true, nextCursor: null }));
    const { container } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onAddPhotos={() => {}} onClose={() => {}} />);
    const busy = container.querySelector('[data-panel-busy]');
    expect(busy.getAttribute('role')).toBe('status');
    expect(busy.textContent).toContain('Opening the album…');
    expect(container.querySelector('[data-grid]')).toBeNull();
    // The panel's one child stretches to its height: the buttons on top, the page below them
    expect(busy.parentElement.className).toContain('grid-rows-[auto_minmax(0,1fr)]');
    expect(busy.parentElement.parentElement.className).toContain('content-stretch');
    expect(screen.getByText('Add photos')).toBeTruthy();
  });

  it('keeps the grid, with its own spinner, while more photos load', () => {
    usePhotoPage.mockReturnValue(page({ loading: true }));
    const { container } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onClose={() => {}} />);
    expect(container.querySelector('[data-panel-busy]')).toBeNull();
    expect(container.querySelector('[data-grid]')).not.toBeNull();
  });

  it('opens a photo in the album viewer and steps through it', () => {
    usePhotoPage.mockReturnValue(page());
    const { container } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onClose={() => {}} />);
    fireEvent.click(screen.getByText('France'));
    expect(container.querySelector('[data-album-index]').getAttribute('data-album-index')).toBe('0');
    fireEvent.click(screen.getByText('Next photo'));
    expect(container.querySelector('[data-album-index]').getAttribute('data-album-index')).toBe('1');
    fireEvent.click(screen.getByText('Close album'));
    expect(container.querySelector('[data-album-index]')).toBeNull();
  });

  it('gives an editor "Add photos"', () => {
    usePhotoPage.mockReturnValue(page());
    const onAddPhotos = vi.fn();
    render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onAddPhotos={onAddPhotos} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Add photos'));
    expect(onAddPhotos).toHaveBeenCalled();
  });

  // 24 Nov 2026, the user's wish: "Play my world" moved here from the toolbar
  it('plays the whole map’s slideshow, once there are photos to play', () => {
    usePhotoPage.mockReturnValue(page());
    const onPlay = vi.fn();
    const { unmount } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onPlay={onPlay} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Play my world'));
    expect(onPlay).toHaveBeenCalled();
    unmount();
    usePhotoPage.mockReturnValue(page({ photos: [], nextCursor: null }));
    render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onPlay={onPlay} onClose={() => {}} />);
    expect(screen.queryByText('Play my world')).toBeNull();
  });

  // 25 Nov 2026: a slideshow of some of the album's photos, with its own link (editors); saved,
  // and listed under "Saved slideshows" since 27 Nov 2026, the user's wish
  it('offers its editors a slideshow to make and their saved ones, once there are photos', () => {
    usePhotoPage.mockReturnValue(page());
    const { unmount } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} showMapId='map-1' onClose={() => {}} />);
    expect(screen.getByText('Make a slideshow')).toBeTruthy();
    expect(screen.getByText('Saved slideshows')).toBeTruthy();
    unmount();
    const { unmount: again } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} onClose={() => {}} />);
    expect(screen.queryByText('Make a slideshow')).toBeNull();
    expect(screen.queryByText('Saved slideshows')).toBeNull();
    again();
    usePhotoPage.mockReturnValue(page({ photos: [], nextCursor: null }));
    render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} showMapId='map-1' onClose={() => {}} />);
    expect(screen.queryByText('Make a slideshow')).toBeNull();
    expect(screen.queryByText('Saved slideshows')).toBeNull();
  });

  it('fetches the list again when photos change elsewhere', () => {
    const photos = page();
    usePhotoPage.mockReturnValue(photos);
    const { rerender } = render(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} photosVersion={0} onClose={() => {}} />);
    expect(photos.reload).not.toHaveBeenCalled();
    rerender(<MapPhotosPanel photoSource={{ mapId: 'map-1' }} photosVersion={1} onClose={() => {}} />);
    expect(photos.reload).toHaveBeenCalledTimes(1);
  });
});

describe('UnplacedPhotosPanel', () => {
  it('tells an editor how to give a photo its country, and lets them reorder', () => {
    const photos = page();
    const onOpenPhoto = vi.fn();
    const { container } = render(<UnplacedPhotosPanel photos={photos} canEdit onOpenPhoto={onOpenPhoto} onClose={() => {}} />);
    expect(screen.getByText(/Open one and choose Edit to give it a country/)).toBeTruthy();
    expect(container.querySelector('[data-grid]').getAttribute('data-empty')).toBe('Every photo has a country now.');
    fireEvent.click(screen.getByText('p1'));
    expect(onOpenPhoto).toHaveBeenCalledWith(photos.photos[0]);
    fireEvent.click(screen.getByText('Move'));
    expect(photos.movePhoto).toHaveBeenCalledWith('p2', 'p1', 'country');
  });

  it('only explains to a viewer, who can’t reorder', () => {
    const { container } = render(<UnplacedPhotosPanel photos={page()} canEdit={false} onOpenPhoto={() => {}} onClose={() => {}} />);
    expect(screen.getByText('These photos have no country yet, so they aren’t on the map.')).toBeTruthy();
    expect(container.querySelector('[data-grid]').getAttribute('data-movable')).toBe('false');
  });
});
