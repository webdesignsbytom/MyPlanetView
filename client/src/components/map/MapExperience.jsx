import React, { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Constants
import { MAP_PAGE_URL, mapPassportPath, mapPath, sharedPassportPath } from '@/utils/constants/routes';
// Hooks
import useMapViewport, { useViewportZoom } from '@/hooks/useMapViewport';
import usePhotoPage, { preloadPhotoPage } from '@/hooks/usePhotoPage';
import { preloadMomentPage } from '@/hooks/useMomentPage';
import useLandmarks, { preloadLandmarks } from '@/hooks/useLandmarks';
import { SplitUkProvider } from '@/hooks/useSplitUk';
import useMediaQuery from '@/hooks/useMediaQuery';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import useMapTheme from '@/hooks/useMapTheme';
import useAchievements from '@/hooks/useAchievements';
// Components
import WorldMap from './WorldMap';
import MapBackground from './MapBackground';
import MapBanner from './MapBanner';
import MapToolbar from './MapToolbar';
import MapZoomControls from './MapZoomControls';
import CountryMapLoading from '@/components/countryMap/CountryMapLoading';
import MapLegend from './MapLegend';
import MapHoverLayer from './MapHoverLayer';
import MapPanelFallback from './MapPanelFallback';
import MapOverlayBoundary from './MapOverlayBoundary';
import VerifyEmailBanner from './VerifyEmailBanner';
import JoinedMapNote from './JoinedMapNote';
import MapStatusScreen from './MapStatusScreen';
import MapPlanBanner from './MapPlanBanner';
import TravelCopyBanner from '@/components/travelCopies/TravelCopyBanner';
import GoalTag from '@/components/achievements/GoalTag';
import AwardNews from '@/components/achievements/AwardNews';
import { LANDMARK_MIN_ZOOM } from './LandmarkPins';
import ErrorBoundary from '@/utils/error/ErrorBoundary';
// Panels, fetched when first wanted (lazyMapPanels.js)
import {
  BadgesGoalsPanel,
  CountryListPanel,
  CountryMapView,
  CountryPanel,
  ExtraMapDialog,
  MapSwitcher,
  MapTipsDialog,
  PhotoUploadPanel,
  PhotoViewer,
  SettingsPanel,
  ShareDialog,
  Slideshow,
  StatsPanel,
  TimelinePanel,
  TripsPanel,
  UnplacedPhotosPanel,
  MapPhotosPanel,
  PinPanel,
  preloadTool,
  preloadWhenIdle,
} from './lazyMapPanels';
// Utils
import { maxTravellersFor } from '@/utils/map/saveMapSetup';
import { nearestGoal } from '@/utils/achievements/goals';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { MAP_PHOTOS, UNPLACED_PHOTOS } from '@/utils/map/mapPhotoLists';
import { forgetMapLists, myMaps, sharedTrips as sharedTripList } from '@/utils/map/mapListCache';
import { countryListsOf, countryMomentFilters, countryPhotoFilters, preloadCountryLists } from '@/utils/map/preloadCountryLists';
import { preloadSharing } from '@/utils/sharing/sharingCache';
import { createValueStore } from '@/utils/map/valueStore';
import { canEditRole, canManageRole } from '@/utils/sharing/shareRoles';
import { mapExtent } from '@/utils/map/projection';
import { isMonoStyle, mapStyleById } from '@/utils/map/mapStyles';
import { TIPS_SHOWN_KEY } from '@/utils/map/mapTips';
import { nextPlannedTrip, todayString } from '@/utils/offers/offerContext';

const atLandmarkZoom = (zoom) => zoom >= LANDMARK_MIN_ZOOM;
// Opening a country from the map: its panel's code is fetched on the first press
const warmCountryPanel = () => CountryPanel.preload().catch(() => {});

// Which overlay is open, the selected country, the open photo, the share dialog and the
// slideshow (`{ country }`: one country's, or null for the whole map's): one reducer, so
// opening one panel closes the last. The slideshow plays over everything, leaving the
// panel it was opened from (a country's) there for when it closes.
// `photo` is the open photo as its list had it (shown at once, before its own reply) and
// `photoList` the list it came from ({ filters } or { photos }), for stepping through it.
// countryMap: a country opened on its own (its code), in the world map's place; pin: the pin
// panel's pin there ({ id }, or { draft } for a new one)
const initialUi = {
  panel: null,
  selectedCode: null,
  uploadCountry: null,
  photoId: null,
  photo: null,
  photoList: null,
  sharing: false,
  slideshow: null,
  countryMap: null,
  pin: null,
};

// The longest the loading screen waits for the panels' data (a slow connection): the map
// shows then, and whatever is still on its way arrives as each panel opens
const LOADING_CAP_MS = 20000;

function uiReducer(state, action) {
  switch (action.type) {
    case 'toggle':
      return { ...state, panel: state.panel === action.panel ? null : action.panel, uploadCountry: null };
    case 'open':
      return { ...state, panel: action.panel, uploadCountry: null };
    case 'close':
      return { ...state, panel: null, selectedCode: state.panel === 'country' ? null : state.selectedCode };
    case 'selectCountry':
      return { ...state, panel: 'country', selectedCode: action.code };
    case 'upload':
      return { ...state, panel: 'upload', uploadCountry: action.code || null };
    case 'openPhoto':
      return { ...state, photoId: action.photo.id, photo: action.photo, photoList: action.list || null };
    case 'closePhoto':
      return { ...state, photoId: null, photo: null, photoList: null };
    case 'share':
      return { ...state, sharing: action.open };
    case 'play':
      return { ...state, slideshow: { country: action.country || null } };
    case 'stopPlaying':
      return { ...state, slideshow: null };
    case 'openCountryMap':
      return { ...state, countryMap: action.code, panel: null, selectedCode: null, pin: null };
    case 'closeCountryMap':
      return { ...state, countryMap: null, panel: state.panel === 'pin' ? null : state.panel, pin: null };
    case 'openPin':
      return { ...state, panel: 'pin', pin: { id: action.id } };
    case 'newPin':
      return { ...state, panel: 'pin', pin: { draft: action.draft } };
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
  const { showAntarctica } = settings;
  // The map reaches further down with Antarctica; the viewport re-fits when it's toggled
  const extent = useMemo(() => mapExtent(showAntarctica), [showAntarctica]);
  const viewport = useMapViewport({ extent });
  const [ui, dispatch] = useReducer(uiReducer, initialUi);
  // The country under the pointer: followed by the hover postcard only (MapHoverLayer)
  const [hover] = useState(() => createValueStore(null));
  const [photosVersion, setPhotosVersion] = useState(0);
  // Wide screens (lg) show the map's banner, while it's switched on. The map has no title tag
  // anywhere (the user's wish, 16 Nov 2026, phones too): "Your maps" opens from the toolbar.
  const bannerShows = useMediaQuery('(min-width: 1024px) and (min-height: 500px)') && settings.showUserBanner;

  const canEdit = Boolean(actions) && !shareCode && canEditRole(role);
  // An unverified email address: nothing can be added or changed yet (the server refuses
  // with 403), so those controls are locked, each saying why, and the banner says how
  const mustVerify = useMustVerifyEmail() && !shareCode;
  const locked = canEdit && mustVerify;
  const canChange = canEdit && !mustVerify;
  const isOwner = !shareCode && role === 'OWNER';
  // The map's settings and sharing: the owner or a co-owner (19 Nov 2026)
  const canManage = !shareCode && canManageRole(role);
  const canShare = Boolean(currentUser) && !shareCode;
  const photoSource = useMemo(() => (shareCode ? { shareCode } : { mapId: map.id }), [shareCode, map.id]);
  // The map's plan (the owner and editors get it; docs/API.md, "Map limits"): a locked map
  // (an extra map that isn't paid for) takes no photos, and says so on a tag under the
  // title; a map handed to its owner without a free slot is in a grace period
  const uploadRules = shareCode ? null : map.uploadRules || null;
  const mapLocked = !shareCode && Boolean(map.locked);
  const inGrace = !shareCode && !mapLocked && Boolean(map.graceUntil) && new Date(map.graceUntil).getTime() > Date.now();
  const planBanner = mapLocked || (inGrace && isOwner);
  const [payingForMap, setPayingForMap] = useState(false);

  // The panels are separate downloads (lazyMapPanels.js): once the map has drawn, fetch
  // the ones this toolbar offers while the browser is idle, the country list (and a
  // country) first, so none has to load when it's opened
  useEffect(
    () =>
      preloadWhenIdle([
        'countries',
        'stats',
        'trips',
        'timeline',
        'badges',
        'settings',
        'play',
        'photos',
        ...(canEdit ? ['upload'] : []),
        ...(canShare ? ['share', 'switcher'] : []),
      ]),
    [canEdit, canShare],
  );

  // Every panel's data, fetched behind the loading screen before the map shows (17 Nov 2026,
  // the user's wish: the loading screen covers all of the person's travel data, so nothing
  // inside the map loads afterwards): the share settings (the owner's), the photo album's
  // and the timeline's first pages, every landmark (the country tickets' lists and the
  // pins), your map lists, and every country ticket's photos and moments
  // (preloadCountryLists: fetched where the map says there are some, kept empty elsewhere;
  // viewers' and share links' photo lists, which have no counts, when a country is hovered),
  // all into the panel cache (utils/data/panelCache.js); the badges and goals come with
  // useAchievements below. Each panel then shows its data at once and refreshes quietly. The
  // map draws underneath meanwhile, and the screen lifts once they're all in, or after
  // LOADING_CAP_MS whatever is still on its way. The map as it is then (a ref, so later
  // changes to it don't start the run again).
  const userId = currentUser?.id;
  const mapNowRef = useRef(map);
  useEffect(() => {
    mapNowRef.current = map;
  }, [map]);
  const [loadedMapId, setLoadedMapId] = useState(null);
  useEffect(() => {
    let left = false;
    const jobs = [
      canManage ? preloadSharing('maps', map.id) : null,
      preloadPhotoPage({ ...photoSource, ...MAP_PHOTOS }),
      preloadMomentPage({ ...photoSource, limit: 30 }),
      preloadLandmarks(),
      userId && !shareCode ? myMaps.load(userId).catch(() => {}) : null,
      userId && !shareCode ? sharedTripList.load(userId).catch(() => {}) : null,
      preloadCountryLists(mapNowRef.current, photoSource, () => left),
    ];
    let cap = 0;
    const capped = new Promise((resolve) => {
      cap = window.setTimeout(resolve, LOADING_CAP_MS);
    });
    Promise.race([Promise.all(jobs), capped]).then(() => {
      if (!left) setLoadedMapId(map.id);
    });
    return () => {
      left = true;
      window.clearTimeout(cap);
    };
  }, [map.id, canManage, photoSource, userId, shareCode]);

  // A country the pointer rests on: its ticket's photos and moments start loading, so it
  // opens with them (phones open a ticket at the first press, so it loads then). Never a
  // list the map reply says is empty: it's kept empty already, and the ticket checks it
  // quietly when it opens
  const hoverTimerRef = useRef(0);
  const hoverCountry = useCallback(
    (code) => {
      hover.set(code);
      window.clearTimeout(hoverTimerRef.current);
      if (!code) return;
      hoverTimerRef.current = window.setTimeout(() => {
        const lists = countryListsOf(mapNowRef.current, code);
        if (lists.photos !== 'none') preloadPhotoPage(countryPhotoFilters(photoSource, code));
        if (lists.moments !== 'none') preloadMomentPage(countryMomentFilters(photoSource, code));
      }, 250);
    },
    [hover, photoSource],
  );
  useEffect(() => () => window.clearTimeout(hoverTimerRef.current), []);

  // The containers over the map follow its style (19 Nov 2026, the user's wish); Black and
  // white puts the grey tokens on <html> (useMapTheme)
  useMapTheme(settings.style);
  const blackAndWhite = isMonoStyle(settings.style);

  // Badges and goals (docs/API.md, "Badges and goals"): loaded with the map, and asked
  // again (debounced) after anything that might earn one: a visit changed, a batch of
  // uploads finished, a photo changed (a landmark confirmed, a country given). The server
  // awards as the owner and editors load them; what it says is new is announced once.
  const achievements = useAchievements({ mapId: shareCode ? null : map.id, shareCode });
  // Whether phones show the goal flag at the top left (GoalTag: an unmet goal, the tag not switched off)
  const phoneFlag = settings.showGoalTag !== false && Boolean(achievements.goals && achievements.badges && nearestGoal(achievements.goals));
  const { check: checkAchievements, dismissNews } = achievements;
  // The loading screen lifts once the panels' data and the badges and goals are in
  const dataReady = loadedMapId === map.id && !achievements.loading;
  // Focus to the page once it lifts (nothing on it could take focus while it was up)
  useEffect(() => {
    if (dataReady && (document.activeElement === document.body || !document.activeElement)) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [dataReady]);
  // The tips (MapTipsDialog; 17 Nov 2026, the user's wish), once the loading screen lifts:
  // once a visit, on whichever map opens first, while the viewer's `showTips` is on. Its box
  // turns the setting off without closing it.
  const tipsWanted = settings.showTips !== false;
  const [tipsOpen, setTipsOpen] = useState(false);
  useEffect(() => {
    if (!dataReady || !tipsWanted) return;
    try {
      if (sessionStorage.getItem(TIPS_SHOWN_KEY) === '1') return;
      sessionStorage.setItem(TIPS_SHOWN_KEY, '1');
    } catch {
      // Storage blocked: they show on each map opened instead
    }
    MapTipsDialog.preload().then(
      () => setTipsOpen(true),
      () => {},
    );
  }, [dataReady, tipsWanted]);
  const wantToGo = useMemo(() => map.visits.filter((v) => v.status === 'WANT_TO_GO').map((v) => v.countryCode), [map.visits]);
  const openBadges = useCallback(() => {
    dismissNews();
    dispatch({ type: 'open', panel: 'badges' });
  }, [dismissNews]);

  const visitsByCode = useMemo(() => Object.fromEntries(map.visits.map((v) => [v.countryCode, v.status])), [map.visits]);
  const visitFor = (code) => map.visits.find((v) => v.countryCode === code) || null;
  // The map's own trips: what a photo or a moment can be on (not the group trips added from other maps)
  const ownTrips = useMemo(() => trips.filter((t) => !t.linked), [trips]);
  // Travel offers (docs/API.md, "Travel offers"): a card every `adEvery` photos in the
  // country galleries and one at the end of a slideshow (null: none for this viewer), chosen
  // first for the soonest planned trip's destination. (A client-only page: today is read here.)
  const adEvery = map.ads?.every ?? null;
  const nextTrip = useMemo(() => nextPlannedTrip(trips, todayString()), [trips]);
  const offerProps = { adEvery, nextTrip, canFetchTrips: !shareCode, mapKey: `map:${map.id}` };

  // my_planet's Detailed map type: names and lines at every zoom. The landmark pins follow
  // their own setting on either type (17 Nov 2026): when zoomed in (re-renders this page
  // only when the zoom crosses that line, not on every move), always, only the passport's
  // stamped ones, or off; the landmarks are fetched only when some can show
  const detailed = settings.mapType === 'detailed';
  const pinMode = settings.landmarkPins;
  const landmarkZoom = useViewportZoom(viewport, atLandmarkZoom);
  const { landmarks } = useLandmarks(null, {
    enabled: pinMode === 'always' || pinMode === 'stamped' || (pinMode === 'zoomed' && landmarkZoom),
  });
  // The passport's stamped landmarks: their pins are gold (the map's own reply, so a
  // confirmed landmark shows once the map refreshes after the photo's change)
  const stampedIds = map.stampedLandmarkIds;
  const stampedLandmarks = useMemo(() => new Set(stampedIds || []), [stampedIds]);

  // Photos with no country: no country panel shows them, so they get their own list
  const unplacedFilters = useMemo(() => ({ ...photoSource, ...UNPLACED_PHOTOS }), [photoSource]);
  const unplaced = usePhotoPage(unplacedFilters);
  const openUnplacedPhoto = useCallback(
    (photo) => dispatch({ type: 'openPhoto', photo, list: { filters: unplacedFilters } }),
    [unplacedFilters],
  );
  const unplacedCount = unplaced.photos.length;
  const unplacedMore = Boolean(unplaced.nextCursor);
  const showUnplaced = useCallback(() => dispatch({ type: 'toggle', panel: 'unplaced' }), []);

  // An upload, edit or delete: the photo lists, and the map itself, as a photo can add a
  // PHOTO visit (or turn a "want to go" country visited) and changes the stats
  const { reload: reloadUnplaced } = unplaced;
  const refreshMap = actions?.refresh;
  const photosChanged = useCallback(() => {
    setPhotosVersion((v) => v + 1);
    reloadUnplaced();
    refreshMap?.();
  }, [reloadUnplaced, refreshMap]);
  // A country map's pins changed (one saved or deleted in the pin panel): its pins reload
  const [pinsVersion, setPinsVersion] = useState(0);
  const pinsChanged = useCallback(() => setPinsVersion((v) => v + 1), []);
  // The world map goes, so no pointer leaves its country: the hover postcard is cleared, or
  // it showed again on the way back (19 Nov 2026, the audit)
  const openCountryMap = useCallback(
    (code) => {
      hoverCountry(null);
      dispatch({ type: 'openCountryMap', code });
    },
    [hoverCountry],
  );
  // A state's change on a country's map moved the map's visits: the world map and the badges
  // catch up (19 Nov 2026, the audit: badges were never checked after one)
  const stateVisitsChanged = useCallback(() => {
    refreshMap?.();
    checkAchievements();
  }, [refreshMap, checkAchievements]);
  // Back from a country's map, focus goes to the world map: the "Open country" button that
  // opened it went with its ticket, and focus was left on the page (19 Nov 2026, the audit)
  const backToWorldRef = useRef(false);
  const closeCountryMap = useCallback(() => {
    backToWorldRef.current = true;
    dispatch({ type: 'closeCountryMap' });
  }, []);
  useEffect(() => {
    if (ui.countryMap || !backToWorldRef.current) return;
    backToWorldRef.current = false;
    document.querySelector('#main-content svg[role="application"]')?.focus({ preventScroll: true });
  }, [ui.countryMap]);
  // A photo changed in the viewer (a landmark confirmed, a country given): it may have
  // earned something. Uploads ask once their batch is done (onBatchDone), not per photo.
  const photoEdited = useCallback(() => {
    photosChanged();
    checkAchievements();
  }, [photosChanged, checkAchievements]);

  const selectCountry = useCallback((code) => dispatch({ type: 'selectCountry', code }), []);
  const showCountry = useCallback(
    (code) => {
      const country = COUNTRY_BY_CODE[code];
      if (country) viewport.focusOn(country.pinX, country.pinY, 500);
      dispatch({ type: 'selectCountry', code });
    },
    [viewport],
  );
  // `list`: the gallery it was opened from ({ filters } of a usePhotoPage list, or { photos })
  const openPhoto = useCallback((photo, list) => dispatch({ type: 'openPhoto', photo, list }), []);
  const close = useCallback(() => dispatch({ type: 'close' }), []);
  // A visit changed by hand: then see whether it earned a badge or met a goal
  const changeVisit = actions?.setVisit;
  const setVisit = useMemo(
    () =>
      changeVisit
        ? async (...args) => {
            const answer = await changeVisit(...args);
            checkAchievements();
            return answer;
          }
        : undefined,
    [changeVisit, checkAchievements],
  );

  const handleToggle = useCallback((panel) => {
    if (panel === 'share') dispatch({ type: 'share', open: true });
    else if (panel === 'play') dispatch({ type: 'play', country: null });
    else dispatch({ type: 'toggle', panel });
  }, []);
  const playCountry = useCallback((code) => dispatch({ type: 'play', country: code }), []);

  // A panel listing photos is open: the viewer is probably next
  const listsPhotos = ui.panel === 'country' || ui.panel === 'unplaced' || ui.panel === 'photos';
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
            canManage={canManage}
            locked={mustVerify}
            onMapSaved={actions?.reload}
            onMapDeleted={() => {
              forgetMapLists();
              navigate(MAP_PAGE_URL, { replace: true });
            }}
            onUpgradePay={isOwner && !mustVerify ? () => setPayingForMap('upgrade') : null}
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
            onShowBadges={openBadges}
            passportHref={shareCode ? sharedPassportPath(shareCode) : mapPassportPath(map.id)}
            onClose={close}
          />
        );
      case 'badges':
        return (
          <BadgesGoalsPanel
            achievements={achievements}
            canEdit={canChange}
            locked={locked}
            wantToGo={wantToGo}
            mapId={map.id}
            shareCode={shareCode}
            // One person's badges only on a family's map: a couple travels together
            perPerson={map.groupType === 'FAMILY'}
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
        return <UnplacedPhotosPanel photos={unplaced} canEdit={canChange} onOpenPhoto={openUnplacedPhoto} onClose={close} />;
      case 'photos':
        return (
          <MapPhotosPanel
            photoSource={photoSource}
            photosVersion={photosVersion}
            // An editor's "Add photos" opens the upload panel (which says why, on a locked or unverified map)
            onAddPhotos={canEdit ? () => dispatch({ type: 'upload' }) : null}
            onClose={close}
          />
        );
      case 'country':
        return ui.selectedCode ? (
          <CountryPanel
            key={ui.selectedCode}
            code={ui.selectedCode}
            visit={visitFor(ui.selectedCode)}
            visitOf={visitFor}
            canEdit={canChange}
            locked={locked}
            onSetVisit={setVisit}
            photoSource={photoSource}
            photosVersion={photosVersion}
            onOpenPhoto={openPhoto}
            onPlay={playCountry}
            onAddPhotos={canChange && !mapLocked ? (code) => dispatch({ type: 'upload', code }) : null}
            mapId={shareCode ? null : map.id}
            travellers={map.travellers}
            trips={ownTrips}
            // A baby born there joins the map's travellers only while its kind has room (a
            // couple's map is two people: a family's has room)
            onAddTraveller={map.travellers.length < maxTravellersFor(map.groupType) ? actions?.addTraveller : undefined}
            onMomentsChanged={refreshMap}
            {...offerProps}
            // A region's ticket opens its country's
            onOpenPlace={selectCountry}
            onOpenCountryMap={openCountryMap}
            onClose={close}
          />
        ) : null;
      case 'timeline':
        return (
          <TimelinePanel
            momentSource={photoSource}
            trips={trips}
            travellers={map.travellers}
            shareCode={shareCode}
            canEdit={canEdit}
            onOpenTool={handleToggle}
            onShowCountry={showCountry}
            onClose={close}
          />
        );
      case 'upload':
        return canEdit ? (
          <PhotoUploadPanel
            mapId={map.id}
            countryCode={ui.uploadCountry}
            locked={locked}
            uploadRules={uploadRules}
            photoCounts={map.photoCounts || null}
            videoCounts={map.videoCounts || null}
            isOwner={isOwner}
            onUploaded={photosChanged}
            onBatchDone={checkAchievements}
            onClose={close}
          />
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
            // The map's owner can take a group trip off it (whoever added it can too, from the trip)
            onRemoveLinked={isOwner && !mustVerify ? actions?.unlinkTrip : null}
            onClose={close}
          />
        );
      case 'switcher':
        return (
          <MapSwitcher currentMapId={map.id} userId={currentUser?.id} userName={currentUser?.name} locked={mustVerify} onClose={close} />
        );
      case 'pin':
        return ui.pin && ui.countryMap ? (
          <PinPanel
            key={ui.pin.id ?? 'new'}
            pinId={ui.pin.id ?? null}
            draft={ui.pin.draft ?? null}
            source={photoSource}
            mapId={map.id}
            canEdit={canEdit}
            locked={locked}
            // A visit's new photos, uploaded from the pin (editors who may add photos)
            uploader={
              canChange && !mapLocked
                ? { mapId: map.id, uploadRules, photoCounts: map.photoCounts || null, videoCounts: map.videoCounts || null, isOwner, onUploaded: photosChanged }
                : null
            }
            onOpenPhoto={openPhoto}
            onCreated={(pin) => {
              pinsChanged();
              dispatch({ type: 'openPin', id: pin.id });
            }}
            onChanged={pinsChanged}
            onDeleted={() => {
              pinsChanged();
              close();
            }}
            onClose={close}
          />
        ) : null;
      default:
        return null;
    }
  })();

  return (
    // The map's own choice to show the UK as its four nations, for everything on the page
    // (the drawing, the country list, every country picker and landmark list)
    <SplitUkProvider value={Boolean(map.splitUk)}>
    <div data-map-style={settings.style} className='relative h-dvh w-full overflow-hidden bg-map-sea text-map-ink'>
      {/* Black and white (a map style): everything here in greys, one greyscale filter
          over the lot (the GPU applies it). The photo viewer and the slideshow sit outside it,
          so a photo opened is in colour. */}
      {/* Out of reach while the loading screen is over it */}
      <div inert={!dataReady} className={`absolute inset-0 ${blackAndWhite ? 'grayscale' : ''}`}>
        <MapBackground styleId={settings.style} animatedSea={settings.animatedSea} />

        <main id='main-content' tabIndex={-1} role='main' className='absolute inset-0' onPointerDownCapture={warmCountryPanel}>
          <h1 className='sr-only'>{map.name}</h1>
          {ui.countryMap ? (
            <ErrorBoundary key={ui.countryMap} fallback={<MapPanelFallback failed onClose={closeCountryMap} />}>
              <Suspense fallback={<CountryMapLoading name={COUNTRY_BY_CODE[ui.countryMap]?.name} />}>
                <CountryMapView
                  code={ui.countryMap}
                  source={photoSource}
                  canEdit={canEdit}
                  locked={locked}
                  pinsVersion={pinsVersion}
                  selectedPinId={ui.panel === 'pin' ? (ui.pin?.id ?? null) : null}
                  onOpenPin={(id) => dispatch({ type: 'openPin', id })}
                  onNewPin={(draft) => dispatch({ type: 'newPin', draft })}
                  onVisitsChanged={stateVisitsChanged}
                  onClose={closeCountryMap}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
          <WorldMap
            viewport={viewport}
            seaDepths={!mapStyleById(settings.style).background}
            visitsByCode={visitsByCode}
            momentCounts={map.momentCountsByCountry || undefined}
            momentSpots={map.momentSpots || undefined}
            showSky={settings.style === 'animated' && settings.sunAndMoon}
            showMoments={settings.showMoments}
            selectedCode={ui.panel === 'country' ? ui.selectedCode : null}
            onSelectCountry={selectCountry}
            onHoverCountry={hoverCountry}
            showGrid={settings.showGrid || detailed}
            showGridLabels={settings.showGridLabels || detailed}
            showCountryNames={settings.showCountryNames || detailed}
            showVisited={settings.showVisited}
            showUnvisited={settings.showUnvisited}
            showAntarctica={showAntarctica}
            landmarks={landmarks}
            stampedLandmarks={stampedLandmarks}
            landmarkPins={pinMode}
            label={`${map.name}: world map`}
          />
          )}
        </main>
        <div className='pointer-events-none absolute left-3 top-3 grid justify-items-start gap-2 phone:right-3'>
          {mustVerify ? <VerifyEmailBanner /> : null}
          {shareCode ? null : <JoinedMapNote mapName={map.name} role={role} />}
          {planBanner ? (
            <MapPlanBanner
              locked={mapLocked}
              inGrace={inGrace}
              graceUntil={map.graceUntil}
              isOwner={isOwner}
              // Paying needs a verified address (the verify banner above says so)
              onPay={isOwner && !mustVerify ? () => setPayingForMap('locked') : null}
            />
          ) : null}
          {/* Someone asks for copies of their travels from this map (docs/API.md, "Travel copies") */}
          {canManage ? <TravelCopyBanner mapId={map.id} /> : null}
          {/* Last in the column, so the banners above keep their place (the map switcher opens
              below them). On phones first (17 Nov 2026): its flag sits level with the Menu
              stamp, and the banners come below them both, or below an empty row as tall as
              the stamps when there's no flag, never under the Menu. */}
          {/* Not while a country is open on its own: its map has the room (18 Nov 2026, the
              user's wish) */}
          {settings.showGoalTag !== false && !ui.countryMap ? (
            <div className='grid phone:order-first'>
              <GoalTag
                goals={achievements.goals}
                badges={achievements.badges}
                onOpen={() => dispatch({ type: 'toggle', panel: 'badges' })}
                onIntent={() => preloadTool('badges')}
              />
            </div>
          ) : null}
          {phoneFlag ? null : <span aria-hidden='true' className='h-10 phone:order-first nophone:hidden' />}
        </div>

        {/* A country's own map has its own header there */}
        {bannerShows && !ui.countryMap ? (
          <div className='pointer-events-none absolute inset-x-0 top-3 grid justify-items-center'>
            <MapBanner map={map} />
          </div>
        ) : null}

        {/* The tools at the top right: a column of stamps on wide screens, the "Menu"
            button on phones (MapToolbar) */}
        <div className='pointer-events-none absolute right-3 top-3 z-20 grid justify-items-end'>
          <MapToolbar
            // Adding photos is part of the Photos stamp's panel
            openPanel={ui.slideshow ? 'play' : ui.sharing ? 'share' : ui.panel === 'upload' ? 'photos' : ui.panel}
            onToggle={handleToggle}
            onIntent={preloadTool}
            canShare={canShare}
            canSwitch={Boolean(currentUser) && !shareCode}
            stats={map.stats}
          />
        </div>

        {/* As far from the bottom as the toolbar is from the top (both 3); a country's own map
            has its own (CountryMapView) */}
        {ui.countryMap ? null : (
          <div className='pointer-events-none absolute bottom-3 right-3 grid'>
            <div className='pointer-events-auto'>
              <MapZoomControls viewport={viewport} />
            </div>
          </div>
        )}

        {/* The key hides while a panel is open: the panel covers that corner */}
        {panel || ui.countryMap ? null : (
          <div className='pointer-events-none absolute bottom-3 left-3 hidden nophone:grid'>
            <MapLegend showMoments={settings.showMoments} showSpots={Boolean(map.momentSpots?.length)} showStamps={stampedLandmarks.size > 0} />
          </div>
        )}

        {/* Wide screens centre every panel on the screen, the map switcher too: the same space
            above and below (4.5rem, clear of the tags at the top and the zoom stamps at the
            bottom; 6rem at the top while the map's banner shows there), and clear of the toolbar
            on the right. The wrapper has a definite height, so a panel's `nophone:max-h-full` keeps it
            on screen. On phones every panel fills the screen but for a 0.75rem margin all round, over the
            Menu stamp (17 Nov 2026, the user's wish; it started below it), and is shut with its
            own close stamp; a country's ticket fills it right to the edges (18 Nov 2026, the
            user's wish: the margin was wasted room there). */}
        {panel ? (
          <div
            data-map-panels=''
            className={`pointer-events-none absolute z-30 grid grid-rows-[minmax(0,1fr)] nophone:inset-x-24 nophone:z-10 nophone:place-items-center ${
              ui.panel === 'country' ? 'inset-0' : 'inset-3'
            } ${
              bannerShows ? 'nophone:bottom-18 nophone:top-24' : 'nophone:inset-y-18'
            }`}
          >
            {/* A panel whose code failed to arrive says so; the next panel tries afresh */}
            <ErrorBoundary key={ui.panel} fallback={<MapPanelFallback failed onClose={close} />}>
              <Suspense fallback={<MapPanelFallback />}>{panel}</Suspense>
            </ErrorBoundary>
          </div>
        ) : null}

        {/* A badge earned or a goal reached: said once, politely */}
        <AwardNews news={achievements.news} onOpen={openBadges} onDismiss={dismissNews} />

        <MapHoverLayer
          hover={hover}
          hidden={Boolean(ui.photoId) || Boolean(ui.countryMap)}
          visitsByCode={visitsByCode}
          showPoster={settings.hoverPreview}
        />

        {ui.sharing ? (
          <MapOverlayBoundary onClose={() => dispatch({ type: 'share', open: false })}>
            <ShareDialog
              resource='maps'
              id={map.id}
              name={map.name}
              role={role}
              travellers={map.travellers}
              currentUserId={currentUser?.id}
              onLeft={() => {
                forgetMapLists();
                navigate(MAP_PAGE_URL, { replace: true });
              }}
              // Handed to someone else: as an editor, the same map with that role (at its own
              // address, as /map is now another map); gone, your own map
              onTransferred={({ stayed }) => {
                dispatch({ type: 'share', open: false });
                if (stayed) {
                  actions?.reload();
                  navigate(mapPath(map.id), { replace: true });
                } else navigate(MAP_PAGE_URL, { replace: true });
              }}
              onClose={() => dispatch({ type: 'share', open: false })}
            />
          </MapOverlayBoundary>
        ) : null}

        {tipsOpen ? (
          <MapOverlayBoundary onClose={() => setTipsOpen(false)}>
            <MapTipsDialog
              hideTips={!tipsWanted}
              onHideTips={(hide) => onChangeSetting('showTips', !hide)}
              posters={settings.hoverPreview}
              onClose={() => setTipsOpen(false)}
            />
          </MapOverlayBoundary>
        ) : null}

        {payingForMap ? (
          <MapOverlayBoundary onClose={() => setPayingForMap(false)}>
            <ExtraMapDialog
              reason={payingForMap === 'upgrade' ? 'upgrade' : 'locked'}
              onClose={() => setPayingForMap(false)}
              onPaid={() => {
                setPayingForMap(false);
                forgetMapLists();
                actions?.reload();
              }}
            />
          </MapOverlayBoundary>
        ) : null}
      </div>

      {ui.photoId ? (
        <MapOverlayBoundary onClose={() => dispatch({ type: 'closePhoto' })}>
          <PhotoViewer
            photoId={ui.photoId}
            photo={ui.photo}
            list={ui.photoList}
            shareCode={shareCode}
            canEdit={canEdit}
            locked={locked}
            trips={canEdit ? ownTrips : undefined}
            onChanged={photoEdited}
            onDeleted={photosChanged}
            onClose={() => dispatch({ type: 'closePhoto' })}
          />
        </MapOverlayBoundary>
      ) : null}

      {ui.slideshow ? (
        <MapOverlayBoundary onClose={() => dispatch({ type: 'stopPlaying' })}>
          <Slideshow
            source={photoSource}
            country={ui.slideshow.country}
            titleCards={!ui.slideshow.country}
            {...offerProps}
            title={`Slideshow: ${ui.slideshow.country ? COUNTRY_BY_CODE[ui.slideshow.country]?.name || ui.slideshow.country : map.name}`}
            onClose={() => dispatch({ type: 'stopPlaying' })}
          />
        </MapOverlayBoundary>
      ) : null}

      {dataReady ? null : <MapStatusScreen loading overlay />}
    </div>
    </SplitUkProvider>
  );
}

export default MapExperience;
