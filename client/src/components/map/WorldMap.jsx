import React, { useId } from 'react';
// Components
import CountryLayer from './CountryLayer';
import MapGridLines from './MapGridLines';
import CountryNameLabels from './CountryNameLabels';
import LandmarkPins from './LandmarkPins';
import StopMarkers from './StopMarkers';
import VisitBadges from './VisitBadges';
import { StarBadgeSymbols } from './StarBadge';

const NO_VISITS = {};

// An open hand over the sea, and a closed one over everything while a mouse button is held
// (useMapViewport sets data-grabbing), beating the countries' pointer
const GRAB_CURSORS = 'touch-none cursor-grab data-grabbing:cursor-grabbing [&[data-grabbing]_*]:cursor-grabbing';

/**
 * The SVG world map (viewBox 2000 x 857, Robinson). Pan and zoom come from a
 * useMapViewport() owned by the page, so the page can also move the view.
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
  landmarks = null,
  alwaysShowLandmarks = false,
  stops = null,
  label = 'World map',
  panZoom = true,
}) {
  const hintId = useId();
  const { zoom } = viewport;
  // Clicks wait for afterTap only when the map can be dragged and double-tapped
  const afterTap = panZoom ? viewport.afterTap : undefined;

  return (
    <>
      <svg
        ref={viewport.svgRef}
        viewBox={viewport.viewBox}
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
        <StarBadgeSymbols />
        {showGrid ? <MapGridLines showLabels={showGridLabels} zoom={zoom} /> : null}
        <CountryLayer
          visitsByCode={visitsByCode}
          selectedCode={selectedCode}
          zoom={zoom}
          onSelect={onSelectCountry}
          onHover={onHoverCountry}
          afterTap={afterTap}
          showVisited={showVisited}
          showUnvisited={showUnvisited}
        />
        {showCountryNames ? <CountryNameLabels zoom={zoom} visitsByCode={visitsByCode} /> : null}
        <VisitBadges visitsByCode={visitsByCode} zoom={zoom} faded={!showVisited} />
        {landmarks?.length ? <LandmarkPins landmarks={landmarks} zoom={zoom} always={alwaysShowLandmarks} onSelectCountry={onSelectCountry} afterTap={afterTap} /> : null}
        {stops?.length ? <StopMarkers stops={stops} zoom={zoom} /> : null}
      </svg>
      {panZoom ? (
        <p id={hintId} className='sr-only'>
          Drag, or use the arrow keys, to move the map. Plus and minus zoom, as does a double-tap; 0 shows the whole
          world. Every country is also in the country list.
        </p>
      ) : null}
    </>
  );
}

export default WorldMap;
