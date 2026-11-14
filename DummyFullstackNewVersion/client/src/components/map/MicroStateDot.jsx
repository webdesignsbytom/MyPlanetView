import React, { memo } from 'react';
// Utils
import { countryFillClass, countsAsVisited } from '@/utils/map/visitStatus';

// Liechtenstein, Monaco, San Marino, Singapore and the Vatican have no shape at this
// scale: a dot at the pin, sized so it stays clickable at any zoom.
function MicroStateDot({ code, x, y, zoom, status, selected }) {
  const r = Math.max(3.2 / Math.sqrt(zoom), 0.6);
  return (
    <g
      data-code={code}
      data-been={countsAsVisited(status) ? 'true' : 'false'}
      className={`cursor-pointer hover:fill-map-hover ${countryFillClass(code, status)} ${
        selected ? 'stroke-map-ink stroke-[1.8]' : ''
      }`}
    >
      <circle cx={x} cy={y} r={r} />
    </g>
  );
}

export default memo(MicroStateDot);
