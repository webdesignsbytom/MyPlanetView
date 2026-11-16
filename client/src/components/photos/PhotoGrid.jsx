import React, { Suspense, lazy, useState } from 'react';
// Components
import PhotoThumb from './PhotoThumb';
import OfferTile from '@/components/offers/OfferTile';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// The drag-to-rearrange grid (and dnd-kit) download only when an editor rearranges;
// pointing at or focusing the button starts it early
const loadSortableGrid = () => import('./SortablePhotoGrid');
const SortablePhotoGrid = lazy(loadSortableGrid);

// The photos around the slot after photos[index], nearest first: the one before it, the
// one after, then outwards, up to `reach` each way
function photosAround(photos, index, reach) {
  const around = [];
  for (let step = 0; step < reach; step++) {
    if (photos[index - step]) around.push(photos[index - step]);
    if (photos[index + 1 + step]) around.push(photos[index + 1 + step]);
  }
  return around;
}

// A grid of photos with "Show more" paging. `narrow` for narrow places (a map panel);
// `wide` for the map's wide Photos panel (80% of a large screen, 16 Nov 2026, the user's
// wish): three across on phones, then as many columns of at least 9rem as fit (5 on a
// 1024px screen, 6 at 1280, about 9 at 1920), so thousands of photos need less scrolling.
// With `onMove(photoId, afterId)` (editors), "Rearrange photos" lets them drag photos
// into a new order; it returns a promise, and a failure is shown under the grid.
// `offerSlots` (useGalleryOffers): a travel offer card after every `every` photos (docs/API.md,
// "Travel offers"), each one grid cell like a photo, in reading and keyboard order. Never
// while rearranging, and the `photos` themselves never include them.
// `caption(photo)`: a line of text under each photo (the map's Photos panel: its country).
function PhotoGrid({
  photos,
  loading,
  error,
  hasMore,
  onLoadMore,
  onOpen,
  onMove,
  offerSlots = null,
  emptyText = 'No photos yet.',
  narrow = false,
  wide = false,
  caption = null,
}) {
  const [arranging, setArranging] = useState(false);
  const [moveError, setMoveError] = useState(null);
  const columnsClass = wide
    ? 'grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]'
    : narrow
      ? 'grid-cols-3'
      : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6';
  const canArrange = Boolean(onMove) && photos.length > 1;
  const showArranging = arranging && canArrange;

  const move = (photoId, afterId) => {
    setMoveError(null);
    onMove(photoId, afterId).catch((err) => setMoveError(err.friendlyMessage || 'That move could not be saved.'));
  };

  // The plain grid, with its offer cards unless it stands in for the rearranging one
  const tiles = [];
  const tilesBeforeArranging = [];
  photos.forEach((photo, index) => {
    const tile = (
      <li key={photo.id} className={caption ? 'grid content-start gap-1' : undefined}>
        <PhotoThumb photo={photo} onOpen={onOpen} />
        {caption ? <span className='truncate text-center text-xs'>{caption(photo)}</span> : null}
      </li>
    );
    tiles.push(tile);
    tilesBeforeArranging.push(tile);
    const every = showArranging ? null : offerSlots?.every;
    if (!every || (index + 1) % every !== 0) return;
    const slot = (index + 1) / every - 1;
    const card = offerSlots.cardAt(slot, photosAround(photos, index, every));
    if (card) {
      tiles.push(
        <li key={`offer-${slot}`} data-offer-slot={slot}>
          <OfferTile offer={card.offer} href={card.href} />
        </li>,
      );
    }
  });

  const plainGrid = <ul className={`grid gap-2 ${columnsClass}`}>{tiles}</ul>;
  const arrangingFallback = <ul className={`grid gap-2 ${columnsClass}`}>{tilesBeforeArranging}</ul>;

  return (
    <div className='grid gap-3'>
      {canArrange ? (
        <div className='grid justify-items-start gap-1'>
          <button
            type='button'
            onClick={() => setArranging((on) => !on)}
            onPointerEnter={loadSortableGrid}
            onFocus={loadSortableGrid}
            className='text-sm font-medium underline underline-offset-2'
          >
            {showArranging ? 'Done rearranging' : 'Rearrange photos'}
          </button>
          {showArranging ? (
            <p className='text-xs opacity-80'>
              Drag a photo to its new place. On a touch screen, press and hold it first. The order is saved as you go.
            </p>
          ) : null}
        </div>
      ) : null}

      {photos.length ? (
        showArranging ? (
          <Suspense fallback={arrangingFallback}>
            <SortablePhotoGrid photos={photos} onMove={move} columnsClass={columnsClass} />
          </Suspense>
        ) : (
          plainGrid
        )
      ) : !loading && !error ? (
        <p className='text-sm opacity-80'>{emptyText}</p>
      ) : null}

      {error || moveError ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error || moveError}
        </p>
      ) : null}

      {loading ? (
        <div className='grid place-items-center py-2' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading photos…</span>
        </div>
      ) : hasMore ? (
        <button type='button' onClick={onLoadMore} className='justify-self-center text-sm font-medium underline underline-offset-2'>
          Show more photos
        </button>
      ) : null}
    </div>
  );
}

export default PhotoGrid;
