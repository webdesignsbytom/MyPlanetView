import React, { memo } from 'react';
// Utils
import { poleMarkerRadius } from '@/utils/map/badges';
import { isMagneticPole } from '@/utils/map/specialPlaces';
import { countsAsVisited } from '@/utils/map/visitStatus';

// The four poles are points, not shapes: each is a small compass rose at its pin, on the
// map's top edge (the North Pole line) or bottom edge (the South Pole line), or for the
// magnetic poles where NOAA's model puts them this year. Gold points; a red heart for a
// geographic pole, a blue one for a magnetic pole, whose rose is turned off true north.
// Clickable like the micro-states' dots (CountryLayer's listeners find data-code).

const POLE_SYMBOL = { GEOGRAPHIC: 'mpv-pole-geographic', MAGNETIC: 'mpv-pole-magnetic' };
const VIEW_BOX = '-10 -10 20 20';

const at = (radius, angle) => `${(radius * Math.sin(angle)).toFixed(2)},${(-radius * Math.cos(angle)).toFixed(2)}`;

// One point of the rose as two halves (light and shaded), from the centre to `length`
function roseHalves(length, shoulder, angle) {
  const tip = at(length, angle);
  return [`0,0 ${tip} ${at(shoulder, angle + Math.PI / 4)}`, `0,0 ${tip} ${at(shoulder, angle - Math.PI / 4)}`];
}

const CARDINAL = [0, 1, 2, 3].map((i) => roseHalves(9.5, 2.6, (i * Math.PI) / 2));
const DIAGONAL = [0, 1, 2, 3].map((i) => roseHalves(5.6, 1.5, Math.PI / 4 + (i * Math.PI) / 2));

function RoseArt({ magnetic }) {
  return (
    <g transform={magnetic ? 'rotate(18)' : undefined} strokeWidth='0.5' strokeLinejoin='round'>
      {DIAGONAL.map(([light, shade], i) => (
        <g key={i} className='stroke-poster-ink'>
          <polygon points={light} className='fill-poster-cream' />
          <polygon points={shade} className='fill-poster-gold-dark' />
        </g>
      ))}
      {CARDINAL.map(([light, shade], i) => (
        <g key={i} className='stroke-poster-ink'>
          <polygon points={light} className='fill-poster-gold-light' />
          <polygon points={shade} className='fill-poster-gold-dark' />
        </g>
      ))}
      <circle r='2' strokeWidth='0.5' className={`stroke-poster-ink ${magnetic ? 'fill-colour7' : 'fill-poster-red'}`} />
    </g>
  );
}

// Rendered once inside the map's <svg>, with the badge symbols
export function PoleMarkerSymbols() {
  return (
    <defs>
      <symbol id={POLE_SYMBOL.GEOGRAPHIC} viewBox={VIEW_BOX}>
        <RoseArt magnetic={false} />
      </symbol>
      <symbol id={POLE_SYMBOL.MAGNETIC} viewBox={VIEW_BOX}>
        <RoseArt magnetic />
      </symbol>
    </defs>
  );
}

// One pole. The hover green fills a disc behind the rose (which is also what takes the
// pointer, so the gaps between the points count); "want to go" is a dashed ring, as a
// country's dashed outline; the selected pole gets an ink ring. Once visited, the gold
// expedition stamp (VisitBadges) takes the rose's place; the disc still takes the click.
function PoleMarker({ code, x, y, zoom, status, selected }) {
  const r = poleMarkerRadius(zoom);
  const visited = countsAsVisited(status);
  const symbol = isMagneticPole(code) ? POLE_SYMBOL.MAGNETIC : POLE_SYMBOL.GEOGRAPHIC;
  return (
    <g data-code={code} data-been={visited ? 'true' : 'false'} className='group cursor-pointer'>
      <circle cx={x} cy={y} r={r * 0.9} className='fill-map-hover opacity-0 group-hover:opacity-70' />
      {status === 'WANT_TO_GO' ? (
        <circle cx={x} cy={y} r={r * 1.05} className='fill-none stroke-map-wish stroke-[1.4] [stroke-dasharray:3_2]' />
      ) : null}
      {selected ? <circle cx={x} cy={y} r={r * 1.05} className='fill-none stroke-map-ink stroke-[1.8]' /> : null}
      {visited ? null : <use href={`#${symbol}`} x={x - r} y={y - r} width={r * 2} height={r * 2} />}
    </g>
  );
}

export default memo(PoleMarker);
