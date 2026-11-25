import React, { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Constants
import { MAP_PAGE_URL, comparePath, mapPassportPath, mapPath, sharedPassportPath } from '@/utils/constants/routes';
// Hooks
import useMapViewport, { useViewportZoom } from '@/hooks/useMapViewport';
import usePhotoPage, { preloadPhotoPage } from '@/hooks/usePhotoPage';
import { preloadMomentPage } from '@/hooks/useMomentPage';
import useLandmarks, { preloadLandmarks } from '@/hooks/useLandmarks';
import { SplitUkProvider } from '@/hooks/useSplitUk';
import { DistanceUnitProvider } from '@/hooks/useDistanceUnit';
import useMediaQuery from '@/hooks/useMediaQuery';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import useMapTheme from '@/hooks/useMapTheme';
import useAchievements from '@/hooks/useAchievements';
// Components
import WorldMap from './WorldMap';
import MapBackground from './MapBackground';
import MapDesignStyle from './MapDesignStyle';
import MonoPictureFilter from './MonoPictureFilter';
import MapBanner from './MapBanner';
import MapToolbar from './MapToolbar';
import SlideAway from './chrome/SlideAway';
import MenusTab from './chrome/MenusTab';
import MapZoomControls from './MapZoomControls';
import StringModeTag from './StringModeTag';
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
  CelebrationDialog,
  CountryListPanel,
  CountryMapView,
  CountryPanel,
  ExtraMapDialog,
  ShareCardDialog,
  MapPosterDialog,
  GuessGameDialog,
  FlightLogDialog,
  QuickFillDialog,
  YearRecapDialog,
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
  WhereNextPanel,
  StringsPanel,
  FeedbackPanel,
  UnplacedPhotosPanel,
  MapPhotosPanel,
  OneShotsPanel,
  PinPanel,
  preloadTool,
  preloadWhenIdle,
} from './lazyMapPanels';
// Utils
import { maxTravellersFor } from '@/utils/map/saveMapSetup';
import { nearestGoal } from '@/utils/achievements/goals';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { countsAsVisited } from '@/utils/map/visitStatus';
import { shownSupporter } from '@/utils/plans/supporterBadge';
import { firstVisitFor } from '@/utils/map/firstVisit';
import { hasString, previousPlannedPlace, previousVisitedPlace, stringKindOf } from '@/utils/map/mapStrings';
import { distanceUnitFor } from '@/utils/map/distanceUnits';
import { MAP_PHOTOS, UNPLACED_PHOTOS } from '@/utils/map/mapPhotoLists';
import { forgetMapLists, myMaps, sharedTrips as sharedTripList } from '@/utils/map/mapListCache';
import { countryListsOf, countryMomentFilters, countryPhotoFilters, preloadCountryLists } from '@/utils/map/preloadCountryLists';
import { preloadSharing } from '@/utils/sharing/sharingCache';
import { createValueStore } from '@/utils/map/valueStore';
import { canEditRole, canManageRole } from '@/utils/sharing/shareRoles';
import { mapExtent } from '@/utils/map/projection';
import { isMonoStyle, mapStyleById, shownStyle } from '@/utils/map/mapStyles';
import { designFor, shownDesign, visitedLookOf } from '@/utils/map/mapDesign';
import { collectionCardOptions, mapCardOptions, oneShotsCardOptions, tripCardOptions } from '@/utils/shareCard/cardOptions';
import { mapPosterOptions } from '@/utils/poster/posterOptions';
import { recapYearFor } from '@/utils/recap/recap';
import { NOT_PHONE_QUERY } from '@/utils/layout/phone';
import RecapTag from '@/components/recap/RecapTag';
import AnniversaryTag from '@/components/moments/AnniversaryTag';
import TripCountdownTag from '@/components/trips/TripCountdownTag';
import TripHomeTag from '@/components/trips/TripHomeTag';
import { LandmarkMarksContext } from '@/hooks/useLandmarkMarks';
import { MapChromeContext } from '@/hooks/useMapChrome';
import useOneShots, { OneShotsContext } from '@/hooks/useOneShots';
import { TIPS_SHOWN_KEY } from '@/utils/map/mapTips';
import { celebratesStamp, celebratesVisit, todayDay } from '@/utils/map/celebrations';
import { QUICK_FILL_MAX_VISITS, QUICK_FILL_SHOWN_KEY } from '@/utils/map/quickFill';
import { nextPlannedTrip, todayString } from '@/utils/offers/offerContext';
import { plannedOutlineCodes, plannedTripsByPlace, plannedTripsFor } from '@/utils/trips/plannedTrips';

const atLandmarkZoom = (zoom) => zoom >= LANDMARK_MIN_ZOOM;
// Opening a country from the map: its panel's code is fetched on the first press
const warmCountryPanel = () => CountryPanel.preload().catch(() => {});

// Which overlay is open, the selected country, the open photo, the share dialog and the
// slideshow (`{ country }`: one country's, or null for the whole map's): one reducer, so
// opening one panel closes the last. A tool from the toolbar or the phone's menu closes the
// open panel, the share dialog and the whole map's slideshow included (`fromMenu`; 22 Nov
// 2026, the user's wish: "Play my world" played over the open photo album). A country's
// slideshow plays over its ticket, leaving it there for when it closes.
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
  // The place a trip is being planned to from its ticket (the trips panel's form opens for it)
  planCountry: null,
};

// The longest the loading screen waits for the panels' data (a slow connection): the map
// shows then, and whatever is still on its way arrives as each panel opens
const LOADING_CAP_MS = 20000;

// No planned trips (a share link's map)
const NO_PLANNED = new Map();

// The open panel closed (a country's forgets which country)
const withoutPanel = (state) => ({
  ...state,
  panel: null,
  selectedCode: state.panel === 'country' ? null : state.selectedCode,
  uploadCountry: null,
  planCountry: null,
});

