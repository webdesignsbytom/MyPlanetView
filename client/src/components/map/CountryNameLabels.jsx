import React, { memo } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
import { COUNTRY_LABEL_WIDTH } from '@/utils/map/countryStyle';
import { UK_NATION_LABEL_WIDTH } from '@/utils/map/ukNationShapes';
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

// A place too small for its name even then (a Caribbean island, the Canaries, the
// Falklands, a micro-state's dot) is named under it instead, at that smallest readable
// size, once the map is zoomed in this far for it (18 Nov 2026, the user's wish: they never
// got a name): sooner the bigger it is (OUTSIDE_PER_WIDTH over its width in map units),
// from OUTSIDE_EARLIEST at the soonest and by OUTSIDE_LATEST at the latest, so every one
// is named before the closest zoom. A micro-state's dot (no shape) is named from DOT_FROM.
const OUTSIDE_PER_WIDTH = 6;
const OUTSIDE_EARLIEST = 4;
const OUTSIDE_LATEST = 10;
const DOT_FROM = 6;
const outsideFrom = (width) => (width ? Math.min(OUTSIDE_LATEST, Math.max(OUTSIDE_EARLIEST, OUTSIDE_PER_WIDTH / width)) : DOT_FROM);

// Country names at their pins, sized to stay readable as the map zooms. A name is drawn
// inside its country's main shape once it fits; a small country (Guatemala, Costa Rica)
// gets a smaller name rather than none, and one too small for even that gets its name
// under it as you zoom in (outsideFrom), below the island (about its size down, as only its
// width is known). A visited country's name sits under its star badge. Antarctica's name is
// drawn too (unless it's hidden); the poles' are PoleNameLabels'. On a map that splits the
// UK (`splitUk`), its nations are named instead of it.
function CountryNameLabels({ zoom, visitsByCode, showAntarctica = true, splitUk = false }) {
  const fontSize = 10 / Math.sqrt(zoom) / Math.max(zoom / 4, 1);
  const minSize = Math.min(fontSize, Math.max(fontSize * MIN_SHRINK, MIN_SCREEN_SIZE / zoom));
  const radius = badgeRadius(zoom);
  return (
    <g className='pointer-events-none fill-map-ink font-medium' fontSize={fontSize} textAnchor='middle' aria-hidden='true'>
      {COUNTRIES.map((country) => {
        const width = splitUk
          ? country.code !== 'GB' && (COUNTRY_LABEL_WIDTH[country.code] ?? UK_NATION_LABEL_WIDTH[country.code])
          : COUNTRY_LABEL_WIDTH[country.code];
        // A micro-state drawn as a dot: a country (not a special place or a UK nation) with no shape
        const dotted = !country.kind && COUNTRY_LABEL_WIDTH[country.code] == null;
        if ((!width && !dotted) || (!showAntarctica && isAntarctic(country.code))) return null;

        const inside = width ? Math.min(fontSize, width / (country.name.length * CHAR_WIDTH)) : 0;
        const outside = inside < minSize;
        if (outside && zoom < outsideFrom(width)) return null;
        const size = outside ? minSize : inside;
        const badge = HAS_BADGE[visitsByCode?.[country.code]] ? radius : 0;
        const y = country.pinY + (outside ? badge + Math.min((width || 0) * 0.45, 4) + size * 1.1 : badge ? radius + size * 0.9 : size * 0.35);
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
