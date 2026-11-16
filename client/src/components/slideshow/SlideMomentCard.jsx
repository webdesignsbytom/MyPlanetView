import React from 'react';
// Components
import MomentStamp from '@/components/moments/MomentStamp';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatMomentDate } from '@/utils/moments/momentDates';
import { MOMENT_KIND_LABELS } from '@/utils/moments/momentKinds';

/**
 * A moment between the photos of a show in date order (docs/FEATURE-PLAN.md, "Moments"):
 * its kind's stamp, the date, the title in the travel face, where it happened and its
 * story, on a paper card like a page from the map's diary.
 */
function SlideMomentCard({ moment }) {
  const where = [moment.landmark?.name || moment.placeName, countryName(moment.countryCode)].filter(Boolean).join(', ');
  return (
    <article className='grid w-full max-w-2xl justify-items-center gap-3 px-2 text-center' aria-label={`Moment: ${moment.title}`}>
      <MomentStamp kind={moment.kind} className='h-16 w-16 text-2xl' />
      <p className='font-travel text-sm uppercase tracking-xl text-poster-brown'>
        {[MOMENT_KIND_LABELS[moment.kind], formatMomentDate(moment)].filter(Boolean).join(' · ')}
      </p>
      <p className='-rotate-1 font-travel text-4xl uppercase leading-tight text-poster-red text-stroke-poster sm:text-5xl'>{moment.title}</p>
      {where ? <p className='text-base font-medium'>{where}</p> : null}
      {moment.text ? <p className='max-w-prose text-base leading-relaxed'>{moment.text}</p> : null}
    </article>
  );
}

export default SlideMomentCard;
