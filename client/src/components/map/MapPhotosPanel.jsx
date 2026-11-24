import React, { useEffect, useState } from 'react';
// Icons
import { FaPlay } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoAlbumViewer from '@/components/photos/PhotoAlbumViewer';
// Utils
import { countryName } from '@/utils/map/countries';
import { MAP_PHOTOS } from '@/utils/map/mapPhotoLists';

// Under each photo: where it was taken
const countryOf = (photo) => (photo.countryCode ? countryName(photo.countryCode) : 'No country yet');

/**
 * The map's photo album (the toolbar's "Photo album", 16 Nov 2026, the user's wishes): every
 * photo and video on the map in the order they were added, newest first, a page at a time,
 * each with its country written under it. One opens in the album's own viewer, full screen,
 * just the picture and its title, stepping through the album (PhotoAlbumViewer): "a fun
 * album", with nothing to edit (that's the country panels and the trip pages). Viewers see
 * what they may (no hidden ones). An editor's "Add photos" at the top opens the upload panel
 * (`onAddPhotos`), and "Play my world" (`onPlay`, once there are photos; the toolbar's own stamp
 * until 24 Nov 2026, the user's wish: a shorter bar) plays the whole map's slideshow over it.
 * `photosVersion` goes up when photos change elsewhere (an upload, an edit, a delete), and the
 * list is fetched again.
 */
function MapPhotosPanel({ photoSource, photosVersion = 0, onAddPhotos = null, onPlay = null, onClose }) {
  const photos = usePhotoPage({ ...photoSource, ...MAP_PHOTOS });
  const { reload } = photos;
  // The photo showing in the viewer, by id (its place moves if the list reloads)
  const [viewingId, setViewingId] = useState(null);
  const viewing = viewingId ? photos.photos.findIndex((photo) => photo.id === viewingId) : -1;

  useEffect(() => {
    if (photosVersion) reload();
  }, [photosVersion, reload]);
  // Something to play: the slideshow of an empty map would show nothing
  const canPlay = Boolean(onPlay) && photos.photos.length > 0;

  return (
    <MapPanel wide title='Photo album' onClose={onClose}>
      {/* Full width on phones; side by side at the start of the wide panel elsewhere, not long red bars */}
      {canPlay || onAddPhotos ? (
        <div className='grid gap-2 md:grid-flow-col md:justify-start' data-album-actions=''>
          {canPlay ? (
            <MapActionButton onClick={onPlay}>
              <FaPlay aria-hidden='true' />
              <span>Play my world</span>
            </MapActionButton>
          ) : null}
          {onAddPhotos ? <MapActionButton onClick={onAddPhotos}>Add photos</MapActionButton> : null}
        </div>
      ) : null}
      <PhotoGrid
        wide
        photos={photos.photos}
        loading={photos.loading}
        error={photos.error}
        hasMore={Boolean(photos.nextCursor)}
        onLoadMore={photos.loadMore}
        onOpen={(photo) => setViewingId(photo.id)}
        caption={countryOf}
        emptyText='No photos on this map yet.'
      />
      {viewing >= 0 ? (
        <PhotoAlbumViewer
          photos={photos.photos}
          index={viewing}
          onIndex={(i) => setViewingId(photos.photos[i].id)}
          hasMore={Boolean(photos.nextCursor)}
          onLoadMore={photos.loadMore}
          onClose={() => setViewingId(null)}
        />
      ) : null}
    </MapPanel>
  );
}

export default MapPhotosPanel;
