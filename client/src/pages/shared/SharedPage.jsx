import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// Api
import { openShareCode } from '@/api/travelApi';
// Constants
import { HOME_PAGE_URL, SHARED_PAGE_URL } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useMapSettings from '@/hooks/useMapSettings';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import MapExperience from '@/components/map/MapExperience';
import MapStatusScreen from '@/components/map/MapStatusScreen';
import TripView from '@/components/trips/TripView';

// What a share link opens: a map or a trip, to view. No sign-in needed; a signed-in
// member still sees it with their own role (editing happens on the map or trip page).
function SharedPage() {
  const { code } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { settings, updateSetting } = useMapSettings({ remote: isAuthenticated });
  const [shared, setShared] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setShared(null);
    setError(null);
    openShareCode(code)
      .then((result) => {
        if (!cancelled) setShared(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? 'This link doesn’t work. It may have been reset, or sharing may have been turned off.'
              : err.friendlyMessage || 'This link could not be opened.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <>
        <AppPageHead route={SHARED_PAGE_URL} />
        <MapStatusScreen title='Link not working' message={error}>
          <Link to={HOME_PAGE_URL} className='btn-poster'>
            What is this site?
          </Link>
        </MapStatusScreen>
      </>
    );
  }

  if (!shared) {
    return (
      <>
        <AppPageHead route={SHARED_PAGE_URL} />
        <MapStatusScreen loading />
      </>
    );
  }

  if (shared.resource === 'trip') {
    return (
      <>
        <AppPageHead route={SHARED_PAGE_URL} title={shared.trip.title} />
        <PublicPageLayout>
          <TripView
            trip={{ ...shared.trip, role: shared.role }}
            shareCode={code}
            styleId={settings.style}
            showAntarctica={settings.showAntarctica}
            blackAndWhite={settings.blackAndWhite}
            onTripChange={() => {}}
          />
        </PublicPageLayout>
      </>
    );
  }

  return (
    <>
      <AppPageHead route={SHARED_PAGE_URL} title={shared.map.name} />
      <MapExperience
        map={shared.map}
        trips={shared.trips || []}
        role={shared.role}
        shareCode={code}
        currentUser={user}
        settings={settings}
        onChangeSetting={updateSetting}
      />
    </>
  );
}

export default SharedPage;
