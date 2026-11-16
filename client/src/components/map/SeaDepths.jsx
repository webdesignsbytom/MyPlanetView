import React from 'react';
// Media
import depthsUrl from '@/assets/map/sea-depths.webp';
// Utils
import { MAP_BOTTOM, MAP_TOP, MAP_WIDTH } from '@/utils/map/projection';

// The sea's depths, as an atlas tints them: lighter over the continental shelves, darker
// over the deep basins (Natural Earth's bathymetry). One tint image over the whole map
// (pole line to pole line), made by images/src/tools/sea-depths.mjs, so panning draws one
// bitmap. Drawn over the sea and under the countries, on the plain sea only.
function SeaDepths() {
  return (
    <image
      href={depthsUrl}
      x={0}
      y={MAP_TOP}
      width={MAP_WIDTH}
      height={MAP_BOTTOM - MAP_TOP}
      preserveAspectRatio='none'
      aria-hidden='true'
      className='pointer-events-none'
    />
  );
}

export default SeaDepths;
