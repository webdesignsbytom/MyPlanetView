import React, { memo, useId } from 'react';
// Hooks
import { useViewportZoom } from '@/hooks/useMapViewport';
import useSplitUk from '@/hooks/useSplitUk';
// Components
import CountryLayer from './CountryLayer';
import MapGridLines from './MapGridLines';
import SeaDepths from './SeaDepths';
import CountryNameLabels from './CountryNameLabels';
import LandmarkPins from './LandmarkPins';
import StopMarkers from './StopMarkers';
import VisitBadges from './VisitBadges';
import MomentMarks from './MomentMarks';
import MomentSpotPins from './MomentSpotPins';
import SkyBodies from './SkyBodies';
import PoleNameLabels from './PoleNameLabels';
import { StarBadgeSymbols } from './StarBadge';
import { PoleMarkerSymbols } from './PoleMarker';
import { MomentMarkSymbol } from './MomentMark';

const NO_VISITS = {};
const NO_MOMENTS = {};
const NO_SPOTS = [];
// The badge, pole and moment art, defined once in the SVG; constant elements, so zoom
// re-renders skip them
const BADGE_SYMBOLS = <StarBadgeSymbols />;
const POLE_SYMBOLS = <PoleMarkerSymbols />;
const MOMENT_SYMBOL = <MomentMarkSymbol />;
const DEPTHS = <SeaDepths />;

// An open hand over the sea, and a closed one over everything while a mouse button is held
// (useMapViewport sets data-grabbing), beating the countries' pointer
const GRAB_CURSORS = 'touch-none cursor-grab data-grabbing:cursor-grabbing [&[data-grabbing]_*]:cursor-grabbing';

/**
 * The SVG world map (Robinson, 2000 wide; from the North Pole line, y -16.6, to the
 * South Pole line, 1020.6, with Antarctica, or to 857 without: projection.js mapExtent). Pan and zoom come from a useMapViewport() owned by
 * the page, so the page can also move the view; give it the same extent. The viewport
 * sets the viewBox itself; this re-renders only when the zoom changes (for the layers
 * drawn by zoom), never while panning.
 * `showAntarctica` off: Antarctica and the poles beside it aren't drawn (the
 * showAntarctica map setting; only the view changes).
 * `momentCounts` (the map's momentCountsByCountry) marks the places with moments, beside
 * their badges, unless `showMoments` is off (the viewer's setting).
 * `stampedLandmarks` (a Set of the map's stampedLandmarkIds) turns those pins gold.
 * `showSky`: the sun and the moon over where each is overhead now (SkyBodies).
 * `momentSpots` (the map's momentSpots) puts a pin on each moment's spot, while
 * `showMoments` is on; a pin opens its country with `onSelectCountry`.
 * The UK is drawn as its four nations when the map being shown splits it (useSplitUk: the
 * page provides the map's `splitUk`).
 * `seaDepths`: the sea tinted by depth (SeaDepths), for the styles whose sea is plain
 * (mapStyles.js `background: null`, the animated sea).
 */
function WorldMap({
  viewport,
  visitsByCode = NO_VISITS,
  momentCounts = NO_MOMENTS,
  momentSpots = NO_SPOTS,
  showSky = false,
  showMoments = true,
  selectedCode = null,
  onSelectCountry,
  onHoverCountry,
  seaDepths = false,
  showGrid = false,
  showGridLabels = false,
  showCountryNames = false,
  showVisited = true,
  showUnvisited = true,
  showAntarctica = true,
  landmarks = null,
  stampedLandmarks,
  alwaysShowLandmarks = false,
  stops = null,
  label = 'World map',
  panZoom = true,
}) {
  const hintId = useId();
  const zoom = useViewportZoom(viewport);
  const splitUk = useSplitUk();
  // Clicks wait for afterTap only when the map can be dragged and double-tapped
  const afterTap = panZoom ? viewport.afterTap : undefined;

  return (
    <>
      <svg
        ref={viewport.svgRef}
        preserveAspectRatio='xMidYMid meet'
        className={`h-full w-full select-none [&_path]:[vector-effect:non-scaling-stroke] [&_circle]:[vector-effect:non-scaling-stroke] [&_polyline]:[vector-effect:non-scaling-stroke] ${
          panZoom ? GRAB_CURSORS : ''
        }`}
        role={panZoom ? 'application' : 'img'}
        aria-label={label}
        aria-describedby={panZoom ? hintId : undefined}
        tabIndex={panZoom ? 0 : undefined}
        {...(panZoom ? viewport.handlers : {})}
      >
        {BADGE_SYMBOLS}
        {POLE_SYMBOLS}
        {MOMENT_SYMBOL}
        {seaDepths ? DEPTHS : null}
        {showGrid ? <MapGridLines showLabels={showGridLabels} zoom={zoom} showAntarctica={showAntarctica} /> : null}
        <CountryLayer
          visitsByCode={visitsByCode}
          selectedCode={selectedCode}
          zoom={zoom}
          onSelect={onSelectCountry}
          onHover={onHoverCountry}
          afterTap={afterTap}
          showVisited={showVisited}
          showUnvisited={showUnvisited}
          showAntarctica={showAntarctica}
          splitUk={splitUk}
        />
        {showSky ? <SkyBodies zoom={zoom} /> : null}
        {showCountryNames ? (
          <CountryNameLabels zoom={zoom} visitsByCode={visitsByCode} showAntarctica={showAntarctica} splitUk={splitUk} />
        ) : null}
        <VisitBadges visitsByCode={visitsByCode} zoom={zoom} faded={!showVisited} showAntarctica={showAntarctica} splitUk={splitUk} />
        {showMoments ? <MomentMarks counts={momentCounts} zoom={zoom} showAntarctica={showAntarctica} /> : null}
        <PoleNameLabels zoom={zoom} visitsByCode={visitsByCode} always={showCountryNames} showAntarctica={showAntarctica} />
        {landmarks?.length ? (
          <LandmarkPins
            landmarks={landmarks}
            stamped={stampedLandmarks}
            zoom={zoom}
            always={alwaysShowLandmarks}
            onSelectCountry={onSelectCountry}
            afterTap={afterTap}
            splitUk={splitUk}
          />
        ) : null}
        {showMoments && momentSpots.length ? (
          <MomentSpotPins spots={momentSpots} zoom={zoom} showAntarctica={showAntarctica} onSelectCountry={onSelectCountry} afterTap={afterTap} />
        ) : null}
        {stops?.length ? <StopMarkers stops={stops} zoom={zoom} /> : null}
      </svg>
      {panZoom ? (
        <p id={hintId} className='sr-only'>
          Drag, or use the arrow keys, to move the map. Plus and minus zoom, as does a double-tap; 0 shows the whole
          world. Every country and special place is also in the country list.
        </p>
      ) : null}
    </>
  );
}

export default memo(WorldMap);
