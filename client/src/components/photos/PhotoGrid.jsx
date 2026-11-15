import React, { Suspense, lazy, useState } from 'react';
// Components
import PhotoThumb from './PhotoThumb';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// The drag-to-rearrange grid (and dnd-kit) download only when an editor rearranges;
// pointing at or focusing the button starts it early
const loadSortableGrid = () => import('./SortablePhotoGrid');
const SortablePhotoGrid = lazy(loadSortableGrid);

// A grid of photos with "Show more" paging. `narrow` for narrow places (a map panel).
// With `onMove(photoId, afterId)` (editors), "Rearrange photos" lets them drag photos
// into a new order; it returns a promise, and a failure is shown under the grid.
function PhotoGrid({ photos, loading, error, hasMore, onLoadMore, onOpen, onMove, emptyText = 'No photos yet.', narrow = false }) {
  const [arranging, setArranging] = useState(false);
  const [moveError, setMoveError] = useState(null);
  const columnsClass = narrow ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6';
  const canArrange = Boolean(onMove) && photos.length > 1;
  const showArranging = arranging && canArrange;

  const move = (photoId, afterId) => {
    setMoveError(null);
    onMove(photoId, afterId).catch((err) => setMoveError(err.friendlyMessage || 'That move could not be saved.'));
  };

  const plainGrid = (
    <ul className={`grid gap-2 ${columnsClass}`}>
      {photos.map((photo) => (
        <li key={photo.id}>
          <PhotoThumb photo={photo} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );

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
          <Suspense fallback={plainGrid}>
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
