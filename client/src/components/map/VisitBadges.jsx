import React, { memo } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
// Utils
import { badgeIdFor, badgeRadiusFor } from '@/utils/map/badges';
import { insidePoleLines } from '@/utils/map/projection';
import { isAntarctic, isPole } from '@/utils/map/specialPlaces';

// A badge on every visited or lived-in place, at its pin: the star sticker on a country,
// the gold expedition stamp on a special place. It never takes a click (the place
// underneath does), and fades with the "show visited" filter. With Antarctica hidden, its
// places' badges go too. A pole's stamp is drawn just inside the map's edge, like its rose.
// On a map that splits the UK (`splitUk`), its nations wear theirs; the UK's own (marked
// before the split, its nations not chosen yet) isn't drawn among them. A region's star is a
// little smaller than a country's. Each says what it marks (`data-visit-badge`): a place the
// map design's visited colour fills, or a pole, which it never does; a design that shows the
// places been to by colour alone hides the first kind (utils/map/mapDesign.js; 25 Nov 2026).
function VisitBadges({ visitsByCode, zoom, faded = false, showAntarctica = true, splitUk = false }) {
  return (
    <g aria-hidden='true' className={`pointer-events-none ${faded ? 'opacity-15' : ''}`}>
      {COUNTRIES.map((country) => {
        const id = badgeIdFor(country.code, visitsByCode[country.code]);
        if (!id || (!showAntarctica && isAntarctic(country.code)) || (splitUk && country.code === 'GB')) return null;
        const r = badgeRadiusFor(country.code, zoom);
        const y = insidePoleLines(country.pinY, r);
        return (
          <use
            key={country.code}
            href={`#${id}`}
            x={country.pinX - r}
            y={y - r}
            width={r * 2}
            height={r * 2}
            data-visit-badge={isPole(country.code) ? 'pole' : 'fill'}
          />
        );
      })}
    </g>
  );
}

export default memo(VisitBadges);
