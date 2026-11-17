import React, { memo, useCallback, useEffect, useRef } from 'react';
// Data
import { COUNTRIES, POLE_PLACES } from '@/utils/map/countries';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';
// Components
import CountryShape from './CountryShape';
import MicroStateDot from './MicroStateDot';
import PoleMarker from './PoleMarker';
// Utils
import { isAntarctic, isPole } from '@/utils/map/specialPlaces';
import { setHoverPoint } from '@/utils/map/hoverPoint';

// The shapes (countries and Antarctica), the micro-states' dots, and the poles' markers;
// each list also without Antarctica's places, for when that's hidden, and with the UK's
// four nations drawn in its place, for a map that splits the UK (ukNationShapes.js)
const shapesOf = (code) => COUNTRY_SHAPES[code] ?? UK_NATION_SHAPES[code];
const SHAPED = COUNTRIES.filter((c) => COUNTRY_SHAPES[c.code]);
const SHAPED_SPLIT_UK = [...SHAPED.filter((c) => c.code !== 'GB'), ...COUNTRIES.filter((c) => c.kind === 'NATION')];
const DOTTED = COUNTRIES.filter((c) => !COUNTRY_SHAPES[c.code] && !isPole(c.code) && c.kind !== 'NATION');
const notAntarctic = (c) => !isAntarctic(c.code);
const layerOf = (shaped) => ({
  withAntarctica: { shaped, dotted: DOTTED, poles: POLE_PLACES },
  withoutAntarctica: {
    shaped: shaped.filter(notAntarctic),
    dotted: DOTTED.filter(notAntarctic),
    poles: POLE_PLACES.filter(notAntarctic),
  },
});
const LAYERS = { whole: layerOf(SHAPED), splitUk: layerOf(SHAPED_SPLIT_UK) };

// A finger held still on a country this long shows its postcard (17 Nov 2026, the user's
// wish: phones have no hover); moving it further than this first is a pan, and hides it
const LONG_PRESS_MS = 450;
const PRESS_MOVE_PX = 10;

const codeFrom = (target) => target?.closest?.('[data-code]')?.getAttribute('data-code') || null;

// my_planet's filters: a hidden group fades back rather than vanishing, so the
// world keeps its shape and every country stays clickable.
const FADE_BEEN = '[&_[data-been=true]]:opacity-15';
const FADE_NOT_BEEN = '[&_[data-been=false]]:opacity-15';

// Every country and special place, with one set of listeners for all of them (event
// delegation), so a hover or click never re-renders the 614 paths. With Antarctica
// hidden (`showAntarctica` off), it and the poles beside it aren't drawn. On a map that
// splits the UK (`splitUk`), its four nations are drawn instead of it.
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
  splitUk = false,
}) {
  const hoveredRef = useRef(null);
  // Set by a long press (below), so the click it ends with opens nothing
  const longPressedRef = useRef(false);
  const layers = splitUk ? LAYERS.splitUk : LAYERS.whole;
  const layer = showAntarctica ? layers.withAntarctica : layers.withoutAntarctica;

  // With pan and zoom on, the viewport's afterTap skips drags and double-taps (which zoom)
  const handleClick = useCallback(
    (e) => {
      // The click a long press ends with (some browsers send one) opens nothing
      if (longPressedRef.current) {
        longPressedRef.current = false;
        return;
      }
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

  // Touch: a long press shows the country's postcard (the hover card) above the finger
  // while it's held; lifting the finger or moving it (a pan) hides it, a second finger (a
  // pinch) cancels it, and the press never opens the country as a tap would. The finger is
  // followed on the window, as the map takes it over once it pans.
  const pressRef = useRef(null); // { pointerId, start, timer, shown, stop }
  const endPress = useCallback(() => {
    const press = pressRef.current;
    if (!press) return;
    pressRef.current = null;
    clearTimeout(press.timer);
    press.stop();
    if (press.shown) onHover?.(null);
  }, [onHover]);

  const handlePointerDown = useCallback(
    (e) => {
      if (pressRef.current) endPress(); // a second finger: a pinch
      if (e.pointerType !== 'touch') return;
      const code = codeFrom(e.target);
      if (!code) return;
      longPressedRef.current = false;
      const start = { x: e.clientX, y: e.clientY };
      const onMove = (ev) => {
        if (ev.pointerId === e.pointerId && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > PRESS_MOVE_PX) endPress();
      };
      const onEnd = (ev) => {
        if (ev.pointerId === e.pointerId) endPress();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
      const press = {
        pointerId: e.pointerId,
        start,
        shown: false,
        stop: () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onEnd);
          window.removeEventListener('pointercancel', onEnd);
        },
      };
      press.timer = setTimeout(() => {
        if (pressRef.current !== press) return;
        press.shown = true;
        longPressedRef.current = true;
        setHoverPoint(start);
        onHover?.(code);
      }, LONG_PRESS_MS);
      pressRef.current = press;
    },
    [onHover, endPress],
  );
  useEffect(() => endPress, [endPress]);

  // The long press's own menu (text selection, "copy") never shows on the map
  const handleContextMenu = useCallback((e) => {
    if (pressRef.current || longPressedRef.current) e.preventDefault();
  }, []);

  return (
    <g
      className={`stroke-[0.6] ${showVisited ? '' : FADE_BEEN} ${showUnvisited ? '' : FADE_NOT_BEEN}`}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {layer.shaped.map((country) => (
        <CountryShape
          key={country.code}
          code={country.code}
          paths={shapesOf(country.code)}
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
