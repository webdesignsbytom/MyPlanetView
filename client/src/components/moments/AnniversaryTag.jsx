import React, { useEffect, useState } from 'react';
// Api
import { getMomentPage } from '@/api/travelApi';
// Components
import LuggageTag from '@/components/map/LuggageTag';
import CloseStamp from '@/components/common/CloseStamp';
import MomentStamp from './MomentStamp';
// Utils
import { countryName } from '@/utils/map/countries';
import { localDay, yearsAgoToday, yearsSince } from '@/utils/moments/anniversaries';

const CLOSED_KEY = 'mpv:anniversaryTagClosed';

// A moment's day come round (21 Nov 2026, the user's wish: "anniversaries as moments", with a
// reminder when the date comes round): on a map someone is on (not a share link), on the
// viewer's own today, a luggage tag says "10 years ago today: Our wedding", the newest first,
// and opens the moment's country, whose ticket lists it. Closed, it stays away for the day
// (sessionStorage keeps the day it was closed). The date is read in an effect.
function AnniversaryTag({ mapId, onOpenCountry }) {
  const [found, setFound] = useState(null); // { today, moments }

  useEffect(() => {
    const today = localDay();
    try {
      if (sessionStorage.getItem(CLOSED_KEY) === `${mapId}:${today}`) return undefined;
    } catch {
      // Storage blocked: the tag can show
    }
    let alive = true;
    getMomentPage({ mapId, anniversary: today })
      .then(({ moments }) => alive && moments.length && setFound({ today, moments }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mapId]);

  if (!found) return null;
  const [moment, ...more] = found.moments;
  const when = yearsAgoToday(yearsSince(moment.happenedOn, found.today));
  const close = () => {
    try {
      sessionStorage.setItem(CLOSED_KEY, `${mapId}:${found.today}`);
    } catch {
      // Storage blocked: it closes for now
    }
    setFound(null);
  };
  return (
    <LuggageTag as='section' aria-label='On this day' className='max-w-[min(22rem,calc(100vw-1.5rem))] text-sm' data-anniversary-tag>
      <span className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2'>
        <MomentStamp kind={moment.kind} className='h-8 w-8 text-sm' />
        <span className='grid gap-1'>
          <span>
            <span className='font-semibold'>{when}:</span> {moment.title}
            {more.length ? <span className='text-xs'> (and {more.length} more)</span> : null}
          </span>
          <button
            type='button'
            onClick={() => onOpenCountry(moment.countryCode)}
            className='justify-self-start text-xs font-semibold text-poster-red-deep underline underline-offset-2'
          >
            Open {countryName(moment.countryCode)}
          </button>
        </span>
        <CloseStamp small onClick={close} label='Close: on this day' />
      </span>
    </LuggageTag>
  );
}

export default AnniversaryTag;
