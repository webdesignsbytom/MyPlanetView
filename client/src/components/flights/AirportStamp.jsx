import React, { useId } from 'react';
// Utils
import { hashOf, stampLook } from '@/utils/passport/passportBook';
import { stampCity, stampDay } from '@/utils/flights/flightLog';

// The stamp's circle: 100 across, the edge at 47, the city on a curve above the middle (its
// letters standing out from 37), the first day flown on one below (hanging in from 43), the
// inner ring at 33 round a little plane and the airport's code
const CITY_ARC = 'M13 50 A37 37 0 0 1 87 50';
const DATE_ARC = 'M7 50 A43 43 0 0 0 93 50';
// The room along the city's curve, and the letters' width for their size (with their spacing)
const CITY_ROOM = 96;
const LETTER_WIDTH = 0.72;

// A scalloped edge, as some rubber stamps have: 28 bumps round the circle
const SCALLOPS = 28;
const SCALLOPED_EDGE = (() => {
  const at = (r, angle) => `${(50 + r * Math.cos(angle)).toFixed(2)} ${(50 + r * Math.sin(angle)).toFixed(2)}`;
  const step = (Math.PI * 2) / SCALLOPS;
  let d = `M${at(45.5, 0)}`;
  for (let i = 0; i < SCALLOPS; i++) d += ` Q${at(49.5, step * (i + 0.5))} ${at(45.5, step * (i + 1))}`;
  return `${d}Z`;
})();

// A small airliner, nose up, drawn in a box 20 across round (0, 0)
const PLANE = [
  'M0 -9.5C1.3 -9.5 1.7 -8 1.7 -6.5L1.7 5.5 0 9.5 -1.7 5.5 -1.7 -6.5C-1.7 -8 -1.3 -9.5 0 -9.5Z',
  'M1.6 -2.2 9.5 2.2 9.5 3.9 1.6 1.6ZM-1.6 -2.2 -9.5 2.2 -9.5 3.9 -1.6 1.6Z',
  'M1.2 5.2 4.6 7.6 4.6 8.8 0.9 7.8ZM-1.2 5.2 -4.6 7.6 -4.6 8.8 -0.9 7.8Z',
].join('');

// A five-pointed star of radius `r` at (x, y), between the city and the date
function starPoints(x, y, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 ? r * 0.45 : r;
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

/**
 * An airport collected in the flight log, as a rubber stamp (25 Nov 2026, the user's wish: "a bit
 * more style on the stamps"): a double ring, plain or scalloped, the city on a curve over a
 * little plane and the airport's code, and the day it was first flown to or from on a curve
 * below, with a star either side; tilted and inked as the passport's stamps are, by the
 * airport's code (stampLook), so each always looks the same. Decorative: the list item says
 * the same in words.
 */
function AirportStamp({ airport, firstFlownOn = '' }) {
  const id = useId();
  const { tilt, ink } = stampLook(`airport-${airport.code}`);
  const hash = hashOf(airport.code);
  const scalloped = hash % 3 === 0;
  const dashedRing = (hash >>> 3) % 2 === 1;
  const city = stampCity(airport.city);
  const citySize = Math.min(10, CITY_ROOM / Math.max(1, city.length * LETTER_WIDTH));
  const date = stampDay(firstFlownOn);
  // The plane's heading, by the code too: up and to the right, give or take
  const heading = 30 + ((hash >>> 5) % 4) * 10;

  return (
    <svg
      viewBox='0 0 100 100'
      aria-hidden='true'
      focusable='false'
      className={`block h-auto w-full overflow-visible ${ink}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      data-airport-stamp={scalloped ? 'scalloped' : 'round'}
    >
      <defs>
        <path id={`${id}-city`} d={CITY_ARC} />
        <path id={`${id}-date`} d={DATE_ARC} />
      </defs>
      <g fill='none' stroke='currentColor' className='opacity-90'>
        {scalloped ? <path d={SCALLOPED_EDGE} strokeWidth='2.5' strokeLinejoin='round' /> : <circle cx='50' cy='50' r='46.5' strokeWidth='3.5' />}
        <circle cx='50' cy='50' r='33' strokeWidth='1.2' strokeDasharray={dashedRing ? '3 2' : undefined} />
      </g>
      <g fill='currentColor' className='opacity-90'>
        <path d={PLANE} transform={`translate(50 33) rotate(${heading}) scale(0.62)`} />
        <polygon points={starPoints(8.5, 50, 2.6)} />
        <polygon points={starPoints(91.5, 50, 2.6)} />
        <text x='50' y='63' textAnchor='middle' fontSize='22' className='font-travel'>
          {airport.code}
        </text>
        <g className='font-main font-semibold' letterSpacing='0.08em'>
          <text fontSize={citySize}>
            <textPath href={`#${id}-city`} startOffset='50%' textAnchor='middle'>
              {city}
            </textPath>
          </text>
          {date ? (
            <text fontSize='6.5'>
              <textPath href={`#${id}-date`} startOffset='50%' textAnchor='middle'>
                {date}
              </textPath>
            </text>
          ) : null}
        </g>
      </g>
    </svg>
  );
}

export default AirportStamp;