function uiReducer(state, action) {
  switch (action.type) {
    case 'toggle':
      return { ...state, panel: state.panel === action.panel ? null : action.panel, uploadCountry: null, planCountry: null };
    case 'open':
      return { ...state, panel: action.panel, uploadCountry: null, planCountry: null };
    case 'planTrip':
      return { ...state, panel: 'trips', planCountry: action.code };
    case 'close':
      return { ...state, panel: null, selectedCode: state.panel === 'country' ? null : state.selectedCode };
    case 'tool':
      // From the toolbar or the phone's menu: the share dialog and the whole map's slideshow
      // replace the open panel, as another panel does
      if (action.panel === 'share') return { ...withoutPanel(state), sharing: true };
      if (action.panel === 'play') return { ...withoutPanel(state), slideshow: { country: null } };
      // The tips are a dialog of their own (tipsOpen): everything else closes
      if (action.panel === 'tips') return { ...withoutPanel(state), sharing: false, slideshow: null };
      return { ...state, panel: state.panel === action.panel ? null : action.panel, uploadCountry: null, planCountry: null };
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
  // The menus slid out of the way (25 Nov 2026, the user's wish: the tab on the toolbar's left
  // edge, MenusTab; every menu leaves by its closest side, components/map/chrome/SlideAway).
  // Not saved: a reload shows them. Wide screens only: phones have the Menu stamp, so a window
  // made phone-sized shows them again.
  const [menusAway, setMenusAway] = useState(false);
  const wideScreen = useMediaQuery(NOT_PHONE_QUERY);
  const menusHidden = menusAway && wideScreen;
  const showMenus = useCallback(() => setMenusAway(false), []);
  const toggleMenus = useCallback(() => setMenusAway((away) => !away), []);
  const mapChrome = useMemo(() => ({ hidden: menusHidden, show: showMenus }), [menusHidden, showMenus]);
  // Something opened while they're hidden (a country pressed on the map: its ticket) brings them
  // back, so it doesn't open off the screen
  const openedKey = ui.panel ? `${ui.panel}:${ui.selectedCode ?? ''}:${ui.pin?.id ?? (ui.pin?.draft ? 'new' : '')}` : '';
  const openedKeyRef = useRef(openedKey);
  useEffect(() => {
    if (openedKey && openedKey !== openedKeyRef.current) setMenusAway(false);
    openedKeyRef.current = openedKey;
  }, [openedKey]);

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
  // Feedback is for anyone signed in, on a share link too (FeedbackPanel)
  const signedIn = Boolean(currentUser);
  const photoSource = useMemo(() => (shareCode ? { shareCode } : { mapId: map.id }), [shareCode, map.id]);
  // The map's plan (the owner and editors get it; docs/API.md, "Map limits"): a locked map
  // (an extra map that isn't paid for) takes no photos, and says so on a tag under the
  // title; a map handed to its owner without a free slot is in a grace period
  const uploadRules = shareCode ? null : map.uploadRules || null;
  const mapLocked = !shareCode && Boolean(map.locked);
  const inGrace = !shareCode && !mapLocked && Boolean(map.graceUntil) && new Date(map.graceUntil).getTime() > Date.now();
  const planBanner = mapLocked || (inGrace && isOwner);
  const [payingForMap, setPayingForMap] = useState(false);
  // A share card being made (the stats panel's "Share a picture of my map"): its options
  const [shareCard, setShareCard] = useState(null);
  // The poster dialog's options (mapPosterOptions), while it's open
  const [poster, setPoster] = useState(null);
  // "Guess where I was": the map's games for friends (23 Nov 2026)
  const [guessGameOpen, setGuessGameOpen] = useState(false);
  // The flight log (23 Nov 2026): flights from boarding passes, airports collected
  const [flightLogOpen, setFlightLogOpen] = useState(false);
  // "Your year in travel" open on this year (docs/API.md "Year in travel"), or null
  const [recapYear, setRecapYear] = useState(null);
  // String mode (docs/API.md "Strings"; 23 Nov 2026, the user's wish): a press on a country
  // picks a string's end instead of opening its ticket. `{ kind, start, message, error }` (the
  // kind being tied, VISITED or PLANNED: 25 Nov 2026), or null
  const [stringMode, setStringMode] = useState(null);

  // The panels are separate downloads (lazyMapPanels.js): once the map has drawn, fetch
  // the ones this toolbar offers while the browser is idle, the country list (and a
  // country) first, so none has to load when it's opened
  useEffect(
    () =>
      preloadWhenIdle([
        'countries',
        'stats',
        'trips',
        'next',
        ...(canEdit ? ['strings'] : []),
        'timeline',
        'badges',
        'settings',
        'play',
        'photos',
        ...(canEdit ? ['upload'] : []),
        ...(canShare ? ['share', 'switcher'] : []),
        ...(signedIn ? ['feedback'] : []),
      ]),
    [canEdit, canShare, signedIn],
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

  // The map's style: the one its owner chose, for everyone who opens it, share links too
  // (docs/API.md "Map styles"; 22 Nov 2026, the user's wish), else the viewer's own. The map's
  // own design for that style, when it has one switched on (docs/API.md "Map designs"; one per
  // style), goes on top: its picture for the sea, its colours for countries, names and grid
  const styleId = shownStyle(map, settings.style);
  const design = shownDesign(designFor(map, styleId));
  // The owner or a co-owner choosing it in Settings: the map's, and kept as their own too
  // (for their maps that have none, and maps whose owner never chose one)
  const setMapStyle = actions?.setMapStyle;
  const changeMapStyle = useCallback(
    (style) => {
      onChangeSetting('style', style);
      setMapStyle?.(style);
    },
    [onChangeSetting, setMapStyle],
  );
  // The design as Settings changes it, before it's saved (MapDesignStyle follows it alone)
  const [designPreview] = useState(() => createValueStore(null));

  // The containers over the map follow its style (19 Nov 2026, the user's wish); Black and
  // white puts the grey tokens on <html> (useMapTheme)
  useMapTheme(styleId);
  const blackAndWhite = isMonoStyle(styleId);

  // Badges and goals (docs/API.md, "Badges and goals"): loaded with the map, and asked
  // again (debounced) after anything that might earn one: a visit changed, a batch of
  // uploads finished, a photo changed (a landmark confirmed, a country given). The server
  // awards as the owner and editors load them; what it says is new is announced once.
  const achievements = useAchievements({ mapId: shareCode ? null : map.id, shareCode });
  // Life's One Shots (24 Nov 2026, the user's wish and name): the map's ticks, and for its
  // editors what the flight log suggests, loaded with the map (docs/API.md "Life's One Shots")
  const oneShots = useOneShots({ mapId: shareCode ? null : map.id, shareCode });
  // Whether phones show the goal flag at the top left (GoalTag: an unmet goal, the tag not switched off)
  const phoneFlag = settings.showGoalTag !== false && Boolean(achievements.goals && achievements.badges && nearestGoal(achievements.goals));
  const { check: checkAchievements, dismissNews } = achievements;
  // The loading screen lifts once the panels' data and the badges and goals are in
  const dataReady = loadedMapId === map.id && !achievements.loading && !oneShots.loading;
  // Focus to the page once it lifts (nothing on it could take focus while it was up)
  useEffect(() => {
    if (dataReady && (document.activeElement === document.body || !document.activeElement)) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [dataReady]);
  // "Where have you been?" (QuickFillDialog; 22 Nov 2026, the user's wish: optional, once the
  // map first loads, never on the sign-up pages): once per account (the viewer's setting
  // `countriesAsked`, set as it opens) and once a visit, for the owner or a co-owner, on a map
  // with no more than QUICK_FILL_MAX_VISITS countries on it (a new map: its birthplaces), so a
  // full map never asks. The tips wait for it. The country list opens it any time ('later').
  const countedVisits = useMemo(() => map.visits.filter((v) => countsAsVisited(v.status)).length, [map.visits]);
  const askCountries = canManage && settings.countriesAsked !== true && countedVisits <= QUICK_FILL_MAX_VISITS;
  const [quickFill, setQuickFill] = useState(null); // 'first' | 'later' | null
  const [quickFillChecked, setQuickFillChecked] = useState(false);
  useEffect(() => {
    if (!dataReady || quickFillChecked) return;
    let shown = !askCountries;
    if (!shown) {
      try {
        shown = sessionStorage.getItem(QUICK_FILL_SHOWN_KEY) === '1';
        if (!shown) sessionStorage.setItem(QUICK_FILL_SHOWN_KEY, '1');
      } catch {
        // Storage blocked: the setting alone keeps it to once
      }
    }
    if (shown) {
      setQuickFillChecked(true);
      return;
    }
    QuickFillDialog.preload().then(
      () => {
        setQuickFill('first');
        onChangeSetting('countriesAsked', true);
        setQuickFillChecked(true);
      },
      () => setQuickFillChecked(true),
    );
  }, [dataReady, askCountries, quickFillChecked, onChangeSetting]);
  const refreshAfterQuickFill = actions?.refresh;
  const quickFillSaved = useCallback(async () => {
    await refreshAfterQuickFill?.();
    checkAchievements();
  }, [refreshAfterQuickFill, checkAchievements]);

  // The tips (MapTipsDialog; 17 Nov 2026, the user's wish), once the loading screen lifts:
  // once a visit, on whichever map opens first, while the viewer's `showTips` is on. Its box
  // turns the setting off without closing it. After "Where have you been?" when that opens.
  const tipsWanted = settings.showTips !== false;
  const [tipsOpen, setTipsOpen] = useState(false);
  useEffect(() => {
    if (!dataReady || !tipsWanted || !quickFillChecked || quickFill) return;
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
  }, [dataReady, tipsWanted, quickFillChecked, quickFill]);
  const wantToGo = useMemo(() => map.visits.filter((v) => v.status === 'WANT_TO_GO').map((v) => v.countryCode), [map.visits]);
  const openBadges = useCallback(() => {
    dismissNews();
    dispatch({ type: 'open', panel: 'badges' });
  }, [dismissNews]);

  const visitsByCode = useMemo(() => Object.fromEntries(map.visits.map((v) => [v.countryCode, v.status])), [map.visits]);
  // The visits as they stand, for the celebration's handlers (below) to read
  const visitsRef = useRef(visitsByCode);
  // ...and the rows themselves, for the country list's status stamps (their dates)
  const visitRowsRef = useRef(map.visits);
  useEffect(() => {
    visitsRef.current = visitsByCode;
    visitRowsRef.current = map.visits;
  }, [visitsByCode, map.visits]);
  const visitFor = (code) => map.visits.find((v) => v.countryCode === code) || null;
  // The map's own trips: what a photo or a moment can be on (not the group trips added from other maps)
  const ownTrips = useMemo(() => trips.filter((t) => !t.linked), [trips]);
  // Travel offers (docs/API.md, "Travel offers"): a card every `adEvery` photos in the
  // country galleries and one at the end of a slideshow (null: none for this viewer), chosen
  // first for the soonest planned trip's destination. (A client-only page: today is read here.)
  const adEvery = map.ads?.every ?? null;
  const nextTrip = useMemo(() => nextPlannedTrip(trips, todayString()), [trips]);
  const offerProps = { adEvery, nextTrip, canFetchTrips: !shareCode, mapKey: `map:${map.id}` };
  // Planned trips on the map (utils/trips/plannedTrips.js; 22 Nov 2026, the user's wish): the
  // places they go to, outlined unless already visited, and listed on their tickets. Never
  // through a share link, which would tell anyone with it when the map's people are away.
  const plannedByPlace = useMemo(
    () => (shareCode ? NO_PLANNED : plannedTripsByPlace(trips, Boolean(map.splitUk))),
    [shareCode, trips, map.splitUk],
  );
  const plannedCodes = useMemo(() => plannedOutlineCodes(plannedByPlace, visitsByCode), [plannedByPlace, visitsByCode]);
  const planTrip = useCallback((code) => dispatch({ type: 'planTrip', code }), []);

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
  const photoStamped = useMemo(() => new Set(stampedIds || []), [stampedIds]);
  // The landmarks ticked "been here" (docs/API.md "Collecting"), and the marks the panels'
  // checklists read (an editor ticks; useLandmarkMarks)
  const tickedIds = map.tickedLandmarkIds;
  const tickedLandmarks = useMemo(() => new Set(tickedIds || []), [tickedIds]);
  // A tick stamps the passport too (23 Nov 2026, the user's decision): both pins are gold
  const stampedLandmarks = useMemo(() => new Set([...photoStamped, ...tickedLandmarks]), [photoStamped, tickedLandmarks]);
  const setLandmarkBeen = canChange ? actions?.setLandmarkBeen : null;

  // The celebration (CelebrationDialog; 24 Nov 2026, the user's wish): stars, the model and the
  // passport's stamp, when the viewer's own tick or confirmed photo stamps a landmark for the
  // first time, or they mark a country visited or lived in from its ticket or the country list
  // (24 Nov 2026, the user's wish). Never for many at once ("Where have you been?"), and not
  // while `showCelebrations` is off.
  // What was stamped and visited before a change is read from refs, so the handlers keep
  // their identity. They queue (24 Nov 2026, the user's wish): a tick that marks a new country
  // plays the landmark's, then the country's once it's closed.
  const celebrationsWanted = settings.showCelebrations !== false;
  // Each with its own number, so the next one opens afresh
  const [celebrations, setCelebrations] = useState([]);
  const celebrationCount = useRef(0);
  const celebration = celebrations[0]?.value ?? null;
  const celebrate = useCallback(
    (...next) => {
      if (!celebrationsWanted) return;
      // The landmarks too (its name, stamp and "Been to 6 of 58"), so it opens at its size
      // (25 Nov 2026, the user's report: it grew a little as it opened)
      Promise.all([CelebrationDialog.preload(), preloadLandmarks()]).then(
        () => setCelebrations((queue) => [...queue, ...next.map((value) => ({ id: (celebrationCount.current += 1), value }))]),
        () => {},
      );
    },
    [celebrationsWanted],
  );
  const closeCelebration = useCallback(() => setCelebrations((queue) => queue.slice(1)), []);
  // A country a tick marked visited (24 Nov 2026, the user's wish): dated and tied as one marked
  // by hand; set below, once those exist
  const newPlaceMarkedRef = useRef(async () => null);
  const stampedRef = useRef(stampedLandmarks);
  useEffect(() => {
    stampedRef.current = stampedLandmarks;
  }, [stampedLandmarks]);

  // A tick can earn a landmark badge or reach a goal: ask, as a visit change does. `modelId`:
  // ticked on a landmark model's card (a country's own map), whose model the celebration shows
  const toggleLandmark = useMemo(
    () =>
      setLandmarkBeen
        ? async (landmarkId, been, { modelId = null } = {}) => {
            const firstStamp = been && celebratesStamp(landmarkId, stampedRef.current);
            const visitsBefore = visitsRef.current || {};
            const answer = await setLandmarkBeen(landmarkId, been);
            checkAchievements();
            if (firstStamp) {
              // The tick marks its place visited too (docs/API.md "Collecting"): a new one is dated
              // today and tied to the place before it, and celebrated after the landmark
              const place = answer?.countryCode;
              const newPlace = place && !countsAsVisited(visitsBefore[place]) ? place : null;
              const firstVisitedOn = newPlace ? await newPlaceMarkedRef.current(newPlace) : null;
              celebrate(
                { kind: 'landmark', landmarkId, stampedOn: todayDay(), photoUrl: null, newPlace, modelId },
                ...(newPlace ? [{ kind: 'country', code: newPlace, status: 'VISITED', firstVisitedOn }] : []),
              );
            }
            return answer;
          }
        : null,
    [setLandmarkBeen, checkAchievements, celebrate],
  );
  // A photo's landmark confirmed (or added by hand) in the photo viewer: its first stamp is
  // celebrated with that photo, dated as the passport dates it (when it was taken)
  const photoStampedLandmark = useCallback(
    (landmarkId, photo) => {
      if (!celebratesStamp(landmarkId, stampedRef.current)) return;
      const taken = typeof photo?.takenAt === 'string' ? photo.takenAt.slice(0, 10) : null;
      celebrate({ kind: 'landmark', landmarkId, stampedOn: taken || todayDay(), photoUrl: photo?.thumbUrl || null, newPlace: null });
    },
    [celebrate],
  );
  // Life's One Shots: a tick or a change saved (a country given is marked visited on the server,
  // so the map is read again), the badges asked again, and a first tick celebrated
  const { save: saveOneShotOnMap, remove: removeOneShotOnMap } = oneShots;
  const refreshAfterTick = actions?.refresh;
  const saveOneShot = useCallback(
    async (itemKey, body) => {
      const answer = await saveOneShotOnMap(itemKey, body);
      checkAchievements();
      if (answer?.countryCode) refreshAfterTick?.();
      if (answer?.created) {
        const tick = answer.oneShot || {};
        celebrate({ kind: 'oneShot', itemKey, seenOn: tick.seenOn || null, datePrecision: tick.datePrecision || null, countryCode: tick.countryCode || null, photoUrl: tick.photo?.thumbUrl || null });
      }
      return answer;
    },
    [saveOneShotOnMap, checkAchievements, refreshAfterTick, celebrate],
  );
  const removeOneShot = useCallback(
    async (itemKey) => {
      await removeOneShotOnMap(itemKey);
      checkAchievements();
    },
    [removeOneShotOnMap, checkAchievements],
  );
  // A country's ticket opens the panel at one item
  const [oneShotFocus, setOneShotFocus] = useState(null);
  const openOneShot = useCallback((itemKey) => {
    setOneShotFocus(itemKey);
    dispatch({ type: 'open', panel: 'oneShots' });
  }, []);
  const oneShotsHere = useMemo(() => ({ oneShots: oneShots.oneShots, open: openOneShot }), [oneShots.oneShots, openOneShot]);

  const landmarkMarks = useMemo(
    () => ({
      stamped: photoStamped,
      ticked: tickedLandmarks,
      onToggle: toggleLandmark,
      onPhotoStamped: canChange ? photoStampedLandmark : null,
    }),
    [photoStamped, tickedLandmarks, toggleLandmark, canChange, photoStampedLandmark],
  );

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
  // A string from the place visited just before a newly visited one (24 Nov 2026, the user's
  // wish: "always from country to country in order of visit"), while the viewer shows the strings
  // and may tie them (an editor, verified); one the map has already isn't tied twice, and a
  // failure leaves it to be tied by hand
  const autoTie = canChange && settings.showStrings !== false ? (actions?.tieString ?? null) : null;
  const stringsRef = useRef(map.strings);
  useEffect(() => {
    stringsRef.current = map.strings;
  }, [map.strings]);
  const tieToPrevious = useCallback(
    (code, status, firstVisitedOn) => {
      if (!autoTie) return;
      const now = { countryCode: code, status, firstVisitedOn: firstVisitedOn || null, markedAt: new Date().toISOString() };
      const previous = previousVisitedPlace([...visitRowsRef.current.filter((v) => v.countryCode !== code), now], code);
      if (!previous || hasString(stringsRef.current, previous, code, 'VISITED')) return;
      autoTie(previous, code, 'VISITED').catch(() => {});
    },
    [autoTie],
  );
  // The planned strings the same way (25 Nov 2026, the user's wish): a place newly marked "want to
  // go" is tied to the one marked before it, in the order they were marked, while the viewer shows
  // the planned strings
  const autoTiePlanned = canChange && settings.showPlannedStrings !== false ? (actions?.tieString ?? null) : null;
  const tieToPreviousPlanned = useCallback(
    (code) => {
      if (!autoTiePlanned) return;
      const now = { countryCode: code, status: 'WANT_TO_GO', markedAt: new Date().toISOString() };
      const previous = previousPlannedPlace([...visitRowsRef.current.filter((v) => v.countryCode !== code), now], code);
      if (!previous || hasString(stringsRef.current, previous, code, 'PLANNED')) return;
      autoTiePlanned(previous, code, 'PLANNED').catch(() => {});
    },
    [autoTiePlanned],
  );
  // A country marked visited or lived in from its ticket (CountryPanel's own status control) or
  // the country list: celebrated, and tied to the place visited before it; one newly wanted is
  // tied to the place wanted before it with a planned string
  const visitMarked = useCallback(
    (code, before, status, firstVisitedOn) => {
      if (status === 'WANT_TO_GO' && before !== 'WANT_TO_GO') tieToPreviousPlanned(code);
      if (!celebratesVisit(before, status)) return;
      celebrate({ kind: 'country', code, status, firstVisitedOn: firstVisitedOn || null });
      tieToPrevious(code, status, firstVisitedOn);
    },
    [celebrate, tieToPrevious, tieToPreviousPlanned],
  );
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
  // A country a landmark's tick marked visited: dated today unless it has a date, and tied to the
  // place visited before it, as one marked by hand. -> its first visit
  useEffect(() => {
    newPlaceMarkedRef.current = async (code) => {
      const firstVisitedOn = firstVisitFor(visitRowsRef.current.find((v) => v.countryCode === code) || null, 'VISITED') ?? null;
      if (setVisit && firstVisitedOn) await setVisit(code, 'VISITED', { firstVisitedOn }).catch(() => {});
      tieToPrevious(code, 'VISITED', firstVisitedOn);
      return firstVisitedOn;
    };
  }, [setVisit, tieToPrevious]);
  // The country list's status stamps: a place newly visited or lived in is dated today unless it
  // has a date (utils/map/firstVisit.js; 24 Nov 2026, the user's wish), as on its ticket, and is
  // celebrated as from its ticket once saved (24 Nov 2026, the user's wish: it gets its passport
  // page too). Stable, so the list's memoised rows don't re-render for it
  const setVisitFromList = useMemo(
    () =>
      setVisit
        ? async (code, status) => {
            const visit = visitRowsRef.current.find((v) => v.countryCode === code) || null;
            const firstVisitedOn = status ? firstVisitFor(visit, status) : undefined;
            const answer = await setVisit(code, status, status ? { firstVisitedOn } : undefined);
            visitMarked(code, visit?.status ?? null, status, firstVisitedOn);
            return answer;
          }
        : undefined,
    [setVisit, visitMarked],
  );

  // A tool from the toolbar or the phone's menu: whatever was open closes (uiReducer 'tool'),
  // string mode too. 'tips' (Settings' "Show the tips", 24 Nov 2026) opens the tips, or shuts them.
  const handleToggle = useCallback((panel) => {
    setStringMode(null);
    setOneShotFocus(null);
    dispatch({ type: 'tool', panel });
    setTipsOpen((open) => panel === 'tips' && !open);
  }, []);

  // String mode: the first country pressed starts a string, the second ties it (and the next
  // starts afresh); a press on a string takes it off
  const tieString = actions?.tieString;
  const untieString = actions?.untieString;
  const pickStringEnd = useCallback(
    (code) => {
      const start = stringMode?.start;
      const kind = stringMode?.kind ?? 'VISITED';
      if (!start) return setStringMode({ kind, start: code, message: '', error: false });
      if (start === code) return setStringMode({ kind, start: null, message: `${COUNTRY_BY_CODE[code]?.name ?? code} let go.`, error: false });
      setStringMode({ kind, start: null, message: 'Tying…', error: false });
      return tieString(start, code, kind).then(
        (string) =>
          setStringMode((mode) =>
            mode ? { ...mode, message: `Tied ${COUNTRY_BY_CODE[string.from]?.name ?? string.from} to ${COUNTRY_BY_CODE[string.to]?.name ?? string.to}.`, error: false } : mode,
          ),
        (err) => setStringMode((mode) => (mode ? { ...mode, message: err?.friendlyMessage || 'That string didn’t tie. Please try again.', error: true } : mode)),
      );
    },
    [stringMode, tieString],
  );
  const removeString = useCallback(
    (string) =>
      untieString(string).then(
        () => setStringMode((mode) => (mode ? { ...mode, message: 'String taken off.', error: false } : mode)),
        (err) => setStringMode((mode) => (mode ? { ...mode, message: err?.friendlyMessage || 'That string didn’t come off. Please try again.', error: true } : mode)),
      ),
    [untieString],
  );
  const endStringMode = useCallback(() => setStringMode(null), []);
  // The strings drawn: each kind unless the viewer hid it, and always the kind being tied
  const showVisitedStrings = stringMode?.kind === 'VISITED' || settings.showStrings !== false;
  const showPlannedStrings = stringMode?.kind === 'PLANNED' || settings.showPlannedStrings !== false;
  const shownStrings = useMemo(
    () => (map.strings || []).filter((string) => (stringKindOf(string) === 'PLANNED' ? showPlannedStrings : showVisitedStrings)),
    [map.strings, showVisitedStrings, showPlannedStrings],
  );
  const playCountry = useCallback((code) => dispatch({ type: 'play', country: code }), []);

  // A panel listing photos is open: the viewer is probably next
  const listsPhotos = ui.panel === 'country' || ui.panel === 'unplaced' || ui.panel === 'photos';
  useEffect(() => {
    if (listsPhotos) PhotoViewer.preload().catch(() => {});
  }, [listsPhotos]);

  const panel = (() => {
    // The map's passport, its own address or through the share link: the statistics, the
    // country list and Where to go next link to it
    const passportHref = shareCode ? sharedPassportPath(shareCode) : mapPassportPath(map.id);
    switch (ui.panel) {
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onChangeSetting={onChangeSetting}
            map={map}
            mapStyle={styleId}
            onMapStyleChange={canManage && actions?.setMapStyle ? changeMapStyle : null}
            canEdit={canEdit}
            isOwner={isOwner}
            canManage={canManage}
            locked={mustVerify}
            onMapSaved={actions?.reload}
            onDesignChange={actions?.setDesign}
            designPreview={designPreview}
            onMapDeleted={() => {
              forgetMapLists();
              navigate(MAP_PAGE_URL, { replace: true });
            }}
            onUpgradePay={isOwner && !mustVerify ? () => setPayingForMap('upgrade') : null}
            // The tips, any time (the toolbar's own stamp until 24 Nov 2026, the user's wish)
            onShowTips={() => handleToggle('tips')}
            onClose={close}
          />
        );
      case 'stats':
        return (
          <StatsPanel
            stats={map.stats}
            travellers={map.travellers}
            // Collector's counts: the UN members to go open their tickets (the UK's is England's
            // on a map that splits it, where the UK has none of its own)
            visits={map.visits}
            onOpenCountry={(code) => showCountry(code === 'GB' && map.splitUk ? 'XE' : code)}
            unplacedCount={unplacedCount}
            unplacedMore={unplacedMore}
            onShowUnplaced={showUnplaced}
            onShowBadges={openBadges}
            // Not through a share link: the card is the map of someone who's on it
            onShareCard={shareCode ? undefined : () => setShareCard(mapCardOptions(map, design))}
            onPoster={shareCode ? undefined : () => setPoster(mapPosterOptions(map, design))}
            onGuessGame={canEdit ? () => setGuessGameOpen(true) : undefined}
            onFlightLog={shareCode || !currentUser ? undefined : () => setFlightLogOpen(true)}
            compareHref={shareCode ? null : comparePath(map.id)}
            onYearRecap={shareCode ? undefined : () => setRecapYear(recapYearFor())}
            collected={landmarkMarks}
            passportHref={passportHref}
            onClose={close}
          />
        );
      case 'oneShots':
        return (
          <OneShotsPanel
            oneShots={oneShots}
            canEdit={canEdit}
            locked={locked}
            travellers={map.travellers}
            photoSource={photoSource}
            focusKey={oneShotFocus}
            onSave={saveOneShot}
            onRemove={removeOneShot}
            // A picture of the lists to post: the map's own people, never a share link
            onShareCard={canEdit && !shareCode ? () => setShareCard(oneShotsCardOptions(map, oneShots.oneShots)) : null}
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
            // A country's medal as a picture to post: the map's own people, never a share link
            onShareCollection={canEdit && !shareCode ? (collection) => setShareCard(collectionCardOptions(collection)) : null}
            onClose={close}
          />
        );
      case 'countries':
        return (
          <CountryListPanel
            visitsByCode={visitsByCode}
            canEdit={canChange}
            locked={locked}
            onChangeStatus={setVisitFromList}
            onShowCountry={showCountry}
            // Ticking several at once: the owner and co-owners (as the first-load offer)
            onQuickFill={canManage ? () => setQuickFill('later') : null}
            unplacedCount={unplacedCount}
            unplacedMore={unplacedMore}
            onShowUnplaced={showUnplaced}
            passportHref={passportHref}
            // The Strings panel, an editor's (its toolbar stamp until 24 Nov 2026, the user's wish)
            onOpenStrings={canEdit ? () => handleToggle('strings') : null}
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
            // The whole map's slideshow, over the album (its own stamp until 24 Nov 2026, the user's wish)
            onPlay={() => dispatch({ type: 'play' })}
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
            onVisitMarked={visitMarked}
            photoSource={photoSource}
            photosVersion={photosVersion}
            onOpenPhoto={openPhoto}
            onPlay={playCountry}
            onAddPhotos={canChange && !mapLocked ? (code) => dispatch({ type: 'upload', code }) : null}
            mapId={shareCode ? null : map.id}
            travellers={map.travellers}
            trips={ownTrips}
            plannedTrips={plannedTripsFor(plannedByPlace, ui.selectedCode)}
            onPlanTrip={canChange && actions?.addTrip ? planTrip : null}
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
            // Fresh for each place a trip is planned to from its ticket
            key={ui.planCountry || 'trips'}
            trips={trips}
            travellers={map.travellers}
            canEdit={canChange}
            locked={locked}
            onCreate={actions?.addTrip}
            planCountry={ui.planCountry}
            noLinks={Boolean(shareCode)}
            // The map's owner can take a group trip off it (whoever added it can too, from the trip)
            onRemoveLinked={isOwner && !mustVerify ? actions?.unlinkTrip : null}
            onFlights={canEdit ? () => setFlightLogOpen(true) : null}
            onClose={close}
          />
        );
      case 'next':
        return <WhereNextPanel visits={map.visits} onShowCountry={showCountry} passportHref={passportHref} onClose={close} />;
      case 'feedback':
        // A problem, an idea or a question (docs/API.md "Feedback"), for anyone signed in
        return currentUser ? <FeedbackPanel mapId={map.id} styleId={styleId} phone={!wideScreen} onClose={close} /> : null;
      case 'strings':
        return canEdit ? (
          <StringsPanel
            map={map}
            strings={map.strings || []}
            shown={{ VISITED: settings.showStrings !== false, PLANNED: settings.showPlannedStrings !== false }}
            onShowStrings={(kind, on) => onChangeSetting(kind === 'PLANNED' ? 'showPlannedStrings' : 'showStrings', on)}
            locked={locked}
            // Their colours are the map design's, for the map's style (as Settings' "How it looks")
            styleId={styleId}
            onDesignChange={canManage ? actions?.setDesign : null}
            designPreview={designPreview}
            onTie={actions.tieString}
            onTieAuto={actions.tieAutoStrings}
            onUntie={actions.untieString}
            onUntieAll={actions.untieAllStrings}
            onStringMode={(kind) => {
              close();
              setStringMode({ kind, start: null, message: '', error: false });
            }}
            onClose={close}
          />
        ) : null;
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
    {/* Kilometres or miles, for the statistics and the flight log: the viewer's setting, else
        miles for a map whose home is in the United States (24 Nov 2026, the user's wish) */}
    <DistanceUnitProvider value={distanceUnitFor(settings.distanceUnit, map.stats?.homeCountryCode)}>
    <LandmarkMarksContext.Provider value={landmarkMarks}>
    <OneShotsContext.Provider value={oneShotsHere}>
    <MapChromeContext.Provider value={mapChrome}>
    <div
      data-map-style={styleId}
      data-map-design={design ? '' : undefined}
      className='relative h-dvh w-full overflow-hidden bg-map-sea text-map-ink'
    >
      {design ? <MapDesignStyle design={design} preview={designPreview} /> : null}
      {/* Black and white (a map style): everything here in greys (data-mono-map in index.css):
          the map's drawing through the grey tokens, so a design's own colours show on it (22 Nov
          2026, the user's wish: they turned grey), and a greyscale filter over the rest and the
          pictures in the map. The photo viewer and the slideshow sit outside it, so a photo
          opened is in colour. */}
      {/* Out of reach while the loading screen is over it */}
      <div inert={!dataReady} data-mono-map={blackAndWhite ? '' : undefined} className='absolute inset-0'>
        {blackAndWhite ? <MonoPictureFilter /> : null}
        <MapBackground styleId={styleId} animatedSea={settings.animatedSea} pictureUrl={design?.picture?.url ?? null} />

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
            seaDepths={!mapStyleById(styleId).background && !design?.picture}
            visitsByCode={visitsByCode}
            plannedCodes={plannedCodes}
            momentCounts={map.momentCountsByCountry || undefined}
            momentSpots={map.momentSpots || undefined}
            showSky={styleId === 'animated' && settings.sunAndMoon}
            showMoments={settings.showMoments}
            selectedCode={ui.panel === 'country' ? ui.selectedCode : null}
            onSelectCountry={stringMode ? pickStringEnd : selectCountry}
            strings={shownStrings}
            stringStart={stringMode?.start ?? null}
            stringKind={stringMode?.kind ?? 'VISITED'}
            onRemoveString={stringMode ? removeString : null}
            onHoverCountry={hoverCountry}
            showGrid={settings.showGrid || detailed}
            gridColoured={Boolean(design?.grid)}
            showGridLabels={settings.showGridLabels || detailed}
            showCountryNames={settings.showCountryNames || detailed}
            showVisited={settings.showVisited}
            showUnvisited={settings.showUnvisited}
            showAntarctica={showAntarctica}
            landmarks={landmarks}
            stampedLandmarks={stampedLandmarks}
            landmarkPins={pinMode}
            label={`${map.name}: world map`}
            design={design}
            designPreview={designPreview}
          />
          )}
        </main>
        {/* Every piece of the page's furniture below slides off by its closest side while the
            menus are hidden (SlideAway, MenusTab) */}
        <SlideAway className='pointer-events-none absolute left-3 top-3 grid justify-items-start gap-2 phone:right-3' data-map-tags=''>
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
          {/* In December and January, the year's recap (docs/API.md "Year in travel") */}
          {shareCode ? null : <RecapTag mapId={map.id} onOpen={setRecapYear} />}
          {/* A moment's day come round: "10 years ago today: Our wedding" (21 Nov 2026) */}
          {shareCode ? null : <AnniversaryTag mapId={map.id} onOpenCountry={selectCountry} />}
          {/* The countdown to the next planned trip: "12 days until Japan in spring" (22 Nov 2026);
              the viewer can switch it off (`showTripCountdown`, 25 Nov 2026) */}
          {shareCode || settings.showTripCountdown === false ? null : <TripCountdownTag trips={trips} />}
          {/* The day after a trip ends, for two weeks: "Welcome home", share it (23 Nov 2026,
              the user's wish: word of mouth). Its editors only; the map's link for those who
              can open the sharing dialog */}
          {canEdit ? (
            <TripHomeTag
              trips={trips}
              onSharePicture={(trip) => setShareCard(tripCardOptions(trip, map, design))}
              onShareLink={canShare ? () => dispatch({ type: 'share', open: true }) : null}
            />
          ) : null}
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
        </SlideAway>

        {/* A country's own map has its own header there */}
        {bannerShows && !ui.countryMap ? (
          <SlideAway className='pointer-events-none absolute inset-x-0 top-3 grid justify-items-center'>
            <MapBanner map={map} supporter={shownSupporter(map, settings, { role, shareCode })} />
          </SlideAway>
        ) : null}

        {/* The tools at the top right: a column of stamps on wide screens, the "Menu"
            button on phones (MapToolbar) */}
        {/* It leaves to the right by its own width, so the tab on its left (MenusTab) stays on the
            screen's edge to bring the menus back */}
        <SlideAway className='pointer-events-none absolute right-3 top-3 z-20 grid justify-items-end' toward='right' margin={0} interactive data-map-tools=''>
          <MenusTab hidden={menusHidden} onToggle={toggleMenus} />
          <div inert={menusHidden ? true : undefined} className='grid justify-items-end'>
          <MapToolbar
            // Adding photos is part of the Photos stamp's panel
            openPanel={tipsOpen ? 'tips' : ui.slideshow ? 'play' : ui.sharing ? 'share' : ui.panel === 'upload' ? 'photos' : ui.panel}
            onToggle={handleToggle}
            onIntent={preloadTool}
            canShare={canShare}
            canSwitch={Boolean(currentUser) && !shareCode}
            canFeedback={signedIn}
            stats={map.stats}
          />
          </div>
        </SlideAway>

        {/* As far from the bottom as the toolbar is from the top (both 3); a country's own map
            has its own (CountryMapView) */}
        {ui.countryMap ? null : (
          <SlideAway className='pointer-events-none absolute bottom-3 right-3 grid'>
            <div className='pointer-events-auto'>
              <MapZoomControls viewport={viewport} />
            </div>
          </SlideAway>
        )}

        {/* String mode's tag at the foot of the map, clear of the zoom stamps */}
        {stringMode && !ui.countryMap ? (
          <div className='pointer-events-none absolute inset-x-3 bottom-20 grid justify-items-center nophone:bottom-3'>
            <StringModeTag
              kind={stringMode.kind}
              startCode={stringMode.start}
              message={stringMode.message}
              error={stringMode.error}
              onDone={endStringMode}
            />
          </div>
        ) : null}

        {/* The key hides while a panel is open: the panel covers that corner. The viewer can
            switch it off (`showMapKey`, 25 Nov 2026) */}
        {panel || ui.countryMap || settings.showMapKey === false ? null : (
          <SlideAway className='pointer-events-none absolute bottom-3 left-3 hidden nophone:grid'>
            <MapLegend
              showMoments={settings.showMoments}
              showSpots={Boolean(map.momentSpots?.length)}
              showStamps={stampedLandmarks.size > 0}
              showPlanned={plannedCodes.size > 0}
              // How the map's design shows the places been to (25 Nov 2026): badges, a colour or both
              visitedLook={visitedLookOf(design)}
            />
          </SlideAway>
        )}

        {/* Wide screens centre every panel on the screen, the map switcher too: the same space
            above and below (4.5rem, clear of the tags at the top and the zoom stamps at the
            bottom; 6rem at the top while the map's banner shows there), and clear of the toolbar
            on the right. The wrapper has a definite height, so a panel's `nophone:max-h-full` keeps it
            on screen. On phones every panel fills the screen but for a 0.75rem margin all round, over the
            Menu stamp (17 Nov 2026, the user's wish; it started below it), and is shut with its
            own close stamp; a country's ticket fills it right to the edges (18 Nov 2026, the
            user's wish: the margin was wasted room there). */}
        {/* Every panel opens over the dimmed map, as the dialogs do (22 Nov 2026, the user's
            wish), and a press on it closes the panel. On wide screens it sits under the toolbar
            (z-20), which stays bright and works, so another tool is one press away. */}
        {panel ? (
          <div
            aria-hidden='true'
            data-map-scrim=''
            onClick={close}
            // Fades while the menus are hidden, the panel sliding away over it
            className={`absolute inset-0 z-30 bg-scrim motion-safe:transition-opacity motion-safe:duration-500 nophone:z-10 ${menusHidden ? 'pointer-events-none opacity-0' : ''}`}
          />
        ) : null}
        {panel ? (
          <SlideAway
            measure='[data-map-panel]'
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
          </SlideAway>
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

        {quickFill ? (
          <MapOverlayBoundary onClose={() => setQuickFill(null)}>
            <QuickFillDialog
              mapId={map.id}
              splitUk={Boolean(map.splitUk)}
              visitsByCode={visitsByCode}
              first={quickFill === 'first'}
              onSaved={quickFillSaved}
              onClose={() => setQuickFill(null)}
            />
          </MapOverlayBoundary>
        ) : null}

        {tipsOpen ? (
          <MapOverlayBoundary onClose={() => setTipsOpen(false)}>
            <MapTipsDialog
              hideTips={!tipsWanted}
              onHideTips={(hide) => onChangeSetting('showTips', !hide)}
              posters={settings.hoverPreview}
              share={canShare}
              design={canManage}
              onClose={() => setTipsOpen(false)}
            />
          </MapOverlayBoundary>
        ) : null}

        {recapYear ? (
          <MapOverlayBoundary onClose={() => setRecapYear(null)}>
            <YearRecapDialog map={map} design={design} year={recapYear} onClose={() => setRecapYear(null)} />
          </MapOverlayBoundary>
        ) : null}

        {shareCard ? (
          <MapOverlayBoundary onClose={() => setShareCard(null)}>
            <ShareCardDialog card={shareCard} title={shareCard.dialogTitle} onClose={() => setShareCard(null)} />
          </MapOverlayBoundary>
        ) : null}

        {poster ? (
          <MapOverlayBoundary onClose={() => setPoster(null)}>
            <MapPosterDialog poster={poster} onClose={() => setPoster(null)} />
          </MapOverlayBoundary>
        ) : null}

        {flightLogOpen ? (
          <MapOverlayBoundary onClose={() => setFlightLogOpen(false)}>
            <FlightLogDialog
              mapId={map.id}
              trips={trips}
              visitsByCode={visitsByCode}
              splitUk={Boolean(map.splitUk)}
              canEdit={canEdit}
              canAdd={canEdit && !mustVerify}
              onSetVisit={setVisit}
              onChanged={refreshMap}
              onClose={() => setFlightLogOpen(false)}
            />
          </MapOverlayBoundary>
        ) : null}

        {guessGameOpen ? (
          <MapOverlayBoundary onClose={() => setGuessGameOpen(false)}>
            <GuessGameDialog mapId={map.id} canMake={!mustVerify} onClose={() => setGuessGameOpen(false)} />
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

      {/* Over everything, the photo viewer too (a confirmed photo is celebrated there), and
          outside Black and white's filter, so the model keeps its colours as photos do */}
      {/* One at a time, each afresh (its own focus, stars and stamp) */}
      {celebration ? (
        <MapOverlayBoundary onClose={closeCelebration}>
          <CelebrationDialog
            key={celebrations[0].id}
            celebration={celebration}
            passportHref={mapPassportPath(map.id)}
            onClose={closeCelebration}
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
    </MapChromeContext.Provider>
    </OneShotsContext.Provider>
    </LandmarkMarksContext.Provider>
    </DistanceUnitProvider>
    </SplitUkProvider>
  );
}

export default MapExperience;
