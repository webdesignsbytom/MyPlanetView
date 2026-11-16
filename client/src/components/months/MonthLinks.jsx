import React from 'react';
// Constants
import { monthPagePath } from '@/utils/constants/routes';
// Utils
import { MONTH_LABELS } from '@/utils/months/monthContent';
import { CHECKED_MONTH_PAGES } from '@/utils/months/monthPages';
// Components
import AppLink from '@/components/common/AppLink';

/**
 * Links to the published "Where to go in <month>" pages, as a line of month names: all of
 * them (the country index), or only `months` (a guide's best months, 1–12). Nothing when
 * none is published, so a page never links to a draft or a missing page.
 */
function MonthLinks({ months = null, lead }) {
  const pages = CHECKED_MONTH_PAGES.filter((page) => !months || months.includes(page.month)).sort((a, b) => a.month - b.month);
  if (!pages.length) return null;
  return (
    <nav aria-label='Where to go, month by month' className='grid gap-2'>
      <p className='text-sm leading-relaxed text-colour5'>{lead}</p>
      <ul className='grid grid-flow-row grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6'>
        {pages.map(({ month, slug }) => (
          <li key={slug}>
            <AppLink
              to={monthPagePath(slug)}
              label={MONTH_LABELS[month - 1]}
              className='block border-2 border-dashed border-poster-brown/60 px-2 py-1.5 text-center font-travel uppercase tracking-wide text-colour6 hover:bg-paper-cream'
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MonthLinks;
