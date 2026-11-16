import React, { memo, useMemo } from 'react';
// Utils
import { pinZoomStep, pinsShownAt, placePins } from '@/utils/map/landmarkPins';
import { landmarkPlace } from '@/utils/map/ukNations';

// Landmark pins, at their real position on the map's projection (the API's pinX/pinY).
// `mode` is the viewer's setting (17 Nov 2026): 'zoomed', hidden until the map is zoomed in
// enough for them not to crowd it; 'always', at every zoom; 'stamped', only the passport's
// stamped ones, at every zoom ('off' isn't drawn at all: WorldMap leaves this out). Not every landmark has a pin at every zoom: there are 1,332, so
// utils/map/landmarkPins.js thins them out by zoom, keeping them about 30 px apart on
// screen, more appearing as the map zooms in, all of them close up. The landmarks stamped
// in the map's passport (`stamped`, a Set of ids: the map's stampedLandmarkIds) are gold
// and a little bigger, and show whenever any pins do, thinned or not: they're the map's own.
export const LANDMARK_MIN_ZOOM = 3;

// Each landmark list's pins are placed once (the list is fetched once per session)
const placedFor = new WeakMap();
function pinsFor(landmarks) {
  if (!placedFor.has(landmarks)) placedFor.set(landmarks, placePins(landmarks));
  return placedFor.get(landmarks);
}

// A pin is a dot: a line of no length with round ends, whose width the map keeps in screen
// pixels (WorldMap draws every path with non-scaling strokes). So a pin is the same size at
// every zoom and nothing about it changes as the map zooms: the pins re-render only when a
// zoom step shows more or fewer of them, and React then only adds or drops those. Changing
// a thousand circles' radius on every zoom made each wheel tick lay the whole map out again.
// Their dark edge is one path under all of them.
const DOT_PX = 7;
const EDGE_PX = DOT_PX + 2;
const STAMP_PX = 9;
const STAMP_EDGE_PX = STAMP_PX + 2;
const dot = (x, y) => `M${x} ${y}h0`;
const NO_STAMPS = new Set();

// `afterTap` is the viewport's: it skips the click ending a drag or a double-tap (which zooms).
// One click handler for every pin, on the group.
// A pin opens its landmark's country; on a map that splits the UK (`splitUk`), a UK
// landmark's nation.
function LandmarkPins({ landmarks, zoom, onSelectCountry, afterTap, mode = 'zoomed', stamped = NO_STAMPS, splitUk = false }) {
  const pins = useMemo(() => pinsFor(landmarks), [landmarks]);
  const onlyStamped = mode === 'stamped';
  // 'always' shows at least the zoom-1 pins (each country's first, and so on): the thinning
  // starts at zoom 1, the whole world on a 1920-pixel screen, and a smaller one sees the
  // whole world further out than that, where none would show
  const count = onlyStamped
    ? 0
    : mode === 'always'
      ? pinsShownAt(pins, pinZoomStep(Math.max(zoom, 1)))
      : zoom >= LANDMARK_MIN_ZOOM
        ? pinsShownAt(pins, pinZoomStep(zoom))
        : 0;
  // The stamped pins show whenever any pins do, and on their own in 'stamped' mode
  const showStamps = count > 0 || (onlyStamped && stamped.size > 0);

  const { drawn, stampCount } = useMemo(() => {
    if (!showStamps) return { drawn: null, stampCount: 0 };
    // The thinned pins, less the stamped ones, which are drawn over them all
    const plain = pins.slice(0, count).filter(({ landmark }) => !stamped.has(landmark.id));
    const mine = stamped.size ? pins.filter(({ landmark }) => stamped.has(landmark.id)) : [];
    const pin = ({ landmark, x, y }, isStamp) => (
      <path
        key={landmark.id}
        d={dot(x, y)}
        strokeWidth={isStamp ? STAMP_PX : DOT_PX}
        data-country={landmarkPlace(landmark, splitUk)}
        data-stamped={isStamp ? '' : undefined}
        className={`cursor-pointer ${isStamp ? 'stroke-poster-gold-light' : 'stroke-poster-red'}`}
      >
        <title>{isStamp ? `${landmark.name}, stamped in the passport` : landmark.name}</title>
      </path>
    );
    return {
      stampCount: mine.length,
      drawn: (
        <>
          <path d={plain.map(({ x, y }) => dot(x, y)).join('')} strokeWidth={EDGE_PX} className='pointer-events-none stroke-map-edge' />
          {plain.map((p) => pin(p, false))}
          {mine.length ? (
            <path d={mine.map(({ x, y }) => dot(x, y)).join('')} strokeWidth={STAMP_EDGE_PX} className='pointer-events-none stroke-map-edge' />
          ) : null}
          {mine.map((p) => pin(p, true))}
        </>
      ),
    };
  }, [pins, count, showStamps, stamped, splitUk]);

  if (!showStamps) return null;
  return (
    <g
      className='fill-none [stroke-linecap:round]'
      data-landmark-pins={count}
      data-stamped-pins={stampCount}
      onClick={(e) => {
        const code = e.target.closest?.('[data-country]')?.getAttribute('data-country');
        if (!code) return;
        e.stopPropagation();
        const select = () => onSelectCountry?.(code);
        if (afterTap) afterTap(select);
        else select();
      }}
    >
      {drawn}
    </g>
  );
}

export default memo(LandmarkPins);
