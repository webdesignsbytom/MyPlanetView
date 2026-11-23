import React, { useState } from 'react';
// Api
import { createTraveller, getTrip } from '@/api/travelApi';
// Hooks
import useMomentPage from '@/hooks/useMomentPage';
// Components
import MomentList from '@/components/moments/MomentList';
import PhotoViewer from '@/components/photos/PhotoViewer';
import PaperCard from '@/components/common/PaperCard';
// Utils
import { tripMomentDays } from '@/utils/trips/tripDays';

/**
 * The trip's moments on a paper card (docs/API.md "Moments"), in date order, with "Add a
 * moment" for the trip's editors (`canEdit`, a trip-only editor too: theirs go on this
 * trip, with this trip's photos). A share link (`shareCode`) shows that trip's moments.
 * Only an editor of the map (the trip's `canDelete`) may add a baby born on the way as
 * a traveller, as travellers are the map's. Day by day (23 Nov 2026, the user's wish: a
 * safari day on a trip to Kenya): each moment under its day of the trip, with where the trip
 * was that day (utils/trips/tripDays.js), once the trip has a start date.
 */
function TripMoments({ trip, canEdit, shareCode = null, onTripChange }) {
  const list = useMomentPage(shareCode ? { shareCode } : { tripId: trip.id });
  const byDay = Boolean(trip.startDate);
  // The moment photo open, with the moment's photos to step through
  const [open, setOpen] = useState(null);

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
        // The days are h3 under the card's h2, the moments under them h4
        headingLevel={byDay ? 4 : 3}
        groupMoments={byDay ? (moments) => tripMomentDays(trip, moments) : null}
        travellers={trip.travellers}
        showCountry
        onOpenPhoto={(photo, photoList) => setOpen({ photo, list: photoList })}
        emptyText='No moments on this trip yet. Add the days to remember: a safari, a hike, a meal.'
        form={{
          mapId: trip.mapId,
          tripId: trip.id,
          defaultCountryCode: trip.stops?.[0]?.countryCode || '',
          travellers: trip.travellers,
          photoSource: { tripId: trip.id },
          onAddTraveller: addTraveller,
        }}
      />
      {open ? <PhotoViewer photoId={open.photo.id} photo={open.photo} list={open.list} shareCode={shareCode} onClose={() => setOpen(null)} /> : null}
    </PaperCard>
  );
}

export default TripMoments;
