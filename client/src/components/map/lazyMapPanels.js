import { createElement, lazy } from 'react';

// The map page's overlays: none is part of the first paint. Each has preload(), so its
// code is fetched once the map has drawn and the browser is idle (preloadWhenIdle), or
// sooner on intent (a toolbar stamp hovered, focused or pressed), and is there by the
// time the click opens it.

// lazy() that renders straight away once its code is loaded (no fallback flash). React
// keeps a lazy component's failed load for good, so after a failure (a dropped connection,
// or old code gone after a deploy) the panel gets a fresh one: the error boundary says it
// failed, and the next open downloads it again instead of failing until a reload
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
  const fresh = () =>
    lazy(() =>
      loaded
        ? { then: (resolve) => resolve(loaded) }
        : preload().catch((err) => {
            current = fresh();
            throw err;
          }),
    );
  let current = fresh();
  const Panel = (props) => createElement(current, props);
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
export const TimelinePanel = lazyPanel(() => import('./TimelinePanel'));
export const PhotoUploadPanel = lazyPanel(() => import('@/components/photos/PhotoUploadPanel'));
// The map's photos, newest first (the toolbar's Photos stamp); its "Add photos" opens the upload panel
export const MapPhotosPanel = lazyPanel(() => import('./MapPhotosPanel'));
export const PhotoViewer = lazyPanel(() => import('@/components/photos/PhotoViewer'));
export const ShareDialog = lazyPanel(() => import('@/components/sharing/ShareDialog'));
// Paying for a map that isn't paid for (the plan banner's button); opened rarely
export const ExtraMapDialog = lazyPanel(() => import('@/components/plans/ExtraMapDialog'));
// The tips the map opens with, once a visit (fetched as the loading screen lifts)
export const MapTipsDialog = lazyPanel(() => import('./MapTipsDialog'));
export const BadgesGoalsPanel = lazyPanel(() => import('@/components/achievements/BadgesGoalsPanel'));
// The slideshows: the map's ("Play my world"), a country's, and a trip's (the trip page)
export const Slideshow = lazyPanel(() => import('@/components/slideshow/Slideshow'));
// A country opened on its own, with its states and pins (a country's ticket's "Open country"),
// and a pin there with its visits
export const CountryMapView = lazyPanel(() => import('@/components/countryMap/CountryMapView'));
export const PinPanel = lazyPanel(() => import('@/components/countryMap/PinPanel'));

// What each toolbar stamp (and the title and stats tags) opens. The country list also
// warms up the country panel, as picking a country is what it's for.
const FOR_TOOL = {
  stats: [StatsPanel],
  countries: [CountryListPanel, CountryPanel],
  trips: [TripsPanel],
  // A moment on the timeline opens its country
  timeline: [TimelinePanel, CountryPanel],
  upload: [PhotoUploadPanel],
  // The gallery opens first; its photos open in the viewer, and an editor's button uploads
  photos: [MapPhotosPanel],
  share: [ShareDialog],
  settings: [SettingsPanel],
  switcher: [MapSwitcher],
  badges: [BadgesGoalsPanel],
  play: [Slideshow],
};

/** Start fetching what a tool opens; errors are left for the real open to show. */
export function preloadTool(id) {
  for (const panel of FOR_TOOL[id] || []) panel.preload().catch(() => {});
}

/**
 * Once the map has drawn: fetch the given tools' panels while the browser is idle, one
 * per idle moment and in the order given, so they open at once instead of showing the
 * fallback while their code downloads (in development, while Vite compiles it). Intent
 * (preloadTool) still jumps the queue. Returns a function that stops what hasn't started.
 */
export function preloadWhenIdle(ids) {
  if (typeof window === 'undefined') return () => {};
  const hasIdle = typeof window.requestIdleCallback === 'function';
  const later = (fn) => (hasIdle ? window.requestIdleCallback(fn, { timeout: 5000 }) : window.setTimeout(fn, 1500));
  const cancel = (handle) => (hasIdle ? window.cancelIdleCallback(handle) : window.clearTimeout(handle));
  let index = 0;
  let handle = 0;
  const next = () => {
    if (index >= ids.length) return;
    preloadTool(ids[index]);
    index += 1;
    handle = later(next);
  };
  handle = later(next);
  return () => cancel(handle);
}
