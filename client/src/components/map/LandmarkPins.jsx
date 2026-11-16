import React, { memo, useMemo } from 'react';
// Utils
import { pinZoomStep, pinsShownAt, placePins } from '@/utils/map/landmarkPins';

// Landmark pins, at their real position on the map's projection (the API's pinX/pinY).
// Hidden until the map is zoomed in enough for them not to crowd it, unless `always`
// (the Detailed map type). Not every landmark has a pin at every zoom: there are 1,332, so
// utils/map/landmarkPins.js thins them out by zoom, keeping them about 30 px apart on
// screen, more appearing as the map zooms in, all of them close up.
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
const dot = (x, y) => `M${x} ${y}h0`;

// `afterTap` is the viewport's: it skips the click ending a drag or a double-tap (which zooms).
// One click handler for every pin, on the group.
function LandmarkPins({ landmarks, zoom, onSelectCountry, afterTap, always = false }) {
  const pins = useMemo(() => pinsFor(landmarks), [landmarks]);
  const count = zoom >= LANDMARK_MIN_ZOOM || always ? pinsShownAt(pins, pinZoomStep(zoom)) : 0;

  const drawn = useMemo(() => {
    const shown = pins.slice(0, count);
    return (
      <>
        <path d={shown.map(({ x, y }) => dot(x, y)).join('')} strokeWidth={EDGE_PX} className='pointer-events-none stroke-map-edge' />
        {shown.map(({ landmark, x, y }) => (
          <path key={landmark.id} d={dot(x, y)} strokeWidth={DOT_PX} data-country={landmark.countryCode} className='cursor-pointer stroke-poster-red'>
            <title>{landmark.name}</title>
          </path>
        ))}
      </>
    );
  }, [pins, count]);

  if (!count) return null;
  return (
    <g
      className='fill-none [stroke-linecap:round]'
      data-landmark-pins={count}
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
