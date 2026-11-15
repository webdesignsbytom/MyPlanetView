import React, { Suspense, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Constants
import { MAP_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useMapViewport, { useViewportZoom } from '@/hooks/useMapViewport';
import usePhotoPage from '@/hooks/usePhotoPage';
import useLandmarks from '@/hooks/useLandmarks';
import useCanHover from '@/hooks/useCanHover';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
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
import MapHoverLayer from './MapHoverLayer';
import MapPanelFallback from './MapPanelFallback';
import VerifyEmailBanner from './VerifyEmailBanner';
import { LANDMARK_MIN_ZOOM } from './LandmarkPins';
import ErrorBoundary from '@/utils/error/ErrorBoundary';
// Panels, fetched when first wanted (lazyMapPanels.js)
import {
  CountryListPanel,
  CountryPanel,
  MapSwitcher,
  PhotoUploadPanel,
  PhotoViewer,
  SettingsPanel,
  ShareDialog,
  StatsPanel,
  TripsPanel,
  UnplacedPhotosPanel,
  preloadTool,
} from './lazyMapPanels';
// Utils
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { PREVIEW_PHOTOS, UNPLACED_PHOTOS } from '@/utils/map/mapPhotoLists';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { createValueStore } from '@/utils/map/valueStore';
import { canEditRole } from '@/utils/sharing/shareRoles';

const PREVIEW_PER_COUNTRY = 6;
const CLUSTER_RADIUS = 220; // map units: countries this close count as one region
const VISITED = new Set(['VISITED', 'LIVED']);
const atLandmarkZoom = (zoom) => zoom >= LANDMARK_MIN_ZOOM;
// Opening a country from the map: its panel's code is fetched on the first press
const warmCountryPanel = () => CountryPanel.preload().catch(() => {});

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
  // The country under the pointer: followed by the hover postcard only (MapHoverLayer)
  const [hover] = useState(() => createValueStore(null));
  const [photosVersion, setPhotosVersion] = useState(0);
  const canHover = useCanHover();

  const canEdit = Boolean(actions) && !shareCode && canEditRole(role);
  // An unverified email address: nothing can be added or changed yet (the server refuses
  // with 403), so those controls are locked, each saying why, and the banner says how
  const mustVerify = useMustVerifyEmail() && !shareCode;
  const locked = canEdit && mustVerify;
  const canChange = canEdit && !mustVerify;
  const isOwner = !shareCode && role === 'OWNER';
  const photoSource = useMemo(() => (shareCode ? { shareCode } : { mapId: map.id }), [shareCode, map.id]);

  const visitsByCode = useMemo(() => Object.fromEntries(map.visits.map((v) => [v.countryCode, v.status])), [map.visits]);
  const visitFor = (code) => map.visits.find((v) => v.countryCode === code) || null;

  // The newest photos, grouped by country, feed the hover slideshow (never fetched for
  // touch screens, which don't hover)
  const preview = usePhotoPage({ ...photoSource, ...PREVIEW_PHOTOS, enabled: settings.hoverPreview && canHover });
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
  // (re-renders this page only when the zoom crosses that line, not on every move)
  const detailed = settings.mapType === 'detailed';
  const landmarkZoom = useViewportZoom(viewport, atLandmarkZoom);
  const { landmarks } = useLandmarks(null, { enabled: detailed || landmarkZoom });

  // Photos with no country: no country panel shows them, so they get their own list
  const unplaced = usePhotoPage({ ...photoSource, ...UNPLACED_PHOTOS });
  const unplacedCount = unplaced.photos.length;
  const unplacedMore = Boolean(unplaced.nextCursor);
  const showUnplaced = useCallback(() => dispatch({ type: 'toggle', panel: 'unplaced' }), []);

  // An upload, edit or delete: the photo lists, and the map itself, as a photo can add a
  // PHOTO visit (or turn a "want to go" country visited) and changes the stats
  const { reload: reloadPreview } = preview;
  const { reload: reloadUnplaced } = unplaced;
  const refreshMap = actions?.refresh;
  const photosChanged = useCallback(() => {
    setPhotosVersion((v) => v + 1);
    reloadPreview();
    reloadUnplaced();
    refreshMap?.();
  }, [reloadPreview, reloadUnplaced, refreshMap]);

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
  const setVisit = actions?.setVisit;

  const handleToggle = useCallback((panel) => {
    if (panel === 'share') dispatch({ type: 'share', open: true });
    else dispatch({ type: 'toggle', panel });
  }, []);

  // A panel listing photos is open: the viewer is probably next
  const listsPhotos = ui.panel === 'country' || ui.panel === 'unplaced';
  useEffect(() => {
    if (listsPhotos) PhotoViewer.preload().catch(() => {});
  }, [listsPhotos]);

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
            locked={mustVerify}
            onMapSaved={actions?.reload}
            onMapDeleted={() => {
              forgetMapLists();
              navigate(MAP_PAGE_URL, { replace: true });
            }}
            onClose={close}
          />
        );
      case 'stats':
        return (
          <StatsPanel
            stats={map.stats}
            travellers={map.travellers}
            unplacedCount={unplacedCount}
            unplacedMore={unplacedMore}
            onShowUnplaced={showUnplaced}
            onClose={close}
          />
        );
      case 'countries':
        return (
          <CountryListPanel
            visitsByCode={visitsByCode}
            canEdit={canChange}
            locked={locked}
            onChangeStatus={setVisit}
            onShowCountry={showCountry}
            unplacedCount={unplacedCount}
            unplacedMore={unplacedMore}
            onShowUnplaced={showUnplaced}
            onClose={close}
          />
        );
      case 'unplaced':
        return <UnplacedPhotosPanel photos={unplaced} canEdit={canChange} onOpenPhoto={openPhoto} onClose={close} />;
      case 'country':
        return ui.selectedCode ? (
          <CountryPanel
            key={ui.selectedCode}
            code={ui.selectedCode}
            visit={visitFor(ui.selectedCode)}
            canEdit={canChange}
            locked={locked}
            onSetVisit={setVisit}
            photoSource={photoSource}
            photosVersion={photosVersion}
            onOpenPhoto={openPhoto}
            onAddPhotos={canChange ? (code) => dispatch({ type: 'upload', code }) : null}
            onClose={close}
          />
        ) : null;
      case 'upload':
        return canEdit ? (
          <PhotoUploadPanel mapId={map.id} countryCode={ui.uploadCountry} locked={locked} onUploaded={photosChanged} onClose={close} />
        ) : null;
      case 'trips':
        return (
          <TripsPanel
            trips={trips}
            travellers={map.travellers}
            canEdit={canChange}
            locked={locked}
            onCreate={actions?.addTrip}
            noLinks={Boolean(shareCode)}
            onClose={close}
          />
        );
      case 'switcher':
        return (
          <MapSwitcher currentMapId={map.id} userId={currentUser?.id} userName={currentUser?.name} locked={mustVerify} onClose={close} />
        );
      default:
        return null;
    }
  })();

  return (
    <div data-map-style={settings.style} className='relative h-dvh w-full overflow-hidden bg-map-sea text-map-ink'>
      <MapBackground styleId={settings.style} animatedSea={settings.animatedSea} />
      {settings.style === 'animated' && settings.animatedSea ? <SeaWaves /> : null}
      {settings.style === 'animated' && settings.sunAndMoon ? <SunMoon /> : null}

      <main id='main-content' tabIndex={-1} role='main' className='absolute inset-0' onPointerDownCapture={warmCountryPanel}>
        <h1 className='sr-only'>{map.name}</h1>
        <WorldMap
          viewport={viewport}
          visitsByCode={visitsByCode}
          selectedCode={ui.panel === 'country' ? ui.selectedCode : null}
          onSelectCountry={selectCountry}
          onHoverCountry={hover.set}
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
          onIntent={() => preloadTool('switcher')}
        />
        <StatsBadge stats={map.stats} onOpen={() => dispatch({ type: 'toggle', panel: 'stats' })} onIntent={() => preloadTool('stats')} />
        {mustVerify ? <VerifyEmailBanner /> : null}
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
          onIntent={preloadTool}
          canUpload={canEdit}
          canShare={Boolean(currentUser) && !shareCode}
        />
      </div>

      <div className='pointer-events-none absolute bottom-24 right-3 grid md:bottom-6'>
        <div className='pointer-events-auto'>
          <MapZoomControls viewport={viewport} />
        </div>
      </div>

      {/* The key hides while a panel is open: the panel covers that corner */}
      {panel ? null : (
        <div className='pointer-events-none absolute bottom-6 left-3 hidden md:grid'>
          <MapLegend />
        </div>
      )}

      {/* With the verify banner under the title, wide screens open panels below it */}
      {panel ? (
        <div
          className={`pointer-events-none absolute inset-x-3 bottom-24 z-10 grid md:inset-x-auto md:bottom-auto md:left-3 ${
            mustVerify ? 'md:top-60 md:[--map-panel-top:15rem]' : 'md:top-32'
          }`}
        >
          {/* A panel whose code failed to arrive says so; the next panel tries afresh */}
          <ErrorBoundary key={ui.panel} fallback={<MapPanelFallback failed onClose={close} />}>
            <Suspense fallback={<MapPanelFallback />}>{panel}</Suspense>
          </ErrorBoundary>
        </div>
      ) : null}

      <MapHoverLayer
        hover={hover}
        hidden={Boolean(ui.photoId)}
        visitsByCode={visitsByCode}
        thumbsByCountry={thumbsByCountry}
        showPhotos={settings.hoverPreview}
      />

      {ui.photoId ? (
        <Suspense fallback={null}>
          <PhotoViewer
            photoId={ui.photoId}
            shareCode={shareCode}
            canEdit={canEdit}
            locked={locked}
            trips={canEdit ? trips : undefined}
            onChanged={photosChanged}
            onDeleted={photosChanged}
            onClose={() => dispatch({ type: 'closePhoto' })}
          />
        </Suspense>
      ) : null}

      {ui.sharing ? (
        <Suspense fallback={null}>
          <ShareDialog
            resource='maps'
            id={map.id}
            name={map.name}
            role={role}
            currentUserId={currentUser?.id}
            onLeft={() => {
              forgetMapLists();
              navigate(MAP_PAGE_URL, { replace: true });
            }}
            onClose={() => dispatch({ type: 'share', open: false })}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

export default MapExperience;
