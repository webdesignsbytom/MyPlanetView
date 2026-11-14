import React from 'react';
// Utils
import { BADGE_IDS } from '@/utils/map/badges';

// The visited badge: a 1950s travel sticker, a gold sunburst round a red disc with a
// cream star (a blue disc for "lived there"). Drawn once as <symbol>s inside the map's
// <svg> and placed per country with <use>; StarBadgeIcon draws the same art in HTML.

const burst = (points, outer, inner) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    return `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');

const SUNBURST = burst(12, 10, 8.4);
const STAR = burst(5, 4.6, 1.9);
const VIEW_BOX = '-10.5 -10.5 21 21';

function BadgeArt({ lived }) {
  return (
    <>
      <polygon points={SUNBURST} strokeWidth='0.8' strokeLinejoin='round' className='fill-poster-gold-light stroke-poster-ink' />
      <circle r='6.6' strokeWidth='0.6' className={`stroke-poster-ink ${lived ? 'fill-colour7' : 'fill-poster-red'}`} />
      <polygon points={STAR} strokeWidth='0.5' strokeLinejoin='round' className='fill-poster-cream stroke-poster-ink' />
    </>
  );
}

// Rendered once inside the map's <svg>
export function StarBadgeSymbols() {
  return (
    <defs>
      <symbol id={BADGE_IDS.VISITED} viewBox={VIEW_BOX}>
        <BadgeArt lived={false} />
      </symbol>
      <symbol id={BADGE_IDS.LIVED} viewBox={VIEW_BOX}>
        <BadgeArt lived />
      </symbol>
    </defs>
  );
}

// The same badge in HTML, for the map key
export function StarBadgeIcon({ lived = false, className = 'h-5 w-5' }) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden='true' className={className}>
      <BadgeArt lived={lived} />
    </svg>
  );
}
