import React, { memo } from 'react';
// The stamps (the account page's backdrop draws some of them)
import { ARC_PATH, LOADING_STAMPS, drawStamp } from '@/components/common/passportStampArt';

/**
 * One stamp on the loading screen (StampLoading), drawn once: memoised on its record, which
 * never changes, so a new press draws only the new stamp, not all of them again every
 * 0.38 s (19 Nov 2026, the audit). It lands with a stamp's thump on its own box (an HTML-level
 * <svg>, which the browser can animate off the main thread; an SVG <g> it can't); with
 * reduced motion it just appears. `arcId` names the path its words follow.
 */
function PressedStamp({ stamp, arcId }) {
  const design = LOADING_STAMPS[stamp.design];
  return (
    <svg
      viewBox='-160 -120 320 240'
      className='absolute w-[clamp(8rem,32vw,15rem)] origin-center -translate-x-1/2 -translate-y-1/2 overflow-visible motion-safe:animate-stamp-in'
      style={{ left: `${stamp.left}%`, top: `${stamp.top}%` }}
    >
      <defs>
        <path id={arcId} d={ARC_PATH} />
      </defs>
      <g transform={`scale(${stamp.scale})`}>{drawStamp({ ...design, x: 0, y: 0, rotate: stamp.rotate }, arcId, 'opacity-90', design.loadingInk)}</g>
    </svg>
  );
}

export default memo(PressedStamp);
