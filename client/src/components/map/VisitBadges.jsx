import React, { memo } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
// Utils
import { badgeIdFor, badgeRadius } from '@/utils/map/badges';
import { isAntarctic } from '@/utils/map/specialPlaces';

// A badge on every visited or lived-in place, at its pin: the star sticker on a country,
// the gold expedition stamp on a special place. It never takes a click (the place
// underneath does), and fades with the "show visited" filter. With Antarctica hidden, its
// places' badges go too.
function VisitBadges({ visitsByCode, zoom, faded = false, showAntarctica = true }) {
  const r = badgeRadius(zoom);
  return (
    <g aria-hidden='true' className={`pointer-events-none ${faded ? 'opacity-15' : ''}`}>
      {COUNTRIES.map((country) => {
        const id = badgeIdFor(country.code, visitsByCode[country.code]);
        if (!id || (!showAntarctica && isAntarctic(country.code))) return null;
        return <use key={country.code} href={`#${id}`} x={country.pinX - r} y={country.pinY - r} width={r * 2} height={r * 2} />;
      })}
    </g>
  );
}

export default memo(VisitBadges);
