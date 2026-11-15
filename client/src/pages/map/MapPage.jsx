import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// Constants
import { MAP_PAGE_URL, WELCOME_PAGE_URL } from '@/utils/constants/routes';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useTravelMap from '@/hooks/useTravelMap';
import useMapSettings from '@/hooks/useMapSettings';
import { preloadPhotoPage } from '@/hooks/usePhotoPage';
import { preloadLandmarks } from '@/hooks/useLandmarks';
import { canHover } from '@/hooks/useCanHover';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import MapExperience from '@/components/map/MapExperience';
import MapStatusScreen from '@/components/map/MapStatusScreen';
// Utils
import { getStoredItem, setStoredItem } from '@/utils/functions/safeStorage';
import { myMaps } from '@/utils/map/mapListCache';
import { PREVIEW_PHOTOS, UNPLACED_PHOTOS } from '@/utils/map/mapPhotoLists';

// Which map /map opened last time, for this user: it starts loading at once, while the
// map list confirms it (or picks another)
const DEFAULT_MAP_KEY = 'mpv:defaultMap';

function rememberedDefault(userId) {
  try {
    const saved = JSON.parse(getStoredItem(DEFAULT_MAP_KEY) || 'null');
    return userId && saved?.userId === userId && typeof saved.mapId === 'string' ? saved.mapId : null;
  } catch {
    return null;
  }
}

// Your default map (/map), or any map you can open (/maps/:mapId).
// Everything the map needs starts together once its id is known: the map and its trips
// (useTravelMap), its photo lists and, when pins will show, the landmarks. On /map the
// id is the one remembered from last time, checked against the map list in parallel.
function MapPage() {
  const { mapId: routeMapId } = useParams();
  const { user } = useAuth();
  const userId = user?.id || null;
  const [defaultMapId, setDefaultMapId] = useState(() => (routeMapId ? null : rememberedDefault(userId)));
  const [defaultConfirmed, setDefaultConfirmed] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [noMap, setNoMap] = useState(false);

  // /map: find your default map (else the first you own, else the first you can open)
  useEffect(() => {
    if (routeMapId) return undefined;
    let cancelled = false;
    myMaps
      .load(userId)
      .then((list) => {
        if (cancelled) return;
        const pick =
          list.find((m) => m.isDefault && m.role === 'OWNER') || list.find((m) => m.role === 'OWNER') || list[0];
        if (pick) {
          setDefaultMapId(pick.id);
          setStoredItem(DEFAULT_MAP_KEY, JSON.stringify({ userId, mapId: pick.id }));
        } else setNoMap(true);
        setDefaultConfirmed(true);
      })
      .catch((err) => {
        if (!cancelled) setLookupError(err.friendlyMessage || 'Your maps could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [routeMapId, userId]);

  const mapId = routeMapId || defaultMapId;
  // Visits show before the server answers, unless it's sure to refuse (an unverified email)
  const travelMap = useTravelMap(mapId, { optimistic: user?.emailVerified !== false });
  const { settings, updateSetting } = useMapSettings({ remote: true });

  // The map's photo lists (and the landmarks, when pins show from the start: the Detailed
  // type, or a portrait screen, which opens zoomed in) alongside the map, not after it
  const previewWanted = settings.hoverPreview && canHover();
  const pinsAtOnce = settings.mapType === 'detailed' || window.innerHeight > window.innerWidth;
  useEffect(() => {
    if (!mapId) return;
    preloadPhotoPage({ mapId, ...UNPLACED_PHOTOS });
    if (previewWanted) preloadPhotoPage({ mapId, ...PREVIEW_PHOTOS });
  }, [mapId, previewWanted]);
  useEffect(() => {
    if (pinsAtOnce) preloadLandmarks();
  }, [pinsAtOnce]);

  if (noMap) {
    return (
      <>
        <AppPageHead route={MAP_PAGE_URL} />
        <MapStatusScreen title='No map yet' message='Set one up and start colouring in the world.'>
          <Link to={WELCOME_PAGE_URL} className='btn-poster'>
            Set up my map
          </Link>
        </MapStatusScreen>
      </>
    );
  }

  // A remembered map that fails is only an error once the list has confirmed it; a list
  // that fails doesn't matter once the remembered map is on screen
  const error = (lookupError && !travelMap.map ? lookupError : null) || (routeMapId || defaultConfirmed ? travelMap.error : null);
  if (error) {
    return (
      <>
        <AppPageHead route={MAP_PAGE_URL} />
        <MapStatusScreen title='This map can’t be opened' message={error}>
          {routeMapId ? (
            <Link to={MAP_PAGE_URL} className='btn-poster'>
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
