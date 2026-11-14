import React, { memo } from 'react';
// Data
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

// A trip's stops in order: a numbered marker at each stop's country pin, joined by a line.
function StopMarkers({ stops, zoom }) {
  const points = stops
    .map((stop) => COUNTRY_BY_CODE[stop.countryCode])
    .filter(Boolean)
    .map((country) => ({ x: country.pinX, y: country.pinY }));
  if (!points.length) return null;

  const r = 9 / Math.sqrt(zoom);
  return (
    <g aria-hidden='true' className='pointer-events-none'>
      {points.length > 1 ? (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          className='fill-none stroke-map-ink stroke-[1.5] [stroke-dasharray:6_4]'
        />
      ) : null}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={r} className='fill-poster-red stroke-map-edge stroke-[1]' />
          <text x={p.x} y={p.y} dy={r * 0.35} fontSize={r} textAnchor='middle' className='fill-map-ink font-semibold'>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}

export default memo(StopMarkers);
