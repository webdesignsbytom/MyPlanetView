import React from 'react';
// Components
import PhotoThumb from './PhotoThumb';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// A grid of photos with "Show more" paging. `columns` for narrow places (a map panel).
function PhotoGrid({ photos, loading, error, hasMore, onLoadMore, onOpen, emptyText = 'No photos yet.', narrow = false }) {
  return (
    <div className='grid gap-3'>
      {photos.length ? (
        <ul className={`grid gap-2 ${narrow ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'}`}>
          {photos.map((photo) => (
            <li key={photo.id}>
              <PhotoThumb photo={photo} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      ) : !loading && !error ? (
        <p className='text-sm opacity-80'>{emptyText}</p>
      ) : null}

      {error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
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
