import React, { memo, useId } from 'react';
// Hooks
import { useViewportZoom } from '@/hooks/useMapViewport';
// Components
import CountryLayer from './CountryLayer';
import MapGridLines from './MapGridLines';
import CountryNameLabels from './CountryNameLabels';
import LandmarkPins from './LandmarkPins';
import StopMarkers from './StopMarkers';
import VisitBadges from './VisitBadges';
import PoleNameLabels from './PoleNameLabels';
import { StarBadgeSymbols } from './StarBadge';
import { PoleMarkerSymbols } from './PoleMarker';

const NO_VISITS = {};
// The badge and pole art, defined once in the SVG; constant elements, so zoom re-renders
// skip them
const BADGE_SYMBOLS = <StarBadgeSymbols />;
const POLE_SYMBOLS = <PoleMarkerSymbols />;

// An open hand over the sea, and a closed one over everything while a mouse button is held
// (useMapViewport sets data-grabbing), beating the countries' pointer
const GRAB_CURSORS = 'touch-none cursor-grab data-grabbing:cursor-grabbing [&[data-grabbing]_*]:cursor-grabbing';

/**
 * The SVG world map (Robinson, 2000 wide; from y -30 to 1034 with Antarctica, to 857
 * without: projection.js mapExtent). Pan and zoom come from a useMapViewport() owned by
 * the page, so the page can also move the view; give it the same extent. The viewport
 * sets the viewBox itself; this re-renders only when the zoom changes (for the layers
 * drawn by zoom), never while panning.
 * `showAntarctica` off: Antarctica and the poles beside it aren't drawn (the
 * showAntarctica map setting; only the view changes).
 */
function WorldMap({
  viewport,
  visitsByCode = NO_VISITS,
  selectedCode = null,
  onSelectCountry,
  onHoverCountry,
  showGrid = false,
  showGridLabels = false,
  showCountryNames = false,
  showVisited = true,
  showUnvisited = true,
  showAntarctica = true,
  landmarks = null,
  alwaysShowLandmarks = false,
  stops = null,
  label = 'World map',
  panZoom = true,
}) {
  const hintId = useId();
  const zoom = useViewportZoom(viewport);
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
        />
        {showCountryNames ? <CountryNameLabels zoom={zoom} visitsByCode={visitsByCode} showAntarctica={showAntarctica} /> : null}
        <VisitBadges visitsByCode={visitsByCode} zoom={zoom} faded={!showVisited} showAntarctica={showAntarctica} />
        <PoleNameLabels zoom={zoom} visitsByCode={visitsByCode} always={showCountryNames} showAntarctica={showAntarctica} />
        {landmarks?.length ? <LandmarkPins landmarks={landmarks} zoom={zoom} always={alwaysShowLandmarks} onSelectCountry={onSelectCountry} afterTap={afterTap} /> : null}
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
