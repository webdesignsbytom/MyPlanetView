import { lazy } from 'react';

// The map page's overlays, loaded only when first wanted: none is part of the first paint.
// Each has preload(), so its code can be fetched on intent (a toolbar stamp hovered,
// focused or pressed) and is usually there by the time the click opens it.

// lazy() that renders straight away once its code is loaded (no fallback flash)
function lazyPanel(load) {
  let loaded = null;
  let pending = null;
  const preload = () => {
    pending ||= load().then(
      (module) => (loaded = module),
      (err) => {
        pending = null;
        throw err;
      },
    );
    return pending;
  };
  const Panel = lazy(() => (loaded ? { then: (resolve) => resolve(loaded) } : preload()));
  Panel.preload = preload;
  return Panel;
}

export const StatsPanel = lazyPanel(() => import('./StatsPanel'));
export const CountryListPanel = lazyPanel(() => import('./CountryListPanel'));
export const CountryPanel = lazyPanel(() => import('./CountryPanel'));
export const SettingsPanel = lazyPanel(() => import('./SettingsPanel'));
export const MapSwitcher = lazyPanel(() => import('./MapSwitcher'));
export const UnplacedPhotosPanel = lazyPanel(() => import('./UnplacedPhotosPanel'));
export const HoverPreview = lazyPanel(() => import('./HoverPreview'));
export const TripsPanel = lazyPanel(() => import('@/components/trips/TripsPanel'));
export const PhotoUploadPanel = lazyPanel(() => import('@/components/photos/PhotoUploadPanel'));
export const PhotoViewer = lazyPanel(() => import('@/components/photos/PhotoViewer'));
export const ShareDialog = lazyPanel(() => import('@/components/sharing/ShareDialog'));

// What each toolbar stamp (and the title and stats tags) opens. The country list also
// warms up the country panel, as picking a country is what it's for.
const FOR_TOOL = {
  stats: [StatsPanel],
  countries: [CountryListPanel, CountryPanel],
  trips: [TripsPanel],
  upload: [PhotoUploadPanel],
  share: [ShareDialog],
  settings: [SettingsPanel],
  switcher: [MapSwitcher],
};

/** Start fetching what a tool opens; errors are left for the real open to show. */
export function preloadTool(id) {
  for (const panel of FOR_TOOL[id] || []) panel.preload().catch(() => {});
}
