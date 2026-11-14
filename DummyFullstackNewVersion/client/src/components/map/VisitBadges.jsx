import React, { memo } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
// Utils
import { BADGE_IDS, badgeRadius } from '@/utils/map/badges';

const BADGE_FOR = { VISITED: BADGE_IDS.VISITED, LIVED: BADGE_IDS.LIVED };

// A star badge on every visited or lived-in country, at its pin. It never takes a
// click (the country underneath does), and fades with the "show visited" filter.
function VisitBadges({ visitsByCode, zoom, faded = false }) {
  const r = badgeRadius(zoom);
  return (
    <g aria-hidden='true' className={`pointer-events-none ${faded ? 'opacity-15' : ''}`}>
      {COUNTRIES.map((country) => {
        const id = BADGE_FOR[visitsByCode[country.code]];
        if (!id) return null;
        return <use key={country.code} href={`#${id}`} x={country.pinX - r} y={country.pinY - r} width={r * 2} height={r * 2} />;
      })}
    </g>
  );
}

export default memo(VisitBadges);
