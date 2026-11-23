import React, { memo, useMemo } from 'react';
// Utils
import { drawnStrings, pinOf, stringPins } from '@/utils/map/mapStrings';

// Sizes on screen (every path on the world map has a non-scaling stroke, so these are pixels
// at any zoom): the thread, a pin's head and its rim, the wide invisible line a press finds
const THREAD_PX = 2;
const HEAD_PX = 7;
const RIM_PX = 10;
const PRESS_PX = 16;
const START_PX = 16;

// A pin head as a zero-length round-capped path: its size never changes with zoom
const dot = ({ x, y }) => `M${x} ${y}h0`;

/**
 * The strings tied between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red
 * thread from pin to pin, hanging a little as thread does, with a pin head at each end, like
 * a map on a corkboard. Drawn over the countries and badges; presses go through to the map,
 * except in string mode (`onRemove`), where a press on a string takes it off. `startCode`: the
 * place chosen first in string mode, marked until the second is chosen.
 */
function MapStrings({ strings, showAntarctica = true, startCode = null, onRemove = null, afterTap }) {
  const drawn = useMemo(() => drawnStrings(strings, { showAntarctica }), [strings, showAntarctica]);
  const pins = useMemo(() => stringPins(drawn), [drawn]);
  const start = startCode ? pinOf(startCode) : null;
  if (!drawn.length && !start) return null;

  const remove = (string) => (afterTap ? afterTap(() => onRemove(string)) : onRemove(string));
  return (
    <g data-map-strings='' className='pointer-events-none'>
      {drawn.map((string) => (
        <g key={string.id} data-string={`${string.from}-${string.to}`}>
          <path d={string.d} fill='none' strokeWidth={THREAD_PX} strokeLinecap='round' className='stroke-map-string' />
          {onRemove ? (
            <path
              d={string.d}
              fill='none'
              stroke='transparent'
              strokeWidth={PRESS_PX}
              data-string-press=''
              className='pointer-events-auto cursor-pointer'
              onClick={(e) => {
                e.stopPropagation();
                remove(string);
              }}
            >
              <title>{`Take off the string from ${string.label}`}</title>
            </path>
          ) : null}
        </g>
      ))}
      {pins.length ? (
        <>
          <path d={pins.map(dot).join('')} strokeWidth={RIM_PX} strokeLinecap='round' className='stroke-map-edge' />
          <path d={pins.map(dot).join('')} strokeWidth={HEAD_PX} strokeLinecap='round' className='stroke-map-string' />
        </>
      ) : null}
      {start ? <path d={dot(start)} strokeWidth={START_PX} strokeLinecap='round' data-string-start={startCode} className='stroke-map-string opacity-70' /> : null}
    </g>
  );
}

export default memo(MapStrings);
