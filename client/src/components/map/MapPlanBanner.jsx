import React from 'react';
// Components
import LuggageTag from './LuggageTag';
// Utils
import { formatDay } from '@/utils/functions/dates';

// The map page's word on the map's slot (docs/API.md, "Map limits"), on a luggage tag
// under the title, like the verify-email banner:
// - `locked`: an extra map that isn't paid for takes no new photos. The owner can pay for
//   it (`onPay`, the extra-map dialog); an editor is told who can;
// - `graceUntil` (the owner only, while it's ahead): a map handed over with no free slot
//   stays fully usable until then, and needs paying for after (a gentler note, no button).
// Nothing shows otherwise. `inGrace` is worked out by the page (it reads the clock).
function MapPlanBanner({ locked, inGrace, graceUntil, isOwner, onPay }) {
  if (locked) {
    return (
      <LuggageTag as='section' aria-label='This map isn’t paid for' className='max-w-[min(24rem,calc(100vw-1.5rem))] text-sm'>
        <span className='grid gap-1'>
          <span className='font-semibold'>This map isn’t paid for, so it can’t take new photos.</span>
          <span className='text-xs'>
            {isOwner
              ? 'Everything on it stays. Pay for it as an extra map, or make it your main map in its settings.'
              : 'Everything on it stays. Its owner can pay for it as an extra map.'}
          </span>
          {isOwner && onPay ? (
            <button
              type='button'
              onClick={onPay}
              className='justify-self-start text-xs font-semibold text-poster-red-deep underline underline-offset-2'
            >
              Pay for this map
            </button>
          ) : null}
        </span>
      </LuggageTag>
    );
  }

  if (inGrace && isOwner) {
    return (
      <LuggageTag as='section' aria-label='A map handed to you' className='max-w-[min(24rem,calc(100vw-1.5rem))] text-sm'>
        <span className='grid gap-1'>
          <span className='font-semibold'>This map was handed to you.</span>
          <span className='text-xs'>
            It’s yours to use in full until {formatDay(graceUntil)}. After that it needs paying for as an extra map, or
            making your main map, to keep taking photos. Your plan is on your account page.
          </span>
        </span>
      </LuggageTag>
    );
  }

  return null;
}

export default MapPlanBanner;
