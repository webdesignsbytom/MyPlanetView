import React, { memo } from 'react';
// Utils
import { badgeRadius } from '@/utils/map/badges';
import { projectToMap } from '@/utils/map/projection';
import { isAntarctic } from '@/utils/map/specialPlaces';

// A map pin, its tip at (0, 0): a red drop with a cream head, a little smaller than a badge
const PIN_PATH = 'M0 0C-0.35-0.7-1-1.25-1-2A1 1 0 0 1 1-2C1-1.25 0.35-0.7 0 0Z';

/** The same pin in HTML, for the map key. */
export function MomentSpotIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox='-1.4 -3.3 2.8 3.6' aria-hidden='true' className={className}>
      <path d={PIN_PATH} strokeWidth={0.18} className='fill-poster-red stroke-poster-ink' />
      <circle cy={-2} r={0.42} className='fill-poster-cream' />
    </svg>
  );
}

/**
 * The moments pinned to a spot (`spots`, the map's momentSpots: the server sends a viewer
 * only the shared ones), each a red map pin with its tip on the spot, sized by zoom like
 * the badges and redrawn only when the zoom or the pins change. A pin's title is its
 * moment's; pressing one opens its country (`onSelectCountry`, through the viewport's
 * `afterTap`, as the landmark pins). With Antarctica hidden, its pins go too.
 */
function MomentSpotPins({ spots, zoom, showAntarctica = true, onSelectCountry, afterTap }) {
  const r = badgeRadius(zoom) * 0.75;
  return (
    <g
      data-moment-spots={spots.length}
      onClick={(e) => {
        const code = e.target.closest?.('[data-spot-country]')?.getAttribute('data-spot-country');
        if (!code || !onSelectCountry) return;
        e.stopPropagation();
        const select = () => onSelectCountry(code);
        if (afterTap) afterTap(select);
        else select();
      }}
    >
      {spots.map((spot) => {
        if (!showAntarctica && isAntarctic(spot.countryCode)) return null;
        const at = projectToMap(spot.latitude, spot.longitude);
        if (!at) return null;
        return (
          <g
            key={spot.id}
            data-moment-spot={spot.id}
            data-spot-country={spot.countryCode}
            transform={`translate(${at.x} ${at.y}) scale(${r})`}
            className={onSelectCountry ? 'cursor-pointer' : undefined}
          >
            <title>{spot.title}</title>
            <path d={PIN_PATH} strokeWidth={1.5} className='fill-poster-red stroke-poster-ink' />
            <circle cy={-2} r={0.42} className='fill-poster-cream' />
          </g>
        );
      })}
    </g>
  );
}

export default memo(MomentSpotPins);
