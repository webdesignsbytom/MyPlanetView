import React from 'react';

// The foil's bands, in map units (the world map and a country's own map are both 2000 wide):
// one gradient for the whole map, its edge, colour and shine reflected along a diagonal, so a few
// broad highlights run across it like light on a sheet of metal
const FOIL = { x1: 0, y1: 0, x2: 520, y2: 300 };
const STOPS = [
  ['0%', 'edge'],
  ['30%', 'colour'],
  ['50%', 'shine'],
  ['70%', 'colour'],
  ['100%', 'edge'],
];

/**
 * A map design's metallic finish for the places been to (25 Nov 2026, the user's wish: "shiny
 * colours like gold and silver"): its foil gradient, which the design's style sheet fills them with
 * (utils/map/mapDesign.js visitedRules, `url(#<gradientId>)`). In a hidden svg of no size, outside
 * the maps, so it's there whichever map is drawn; `userSpaceOnUse` puts its bands in the map's own
 * units. Its colours are the metal's medal tokens, so Black and white has its greys.
 */
function VisitedFinishDefs({ finish }) {
  if (!finish) return null;
  return (
    <svg aria-hidden='true' focusable='false' width='0' height='0' className='pointer-events-none absolute' data-visited-finish-defs={finish.id}>
      <defs>
        <linearGradient id={finish.gradientId} gradientUnits='userSpaceOnUse' spreadMethod='reflect' {...FOIL}>
          {STOPS.map(([offset, token]) => (
            <stop key={offset} offset={offset} style={{ stopColor: `var(${finish.tokens[token]})` }} />
          ))}
        </linearGradient>
      </defs>
    </svg>
  );
}

export default VisitedFinishDefs;
