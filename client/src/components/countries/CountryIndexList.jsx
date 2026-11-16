import React from 'react';
// Constants
import { countryPagePath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import AppLink from '@/components/common/AppLink';
import MonthStrip from './MonthStrip';
import MonthStripSummary from './MonthStripSummary';

// The guides by continent (continents A–Z, countries A–Z within each), one card each:
// every country links to its guide, with its summary and its months in brief
function CountryIndexList({ pages }) {
  const continents = [...new Set(pages.map((page) => page.continent))].sort((a, b) => a.localeCompare(b));

  return continents.map((continent) => {
    const id = `countries-${continent.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    return (
      <PaperCard key={continent} title={continent} titleId={id}>
        <ul className='grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3'>
          {pages
            .filter((page) => page.continent === continent)
            .map((page) => (
              <li key={page.slug} className='grid content-start gap-2'>
                <p className='grid grid-flow-col items-center justify-start gap-2'>
                  <AppLink
                    to={countryPagePath(page.slug)}
                    label={page.name}
                    className='font-travel text-2xl uppercase tracking-wide text-colour6 underline decoration-2 underline-offset-4 hover:brightness-75'
                  />
                  {page.status === 'checked' ? null : (
                    <span className='tone-warn rounded-sm border px-1.5 text-2xs font-semibold uppercase tracking-wide'>Draft</span>
                  )}
                </p>
                <p className='text-sm leading-relaxed'>{page.summary}</p>
                <MonthStrip months={page.months} compact />
                <MonthStripSummary months={page.months} />
              </li>
            ))}
        </ul>
      </PaperCard>
    );
  });
}

export default CountryIndexList;
