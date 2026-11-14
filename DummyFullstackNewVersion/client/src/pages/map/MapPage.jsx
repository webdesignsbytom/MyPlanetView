import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// Api
import { getMyMaps } from '@/api/travelApi';
// Constants
import { MAP_PAGE_URL, WELCOME_PAGE_URL } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useTravelMap from '@/hooks/useTravelMap';
import useMapSettings from '@/hooks/useMapSettings';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import MapExperience from '@/components/map/MapExperience';
import MapStatusScreen from '@/components/map/MapStatusScreen';

// Your default map (/map), or any map you can open (/maps/:mapId).
function MapPage() {
  const { mapId: routeMapId } = useParams();
  const { user } = useAuth();
  const [defaultMapId, setDefaultMapId] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [noMap, setNoMap] = useState(false);

  // /map: find your default map (else the first you own, else the first you can open)
  useEffect(() => {
    if (routeMapId) return undefined;
    let cancelled = false;
    getMyMaps()
      .then(({ maps }) => {
        if (cancelled) return;
        const list = maps || [];
        const pick =
          list.find((m) => m.isDefault && m.role === 'OWNER') || list.find((m) => m.role === 'OWNER') || list[0];
        if (pick) setDefaultMapId(pick.id);
        else setNoMap(true);
      })
      .catch((err) => {
        if (!cancelled) setLookupError(err.friendlyMessage || 'Your maps could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [routeMapId]);

  const mapId = routeMapId || defaultMapId;
  const travelMap = useTravelMap(mapId);
  const { settings, updateSetting } = useMapSettings({ remote: true });

  if (noMap) {
    return (
      <>
        <AppPageHead route={MAP_PAGE_URL} />
        <MapStatusScreen title='No map yet' message='Set one up and start colouring in the world.'>
          <Link to={WELCOME_PAGE_URL} className='font-medium underline underline-offset-2'>
            Set up my map
          </Link>
        </MapStatusScreen>
      </>
    );
  }

  const error = lookupError || travelMap.error;
  if (error) {
    return (
      <>
        <AppPageHead route={MAP_PAGE_URL} />
        <MapStatusScreen title='This map can’t be opened' message={error}>
          {routeMapId ? (
            <Link to={MAP_PAGE_URL} className='font-medium underline underline-offset-2'>
              Go to your own map
            </Link>
          ) : null}
        </MapStatusScreen>
      </>
    );
  }

  if (!travelMap.map) {
    return (
      <>
        <AppPageHead route={MAP_PAGE_URL} />
        <MapStatusScreen loading />
      </>
    );
  }

  return (
    <>
      <AppPageHead route={MAP_PAGE_URL} title={travelMap.map.name} />
      <MapExperience
        key={travelMap.map.id}
        map={travelMap.map}
        trips={travelMap.trips}
        role={travelMap.map.role}
        actions={travelMap}
        currentUser={user}
        settings={settings}
        onChangeSetting={updateSetting}
      />
    </>
  );
}

export default MapPage;
