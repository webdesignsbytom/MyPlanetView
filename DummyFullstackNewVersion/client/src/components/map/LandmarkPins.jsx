import React, { memo } from 'react';
// Utils
import { projectToMap } from '@/utils/map/projection';

// Landmark pins, placed from their real position with the map's projection.
// Hidden until the map is zoomed in enough for them not to crowd it, unless `always`
// (the Detailed map type), when they shrink with the zoom instead.
export const LANDMARK_MIN_ZOOM = 3;

function LandmarkPins({ landmarks, zoom, onSelectCountry, always = false }) {
  if (zoom < LANDMARK_MIN_ZOOM && !always) return null;
  const r = Math.min(5 / zoom, 3);
  return (
    <g className='fill-map-panel-alt stroke-map-edge'>
      {landmarks.map((landmark) => {
        const at =
          landmark.pinX != null && landmark.pinY != null
            ? { x: landmark.pinX, y: landmark.pinY }
            : projectToMap(landmark.latitude, landmark.longitude);
        if (!at) return null;
        return (
          <circle
            key={landmark.id}
            cx={at.x}
            cy={at.y}
            r={r}
            className='cursor-pointer stroke-[1]'
            onClick={(e) => {
              e.stopPropagation();
              onSelectCountry?.(landmark.countryCode);
            }}
          >
            <title>{landmark.name}</title>
          </circle>
        );
      })}
    </g>
  );
}

export default memo(LandmarkPins);
