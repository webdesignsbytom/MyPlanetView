import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Constants
import { MAP_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMapViewport from '@/hooks/useMapViewport';
import usePhotoPage from '@/hooks/usePhotoPage';
import useLandmarks from '@/hooks/useLandmarks';
// Components
import WorldMap from './WorldMap';
import MapBackground from './MapBackground';
import SeaWaves from './SeaWaves';
import SunMoon from './SunMoon';
import MapBanner from './MapBanner';
import MapTitle from './MapTitle';
import StatsBadge from './StatsBadge';
import MapToolbar from './MapToolbar';
import MapZoomControls from './MapZoomControls';
import MapLegend from './MapLegend';
import HoverPreview from './HoverPreview';
import StatsPanel from './StatsPanel';
import CountryListPanel from './CountryListPanel';
import CountryPanel from './CountryPanel';
import SettingsPanel from './SettingsPanel';
import MapSwitcher from './MapSwitcher';
import { LANDMARK_MIN_ZOOM } from './LandmarkPins';
import TripsPanel from '@/components/trips/TripsPanel';
import PhotoUploadPanel from '@/components/photos/PhotoUploadPanel';
import PhotoViewer from '@/components/photos/PhotoViewer';
import ShareDialog from '@/components/sharing/ShareDialog';
// Utils
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { canEditRole } from '@/utils/sharing/shareRoles';

const PREVIEW_PER_COUNTRY = 6;
const CLUSTER_RADIUS = 220; // map units: countries this close count as one region
const VISITED = new Set(['VISITED', 'LIVED']);

// Where a portrait screen opens: the middle of the biggest group of visited countries
// (so a map of European trips opens on Europe), or Europe when nothing is visited yet
function homeFromVisits(visits) {
  const pins = visits.filter((v) => VISITED.has(v.status)).map((v) => COUNTRY_BY_CODE[v.countryCode]).filter(Boolean);
  if (!pins.length) return undefined;
  let best = [];
  for (const pin of pins) {
    const near = pins.filter((p) => Math.hypot(p.pinX - pin.pinX, p.pinY - pin.pinY) <= CLUSTER_RADIUS);
    if (near.length > best.length) best = near;
  }
  return {
    x: best.reduce((sum, p) => sum + p.pinX, 0) / best.length,
    y: best.reduce((sum, p) => sum + p.pinY, 0) / best.length,
  };
}

// Which overlay is open, the selected country, the open photo and the share dialog:
// one reducer, so opening one panel closes the last.
const initialUi = { panel: null, selectedCode: null, uploadCountry: null, photoId: null, sharing: false };

function uiReducer(state, action) {
  switch (action.type) {
    case 'toggle':
      return { ...state, panel: state.panel === action.panel ? null : action.panel, uploadCountry: null };
    case 'close':
      return { ...state, panel: null, selectedCode: state.panel === 'country' ? null : state.selectedCode };
    case 'selectCountry':
      return { ...state, panel: 'country', selectedCode: action.code };
    case 'upload':
      return { ...state, panel: 'upload', uploadCountry: action.code || null };
    case 'openPhoto':
      return { ...state, photoId: action.photoId };
    case 'closePhoto':
      return { ...state, photoId: null };
    case 'share':
      return { ...state, sharing: action.open };
    default:
      return state;
  }
}

/**
 * The full-screen map with its toolbar and overlays: the signed-in map page, and the
 * read-only view a share link opens (`shareCode`, no `actions`).
 * `actions` comes from useTravelMap; `settings` from useMapSettings.
 */
function MapExperience({ map, trips, role, actions = null, shareCode = null, currentUser = null, settings, onChangeSetting }) {
  const navigate = useNavigate();
  const home = useMemo(() => homeFromVisits(map.visits), [map.visits]);
  const viewport = useMapViewport({ home });
  const [ui, dispatch] = useReducer(uiReducer, initialUi);
  const [hoveredCode, setHoveredCode] = useState(null);
  const [photosVersion, setPhotosVersion] = useState(0);

  const canEdit = Boolean(actions) && !shareCode && canEditRole(role);
  const isOwner = !shareCode && role === 'OWNER';
  const photoSource = useMemo(() => (shareCode ? { shareCode } : { mapId: map.id }), [shareCode, map.id]);

  const visitsByCode = useMemo(() => Object.fromEntries(map.visits.map((v) => [v.countryCode, v.status])), [map.visits]);
  const visitFor = (code) => map.visits.find((v) => v.countryCode === code) || null;

  // The newest photos, grouped by country, feed the hover slideshow
  const preview = usePhotoPage({ ...photoSource, limit: 60, enabled: settings.hoverPreview });
  const thumbsByCountry = useMemo(() => {
    const groups = {};
    for (const photo of preview.photos) {
      if (!photo.countryCode || !photo.thumbUrl) continue;
      const group = (groups[photo.countryCode] ||= []);
      if (group.length < PREVIEW_PER_COUNTRY) group.push(photo);
    }
    return groups;
  }, [preview.photos]);

  // my_planet's Detailed map type: names, lines and landmark pins at every zoom
  const detailed = settings.mapType === 'detailed';
  const { landmarks } = useLandmarks(null, { enabled: detailed || viewport.zoom >= LANDMARK_MIN_ZOOM });

  const { reload: reloadPreview } = preview;
  const refreshStats = actions?.refreshStats;
  const photosChanged = useCallback(() => {
    setPhotosVersion((v) => v + 1);
    reloadPreview();
    refreshStats?.();
  }, [reloadPreview, refreshStats]);

  const selectCountry = useCallback((code) => dispatch({ type: 'selectCountry', code }), []);
  const showCountry = useCallback(
    (code) => {
      const country = COUNTRY_BY_CODE[code];
      if (country) viewport.focusOn(country.pinX, country.pinY, 500);
      dispatch({ type: 'selectCountry', code });
    },
    [viewport],
  );
  const openPhoto = useCallback((photo) => dispatch({ type: 'openPhoto', photoId: photo.id }), []);
  const close = useCallback(() => dispatch({ type: 'close' }), []);

  const handleToggle = (panel) => {
    if (panel === 'share') dispatch({ type: 'share', open: true });
    else dispatch({ type: 'toggle', panel });
  };

  const panel = (() => {
    switch (ui.panel) {
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onChangeSetting={onChangeSetting}
            map={map}
            canEdit={canEdit}
            isOwner={isOwner}
            onMapSaved={actions?.reload}
            onMapDeleted={() => navigate(MAP_PAGE_URL, { replace: true })}
            onClose={close}
          />
        );
      case 'stats':
        return <StatsPanel stats={map.stats} travellers={map.travellers} onClose={close} />;
      case 'countries':
        return (
          <CountryListPanel
            visitsByCode={visitsByCode}
            canEdit={canEdit}
            onChangeStatus={(code, status) => actions.setVisit(code, status)}
            onShowCountry={showCountry}
            onClose={close}
          />
        );
      case 'country':
        return ui.selectedCode ? (
          <CountryPanel
            key={ui.selectedCode}
            code={ui.selectedCode}
            visit={visitFor(ui.selectedCode)}
            canEdit={canEdit}
            onSetVisit={(code, status, extra) => actions.setVisit(code, status, extra)}
            photoSource={photoSource}
            photosVersion={photosVersion}
            onOpenPhoto={openPhoto}
            onAddPhotos={canEdit ? (code) => dispatch({ type: 'upload', code }) : null}
            onClose={close}
          />
        ) : null;
      case 'upload':
        return canEdit ? (
          <PhotoUploadPanel mapId={map.id} countryCode={ui.uploadCountry} onUploaded={photosChanged} onClose={close} />
        ) : null;
      case 'trips':
        return (
          <TripsPanel
            trips={trips}
            travellers={map.travellers}
            canEdit={canEdit}
            onCreate={actions?.addTrip}
            noLinks={Boolean(shareCode)}
            onClose={close}
          />
        );
      case 'switcher':
        return <MapSwitcher currentMapId={map.id} userName={currentUser?.name} onClose={close} />;
      default:
        return null;
    }
  })();

  return (
    <div data-map-style={settings.style} className='relative h-dvh w-full overflow-hidden bg-map-sea text-map-ink'>
      <MapBackground styleId={settings.style} animatedSea={settings.animatedSea} />
      {settings.style === 'animated' && settings.animatedSea ? <SeaWaves /> : null}
      {settings.style === 'animated' && settings.sunAndMoon ? <SunMoon /> : null}

      <main id='main-content' tabIndex={-1} role='main' className='absolute inset-0'>
        <h1 className='sr-only'>{map.name}</h1>
        <WorldMap
          viewport={viewport}
          visitsByCode={visitsByCode}
          selectedCode={ui.panel === 'country' ? ui.selectedCode : null}
          onSelectCountry={selectCountry}
          onHoverCountry={setHoveredCode}
          showGrid={settings.showGrid || detailed}
          showGridLabels={settings.showGridLabels || detailed}
          showCountryNames={settings.showCountryNames || detailed}
          showVisited={settings.showVisited}
          showUnvisited={settings.showUnvisited}
          landmarks={landmarks}
          alwaysShowLandmarks={detailed}
          label={`${map.name}: world map`}
        />
      </main>

      <div className='pointer-events-none absolute left-3 top-3 grid justify-items-start gap-2'>
        <MapTitle
          map={map}
          role={role}
          shared={Boolean(shareCode)}
          onOpenSwitcher={currentUser && !shareCode ? () => dispatch({ type: 'toggle', panel: 'switcher' }) : null}
        />
        <StatsBadge stats={map.stats} onOpen={() => dispatch({ type: 'toggle', panel: 'stats' })} />
      </div>

      {settings.showUserBanner ? (
        <div className='pointer-events-none absolute inset-x-0 top-3 hidden justify-items-center lg:grid'>
          <MapBanner map={map} onHide={() => onChangeSetting('showUserBanner', false)} />
        </div>
      ) : null}

      <div className='pointer-events-none absolute inset-x-0 bottom-3 grid justify-items-center md:inset-x-auto md:bottom-auto md:right-3 md:top-3'>
        <MapToolbar
          openPanel={ui.sharing ? 'share' : ui.panel}
          onToggle={handleToggle}
          canUpload={canEdit}
          canShare={Boolean(currentUser) && !shareCode}
        />
      </div>

      <div className='pointer-events-none absolute bottom-24 right-3 grid md:bottom-6'>
        <div className='pointer-events-auto'>
          <MapZoomControls viewport={viewport} />
        </div>
      </div>

      <div className='pointer-events-none absolute bottom-6 left-3 hidden md:grid'>
        <MapLegend />
      </div>

      {panel ? (
        <div className='pointer-events-none absolute inset-x-3 bottom-24 z-10 grid md:inset-x-auto md:bottom-auto md:left-3 md:top-32'>
          {panel}
        </div>
      ) : null}

      {hoveredCode && !ui.photoId ? (
        <HoverPreview
          code={hoveredCode}
          status={visitsByCode[hoveredCode]}
          thumbs={thumbsByCountry[hoveredCode]}
          showPhotos={settings.hoverPreview}
        />
      ) : null}

      {ui.photoId ? (
        <PhotoViewer
          photoId={ui.photoId}
          shareCode={shareCode}
          canEdit={canEdit}
          trips={canEdit ? trips : undefined}
          onChanged={photosChanged}
          onDeleted={photosChanged}
          onClose={() => dispatch({ type: 'closePhoto' })}
        />
      ) : null}

      {ui.sharing ? (
        <ShareDialog
          resource='maps'
          id={map.id}
          name={map.name}
          role={role}
          currentUserId={currentUser?.id}
          onLeft={() => navigate(MAP_PAGE_URL, { replace: true })}
          onClose={() => dispatch({ type: 'share', open: false })}
        />
      ) : null}
    </div>
  );
}

export default MapExperience;
