import React, { memo, useMemo } from 'react';
// Utils
import { TWIST_DASH_PX, TWIST_STRAND_PX, drawnStrings, pinOf, stringPins, twistStrands } from '@/utils/map/mapStrings';

// Sizes on screen (every path on the world map has a non-scaling stroke, so these are pixels
// at any zoom): the thread, a pin's head and its rim, the wide invisible line a press finds
// The thread 1.8px (2 until 25 Nov 2026, the user's wish: 10% thinner)
const THREAD_PX = 1.8;
const HEAD_PX = 7;
const RIM_PX = 10;
const PRESS_PX = 16;
const START_PX = 16;

// A pin head as a zero-length round-capped path: its size never changes with zoom
const dot = ({ x, y }) => `M${x} ${y}h0`;

// A map design's twine (utils/map/mapDesign.js stringVars) is all in its tokens, so ticking
// it in Settings shows at once: the string as wide as the twine, its opacity on each string
// as a whole (so its two colours never show through each other), and the second colour's
// strands, hidden unless the design twists one in
const THREAD = 'stroke-map-string [stroke-width:var(--map-string-width,1.8px)]';
const SEE_THROUGH = '[opacity:var(--map-string-alpha,1)]';
const STRAND = 'stroke-map-string-2 [display:var(--map-string-twist,none)]';
const TWIST_DASHES = `${TWIST_DASH_PX} ${TWIST_DASH_PX}`;

/**
 * The strings tied between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red
 * thread from pin to pin, hanging a little as thread does, with a pin head at each end, like
 * a map on a corkboard. Drawn over the countries and badges; presses go through to the map,
 * except in string mode (`onRemove`), where a press on a string takes it off. `startCode`: the
 * place chosen first in string mode, marked until the second is chosen.
 * A map design can twist a second colour in, as baker's twine (25 Nov 2026, the user's wish):
 * its strands (twistStrands) sit a few pixels apart at any `zoom` (WorldMap's, in steps).
 */
function MapStrings({ strings, zoom = 1, showAntarctica = true, startCode = null, onRemove = null, afterTap }) {
  const drawn = useMemo(() => drawnStrings(strings, { showAntarctica }), [strings, showAntarctica]);
  const pins = useMemo(() => stringPins(drawn), [drawn]);
  const strands = useMemo(() => new Map(drawn.map((string) => [string.id, twistStrands(string.across, zoom)])), [drawn, zoom]);
  const start = startCode ? pinOf(startCode) : null;
  if (!drawn.length && !start) return null;

  const remove = (string) => (afterTap ? afterTap(() => onRemove(string)) : onRemove(string));
  return (
    <g data-map-strings='' className='pointer-events-none'>
      {drawn.map((string) => (
        <g key={string.id} data-string={`${string.from}-${string.to}`} className={SEE_THROUGH}>
          <path d={string.d} fill='none' strokeWidth={THREAD_PX} strokeLinecap='round' className={THREAD} />
          {strands.get(string.id).map((strand, index) => (
            <path
              key={index}
              d={string.d}
              transform={`translate(${strand.dx} ${strand.dy})`}
              fill='none'
              strokeWidth={TWIST_STRAND_PX}
              strokeDasharray={TWIST_DASHES}
              strokeDashoffset={strand.dashOffset}
              data-string-strand=''
              className={STRAND}
            />
          ))}
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
        <g data-string-pins='' className={SEE_THROUGH}>
          <path d={pins.map(dot).join('')} strokeWidth={RIM_PX} strokeLinecap='round' className='stroke-map-edge' />
          <path d={pins.map(dot).join('')} strokeWidth={HEAD_PX} strokeLinecap='round' className='stroke-map-string' />
        </g>
      ) : null}
      {start ? <path d={dot(start)} strokeWidth={START_PX} strokeLinecap='round' data-string-start={startCode} className='stroke-map-string opacity-70' /> : null}
    </g>
  );
}

export default memo(MapStrings);
