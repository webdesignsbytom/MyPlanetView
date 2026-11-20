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
  // Kept inside the stage (scrolling if it must, as the end card does), and smaller on a phone
  // held sideways, where the stage is about 190px tall: the stamp went under the header and
  // the place and story under the controls (19 Nov 2026, the audit)
  return (
    <article
      className='grid max-h-full w-full max-w-2xl justify-items-center gap-3 overflow-y-auto px-2 text-center sideways:gap-1'
      aria-label={`Moment: ${moment.title}`}
    >
      <MomentStamp kind={moment.kind} className='h-16 w-16 text-2xl sideways:h-10 sideways:w-10 sideways:text-lg' />
      <p className='font-travel text-sm uppercase tracking-xl text-poster-brown sideways:text-xs'>
        {[MOMENT_KIND_LABELS[moment.kind], formatMomentDate(moment)].filter(Boolean).join(' · ')}
      </p>
      <p className='-rotate-1 font-travel text-4xl uppercase leading-tight text-poster-red text-stroke-poster sm:text-5xl sideways:text-2xl'>
        {moment.title}
      </p>
      {where ? <p className='text-base font-medium sideways:text-sm'>{where}</p> : null}
      {moment.text ? <p className='max-w-prose text-base leading-relaxed sideways:text-sm sideways:leading-snug'>{moment.text}</p> : null}
    </article>
  );
}

export default SlideMomentCard;
