import React, { memo, useMemo } from 'react';
// Utils
import { TWIST_DASH_PX, TWIST_STRAND_PX, drawnStrings, pinOf, stringKindOf, stringPins, twistStrands } from '@/utils/map/mapStrings';

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

// Each kind's look, all in its tokens (utils/map/mapDesign.js stringVars), so a map design's
// change shows at once: the thread (as wide as the twine when there's one), its opacity on each
// string as a whole (so a twine's two colours never show through each other), and the second
// colour's strands, hidden unless the design twists one in. The visited strings' tokens are
// `--map-string…`, the planned ones' `--map-plan-string…` (25 Nov 2026, the user's wish).
const LOOKS = {
  VISITED: {
    thread: 'stroke-map-string [stroke-width:var(--map-string-width,1.8px)]',
    seeThrough: '[opacity:var(--map-string-alpha,1)]',
    strand: 'stroke-map-string-2 [display:var(--map-string-twist,none)]',
    head: 'stroke-map-string',
  },
  PLANNED: {
    thread: 'stroke-map-plan-string [stroke-width:var(--map-plan-string-width,1.8px)]',
    seeThrough: '[opacity:var(--map-plan-string-alpha,1)]',
    strand: 'stroke-map-plan-string-2 [display:var(--map-plan-string-twist,none)]',
    head: 'stroke-map-plan-string',
  },
};
const TWIST_DASHES = `${TWIST_DASH_PX} ${TWIST_DASH_PX}`;
// The planned strings under the visited ones, and their pins too
const DRAW_ORDER = ['PLANNED', 'VISITED'];

/**
 * The strings tied between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): thread
 * from pin to pin, hanging a little as thread does, with a pin head at each end, like a map on
 * a corkboard: the places been to in red, the places planned in blue (25 Nov 2026, the user's
 * wish; `stringKindOf`), each kind in its map design's colours. Drawn over the countries and
 * badges; presses go through to the map, except in string mode (`onRemove`), where a press on a
 * string of the kind being tied (`removeKind`) takes it off. `startCode`: the place chosen first
 * in string mode, marked in its kind's colour (`startKind`) until the second is chosen.
 * A map design can twist a second colour in, as baker's twine (25 Nov 2026, the user's wish):
 * its strands (twistStrands) sit a few pixels apart at any `zoom` (WorldMap's, in steps).
 */
function MapStrings({ strings, zoom = 1, showAntarctica = true, startCode = null, startKind = 'VISITED', onRemove = null, removeKind = 'VISITED', afterTap }) {
  const drawn = useMemo(() => drawnStrings(strings, { showAntarctica }), [strings, showAntarctica]);
  const kinds = useMemo(
    () =>
      DRAW_ORDER.map((kind) => {
        const ofKind = drawn.filter((string) => stringKindOf(string) === kind);
        return { kind, strings: ofKind, pins: stringPins(ofKind) };
      }).filter((group) => group.strings.length),
    [drawn],
  );
  const strands = useMemo(() => new Map(drawn.map((string) => [string.id, twistStrands(string.across, zoom)])), [drawn, zoom]);
  const start = startCode ? pinOf(startCode) : null;
  if (!drawn.length && !start) return null;

  const remove = (string) => (afterTap ? afterTap(() => onRemove(string)) : onRemove(string));
  return (
    <g data-map-strings='' className='pointer-events-none'>
      {kinds.map(({ kind, strings: ofKind }) =>
        ofKind.map((string) => (
          <g key={string.id} data-string={`${string.from}-${string.to}`} data-string-kind={kind} className={LOOKS[kind].seeThrough}>
            <path d={string.d} fill='none' strokeWidth={THREAD_PX} strokeLinecap='round' className={LOOKS[kind].thread} />
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
                className={LOOKS[kind].strand}
              />
            ))}
            {onRemove && kind === removeKind ? (
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
        )),
      )}
      {kinds.map(({ kind, pins }) => (
        <g key={kind} data-string-pins={kind} className={LOOKS[kind].seeThrough}>
          <path d={pins.map(dot).join('')} strokeWidth={RIM_PX} strokeLinecap='round' className='stroke-map-edge' />
          <path d={pins.map(dot).join('')} strokeWidth={HEAD_PX} strokeLinecap='round' className={LOOKS[kind].head} />
        </g>
      ))}
      {start ? (
        <path
          d={dot(start)}
          strokeWidth={START_PX}
          strokeLinecap='round'
          data-string-start={startCode}
          className={`${LOOKS[startKind === 'PLANNED' ? 'PLANNED' : 'VISITED'].head} opacity-70`}
        />
      ) : null}
    </g>
  );
}

export default memo(MapStrings);
