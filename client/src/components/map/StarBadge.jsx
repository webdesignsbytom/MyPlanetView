import React from 'react';
// Utils
import { BADGE_IDS } from '@/utils/map/badges';
import { isSpecialPlace } from '@/utils/map/specialPlaces';

// The visited badge: a 1950s travel sticker, a gold sunburst round a red disc with a
// cream star (a blue disc for "lived there"). Special places (Antarctica and the poles)
// get a gold expedition stamp instead: a milled gold rim, a dashed ring and a flag
// planted on an ice peak (a blue flag for "lived there"). Drawn once as <symbol>s inside
// the map's <svg> and placed per place with <use>; the *Icon components draw the same
// art in HTML.

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

// The expedition stamp: a coin-like milled edge, so it reads apart from the sunburst
const MILLED = burst(28, 10, 9.3);
// A polygon, not a circle: the map draws circles' strokes at screen size, which would
// shrink the dashes to dots
const RING = burst(24, 6.7, 6.7);
const PEAK = '-5.6,4.2 -1,-2.4 0.9,0.2 2.4,-1.2 5.6,4.2';
const SNOW = '-2.6,-0.1 -1,-2.4 0.6,-0.2 -0.4,0.6 -1.3,-0.2';
const FLAG = '-1,-6.6 3.2,-5.6 -1,-4.6';

function ExpeditionArt({ lived }) {
  return (
    <>
      <polygon points={MILLED} strokeWidth='0.7' strokeLinejoin='round' className='fill-poster-gold-light stroke-poster-ink' />
      <circle r='7.6' strokeWidth='0.6' className='fill-poster-gold-dark stroke-poster-ink' />
      <polygon points={RING} strokeWidth='0.5' strokeDasharray='1.2 0.9' className='fill-none stroke-poster-cream' />
      <polygon points={PEAK} strokeWidth='0.5' strokeLinejoin='round' className='fill-poster-cream stroke-poster-ink' />
      <polygon points={SNOW} className='fill-poster-gold-light' />
      <line x1='-1' y1='-2.4' x2='-1' y2='-6.8' strokeWidth='0.6' strokeLinecap='round' className='stroke-poster-ink' />
      <polygon points={FLAG} strokeWidth='0.4' strokeLinejoin='round' className={`stroke-poster-ink ${lived ? 'fill-colour7' : 'fill-poster-red'}`} />
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
      <symbol id={BADGE_IDS.EXPEDITION_VISITED} viewBox={VIEW_BOX}>
        <ExpeditionArt lived={false} />
      </symbol>
      <symbol id={BADGE_IDS.EXPEDITION_LIVED} viewBox={VIEW_BOX}>
        <ExpeditionArt lived />
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

// The expedition stamp in HTML
export function ExpeditionStampIcon({ lived = false, className = 'h-5 w-5' }) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden='true' className={className}>
      <ExpeditionArt lived={lived} />
    </svg>
  );
}

// Whichever a place wears: the star sticker on a country, the stamp on a special place
export function PlaceBadgeIcon({ code, lived = false, className }) {
  return isSpecialPlace(code) ? (
    <ExpeditionStampIcon lived={lived} className={className} />
  ) : (
    <StarBadgeIcon lived={lived} className={className} />
  );
}
