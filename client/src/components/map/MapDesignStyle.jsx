import React, { useMemo, useSyncExternalStore } from 'react';
// Components
import VisitedFinishDefs from './VisitedFinishDefs';
// Utils
import { designCss, visitedFinishOf, visitedLookOf } from '@/utils/map/mapDesign';

const NO_PREVIEW = () => null;

// A map design's colours (docs/API.md "Map designs") as a style sheet for the map inside
// [data-map-design]: the names' and grid's tokens, and a rule per coloured place. `preview`
// (a value store) holds the design while Settings changes it, before it's saved: following
// it re-renders only this, so a colour picker's every move restyles the map without
// re-rendering the page. Only "#rrggbb" colours and two-letter codes get in (designCss).
// A metallic finish for the places been to (25 Nov 2026) also needs its foil gradient on the
// page: VisitedFinishDefs, while the design shows them by colour.
function MapDesignStyle({ design, preview }) {
  const previewed = useSyncExternalStore(preview?.subscribe ?? noSubscribe, preview?.get ?? NO_PREVIEW, NO_PREVIEW);
  const shown = previewed ?? design;
  const css = useMemo(() => designCss(shown), [shown]);
  const finish = visitedLookOf(shown) === 'BADGE' ? null : visitedFinishOf(shown);
  return (
    <>
      {css ? <style>{css}</style> : null}
      <VisitedFinishDefs finish={finish} />
    </>
  );
}

const noSubscribe = () => () => {};

export default MapDesignStyle;
