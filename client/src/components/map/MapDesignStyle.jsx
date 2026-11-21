import React, { useMemo, useSyncExternalStore } from 'react';
// Utils
import { designCss } from '@/utils/map/mapDesign';

const NO_PREVIEW = () => null;

// A map design's colours (docs/API.md "Map designs") as a style sheet for the map inside
// [data-map-design]: the names' and grid's tokens, and a rule per coloured place. `preview`
// (a value store) holds the design while Settings changes it, before it's saved: following
// it re-renders only this, so a colour picker's every move restyles the map without
// re-rendering the page. Only "#rrggbb" colours and two-letter codes get in (designCss).
function MapDesignStyle({ design, preview }) {
  const previewed = useSyncExternalStore(preview?.subscribe ?? noSubscribe, preview?.get ?? NO_PREVIEW, NO_PREVIEW);
  const shown = previewed ?? design;
  const css = useMemo(() => designCss(shown), [shown]);
  return css ? <style>{css}</style> : null;
}

const noSubscribe = () => () => {};

export default MapDesignStyle;
