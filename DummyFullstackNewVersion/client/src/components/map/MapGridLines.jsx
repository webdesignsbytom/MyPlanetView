import React, { memo } from 'react';
// Utils
import { buildGridLines, latitudeLabel, longitudeLabel } from '@/utils/map/projection';

// Parallels and meridians every 30°, drawn from the projection (meridians curve on a
// Robinson map; the old site drew a straight even grid, which didn't line up).
const GRID = buildGridLines(30);

function MapGridLines({ showLabels, zoom }) {
  const fontSize = 13 / zoom;
  return (
    <g className='pointer-events-none fill-none stroke-map-edge opacity-30' aria-hidden='true'>
      {GRID.parallels.map((line) => (
        <polyline
          key={`lat${line.lat}`}
          points={line.points}
          className={line.lat === 0 ? 'stroke-[1]' : 'stroke-[0.6] [stroke-dasharray:4_4]'}
        />
      ))}
      {GRID.meridians.map((line) => (
        <polyline
          key={`lng${line.lng}`}
          points={line.points}
          className={line.lng === 0 ? 'stroke-[1]' : 'stroke-[0.6] [stroke-dasharray:4_4]'}
        />
      ))}
      {showLabels ? (
        <g className='fill-map-ink stroke-none opacity-100' fontSize={fontSize}>
          {GRID.parallels.map((line) => (
            <text key={`latl${line.lat}`} x={line.labelAt.x + 4 / zoom} y={line.labelAt.y - 3 / zoom}>
              {latitudeLabel(line.lat)}
            </text>
          ))}
          {GRID.meridians.map((line) => (
            <text key={`lngl${line.lng}`} x={line.labelAt.x} y={line.labelAt.y} textAnchor='middle'>
              {longitudeLabel(line.lng)}
            </text>
          ))}
        </g>
      ) : null}
    </g>
  );
}

export default memo(MapGridLines);
