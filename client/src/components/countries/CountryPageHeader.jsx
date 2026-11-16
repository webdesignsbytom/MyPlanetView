import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Utils
import { bestMonthsText, formatDay } from '@/utils/countries/countryContent';
import { COUNTRIES_SECTION } from '@/utils/countries/countryRoutes';
import { countryPagePath } from '@/utils/constants/routes';
// Components
import Breadcrumbs from '@/components/common/Breadcrumbs';
import RubberStamp from '@/components/common/RubberStamp';
import CountryPagePoster from './CountryPagePoster';

/**
 * A country page's headline, like the boarding pass's title card: the trail back to the
 * index, the country's name as the page's one h1 (poster red, tilted), its summary, the
 * best months and the date the page was last checked, with the travel poster beside it
 * (below the words on phones) and a rubber stamp in the country's own words.
 */
function CountryPageHeader({ page }) {
  const bestMonths = bestMonthsText(page.whenToGo.months, { short: true });
  const checked = formatDay(page.lastChecked);

  return (
    <header className='paper-aged ticket-edge grid gap-6 rounded-lg px-6 py-6 text-poster-ink sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:px-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]'>
      {/* The words come first (reading order); from sm up the poster takes the first column */}
      <div className='grid content-start gap-4 sm:col-start-2 sm:row-start-1'>
        <Breadcrumbs items={[COUNTRIES_SECTION, { name: page.name, href: countryPagePath(page.slug) }]} />

        <div className='grid items-start gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto]'>
          <div className='grid min-w-0 gap-2'>
            <p className='font-travel text-sm uppercase tracking-xl text-poster-brown'>{CompanyName} · Country guide</p>
            <h1
              id='country-title'
              className='-rotate-1 font-travel text-5xl uppercase leading-none text-poster-red text-stroke-poster [overflow-wrap:anywhere] sm:text-6xl'
            >
              {page.name}
            </h1>
          </div>
          <RubberStamp lines={page.stamp} className='hidden md:grid' />
        </div>

        <p id='country-summary' className='max-w-2xl text-base leading-relaxed sm:text-lg'>
          {page.summary}
        </p>

        <dl className='grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]'>
          <dt className='font-travel uppercase tracking-xl text-poster-brown'>Best months</dt>
          <dd className='font-semibold'>{bestMonths || 'No month stands out'}</dd>
          <dt className='font-travel uppercase tracking-xl text-poster-brown'>Last checked</dt>
          <dd>{checked || 'Not yet'}</dd>
        </dl>
      </div>

      <div className='grid content-start sm:col-start-1 sm:row-start-1'>
        <CountryPagePoster code={page.code} name={page.name} />
      </div>
    </header>
  );
}

export default CountryPageHeader;
