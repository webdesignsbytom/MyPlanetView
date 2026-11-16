import React from 'react';
// Components
import { ExpeditionStampIcon, StarBadgeIcon } from './StarBadge';
import { MomentMarkIcon } from './MomentMark';
import LuggageTag from './LuggageTag';

// What the map's marks mean (shown on wide screens), on a luggage tag. Every country has
// its own colour; the badges and outlines show where you've been, the gold stamp which
// special places (Antarctica and the poles) you've reached, and the pinned note where
// there are moments (while `showMoments`, the viewer's setting, is on).
function MapLegend({ showMoments = true }) {
  return (
    <LuggageTag className='text-xs'>
      <ul aria-label='Map key' className='grid gap-1'>
        <li className='grid grid-cols-reg items-center gap-2'>
          <StarBadgeIcon />
          Visited
        </li>
        <li className='grid grid-cols-reg items-center gap-2'>
          <StarBadgeIcon lived />
          Lived there
        </li>
        <li className='grid grid-cols-reg items-center gap-2'>
          <ExpeditionStampIcon />
          Special place
        </li>
        <li className='grid grid-cols-reg items-center gap-2'>
          <span aria-hidden='true' className='h-3 w-5 rounded-sm border-2 border-dashed border-map-wish bg-map-visit-3' />
          Want to go
        </li>
        {showMoments ? (
          <li className='grid grid-cols-reg items-center gap-2'>
            <MomentMarkIcon />
            Moments
          </li>
        ) : null}
      </ul>
    </LuggageTag>
  );
}

export default MapLegend;
