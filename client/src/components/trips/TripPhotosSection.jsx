import React, { useState } from 'react';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoUploader from '@/components/photos/PhotoUploader';
import PhotoViewer from '@/components/photos/PhotoViewer';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import PaperCard from '@/components/common/PaperCard';

// The trip's photos on a paper card (each on its white photo border, from PhotoThumb),
// with adding (editors) and the viewer. Link visitors pass `shareCode`.
// `locked`: an editor whose email address isn't verified yet (the viewer says why).
function TripPhotosSection({ trip, canEdit, locked = false, shareCode }) {
  const photos = usePhotoPage(shareCode ? { shareCode } : { tripId: trip.id });
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState(null);

  return (
    <PaperCard title='Photos' titleId='trip-photos-heading'>
      {canEdit ? (
        <div className='grid justify-items-start'>
          <Button onClick={() => setUploading(true)}>Add photos</Button>
        </div>
      ) : null}
      <PhotoGrid
        photos={photos.photos}
        loading={photos.loading}
        error={photos.error}
        hasMore={Boolean(photos.nextCursor)}
        onLoadMore={photos.loadMore}
        onOpen={(photo) => setOpenId(photo.id)}
        emptyText='No photos from this trip yet.'
      />

      {uploading ? (
        <Modal title={`Add photos to ${trip.title}`} onClose={() => setUploading(false)}>
          <PhotoUploader
            mapId={trip.mapId}
            tripId={trip.id}
            defaultCountryCode={trip.stops?.[0]?.countryCode || ''}
            onUploaded={(photo) => photos.addPhotos([photo])}
          />
        </Modal>
      ) : null}

      {openId ? (
        <PhotoViewer
          photoId={openId}
          shareCode={shareCode}
          canEdit={(canEdit || locked) && !shareCode}
          locked={locked}
          onChanged={photos.replacePhoto}
          onDeleted={photos.removePhoto}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </PaperCard>
  );
}

export default TripPhotosSection;
