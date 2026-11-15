import React, { memo } from 'react';
// Data
import { POLE_PLACES } from '@/utils/map/countries';
// Utils
import { badgeRadius, poleMarkerRadius } from '@/utils/map/badges';
import { MAP_EQUATOR_Y } from '@/utils/map/projection';
import { isAntarctic } from '@/utils/map/specialPlaces';

// Names show once you've zoomed in this far, or at any zoom with country names on
const NAME_ZOOM = 2.5;
const VISITED = { VISITED: true, LIVED: true };

// The poles' names, below a north pole (into the map) and above a south one, clear of
// its marker or its stamp. Drawn over the badges; they never take a click.
function PoleNameLabels({ zoom, visitsByCode, always = false, showAntarctica = true }) {
  if (!always && zoom < NAME_ZOOM) return null;
  const fontSize = 10 / Math.sqrt(zoom) / Math.max(zoom / 4, 1);
  return (
    <g className='pointer-events-none fill-map-ink font-medium' fontSize={fontSize} textAnchor='middle' aria-hidden='true'>
      {POLE_PLACES.map((pole) => {
        if (!showAntarctica && isAntarctic(pole.code)) return null;
        const clear = VISITED[visitsByCode?.[pole.code]] ? badgeRadius(zoom) : poleMarkerRadius(zoom) * 1.05;
        const north = pole.pinY < MAP_EQUATOR_Y;
        const y = north ? pole.pinY + clear + fontSize * 0.95 : pole.pinY - clear - fontSize * 0.35;
        return (
          <text key={pole.code} x={pole.pinX} y={y}>
            {pole.name}
          </text>
        );
      })}
    </g>
  );
}

export default memo(PoleNameLabels);
