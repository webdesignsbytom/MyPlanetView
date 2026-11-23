import React, { Suspense, lazy, useEffect, useState } from 'react';
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
import MapStatusScreen from '@/components/map/MapStatusScreen';

// The map's code (about 320 KB gzip) starts loading as this page's code runs, alongside the
// link's own request, behind the loading stamps (19 Nov 2026, the audit: it had to arrive
// before the page showed or asked anything); a trip's page only for a trip's link
const mapExperience = import('@/components/map/MapExperience');
mapExperience.catch(() => {}); // a failure shows when it's drawn (the error screen)
const MapExperience = lazy(() => mapExperience);
const TripView = lazy(() => import('@/components/trips/TripView'));

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
        <MapStatusScreen styleId={settings.style} title='Link not working' message={error}>
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
        <MapStatusScreen loading styleId={settings.style} heading='Opening the shared link' />
      </>
    );
  }

  if (shared.resource === 'trip') {
    return (
      <>
        <AppPageHead route={SHARED_PAGE_URL} title={shared.trip.title} />
        <Suspense fallback={<MapStatusScreen loading styleId={settings.style} heading='Opening the shared trip' />}>
          <PublicPageLayout>
            <TripView
              trip={{ ...shared.trip, role: shared.role }}
              shareCode={code}
              styleId={settings.style}
              showAntarctica={settings.showAntarctica}
              onTripChange={() => {}}
            />
          </PublicPageLayout>
        </Suspense>
      </>
    );
  }

  return (
    <>
      <AppPageHead route={SHARED_PAGE_URL} title={shared.map.name} />
      <Suspense fallback={<MapStatusScreen loading styleId={settings.style} heading='Opening the shared map' />}>
        <MapExperience
          map={shared.map}
          trips={shared.trips || []}
          role={shared.role}
          shareCode={code}
          currentUser={user}
          settings={settings}
          onChangeSetting={updateSetting}
        />
      </Suspense>
    </>
  );
}

export default SharedPage;
