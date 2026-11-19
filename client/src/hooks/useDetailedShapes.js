import { useEffect, useState } from 'react';
// Hooks
import { useViewportZoom } from '@/hooks/useMapViewport';
// Data
import { DETAIL_SHAPE_BOUNDS } from '@/utils/map/detailShapeBounds';

// The detailed outlines (18 Nov 2026, the user's wish: islands such as the Falklands looked
// jagged zoomed in). The whole map's outlines are simplified to 0.35 map units, fine for the
// world but eight pixels out at the closest zoom; utils/map/detailShapes/ has each place to
// 0.05 (about a pixel there), made by images/src/tools/country-outlines.mjs with the rest.
// One module per place (about 2.7 MB in all, Canada's the biggest at 330 KB), so only the
// places in view are fetched: once the map is zoomed in to DETAIL_FROM_ZOOM, after a pan
// or zoom settles, for the view and a margin round it. They're kept for the visit, and the
// build names their chunks `outline-*` so the installed app doesn't fetch them all ahead
// (vite.config.js).
const LOADERS = Object.fromEntries(
  Object.entries(import.meta.glob('../utils/map/detailShapes/*.js', { import: 'default' })).map(([file, load]) => [
    file.match(/([A-Z]{2})\.js$/)[1],
    load,
  ]),
);

// At this zoom the whole map's outlines are about a pixel and a half out
export const DETAIL_FROM_ZOOM = 4;
// A pan or zoom settles this long before the places in view are worked out
const SETTLE_MS = 150;
// Fetched ahead of a pan: the view and this share of its size all round (a quarter fetched
// about a fifth more for little gain; 19 Nov 2026, the audit)
const MARGIN = 0.1;

// code -> paths, for the visit; codes being fetched
const loaded = {};
const fetching = new Set();

// The places with land in the view and its margin: each place has a box per stretch of its
// land (detailShapeBounds.js), so the US isn't "in view" over Germany because of Alaska
function placesInView(view) {
  const mx = view.w * MARGIN;
  const my = view.h * MARGIN;
  const left = view.x - mx;
  const right = view.x + view.w + mx;
  const top = view.y - my;
  const bottom = view.y + view.h + my;
  return Object.keys(DETAIL_SHAPE_BOUNDS).filter((code) =>
    DETAIL_SHAPE_BOUNDS[code].some(([minX, minY, maxX, maxY]) => maxX >= left && minX <= right && maxY >= top && minY <= bottom),
  );
}

// The loaded outlines of the places in view: only those are drawn in detail, so the map
// doesn't carry every detailed path met on the visit, nor rewrite them all when the zoom
// crosses DETAIL_FROM_ZOOM (19 Nov 2026, the audit)
function shownFor(view) {
  return Object.fromEntries(placesInView(view).filter((code) => loaded[code]).map((code) => [code, loaded[code]]));
}

const sameShapes = (a, b) => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((code) => a[code] === b[code]);
};

/**
 * The detailed outlines to draw instead of the whole map's: `{ code: paths }` for the places
 * in view whose detail has arrived, once the view is zoomed in to DETAIL_FROM_ZOOM; null
 * further out, or when `enabled` is false (a map that can't be zoomed). A place not fetched
 * yet, or out of view, keeps its usual outline.
 */
export default function useDetailedShapes(viewport, enabled = true) {
  const close = useViewportZoom(viewport, (zoom) => zoom >= DETAIL_FROM_ZOOM);
  // A fresh object whenever what's shown changes (the paths themselves keep their identity,
  // so a place already drawn in detail doesn't re-render)
  const [shapes, setShapes] = useState(() => ({}));

  useEffect(() => {
    if (!enabled || !close) return undefined;
    let live = true;
    let timer = 0;
    const show = () => {
      if (!live) return;
      const next = shownFor(viewport.getView());
      setShapes((prev) => (sameShapes(prev, next) ? prev : next));
    };
    const settle = () => {
      if (!live || viewport.getZoom() < DETAIL_FROM_ZOOM) return;
      const wanted = placesInView(viewport.getView()).filter((code) => !loaded[code] && !fetching.has(code) && LOADERS[code]);
      if (!wanted.length) {
        show();
        return;
      }
      wanted.forEach((code) => fetching.add(code));
      Promise.all(
        wanted.map((code) =>
          LOADERS[code]()
            .then((paths) => {
              loaded[code] = paths;
            })
            // Offline, or a chunk from an older deploy: the usual outline stays, and the
            // next pan asks again
            .catch(() => {})
            .finally(() => fetching.delete(code)),
        ),
      ).then(show);
    };
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, SETTLE_MS);
    };
    show();
    later();
    const unsubscribe = viewport.subscribeView(later);
    return () => {
      live = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [viewport, enabled, close]);

  return enabled && close ? shapes : null;
}
