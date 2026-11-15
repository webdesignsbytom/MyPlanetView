import React from 'react';
// Components
import MapPanel from './MapPanel';
import PhotoGrid from '@/components/photos/PhotoGrid';

// The photos with no country, which no country's panel shows: no location in the file
// and none chosen, or a location out at sea. Opening one lets an editor choose its
// country (Edit in the photo viewer); it then leaves this list. `photos` is the map
// page's usePhotoPage({ unplaced: true }).
function UnplacedPhotosPanel({ photos, canEdit, onOpenPhoto, onClose }) {
  return (
    <MapPanel title='Unplaced photos' onClose={onClose}>
      <p className='text-sm'>
        {canEdit
          ? 'These photos have no country yet: the file had no location and none was chosen, or the location is out at sea. Open one and choose Edit to give it a country.'
          : 'These photos have no country yet, so they aren’t on the map.'}
      </p>
      <PhotoGrid
        narrow
        photos={photos.photos}
        loading={photos.loading}
        error={photos.error}
        hasMore={Boolean(photos.nextCursor)}
        onLoadMore={photos.loadMore}
        onOpen={onOpenPhoto}
        // The unplaced photos are one gallery on the server, as a country's are
        onMove={canEdit ? (photoId, afterId) => photos.movePhoto(photoId, afterId, 'country') : undefined}
        emptyText='Every photo has a country now.'
      />
    </MapPanel>
  );
}

export default UnplacedPhotosPanel;
