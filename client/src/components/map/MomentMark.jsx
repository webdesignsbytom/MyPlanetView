import React from 'react';
// Utils
import { MOMENT_MARK_ID } from '@/utils/map/badges';

// The mark beside a country with moments: a little paper note pinned with a red pin,
// tilted, with three lines of ink, so it reads apart from the round visit badges.
// Drawn once as a <symbol> inside the map's <svg> (MomentMarks places it per country);
// MomentMarkIcon draws the same in HTML, for the map key.
const VIEW_BOX = '-8 -9 16 18';

function MomentMarkArt() {
  return (
    <g transform='rotate(8)'>
      <rect x='-5.6' y='-6.4' width='11.2' height='13.4' rx='0.8' strokeWidth='0.8' className='fill-poster-cream stroke-poster-ink' />
      <line x1='-3.4' y1='-1.6' x2='3.4' y2='-1.6' strokeWidth='0.9' strokeLinecap='round' className='stroke-poster-brown' />
      <line x1='-3.4' y1='1.2' x2='3.4' y2='1.2' strokeWidth='0.9' strokeLinecap='round' className='stroke-poster-brown' />
      <line x1='-3.4' y1='4' x2='1.4' y2='4' strokeWidth='0.9' strokeLinecap='round' className='stroke-poster-brown' />
      <circle cy='-6.2' r='2.1' strokeWidth='0.6' className='fill-poster-red stroke-poster-ink' />
    </g>
  );
}

export function MomentMarkSymbol() {
  return (
    <defs>
      <symbol id={MOMENT_MARK_ID} viewBox={VIEW_BOX}>
        <MomentMarkArt />
      </symbol>
    </defs>
  );
}

export function MomentMarkIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden='true' className={className}>
      <MomentMarkArt />
    </svg>
  );
}
