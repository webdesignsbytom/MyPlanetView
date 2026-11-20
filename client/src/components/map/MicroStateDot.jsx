import React, { memo } from 'react';
// Utils
import { countryFillClass, countsAsVisited } from '@/utils/map/visitStatus';
import { REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';

// Liechtenstein, Monaco, San Marino, Singapore and the Vatican have no shape at this
// scale: a dot at the pin, sized so it stays clickable at any zoom.
function MicroStateDot({ code, x, y, zoom, status, selected }) {
  const r = Math.max(3.2 / Math.sqrt(zoom), 0.6);
  // Too small to aim a finger at (under 4px across on screen), it takes no touches: the
  // browser's tap targeting picked the dot over the country under the finger, so a tap on
  // south-east France opened Monaco (19 Nov 2026, the audit). A mouse can still click it.
  const tooSmallToTouch = r * zoom * REFERENCE_PX_PER_UNIT < 2;
  return (
    <g
      data-code={code}
      data-been={countsAsVisited(status) ? 'true' : 'false'}
      className={`cursor-pointer hover:fill-map-hover ${countryFillClass(code, status)} ${
        selected ? 'stroke-map-ink stroke-[1.8]' : ''
      } ${tooSmallToTouch ? 'pointer-coarse:pointer-events-none' : ''}`}
    >
      <circle cx={x} cy={y} r={r} />
    </g>
  );
}

export default memo(MicroStateDot);
