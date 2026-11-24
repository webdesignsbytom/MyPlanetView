import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import MapExperience from '@/components/map/MapExperience';
import { preloadCountryLists } from '@/utils/map/preloadCountryLists';
import { preloadSharing } from '@/utils/sharing/sharingCache';
import { myMaps } from '@/utils/map/mapListCache';
import { DEFAULT_MAP_SETTINGS } from '@/utils/map/mapSettings';
import { QUICK_FILL_SHOWN_KEY } from '@/utils/map/quickFill';
import { TIPS_SHOWN_KEY } from '@/utils/map/mapTips';
import { withProviders } from './helpers';

// Everything round the map page's state is a stand-in, so what's tested is what MapExperience
// itself decides: the loading screen, the first-load dialogs, which panel is open
const { stub, viewport, toolbar, panelProps, oneShotsState } = vi.hoisted(() => {
  // The map's Life's One Shots (useOneShots), as a test sets them
  const oneShotsState = { oneShots: [], suggestions: [], loading: false, error: null, save: null, remove: null, reload: () => {} };
  // The props each stand-in last got, so a test can call what the page handed it
  const panelProps = {};
  const stub = (name) => {
    const Panel = (props) => {
      panelProps[name] = props;
      return (
      <div
        data-panel={name}
        data-code={props.code ?? undefined}
        data-first={props.first === undefined ? undefined : String(props.first)}
        data-share={props.share === undefined ? undefined : String(props.share)}
      >
        {props.onClose ? (
          <button type='button' onClick={props.onClose}>
            {`close ${name}`}
          </button>
        ) : null}
      </div>
      );
    };
    Panel.preload = vi.fn(() => Promise.resolve({}));
    return Panel;
  };
  const viewport = { svgRef: () => {}, handlers: {}, afterTap: (run) => run(), focusOn: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), reset: vi.fn() };
  const toolbar = { props: null };
  return { stub, viewport, toolbar, panelProps, oneShotsState };
});

