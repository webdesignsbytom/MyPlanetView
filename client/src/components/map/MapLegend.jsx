import React from 'react';
// Components
import { ExpeditionStampIcon, StarBadgeIcon } from './StarBadge';
import { MomentMarkIcon } from './MomentMark';
import { MomentSpotIcon } from './MomentSpotPins';
import LuggageTag from './LuggageTag';
// Utils
import { PLANNED_OUTLINE } from '@/utils/map/visitStatus';

// What the map's marks mean (shown on wide screens), on a luggage tag. Every country has
// its own colour; the badges and outlines show where you've been, the gold stamp which
// special places (Antarctica and the poles) you've reached, the pinned note where
// there are moments (while `showMoments`, the viewer's setting, is on), the gold pin of
// a landmark stamped in the passport (once the map has one; pins show zoomed in), and a
// planned trip's dash-dot outline (once one goes somewhere not yet visited: `showPlanned`).
function MapLegend({ showMoments = true, showSpots = false, showStamps = false, showPlanned = false }) {
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
        {showPlanned ? (
          <li className='grid grid-cols-reg items-center gap-2'>
            <svg aria-hidden='true' viewBox='0 0 20 12' className='h-3 w-5'>
              <rect x='1' y='1' width='18' height='10' rx='1.5' className={`fill-map-visit-3 ${PLANNED_OUTLINE}`} />
            </svg>
            Planned trip
          </li>
        ) : null}
        {showMoments ? (
          <li className='grid grid-cols-reg items-center gap-2'>
            <MomentMarkIcon />
            Moments
          </li>
        ) : null}
        {showMoments && showSpots ? (
          <li className='grid grid-cols-reg items-center gap-2'>
            <MomentSpotIcon />
            A moment’s spot
          </li>
        ) : null}
        {showStamps ? (
          <li className='grid grid-cols-reg items-center gap-2'>
            <span aria-hidden='true' className='mx-1 h-3 w-3 rounded-full border-[3px] border-map-land bg-map-stamp outline outline-1 outline-map-edge' />
            Stamped landmark
          </li>
        ) : null}
      </ul>
    </LuggageTag>
  );
}

export default MapLegend;
