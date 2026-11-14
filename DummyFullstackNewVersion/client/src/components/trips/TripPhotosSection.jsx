import React, { useState } from 'react';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoUploader from '@/components/photos/PhotoUploader';
import PhotoViewer from '@/components/photos/PhotoViewer';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

// The trip's photos, with adding (editors) and the viewer. Link visitors pass `shareCode`.
function TripPhotosSection({ trip, canEdit, shareCode }) {
  const photos = usePhotoPage(shareCode ? { shareCode } : { tripId: trip.id });
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState(null);

  return (
    <section className='grid gap-3' aria-labelledby='trip-photos-heading'>
      <div className='grid grid-cols-rev items-center gap-3'>
        <h2 id='trip-photos-heading' className='text-xl font-semibold'>
          Photos
        </h2>
        {canEdit ? <Button onClick={() => setUploading(true)}>Add photos</Button> : null}
      </div>
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
          canEdit={canEdit && !shareCode}
          onChanged={photos.replacePhoto}
          onDeleted={photos.removePhoto}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  );
}

export default TripPhotosSection;