vi.mock('@/hooks/useMapViewport', () => ({ default: () => viewport, useViewportZoom: () => false }));
vi.mock('@/hooks/usePhotoPage', () => ({
  default: () => ({ photos: [], nextCursor: null, loading: false, reload: () => {} }),
  preloadPhotoPage: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/hooks/useMomentPage', () => ({ preloadMomentPage: vi.fn(() => Promise.resolve()) }));
vi.mock('@/hooks/useLandmarks', () => ({ default: () => ({ landmarks: [] }), preloadLandmarks: vi.fn(() => Promise.resolve()) }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));
vi.mock('@/hooks/useOneShots', async (importOriginal) => ({ ...(await importOriginal()), default: () => oneShotsState }));
vi.mock('@/hooks/useMediaQuery', () => ({ default: () => false }));
vi.mock('@/hooks/useAchievements', () => ({
  default: () => ({ goals: [], badges: [], loading: false, news: null, check: () => {}, dismissNews: () => {} }),
}));
vi.mock('@/utils/map/mapListCache', () => ({
  forgetMapLists: vi.fn(),
  myMaps: { load: vi.fn(() => Promise.resolve([])) },
  sharedTrips: { load: vi.fn(() => Promise.resolve([])) },
}));
vi.mock('@/utils/map/preloadCountryLists', () => ({
  preloadCountryLists: vi.fn(() => Promise.resolve()),
  countryListsOf: () => ({ photos: 'none', moments: 'none' }),
  countryPhotoFilters: (source, code) => ({ ...source, country: code }),
  countryMomentFilters: (source, code) => ({ ...source, country: code }),
}));
vi.mock('@/utils/sharing/sharingCache', () => ({ preloadSharing: vi.fn(() => Promise.resolve()) }));
vi.mock('@/components/map/WorldMap', async () => {
  // It reads the page's One Shots context too, as a country's ticket does
  const { useOneShotsHere } = await vi.importActual('@/hooks/useOneShots');
  const WorldMap = (props) => {
    toolbar.oneShotsHere = useOneShotsHere();
    return (
      <div data-world-map={props.label}>
        <button type='button' onClick={() => props.onSelectCountry('FR')}>
          pick France
        </button>
      </div>
    );
  };
  return { default: WorldMap };
});
vi.mock('@/components/map/MapToolbar', () => ({
  default: (props) => {
    toolbar.props = props;
    return (
      <nav data-open-panel={props.openPanel ?? ''}>
        {['stats', 'countries', 'trips', 'oneShots', 'share', 'play', 'settings', 'tips'].map((id) => (
          <button key={id} type='button' onClick={() => props.onToggle(id)}>
            {`tool ${id}`}
          </button>
        ))}
      </nav>
    );
  },
}));
vi.mock('@/components/map/MapHoverLayer', () => ({ default: () => null }));
vi.mock('@/components/map/VerifyEmailBanner', () => ({ default: () => <p data-verify-banner /> }));
vi.mock('@/components/achievements/GoalTag', () => ({ default: () => null }));
vi.mock('@/components/achievements/AwardNews', () => ({ default: () => null }));
vi.mock('@/components/travelCopies/TravelCopyBanner', () => ({ default: () => null }));
vi.mock('@/components/recap/RecapTag', () => ({ default: () => null }));
vi.mock('@/components/moments/AnniversaryTag', () => ({ default: () => null }));
vi.mock('@/components/trips/TripCountdownTag', () => ({ default: () => null }));
vi.mock('@/components/countryMap/CountryMapLoading', () => ({ default: () => null }));
vi.mock('@/components/map/lazyMapPanels', () => {
  const names = [
    'BadgesGoalsPanel', 'CelebrationDialog', 'OneShotsPanel', 'CountryListPanel', 'CountryMapView', 'CountryPanel', 'ExtraMapDialog', 'ShareCardDialog', 'MapPosterDialog',
    'QuickFillDialog', 'YearRecapDialog', 'MapSwitcher', 'MapTipsDialog', 'PhotoUploadPanel', 'PhotoViewer', 'SettingsPanel',
    'ShareDialog', 'Slideshow', 'StatsPanel', 'TimelinePanel', 'TripsPanel', 'WhereNextPanel', 'UnplacedPhotosPanel', 'MapPhotosPanel', 'PinPanel',
  ];
  return { ...Object.fromEntries(names.map((name) => [name, stub(name)])), preloadTool: vi.fn(), preloadWhenIdle: vi.fn(() => () => {}) };
});

const MAP = {
  id: 'map-1',
  name: 'Our trips',
  groupType: 'COUPLE',
  splitUk: false,
  visits: [{ countryCode: 'GB', status: 'LIVED' }],
  travellers: [{ id: 't1', name: 'Charlie' }],
  stats: { countries: 1, continents: 1, photos: 0, specialPlaces: 0 },
};
const actions = () => ({ setVisit: vi.fn(), refresh: vi.fn(), reload: vi.fn(), setMapStyle: vi.fn(), setDesign: vi.fn(), addTrip: vi.fn() });

const open = (props = {}) => {
  const onChangeSetting = vi.fn();
  const result = render(
    withProviders(
      <MapExperience
        map={MAP}
        trips={[]}
        role='OWNER'
        actions={actions()}
        currentUser={{ id: 'user-1', name: 'Charlie' }}
        settings={DEFAULT_MAP_SETTINGS}
        onChangeSetting={onChangeSetting}
        {...props}
      />,
      { route: '/maps/map-1' },
    ),
  );
  const q = (selector) => result.container.querySelector(selector);
  const panel = (name) => q(`[data-panel="${name}"]`);
  const click = (text) => fireEvent.click([...result.container.querySelectorAll('button')].find((b) => b.textContent === text));
  return { ...result, q, panel, click, onChangeSetting };
};

// The ones that open the first time a map loads, as if they'd shown this visit already
const seenDialogs = () => {
  sessionStorage.setItem(QUICK_FILL_SHOWN_KEY, '1');
  sessionStorage.setItem(TIPS_SHOWN_KEY, '1');
};

describe('MapExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preloadCountryLists.mockImplementation(() => Promise.resolve());
  });
  afterEach(() => vi.useRealTimers());

  describe('the loading screen', () => {
    it('covers the map, out of reach, until every panel’s data is in', async () => {
      seenDialogs();
      let finish;
      preloadCountryLists.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const { q } = open();
      expect(q('[data-map-loading]')).not.toBeNull();
      expect(q('[inert]')).not.toBeNull();
      // The map is drawn underneath meanwhile
      expect(q('[data-world-map="Our trips: world map"]')).not.toBeNull();
      await act(async () => finish());
      await waitFor(() => expect(q('[data-map-loading]')).toBeNull());
      expect(q('[inert]')).toBeNull();
      expect(preloadSharing).toHaveBeenCalledWith('maps', 'map-1');
      expect(myMaps.load).toHaveBeenCalledWith('user-1');
    });

    it('lifts after 20 seconds whatever is still on its way', async () => {
      seenDialogs();
      vi.useFakeTimers();
      preloadCountryLists.mockReturnValue(new Promise(() => {}));
      const { q } = open();
      await act(async () => {
        vi.advanceTimersByTime(19999);
      });
      expect(q('[data-map-loading]')).not.toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(q('[data-map-loading]')).toBeNull();
    });

    it('fetches no share settings or map lists through a share link', async () => {
      seenDialogs();
      const { q } = open({ shareCode: 'ABCD-EFGH-JKMN', role: 'VIEWER', actions: null, currentUser: null });
      await waitFor(() => expect(q('[data-map-loading]')).toBeNull());
      expect(preloadSharing).not.toHaveBeenCalled();
      expect(myMaps.load).not.toHaveBeenCalled();
      expect(toolbar.props.canShare).toBe(false);
      expect(toolbar.props.canSwitch).toBe(false);
    });
  });

  describe('the first-load dialogs', () => {
    it('asks "Where have you been?" once for a new map’s owner, and the tips wait for it', async () => {
      const { panel, onChangeSetting, click } = open();
      await waitFor(() => expect(panel('QuickFillDialog')).not.toBeNull());
      expect(panel('QuickFillDialog').getAttribute('data-first')).toBe('true');
      expect(onChangeSetting).toHaveBeenCalledWith('countriesAsked', true);
      expect(sessionStorage.getItem(QUICK_FILL_SHOWN_KEY)).toBe('1');
      expect(panel('MapTipsDialog')).toBeNull();
      click('close QuickFillDialog');
      await waitFor(() => expect(panel('MapTipsDialog')).not.toBeNull());
      expect(panel('QuickFillDialog')).toBeNull();
      expect(sessionStorage.getItem(TIPS_SHOWN_KEY)).toBe('1');
    });

    it('never asks a map with countries on it, or an account asked before, or twice a visit', async () => {
      const full = { ...MAP, visits: ['FR', 'ES', 'IT', 'PT'].map((countryCode) => ({ countryCode, status: 'VISITED' })) };
      for (const props of [{ map: full }, { settings: { ...DEFAULT_MAP_SETTINGS, countriesAsked: true } }, { role: 'VIEWER' }]) {
        sessionStorage.clear();
        const { panel, unmount } = open(props);
        await waitFor(() => expect(panel('MapTipsDialog')).not.toBeNull());
        expect(panel('QuickFillDialog')).toBeNull();
        unmount();
      }
      sessionStorage.clear();
      sessionStorage.setItem(QUICK_FILL_SHOWN_KEY, '1');
      const { panel } = open();
      await waitFor(() => expect(panel('MapTipsDialog')).not.toBeNull());
      expect(panel('QuickFillDialog')).toBeNull();
    });

    it('shows the tips once a visit, and not when they’re switched off', async () => {
      sessionStorage.setItem(QUICK_FILL_SHOWN_KEY, '1');
      sessionStorage.setItem(TIPS_SHOWN_KEY, '1');
      const seen = open();
      await waitFor(() => expect(seen.q('[data-map-loading]')).toBeNull());
      expect(seen.panel('MapTipsDialog')).toBeNull();
      seen.unmount();
      sessionStorage.removeItem(TIPS_SHOWN_KEY);
      const off = open({ settings: { ...DEFAULT_MAP_SETTINGS, showTips: false } });
      await waitFor(() => expect(off.q('[data-map-loading]')).toBeNull());
      expect(off.panel('MapTipsDialog')).toBeNull();
    });
  });

  describe('the panels', () => {
    beforeEach(() => seenDialogs());

    it('opens a tool’s panel over the dimmed map, and a press on the map closes it', async () => {
      const { q, panel, click } = open();
      expect(q('[data-map-scrim]')).toBeNull();
      click('tool stats');
      expect(panel('StatsPanel')).not.toBeNull();
      expect(q('[data-map-panels]')).not.toBeNull();
      expect(q('nav').getAttribute('data-open-panel')).toBe('stats');
      fireEvent.click(q('[data-map-scrim]'));
      expect(panel('StatsPanel')).toBeNull();
      expect(q('[data-map-scrim]')).toBeNull();
    });

    it('swaps one panel for another, and the same tool again closes it', () => {
      const { panel, click } = open();
      click('tool stats');
      click('tool countries');
      expect(panel('StatsPanel')).toBeNull();
      expect(panel('CountryListPanel')).not.toBeNull();
      click('tool countries');
      expect(panel('CountryListPanel')).toBeNull();
    });

    it('closes the open panel for the share dialog and the slideshow', () => {
      const { panel, click, q } = open();
      click('tool settings');
      click('tool share');
      expect(panel('SettingsPanel')).toBeNull();
      expect(panel('ShareDialog')).not.toBeNull();
      expect(q('nav').getAttribute('data-open-panel')).toBe('share');
      click('tool stats');
      click('tool play');
      expect(panel('StatsPanel')).toBeNull();
      expect(panel('Slideshow')).not.toBeNull();
      expect(q('nav').getAttribute('data-open-panel')).toBe('play');
    });

    it('opens the tips from their tool any time, even switched off, closing what was open', async () => {
      const { panel, click, q } = open({ settings: { ...DEFAULT_MAP_SETTINGS, showTips: false } });
      await waitFor(() => expect(q('[data-map-loading]')).toBeNull());
      expect(panel('MapTipsDialog')).toBeNull();
      click('tool stats');
      click('tool tips');
      expect(panel('StatsPanel')).toBeNull();
      expect(panel('MapTipsDialog')).not.toBeNull();
      expect(q('nav').getAttribute('data-open-panel')).toBe('tips');
      // The owner hears about sharing; the same tool again shuts them
      expect(panel('MapTipsDialog').getAttribute('data-share')).toBe('true');
      click('tool tips');
      expect(panel('MapTipsDialog')).toBeNull();
      click('tool tips');
      click('close MapTipsDialog');
      expect(panel('MapTipsDialog')).toBeNull();
    });

    it('leaves sharing out of the tips through a share link', () => {
      const { panel, click } = open({ shareCode: 'ABCD-EFGH-JKMN', role: 'VIEWER', actions: null, currentUser: null });
      click('tool tips');
      expect(panel('MapTipsDialog').getAttribute('data-share')).toBe('false');
    });

    it('opens a country picked on the map, edge to edge on phones, hiding the key', () => {
      const { panel, click, q } = open();
      expect(q('ul[aria-label="Map key"]')).not.toBeNull();
      click('pick France');
      expect(panel('CountryPanel').getAttribute('data-code')).toBe('FR');
      expect(q('[data-map-panels]').getAttribute('class')).toContain('inset-0');
      expect(q('ul[aria-label="Map key"]')).toBeNull();
      click('close CountryPanel');
      expect(panel('CountryPanel')).toBeNull();
    });

    it('fetches the country panel’s code on the first press on the map', async () => {
      const { CountryPanel } = await import('@/components/map/lazyMapPanels');
      const { q } = open();
      fireEvent.pointerDown(q('main'));
      expect(CountryPanel.preload).toHaveBeenCalled();
    });
  });

  describe('the page', () => {
    beforeEach(() => seenDialogs());

    it('names the map for screen readers and is the page’s main', () => {
      const { q } = open();
      expect(q('main#main-content h1').textContent).toBe('Our trips');
    });

    it('wears the map’s own style, else the viewer’s', () => {
      const own = open({ map: { ...MAP, style: 'starry' } });
      expect(own.q('[data-map-style]').getAttribute('data-map-style')).toBe('starry');
      own.unmount();
      const viewer = open({ settings: { ...DEFAULT_MAP_SETTINGS, style: 'old-map' } });
      expect(viewer.q('[data-map-style]').getAttribute('data-map-style')).toBe('old-map');
    });

    it('draws the map’s design for its style while it’s switched on', () => {
      const design = { shown: true, countries: { FR: '#123456' } };
      const { q, unmount } = open({ map: { ...MAP, style: 'starry', designs: { starry: design } } });
      expect(q('[data-map-design]')).not.toBeNull();
      expect(q('style').textContent).toContain('g[data-code="FR"]');
      unmount();
      // Another style's design isn't this one's
      const other = open({ map: { ...MAP, style: 'old-map', designs: { starry: design } } });
      expect(other.q('[data-map-design]')).toBeNull();
    });

    it('filters only the pictures in Black and white', () => {
      const { q } = open({ map: { ...MAP, style: 'mono' } });
      expect(q('[data-mono-map]')).not.toBeNull();
      expect(q('filter#mpv-mono-pictures')).not.toBeNull();
    });

    it('tells an unverified owner to verify, and never through a share link', async () => {
      const verify = (await import('@/hooks/useMustVerifyEmail')).default;
      verify.mockReturnValue(true);
      const mine = open();
      expect(mine.q('[data-verify-banner]')).not.toBeNull();
      mine.unmount();
      const shared = open({ shareCode: 'ABCD-EFGH-JKMN', role: 'VIEWER', actions: null });
      expect(shared.q('[data-verify-banner]')).toBeNull();
      verify.mockReturnValue(false);
    });

    it('says a locked map isn’t paid for', () => {
      const { container } = open({ map: { ...MAP, locked: true } });
      expect(container.querySelector('[aria-label="This map isn’t paid for"]')).not.toBeNull();
    });
  });

  // 24 Nov 2026, the user's wish: stars, the model and the passport's stamp
  describe('the celebration', () => {
    // The map page with its statistics open: they carry the landmark marks (`collected`)
    const withMarks = async (props = {}) => {
      seenDialogs();
      const view = open(props);
      await waitFor(() => expect(view.q('[data-map-loading]')).toBeNull());
      view.click('tool stats');
      await waitFor(() => expect(panelProps.StatsPanel?.collected).toBeTruthy());
      return view;
    };
    const celebration = () => panelProps.CelebrationDialog?.celebration;

    beforeEach(() => {
      delete panelProps.CelebrationDialog;
    });

    it('celebrates a landmark’s first stamp from a tick, and the place it marked', async () => {
      const setLandmarkBeen = vi.fn().mockResolvedValue({ landmarkId: 'lm-eiffel', been: true, countryCode: 'FR' });
      const { panel } = await withMarks({ actions: { ...actions(), setLandmarkBeen } });
      await act(async () => {
        await panelProps.StatsPanel.collected.onToggle('lm-eiffel', true);
      });
      await waitFor(() => expect(panel('CelebrationDialog')).not.toBeNull());
      expect(celebration()).toEqual({ kind: 'landmark', landmarkId: 'lm-eiffel', stampedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), photoUrl: null, newPlace: 'FR' });
      expect(panelProps.CelebrationDialog.passportHref).toBe('/maps/map-1/passport');
    });

    it('says nothing new of a place already on the map, nor of a landmark stamped already', async () => {
      const setLandmarkBeen = vi.fn().mockResolvedValue({ landmarkId: 'lm-tower', been: true, countryCode: 'GB' });
      const map = { ...MAP, stampedLandmarkIds: ['lm-big-ben'] };
      const { panel } = await withMarks({ map, actions: { ...actions(), setLandmarkBeen } });
      await act(async () => {
        await panelProps.StatsPanel.collected.onToggle('lm-tower', true);
      });
      await waitFor(() => expect(panel('CelebrationDialog')).not.toBeNull());
      expect(celebration().newPlace).toBeNull();
      // Big Ben has a photo's stamp: ticking it too stamps nothing new
      act(() => panelProps.CelebrationDialog.onClose());
      expect(panel('CelebrationDialog')).toBeNull();
      await act(async () => {
        await panelProps.StatsPanel.collected.onToggle('lm-big-ben', true);
      });
      expect(panel('CelebrationDialog')).toBeNull();
      // Nor does a tick taken off
      await act(async () => {
        await panelProps.StatsPanel.collected.onToggle('lm-tower', false);
      });
      expect(panel('CelebrationDialog')).toBeNull();
    });

    it('celebrates a photo’s confirmed landmark with that photo, dated when it was taken', async () => {
      const { panel } = await withMarks({ actions: { ...actions(), setLandmarkBeen: vi.fn() } });
      act(() => panelProps.StatsPanel.collected.onPhotoStamped('lm-eiffel', { id: 'p1', takenAt: '2019-05-02T10:00:00.000Z', thumbUrl: 'https://x/p1.webp' }));
      await waitFor(() => expect(panel('CelebrationDialog')).not.toBeNull());
      expect(celebration()).toEqual({ kind: 'landmark', landmarkId: 'lm-eiffel', stampedOn: '2019-05-02', photoUrl: 'https://x/p1.webp', newPlace: null });
    });

    it('celebrates a country marked visited from its ticket, never from the country list', async () => {
      seenDialogs();
      const { panel, click, q } = open();
      await waitFor(() => expect(q('[data-map-loading]')).toBeNull());
      click('pick France');
      await waitFor(() => expect(panelProps.CountryPanel).toBeTruthy());
      act(() => panelProps.CountryPanel.onVisitMarked('FR', 'WANT_TO_GO', 'VISITED', '2016-08-01'));
      await waitFor(() => expect(panel('CelebrationDialog')).not.toBeNull());
      expect(celebration()).toEqual({ kind: 'country', code: 'FR', status: 'VISITED', firstVisitedOn: '2016-08-01' });
      act(() => panelProps.CelebrationDialog.onClose());

      // Lived in, from visited: no first visit
      act(() => panelProps.CountryPanel.onVisitMarked('FR', 'VISITED', 'LIVED', null));
      expect(panel('CelebrationDialog')).toBeNull();
      // The country list saves straight through setVisit: many at once, no celebration
      click('tool countries');
      await waitFor(() => expect(panelProps.CountryListPanel).toBeTruthy());
      expect(panelProps.CountryListPanel.onVisitMarked).toBeUndefined();
    });

    it('never shows while the viewer has turned it off, and its box turns it off', async () => {
      const setLandmarkBeen = vi.fn().mockResolvedValue({ landmarkId: 'lm-eiffel', been: true, countryCode: 'FR' });
      const view = await withMarks({ actions: { ...actions(), setLandmarkBeen } });
      await act(async () => {
        await panelProps.StatsPanel.collected.onToggle('lm-eiffel', true);
      });
      await waitFor(() => expect(view.panel('CelebrationDialog')).not.toBeNull());
      expect(panelProps.CelebrationDialog.hideCelebrations).toBe(false);
      act(() => panelProps.CelebrationDialog.onHideCelebrations(true));
      expect(view.onChangeSetting).toHaveBeenCalledWith('showCelebrations', false);
      view.unmount();

      delete panelProps.CelebrationDialog;
      const off = await withMarks({ settings: { ...DEFAULT_MAP_SETTINGS, showCelebrations: false }, actions: { ...actions(), setLandmarkBeen } });
      await act(async () => {
        await panelProps.StatsPanel.collected.onToggle('lm-louvre', true);
      });
      expect(off.panel('CelebrationDialog')).toBeNull();
    });

    // Life's One Shots (24 Nov 2026): a first tick celebrated, a change not
    it('celebrates a first One Shot, never a change, and marks a country visited by reading the map again', async () => {
      seenDialogs();
      const refresh = vi.fn();
      oneShotsState.save = vi.fn().mockResolvedValue({ oneShot: { itemKey: 'lion', seenOn: '2024-03-12', datePrecision: 'DAY', countryCode: 'KE', photo: null }, created: true, countryCode: 'KE' });
      oneShotsState.remove = vi.fn().mockResolvedValue();
      const { panel, click, q } = open({ actions: { ...actions(), refresh } });
      await waitFor(() => expect(q('[data-map-loading]')).toBeNull());
      click('tool oneShots');
      await waitFor(() => expect(panelProps.OneShotsPanel).toBeTruthy());
      expect(panelProps.OneShotsPanel.canEdit).toBe(true);
      expect(typeof panelProps.OneShotsPanel.onShareCard).toBe('function');
      await act(async () => {
        await panelProps.OneShotsPanel.onSave('lion', { countryCode: 'KE' });
      });
      expect(oneShotsState.save).toHaveBeenCalledWith('lion', { countryCode: 'KE' });
      expect(refresh).toHaveBeenCalled();
      await waitFor(() => expect(panel('CelebrationDialog')).not.toBeNull());
      expect(celebration()).toEqual({ kind: 'oneShot', itemKey: 'lion', seenOn: '2024-03-12', datePrecision: 'DAY', countryCode: 'KE', photoUrl: null });
      act(() => panelProps.CelebrationDialog.onClose());

      oneShotsState.save.mockResolvedValue({ oneShot: { itemKey: 'lion' }, created: false, countryCode: null });
      await act(async () => {
        await panelProps.OneShotsPanel.onSave('lion', { notes: 'x' });
      });
      expect(panel('CelebrationDialog')).toBeNull();
      await act(async () => {
        await panelProps.OneShotsPanel.onRemove('lion');
      });
      expect(oneShotsState.remove).toHaveBeenCalledWith('lion');
    });

    it('opens the One Shots panel at an item from what the page’s context offers (a country’s ticket)', async () => {
      seenDialogs();
      oneShotsState.oneShots = [{ itemKey: 'puffin', countryCode: 'IE' }];
      const { q } = open();
      await waitFor(() => expect(q('[data-map-loading]')).toBeNull());
      expect(toolbar.oneShotsHere.oneShots).toEqual([{ itemKey: 'puffin', countryCode: 'IE' }]);
      act(() => toolbar.oneShotsHere.open('northern-lights'));
      await waitFor(() => expect(panelProps.OneShotsPanel?.focusKey).toBe('northern-lights'));
      oneShotsState.oneShots = [];
    });

    it('gives a viewer nothing to celebrate with', async () => {
      await withMarks({ role: 'VIEWER' });
      expect(panelProps.StatsPanel.collected.onToggle).toBeNull();
      expect(panelProps.StatsPanel.collected.onPhotoStamped).toBeNull();
    });
  });
});
