import React, { memo } from 'react';
// Data
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
// Utils
import { MOMENT_MARK_ID, badgeRadius, momentMarkPlace } from '@/utils/map/badges';
import { insidePoleLines } from '@/utils/map/projection';
import { isAntarctic } from '@/utils/map/specialPlaces';

/**
 * A pinned note beside the badge of every place with moments (`counts`, the map's
 * momentCountsByCountry), sized by zoom like the badges. It never takes a click (the place
 * underneath does). With Antarctica hidden, its places' marks go too. Redrawn only when
 * the zoom or the counts change, never while panning.
 */
function MomentMarks({ counts, zoom, showAntarctica = true }) {
  const r = badgeRadius(zoom);
  return (
    <g aria-hidden='true' className='pointer-events-none'>
      {Object.keys(counts).map((code) => {
        const country = COUNTRY_BY_CODE[code];
        if (!country || !counts[code] || (!showAntarctica && isAntarctic(code))) return null;
        const place = momentMarkPlace(country.pinX, insidePoleLines(country.pinY, r), zoom);
        return <use key={code} href={`#${MOMENT_MARK_ID}`} data-moment-mark={code} {...place} />;
      })}
    </g>
  );
}

export default memo(MomentMarks);
