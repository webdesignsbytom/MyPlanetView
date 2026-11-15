import React, { memo } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
import { COUNTRY_LABEL_WIDTH } from '@/utils/map/countryStyle';
// Utils
import { badgeRadius } from '@/utils/map/badges';
import { isAntarctic } from '@/utils/map/specialPlaces';

// Roughly how wide a character is, as a share of the font size (Poppins, medium)
const CHAR_WIDTH = 0.55;
// A name too wide for its country shrinks to fit, down to this share of the usual size...
const MIN_SHRINK = 0.65;
// ...and never below this size on screen (in map units at zoom 1), so it stays readable
const MIN_SCREEN_SIZE = 11;
const HAS_BADGE = { VISITED: true, LIVED: true };

// Country names at their pins, sized to stay readable as the map zooms. A name is
// only drawn once it fits inside the country's main shape; a small country (Guatemala,
// Costa Rica) gets a smaller name rather than none, and the tiniest get theirs as you
// zoom in. A visited country's name sits under its star badge. Antarctica's name is
// drawn too (unless it's hidden); the poles' are PoleNameLabels'.
function CountryNameLabels({ zoom, visitsByCode, showAntarctica = true }) {
  const fontSize = 10 / Math.sqrt(zoom) / Math.max(zoom / 4, 1);
  const minSize = Math.min(fontSize, Math.max(fontSize * MIN_SHRINK, MIN_SCREEN_SIZE / zoom));
  const radius = badgeRadius(zoom);
  return (
    <g className='pointer-events-none fill-map-ink font-medium' fontSize={fontSize} textAnchor='middle' aria-hidden='true'>
      {COUNTRIES.map((country) => {
        const width = COUNTRY_LABEL_WIDTH[country.code];
        if (!width || (!showAntarctica && isAntarctic(country.code))) return null;
        const size = Math.min(fontSize, width / (country.name.length * CHAR_WIDTH));
        if (size < minSize) return null;
        const y = country.pinY + (HAS_BADGE[visitsByCode?.[country.code]] ? radius + size * 0.9 : size * 0.35);
        return (
          <text key={country.code} x={country.pinX} y={y} fontSize={size < fontSize ? size : undefined}>
            {country.name}
          </text>
        );
      })}
    </g>
  );
}

export default memo(CountryNameLabels);
