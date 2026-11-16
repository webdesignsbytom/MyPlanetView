import React from 'react';
// Constants
import { countryPagePath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import AppLink from '@/components/common/AppLink';

/**
 * The month's second list, in short: the countries also good then (`kind: 'good'`, with
 * the season's line), or the regions at their best where the rest of the country isn't
 * (`kind: 'regions'`, with the region's line). Each links to its guide.
 */
function MonthMoreList({ title, titleId, picks, kind }) {
  return (
    <PaperCard title={title} titleId={titleId}>
      <ul className='grid gap-x-8 gap-y-4 md:grid-cols-2'>
        {picks.map((pick) => (
          <li key={kind === 'regions' ? `${pick.code}-${pick.region}` : pick.code} className='grid content-start gap-1'>
            <p className='grid grid-flow-col items-center justify-start gap-2'>
              <AppLink
                to={countryPagePath(pick.slug)}
                label={kind === 'regions' ? `${pick.region}, ${pick.name}` : pick.name}
                className='font-semibold text-colour6 underline underline-offset-4 hover:brightness-75'
              />
              {pick.status === 'checked' ? null : (
                <span className='tone-warn rounded-sm border px-1.5 text-2xs font-semibold uppercase tracking-wide'>Draft</span>
              )}
            </p>
            <p className='text-sm leading-relaxed'>{kind === 'regions' ? pick.text : pick.season}</p>
          </li>
        ))}
      </ul>
    </PaperCard>
  );
}

export default MonthMoreList;
