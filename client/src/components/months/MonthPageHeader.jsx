import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
import { monthPagePath } from '@/utils/constants/routes';
// Utils
import { formatDay } from '@/utils/countries/countryContent';
import { COUNTRIES_SECTION } from '@/utils/countries/countryRoutes';
import { MONTH_LABELS } from '@/utils/months/monthContent';
// Components
import Breadcrumbs from '@/components/common/Breadcrumbs';
import RubberStamp from '@/components/common/RubberStamp';

/**
 * A month page's headline, as a country guide's: the trail back to the country index, the
 * page's one h1 (poster red, tilted), its summary, how many countries it lists and when it
 * was last checked, with a rubber stamp of the month.
 */
function MonthPageHeader({ page }) {
  const label = MONTH_LABELS[page.month - 1];
  const title = `Where to go in ${label}`;
  const listed = page.picks.best.length + page.picks.good.length;

  return (
    <header className='paper-aged ticket-edge grid gap-4 rounded-lg px-6 py-6 text-poster-ink sm:px-8'>
      <Breadcrumbs items={[COUNTRIES_SECTION, { name: title, href: monthPagePath(page.slug) }]} />
      <div className='grid items-start gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto]'>
        <div className='grid min-w-0 gap-2'>
          <p className='font-travel text-sm uppercase tracking-xl text-poster-brown'>{CompanyName} · Month by month</p>
          <h1 id='month-title' className='-rotate-1 font-travel text-5xl uppercase leading-none text-poster-red text-stroke-poster [overflow-wrap:anywhere] sm:text-6xl'>
            {title}
          </h1>
        </div>
        <RubberStamp lines={[label.slice(0, 3), 'Best time']} className='hidden md:grid' />
      </div>
      <p id='month-summary' className='max-w-2xl text-base leading-relaxed sm:text-lg'>
        {page.summary}
      </p>
      <dl className='grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]'>
        <dt className='font-travel uppercase tracking-xl text-poster-brown'>At their best</dt>
        <dd className='font-semibold'>
          {page.picks.best.length === 1 ? '1 country' : `${page.picks.best.length} countries`}, and {listed - page.picks.best.length} more good
        </dd>
        <dt className='font-travel uppercase tracking-xl text-poster-brown'>Last checked</dt>
        <dd>{formatDay(page.lastChecked) || 'Not yet'}</dd>
      </dl>
    </header>
  );
}

export default MonthPageHeader;
