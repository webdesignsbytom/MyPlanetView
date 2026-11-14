import React, { memo, useCallback, useRef } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
// Components
import CountryShape from './CountryShape';
import MicroStateDot from './MicroStateDot';

const SHAPED = COUNTRIES.filter((c) => COUNTRY_SHAPES[c.code]);
const DOTTED = COUNTRIES.filter((c) => !COUNTRY_SHAPES[c.code]);

const codeFrom = (target) => target?.closest?.('[data-code]')?.getAttribute('data-code') || null;

// my_planet's filters: a hidden group fades back rather than vanishing, so the
// world keeps its shape and every country stays clickable.
const FADE_BEEN = '[&_[data-been=true]]:opacity-15';
const FADE_NOT_BEEN = '[&_[data-been=false]]:opacity-15';

// Every country, with one set of listeners for all of them (event delegation), so a
// hover or click never re-renders the 470 shapes.
function CountryLayer({ visitsByCode, selectedCode, zoom, onSelect, onHover, afterTap, showVisited = true, showUnvisited = true }) {
  const hoveredRef = useRef(null);

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
      {SHAPED.map((country) => (
        <CountryShape
          key={country.code}
          code={country.code}
          paths={COUNTRY_SHAPES[country.code]}
          status={visitsByCode[country.code]}
          selected={selectedCode === country.code}
        />
      ))}
      {DOTTED.map((country) => (
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
    </g>
  );
}

export default memo(CountryLayer);
