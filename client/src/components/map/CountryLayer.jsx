import React, { memo, useCallback, useRef } from 'react';
// Data
import { COUNTRIES, POLE_PLACES } from '@/utils/map/countries';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
// Components
import CountryShape from './CountryShape';
import MicroStateDot from './MicroStateDot';
import PoleMarker from './PoleMarker';
// Utils
import { isAntarctic, isPole } from '@/utils/map/specialPlaces';

// The shapes (countries and Antarctica), the micro-states' dots, and the poles' markers;
// each list also without Antarctica's places, for when that's hidden
const SHAPED = COUNTRIES.filter((c) => COUNTRY_SHAPES[c.code]);
const DOTTED = COUNTRIES.filter((c) => !COUNTRY_SHAPES[c.code] && !isPole(c.code));
const notAntarctic = (c) => !isAntarctic(c.code);
const LAYERS = {
  withAntarctica: { shaped: SHAPED, dotted: DOTTED, poles: POLE_PLACES },
  withoutAntarctica: { shaped: SHAPED.filter(notAntarctic), dotted: DOTTED.filter(notAntarctic), poles: POLE_PLACES.filter(notAntarctic) },
};

const codeFrom = (target) => target?.closest?.('[data-code]')?.getAttribute('data-code') || null;

// my_planet's filters: a hidden group fades back rather than vanishing, so the
// world keeps its shape and every country stays clickable.
const FADE_BEEN = '[&_[data-been=true]]:opacity-15';
const FADE_NOT_BEEN = '[&_[data-been=false]]:opacity-15';

// Every country and special place, with one set of listeners for all of them (event
// delegation), so a hover or click never re-renders the 614 paths. With Antarctica
// hidden (`showAntarctica` off), it and the poles beside it aren't drawn.
function CountryLayer({
  visitsByCode,
  selectedCode,
  zoom,
  onSelect,
  onHover,
  afterTap,
  showVisited = true,
  showUnvisited = true,
  showAntarctica = true,
}) {
  const hoveredRef = useRef(null);
  const layer = showAntarctica ? LAYERS.withAntarctica : LAYERS.withoutAntarctica;

  // With pan and zoom on, the viewport's afterTap skips drags and double-taps (which zoom)
  const handleClick = useCallback(
    (e) => {
      const code = codeFrom(e.target);
      if (!code) return;
      const select = () => onSelect?.(code);
      if (afterTap) afterTap(select);
      else select();
    },
    [onSelect, afterTap],
  );

  const handlePointerOver = useCallback(
    (e) => {
      if (e.pointerType === 'touch') return; // a tap selects; there's no hover on touch
      const code = codeFrom(e.target);
      if (code === hoveredRef.current) return;
      hoveredRef.current = code;
      onHover?.(code);
    },
    [onHover],
  );

  const handlePointerLeave = useCallback(() => {
    hoveredRef.current = null;
    onHover?.(null);
  }, [onHover]);

  return (
    <g
      className={`stroke-[0.6] ${showVisited ? '' : FADE_BEEN} ${showUnvisited ? '' : FADE_NOT_BEEN}`}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
    >
      {layer.shaped.map((country) => (
        <CountryShape
          key={country.code}
          code={country.code}
          paths={COUNTRY_SHAPES[country.code]}
          status={visitsByCode[country.code]}
          selected={selectedCode === country.code}
        />
      ))}
      {layer.dotted.map((country) => (
        <MicroStateDot
          key={country.code}
          code={country.code}
          x={country.pinX}
          y={country.pinY}
          zoom={zoom}
          status={visitsByCode[country.code]}
          selected={selectedCode === country.code}
        />
      ))}
      {layer.poles.map((pole) => (
        <PoleMarker
          key={pole.code}
          code={pole.code}
          x={pole.pinX}
          y={pole.pinY}
          zoom={zoom}
          status={visitsByCode[pole.code]}
          selected={selectedCode === pole.code}
        />
      ))}
    </g>
  );
}

export default memo(CountryLayer);
