import React, { useEffect, useState } from 'react';
// Components
import LuggageTag from '@/components/map/LuggageTag';
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { isRecapSeason, loadYearRecap, recapHasAnything, recapYearFor } from '@/utils/recap/recap';

const CLOSED_KEY = 'mpv:recapTagClosed';

// In December and January, on a map someone is on (not a share link): a luggage tag offering
// the year's recap ("Your 2026 in travel is ready"), once the year has something on the map.
// Closed, it stays away for the visit (sessionStorage). The date is read in an effect.
function RecapTag({ mapId, onOpen }) {
  const [year, setYear] = useState(null);

  useEffect(() => {
    const now = new Date();
    if (!isRecapSeason(now)) return undefined;
    try {
      if (sessionStorage.getItem(CLOSED_KEY) === '1') return undefined;
    } catch {
      // Storage blocked: the tag can show
    }
    let alive = true;
    const wanted = recapYearFor(now);
    loadYearRecap(mapId, wanted)
      .then((recap) => alive && recapHasAnything(recap) && setYear(wanted))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mapId]);

  if (!year) return null;
  const close = () => {
    try {
      sessionStorage.setItem(CLOSED_KEY, '1');
    } catch {
      // Storage blocked: it closes for now
    }
    setYear(null);
  };
  return (
    <LuggageTag as='section' aria-label={`Your ${year} in travel`} className='max-w-[min(22rem,calc(100vw-1.5rem))] text-sm' data-recap-tag>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <span className='grid gap-1'>
          <span className='font-semibold'>Your {year} in travel is ready.</span>
          <button
            type='button'
            onClick={() => onOpen(year)}
            className='justify-self-start text-xs font-semibold text-poster-red-deep underline underline-offset-2'
          >
            See your year
          </button>
        </span>
        <CloseStamp small onClick={close} label={`Close: your ${year} in travel`} />
      </span>
    </LuggageTag>
  );
}

export default RecapTag;
