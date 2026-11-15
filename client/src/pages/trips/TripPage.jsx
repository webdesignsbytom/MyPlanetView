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
import { preloadPhotoPage } from '@/hooks/usePhotoPage';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PaperCard from '@/components/common/PaperCard';
import TripView from '@/components/trips/TripView';
import VerifyEmailBanner from '@/components/map/VerifyEmailBanner';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { forgetMapLists } from '@/utils/map/mapListCache';

// One trip: anyone with a role on it (its map's people, or people added to the trip alone).
// In the public pages' poster frame (the side nav, paper cards, the footer): nothing in
// that layout depends on being signed out.
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
    // Its photos (TripPhotosSection's first page) alongside the trip, not after it
    preloadPhotoPage({ tripId });
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
      <PublicPageLayout mainProps={{ 'aria-busy': !trip && !error ? 'true' : undefined }}>
        {/* Signed in with an unverified email: nothing on the trip can change until it is */}
        <VerifyEmailBanner className='justify-self-start' />
        {error ? (
          <PaperCard title='Trip not found' titleId='trip-error-heading' headingLevel={1}>
            <InlineAlert>{error}</InlineAlert>
          </PaperCard>
        ) : null}
        {!trip && !error ? (
          <PaperCard>
            <div className='grid place-items-center py-10' role='status'>
              <LoadingSpinner md />
              <span className='sr-only'>Opening the trip…</span>
            </div>
          </PaperCard>
        ) : null}
        {trip ? (
          <TripView
            trip={trip}
            onTripChange={(updated) => setTrip((prev) => ({ ...prev, ...updated }))}
            styleId={settings.style}
            showAntarctica={settings.showAntarctica}
            currentUser={user}
            onDelete={async () => {
              await deleteTrip(trip.id);
              forgetMapLists();
              // Back to its map, or to your own when you were added to the trip alone
              navigate(trip.canOpenMap ? mapPath(trip.mapId) : MAP_PAGE_URL, { replace: true });
            }}
            onLeft={() => {
              forgetMapLists();
              navigate(MAP_PAGE_URL, { replace: true });
            }}
          />
        ) : null}
      </PublicPageLayout>
    </>
  );
}

export default TripPage;
