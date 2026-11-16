import React, { useState } from 'react';
// Api
import { createTraveller, getTrip } from '@/api/travelApi';
// Hooks
import useMomentPage from '@/hooks/useMomentPage';
// Components
import MomentList from '@/components/moments/MomentList';
import PhotoViewer from '@/components/photos/PhotoViewer';
import PaperCard from '@/components/common/PaperCard';

/**
 * The trip's moments on a paper card (docs/API.md "Moments"), in date order, with "Add a
 * moment" for the trip's editors (`canEdit`, a trip-only editor too: theirs go on this
 * trip, with this trip's photos). A share link (`shareCode`) shows that trip's moments.
 * Only an editor of the map (the trip's `canDelete`) may add a baby born on the way as
 * a traveller, as travellers are the map's.
 */
function TripMoments({ trip, canEdit, shareCode = null, onTripChange }) {
  const list = useMomentPage(shareCode ? { shareCode } : { tripId: trip.id });
  const [openPhotoId, setOpenPhotoId] = useState(null);

  const addTraveller = trip.canDelete
    ? async (body) => {
        const { traveller } = await createTraveller(trip.mapId, body);
        // The trip's traveller names come from its map
        const { trip: fresh } = await getTrip(trip.id);
        onTripChange(fresh);
        return traveller;
      }
    : undefined;

  return (
    <PaperCard title='Moments' titleId='trip-moments-heading'>
      <MomentList
        list={list}
        canEdit={canEdit && !shareCode}
        headingLevel={3}
        travellers={trip.travellers}
        showCountry
        onOpenPhoto={(photo) => setOpenPhotoId(photo.id)}
        emptyText='No moments on this trip yet.'
        form={{
          mapId: trip.mapId,
          tripId: trip.id,
          defaultCountryCode: trip.stops?.[0]?.countryCode || '',
          travellers: trip.travellers,
          photoSource: { tripId: trip.id },
          onAddTraveller: addTraveller,
        }}
      />
      {openPhotoId ? <PhotoViewer photoId={openPhotoId} shareCode={shareCode} onClose={() => setOpenPhotoId(null)} /> : null}
    </PaperCard>
  );
}

export default TripMoments;
