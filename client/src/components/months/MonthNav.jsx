import React from 'react';
// Constants
import { monthPagePath } from '@/utils/constants/routes';
// Utils
import { MONTH_LABELS } from '@/utils/months/monthContent';
// Components
import PaperCard from '@/components/common/PaperCard';
import AppLink from '@/components/common/AppLink';

// The other months this build has (`months`: [{ month, slug }]), in calendar order, the
// current one named but not linked: the section has no index page, so they link each other
function MonthNav({ months, current }) {
  return (
    <PaperCard title='Other months' titleId='month-nav-heading'>
      <ul className='grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6' aria-label='Where to go, month by month'>
        {months.map(({ month, slug }) => (
          <li key={slug}>
            {month === current ? (
              <span aria-current='page' className='block border-2 border-poster-red px-2 py-1.5 text-center font-travel uppercase tracking-wide text-poster-red'>
                {MONTH_LABELS[month - 1]}
              </span>
            ) : (
              <AppLink
                to={monthPagePath(slug)}
                label={MONTH_LABELS[month - 1]}
                className='block border-2 border-dashed border-poster-brown/60 px-2 py-1.5 text-center font-travel uppercase tracking-wide text-colour6 hover:bg-paper-cream'
              />
            )}
          </li>
        ))}
      </ul>
    </PaperCard>
  );
}

export default MonthNav;
