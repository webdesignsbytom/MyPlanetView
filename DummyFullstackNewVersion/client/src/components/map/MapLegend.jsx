import React from 'react';
// Components
import { StarBadgeIcon } from './StarBadge';

// What the map's marks mean (shown on wide screens). Every country has its own colour;
// the badges and outlines show where you've been.
function MapLegend() {
  return (
    <ul
      aria-label='Map key'
      className='pointer-events-auto grid gap-1 rounded-lg border-2 border-map-edge bg-map-panel px-3 py-2 text-xs text-map-ink shadow-lift-sm'
    >
      <li className='grid grid-cols-reg items-center gap-2'>
        <StarBadgeIcon />
        Visited
      </li>
      <li className='grid grid-cols-reg items-center gap-2'>
        <StarBadgeIcon lived />
        Lived there
      </li>
      <li className='grid grid-cols-reg items-center gap-2'>
        <span aria-hidden='true' className='h-3 w-5 rounded-sm border-2 border-dashed border-map-wish bg-map-visit-3' />
        Want to go
      </li>
    </ul>
  );
}

export default MapLegend;
