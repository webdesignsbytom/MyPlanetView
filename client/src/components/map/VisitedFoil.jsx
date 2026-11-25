import React, { memo, useId, useSyncExternalStore } from 'react';
// Utils
import { drawnPlaces, microStateDotRadius, shapesOf } from '@/utils/map/drawnPlaces';
import { MAP_BOTTOM, MAP_TOP, MAP_WIDTH } from '@/utils/map/projection';
import { visitedFinishOf, visitedLookOf } from '@/utils/map/mapDesign';
import { countsAsVisited } from '@/utils/map/visitStatus';

const NO_PREVIEW = () => null;
const noSubscribe = () => () => {};

/**
 * A map design's metallic finish (25 Nov 2026, the user's wish: gold, silver and bronze that look
 * like real metal): one picture of polished metal across the whole map (utils/map/mapDesign.js
 * VISITED_FINISHES `texture`), under the countries, cut to the places been to. Their own fill is
 * see-through while the design shows them by colour (mapDesign.js visitedRules), so the metal
 * shows in them, and the hovered one still takes its hover colour over it. One sheet, so it runs
 * on across neighbours as printed foil does, and a plain picture, which costs next to nothing to
 * pan or zoom: a pattern of it was redrawn on every frame once zoomed in. The metal's medal token
 * fills the cut until the picture has loaded. Its edges are lit while the map is still
 * (FoilEdgeFilter, `data-visited-foil`).
 *
 * The places and their outlines are the ones CountryLayer draws (utils/map/drawnPlaces.js): the
 * detailed outlines when zoomed in (`detail`), a micro-state's dot at its size for the zoom.
 * `visited` is the map's visited look (utils/map/mapDesign.js visitedLookFrom), and `preview`
 * Settings' value store of it, as MapDesignStyle's `visitedPreview`: changes show before they're
 * saved. The picture keeps its colours on Black and white (`data-keep-colour`), as the map's own
 * choice, like a design's colours.
 * `faded` fades it with the places been to (the visited filter off).
 */
function VisitedFoil({ visited, preview, visitsByCode, detail = null, splitUk = false, showAntarctica = true, zoom = 1, faded = false }) {
  // React's ids carry characters a url(#…) reference may not match: letters and digits only
  const clipId = `foil-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const previewed = useSyncExternalStore(preview?.subscribe ?? noSubscribe, preview?.get ?? NO_PREVIEW, NO_PREVIEW);
  const shown = previewed ?? visited;
  const finish = visitedLookOf(shown) === 'BADGE' ? null : visitedFinishOf(shown);
  if (!finish) return null;
  const { shaped, dotted } = drawnPlaces({ splitUk, showAntarctica });
  const been = (place) => countsAsVisited(visitsByCode?.[place.code]);
  const radius = microStateDotRadius(zoom);
  return (
    <g data-visited-foil={finish.id} className={`pointer-events-none ${faded ? 'opacity-15' : ''}`}>
      <clipPath id={clipId}>
        {shaped.filter(been).flatMap((place) => (detail?.[place.code] ?? shapesOf(place.code)).map((d, i) => <path key={`${place.code}-${i}`} d={d} />))}
        {dotted.filter(been).map((place) => (
          <circle key={place.code} cx={place.pinX} cy={place.pinY} r={radius} />
        ))}
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={MAP_TOP} width={MAP_WIDTH} height={MAP_BOTTOM - MAP_TOP} style={{ fill: `var(${finish.colour})` }} />
        <image href={finish.texture} x={0} y={MAP_TOP} width={MAP_WIDTH} height={MAP_BOTTOM - MAP_TOP} preserveAspectRatio='none' data-keep-colour />
      </g>
    </g>
  );
}

export default memo(VisitedFoil);
