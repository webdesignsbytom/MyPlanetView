import React, { memo } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
import { COUNTRY_LABEL_WIDTH } from '@/utils/map/countryStyle';
// Utils
import { badgeRadius } from '@/utils/map/badges';

// Roughly how wide a character is, as a share of the font size (Poppins, medium)
const CHAR_WIDTH = 0.55;
const HAS_BADGE = { VISITED: true, LIVED: true };

// Country names at their pins, sized to stay readable as the map zooms. A name is
// only drawn once it fits inside the country's main shape, so small countries get
// theirs as you zoom in. A visited country's name sits under its star badge.
function CountryNameLabels({ zoom, visitsByCode }) {
  const fontSize = 10 / Math.sqrt(zoom) / Math.max(zoom / 4, 1);
  const badgeGap = badgeRadius(zoom) + fontSize * 0.9;
  return (
    <g className='pointer-events-none fill-map-ink font-medium' fontSize={fontSize} textAnchor='middle' aria-hidden='true'>
      {COUNTRIES.map((country) => {
        const width = COUNTRY_LABEL_WIDTH[country.code];
        if (!width || width < country.name.length * fontSize * CHAR_WIDTH) return null;
        const y = country.pinY + (HAS_BADGE[visitsByCode?.[country.code]] ? badgeGap : fontSize * 0.35);
        return (
          <text key={country.code} x={country.pinX} y={y}>
            {country.name}
          </text>
        );
      })}
    </g>
  );
}

export default memo(CountryNameLabels);
