import React, { Suspense, useMemo, useState } from 'react';
// Icons
import { FaPlay } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
import useGalleryOffers from '@/hooks/useGalleryOffers';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';
// Components
import { Slideshow } from '@/components/map/lazyMapPanels';
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoUploader from '@/components/photos/PhotoUploader';
import PhotoViewer from '@/components/photos/PhotoViewer';
import PrintDownload from '@/components/photos/PrintDownload';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import PaperCard from '@/components/common/PaperCard';
import LockedMapNote from '@/components/plans/LockedMapNote';
// Utils
import { isUpcomingPlannedTrip, todayString } from '@/utils/offers/offerContext';

// The trip's photos on a paper card (each on its white photo border, from PhotoThumb),
// with adding (editors), the viewer, and the trip's slideshow (everyone, oldest taken
// first; lazy-loaded). Link visitors pass `shareCode`.
// `locked`: an editor whose email address isn't verified yet (the viewer says why).
// "Print or download" (docs/API.md, "Downloads"): the trip's editors, verified or not,
// get its photos' best copies as a zip; never through a share link.
// Travel offers (docs/API.md, "Travel offers"): a card every `trip.ads.every` photos (none
// for a paying viewer, or on a First Class map) and one at the end of the slideshow,
// chosen for this trip's destination and dates while it's planned and still to come.
function TripPhotosSection({ trip, canEdit, locked = false, shareCode }) {
  // With their screen-sized copies, so the viewer opens a photo at once (and the trip page
  // starts this same list alongside the trip: TripPage)
  const source = useMemo(() => (shareCode ? { shareCode, display: true } : { tripId: trip.id, display: true }), [shareCode, trip.id]);
  const photos = usePhotoPage(source);
  const adEvery = trip.ads?.every ?? null;
  // A client-only page, so today can be read here
  const upcoming = useMemo(() => isUpcomingPlannedTrip(trip, todayString()), [trip]);
  const plannedTrip = usePlannedTripPlace(upcoming ? trip : null);
  const offerSlots = useGalleryOffers({ every: adEvery, slotKey: `trip:${trip.id}`, plannedTrip });
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const play = photos.photos.length ? (
    <Button quiet onClick={() => setPlaying(true)} ariaLabel={`Slideshow of ${trip.title}`}>
      <FaPlay aria-hidden='true' className='self-center text-sm' />
      <span>Slideshow</span>
    </Button>
  ) : null;
  // The map owner's plan, for those who can upload (docs/API.md, "Trips"): a map that
  // isn't paid for takes no photos, so adding is locked with the reason
  const uploadRules = trip.uploadRules || null;
  const isOwner = trip.role === 'OWNER';
  const canDownload = (canEdit || locked) && !shareCode && photos.photos.length > 0;

  return (
    <PaperCard title='Photos' titleId='trip-photos-heading' action={play}>
      {canEdit && uploadRules?.locked ? (
        <LockedMapNote isOwner={isOwner} />
      ) : canEdit ? (
        <div className='grid justify-items-start'>
          <Button onClick={() => setUploading(true)}>Add photos</Button>
        </div>
      ) : null}
      {canDownload ? <PrintDownload scope={{ tripId: trip.id }} title={trip.title} /> : null}
      <PhotoGrid
        photos={photos.photos}
        loading={photos.loading}
        error={photos.error}
        hasMore={Boolean(photos.nextCursor)}
        onLoadMore={photos.loadMore}
        onOpen={(photo) => setOpenId(photo.id)}
        onMove={canEdit && !shareCode ? (photoId, afterId) => photos.movePhoto(photoId, afterId, 'trip') : undefined}
        offerSlots={offerSlots}
        emptyText='No photos from this trip yet.'
      />

      {uploading ? (
        <Modal title={`Add photos to ${trip.title}`} onClose={() => setUploading(false)}>
          <PhotoUploader
            mapId={trip.mapId}
            tripId={trip.id}
            defaultCountryCode={trip.stops?.[0]?.countryCode || ''}
            uploadRules={uploadRules}
            isOwner={isOwner}
            onUploaded={(photo) => photos.addPhotos([photo])}
          />
        </Modal>
      ) : null}

      {openId ? (
        <PhotoViewer
          photoId={openId}
          photo={photos.photos.find((p) => p.id === openId) || null}
          list={{ filters: source }}
          shareCode={shareCode}
          canEdit={(canEdit || locked) && !shareCode}
          locked={locked}
          onChanged={photos.replacePhoto}
          onDeleted={photos.removePhoto}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      {playing ? (
        <Suspense fallback={null}>
          <Slideshow
            source={source}
            title={`Slideshow: ${trip.title}`}
            adEvery={adEvery}
            nextTrip={upcoming ? trip : null}
            mapKey={`trip:${trip.id}`}
            onClose={() => setPlaying(false)}
          />
        </Suspense>
      ) : null}
    </PaperCard>
  );
}

export default TripPhotosSection;
