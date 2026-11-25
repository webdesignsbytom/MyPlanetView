import React, { memo, useId } from 'react';
// Hooks
import { useViewportZoom } from '@/hooks/useMapViewport';
import useDetailedShapes from '@/hooks/useDetailedShapes';
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
import MapStrings from './MapStrings';
import SkyBodies from './SkyBodies';
import PoleNameLabels from './PoleNameLabels';
import { StarBadgeSymbols } from './StarBadge';
import { PoleMarkerSymbols } from './PoleMarker';
import { MomentMarkSymbol } from './MomentMark';
import MapKeyboardHint from './MapKeyboardHint';
import FoilEdgeFilter from './FoilEdgeFilter';
import VisitedFoil from './VisitedFoil';
// Utils
import { clearPointerFocus, markPointerFocus } from '@/utils/map/pointerFocus';

const NO_VISITS = {};
const NO_MOMENTS = {};
const NO_PLANS = new Set();
const NO_SPOTS = [];
// The country names are drawn for the zoom rounded down to eighths of a doubling (about 9%
// apart), so about 250 labels are resized a few times per doubling, not on every wheel tick
// or pinch frame (the landmark pins' rule, pinZoomStep; 19 Nov 2026, the audit)
const labelZoom = (zoom) => 2 ** (Math.floor(Math.log2(Math.max(zoom, 1e-3)) * 8) / 8);
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
 * `plannedCodes` (a Set: utils/trips/plannedTrips.js plannedOutlineCodes) outlines the places
 * a planned trip goes to.
 * `showSky`: the sun and the moon over where each is overhead now (SkyBodies).
 * `momentSpots` (the map's momentSpots) puts a pin on each moment's spot, while
 * `showMoments` is on; a pin opens its country with `onSelectCountry`.
 * The UK is drawn as its four nations when the map being shown splits it (useSplitUk: the
 * page provides the map's `splitUk`).
 * `seaDepths`: the sea tinted by depth (SeaDepths), for the styles whose sea is plain
 * (mapStyles.js `background: null`, the animated sea).
 * `gridColoured`: a map design gave the grid its own colour, so it's drawn stronger.
 * `design` (the map design shown) and `designPreview` (Settings' value store, MapDesignStyle's):
 * a metallic finish for the places been to draws its sheet of metal under them (VisitedFoil).
 */
function WorldMap({
  viewport,
  visitsByCode = NO_VISITS,
  plannedCodes = NO_PLANS,
  momentCounts = NO_MOMENTS,
  momentSpots = NO_SPOTS,
  showSky = false,
  showMoments = true,
  selectedCode = null,
  onSelectCountry,
  onHoverCountry,
  seaDepths = false,
  showGrid = false,
  gridColoured = false,
  showGridLabels = false,
  showCountryNames = false,
  showVisited = true,
  showUnvisited = true,
  showAntarctica = true,
  landmarks = null,
  stampedLandmarks,
  // When the landmark pins show (utils/map/mapSettings.js LANDMARK_PIN_MODES)
  landmarkPins = 'zoomed',
  stops = null,
  // Strings between places (MapStrings): the map's own, shown unless the viewer hid them;
  // `stringStart`, `onRemoveString` and the kind being tied (`stringKind`) while in string mode
  strings = null,
  stringStart = null,
  stringKind = 'VISITED',
  onRemoveString = null,
  label = 'World map',
  panZoom = true,
  design = null,
  designPreview = null,
}) {
  const hintId = useId();
  const zoom = useViewportZoom(viewport);
  // Zoomed in, the places in view are drawn from their detailed outlines
  const detail = useDetailedShapes(viewport, panZoom);
  const splitUk = useSplitUk();
  // Clicks wait for afterTap only when the map can be dragged and double-tapped
  const afterTap = panZoom ? viewport.afterTap : undefined;

  return (
    <>
      <svg
        ref={viewport.svgRef}
        preserveAspectRatio='xMidYMid meet'
        // Never a focus ring round the whole map (19 Nov 2026, the user's wish: a click then
        // any key, a screenshot's shortcut too, drew one): its keyboard focus shows as the
        // hint below instead
        className={`peer h-full w-full select-none outline-none [&_path]:[vector-effect:non-scaling-stroke] [&_circle]:[vector-effect:non-scaling-stroke] [&_polyline]:[vector-effect:non-scaling-stroke] ${
          panZoom ? GRAB_CURSORS : ''
        }`}
        role={panZoom ? 'application' : 'img'}
        aria-label={label}
        aria-describedby={panZoom ? hintId : undefined}
        tabIndex={panZoom ? 0 : undefined}
        onPointerDownCapture={panZoom ? markPointerFocus : undefined}
        onBlur={panZoom ? clearPointerFocus : undefined}
        {...(panZoom ? viewport.handlers : {})}
      >
        {BADGE_SYMBOLS}
        {POLE_SYMBOLS}
        {MOMENT_SYMBOL}
        {/* A map design's metallic finish lights the places been to's edges with this, a few
            pixels wide at every zoom (in the names' steps), once the map is still */}
        <FoilEdgeFilter zoom={labelZoom(zoom)} />
        {seaDepths ? DEPTHS : null}
        {showGrid ? <MapGridLines showLabels={showGridLabels} zoom={zoom} showAntarctica={showAntarctica} coloured={gridColoured} /> : null}
        {design || designPreview ? (
          <VisitedFoil
            design={design}
            preview={designPreview}
            visitsByCode={visitsByCode}
            detail={detail}
            splitUk={splitUk}
            showAntarctica={showAntarctica}
            zoom={zoom}
            faded={!showVisited}
          />
        ) : null}
        <CountryLayer
          visitsByCode={visitsByCode}
          plannedCodes={plannedCodes}
          selectedCode={selectedCode}
          zoom={zoom}
          onSelect={onSelectCountry}
          onHover={onHoverCountry}
          afterTap={afterTap}
          showVisited={showVisited}
          showUnvisited={showUnvisited}
          showAntarctica={showAntarctica}
          splitUk={splitUk}
          detail={detail}
        />
        {showSky ? <SkyBodies zoom={zoom} /> : null}
        {showCountryNames ? (
          <CountryNameLabels zoom={labelZoom(zoom)} visitsByCode={visitsByCode} showAntarctica={showAntarctica} splitUk={splitUk} />
        ) : null}
        <VisitBadges visitsByCode={visitsByCode} zoom={zoom} faded={!showVisited} showAntarctica={showAntarctica} splitUk={splitUk} />
        {showMoments ? <MomentMarks counts={momentCounts} zoom={zoom} showAntarctica={showAntarctica} /> : null}
        <PoleNameLabels zoom={zoom} visitsByCode={visitsByCode} always={showCountryNames} showAntarctica={showAntarctica} />
        {landmarks?.length && landmarkPins !== 'off' ? (
          <LandmarkPins
            landmarks={landmarks}
            stamped={stampedLandmarks}
            zoom={zoom}
            mode={landmarkPins}
            onSelectCountry={onSelectCountry}
            afterTap={afterTap}
            splitUk={splitUk}
          />
        ) : null}
        {showMoments && momentSpots.length ? (
          <MomentSpotPins spots={momentSpots} zoom={zoom} showAntarctica={showAntarctica} onSelectCountry={onSelectCountry} afterTap={afterTap} />
        ) : null}
        {/* Strings between places, over everything else, as thread pinned to a board */}
        {strings?.length || stringStart ? (
          <MapStrings
            strings={strings}
            // In the names' steps: a twined string's strands are a few pixels apart, which this
            // keeps close enough while it re-renders only a few times a doubling
            zoom={labelZoom(zoom)}
            showAntarctica={showAntarctica}
            startCode={stringStart}
            startKind={stringKind}
            onRemove={onRemoveString}
            removeKind={stringKind}
            afterTap={afterTap}
          />
        ) : null}
        {stops?.length ? <StopMarkers stops={stops} zoom={zoom} /> : null}
      </svg>
      {/* How to move the map: read out with it, and shown while it has the keyboard's focus */}
      {panZoom ? (
        <MapKeyboardHint id={hintId}>
          Drag, or use the arrow keys, to move the map. Plus and minus zoom, as does a double-tap; 0 shows the whole
          world. Every country and special place is also in the country list.
        </MapKeyboardHint>
      ) : null}
    </>
  );
}

export default memo(WorldMap);
