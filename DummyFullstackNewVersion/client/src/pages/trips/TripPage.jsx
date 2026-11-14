import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Api
import { deleteTrip, getTrip } from '@/api/travelApi';
// Constants
import { MAP_PAGE_URL, TRIP_PAGE_URL, mapPath } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useMapSettings from '@/hooks/useMapSettings';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import TripView from '@/components/trips/TripView';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// One trip: anyone with a role on it (its map's people, or people added to the trip alone).
function TripPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useMapSettings({ remote: true });
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setTrip(null);
    setError(null);
    getTrip(tripId)
      .then(({ trip: loaded }) => {
        if (!cancelled) setTrip(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'This trip could not be opened.');
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return (
    <>
      <AppPageHead route={TRIP_PAGE_URL} title={trip?.title} />
      <AppPageShell>
        <InlineAlert>{error}</InlineAlert>
        {!trip && !error ? (
          <div className='grid place-items-center py-16' role='status'>
            <LoadingSpinner md />
            <span className='sr-only'>Opening the trip…</span>
          </div>
        ) : null}
        {trip ? (
          <TripView
            trip={trip}
            onTripChange={(updated) => setTrip((prev) => ({ ...prev, ...updated }))}
            styleId={settings.style}
            currentUser={user}
            onDelete={async () => {
              await deleteTrip(trip.id);
              navigate(mapPath(trip.mapId), { replace: true });
            }}
            onLeft={() => navigate(MAP_PAGE_URL, { replace: true })}
          />
        ) : null}
      </AppPageShell>
    </>
  );
}

export default TripPage;
