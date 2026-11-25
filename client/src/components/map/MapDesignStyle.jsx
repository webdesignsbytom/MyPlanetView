import React, { useMemo, useSyncExternalStore } from 'react';
// Utils
import { designCss, visitedCss } from '@/utils/map/mapDesign';

const NO_PREVIEW = () => null;

// A map design's colours (docs/API.md "Map designs") as a style sheet for the map inside
// [data-map-design]: the names' and grid's tokens, and a rule per coloured place. `preview`
// (a value store) holds the design while Settings changes it, before it's saved: following
// it re-renders only this, so a colour picker's every move restyles the map without
// re-rendering the page. Only "#rrggbb" colours and two-letter codes get in (designCss).
// The map's visited look (`visited`, the map's own in every style: utils/map/mapDesign.js
// visitedCss) goes in too, with its own value store (`visitedPreview`) for Settings' changes. A
// metallic finish's sheet of metal is the world map's own (VisitedFoil), following the same.
function MapDesignStyle({ design = null, preview, visited = null, visitedPreview }) {
  const previewed = useSyncExternalStore(preview?.subscribe ?? noSubscribe, preview?.get ?? NO_PREVIEW, NO_PREVIEW);
  const previewedVisited = useSyncExternalStore(visitedPreview?.subscribe ?? noSubscribe, visitedPreview?.get ?? NO_PREVIEW, NO_PREVIEW);
  const shown = previewed ?? design;
  const shownVisited = previewedVisited ?? visited;
  const css = useMemo(() => [designCss(shown), visitedCss(shownVisited)].filter(Boolean).join(' '), [shown, shownVisited]);
  return css ? <style>{css}</style> : null;
}

const noSubscribe = () => () => {};

export default MapDesignStyle;
