import React from 'react';
// Constants
import { countryPagePath } from '@/utils/constants/routes';
// Data
import { postersFor } from '@/utils/map/posterData';
// Components
import PaperCard from '@/components/common/PaperCard';
import AppLink from '@/components/common/AppLink';
import PosterImage from '@/components/map/PosterImage';

/**
 * The countries at their best in the month: each its poster, its name (a link to its
 * guide), what the season is like then, and the festivals that month, all from the guide.
 * A draft guide (development only) is tagged.
 */
function MonthBestList({ label, picks }) {
  return (
    <PaperCard title={`At their best in ${label}`} titleId='month-best-heading'>
      <ul className='grid gap-6 md:grid-cols-2'>
        {picks.map((pick) => {
          const [poster] = postersFor(pick.code);
          return (
            <li key={pick.code} className='grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]'>
              {poster ? (
                <PosterImage poster={poster} alt='' className='ticket-edge overflow-hidden rounded-md' />
              ) : (
                <span aria-hidden='true' className='ticket-edge paper-aged block aspect-[9/16] rounded-md' />
              )}
              <div className='grid content-start gap-1.5'>
                <p className='grid grid-flow-col items-center justify-start gap-2'>
                  <AppLink
                    to={countryPagePath(pick.slug)}
                    label={pick.name}
                    className='font-travel text-2xl uppercase tracking-wide text-colour6 underline decoration-2 underline-offset-4 hover:brightness-75'
                  />
                  {pick.status === 'checked' ? null : (
                    <span className='tone-warn rounded-sm border px-1.5 text-2xs font-semibold uppercase tracking-wide'>Draft</span>
                  )}
                </p>
                {pick.season ? <p className='text-sm leading-relaxed'>{pick.season}</p> : null}
                {pick.festivals.length ? (
                  <ul className='grid gap-1 text-sm' aria-label={`Festivals in ${pick.name} in ${label}`}>
                    {pick.festivals.map((festival) => (
                      <li key={festival.name}>
                        <span className='font-semibold'>{festival.name}</span>
                        {festival.place ? `, ${festival.place}` : ''}: {festival.when}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </PaperCard>
  );
}

export default MonthBestList;
