import React from 'react';
// Utils
import { countriesIndexMeta } from '@/utils/countries/countryMeta';
import { countriesIndexSchema } from '@/utils/countries/countrySchema';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PageTitleCard from '@/components/common/PageTitleCard';
import CountryIndexList from '@/components/countries/CountryIndexList';
import CountryStartMap from '@/components/countries/CountryStartMap';
import MonthLinks from '@/components/months/MonthLinks';
import PaperCard from '@/components/common/PaperCard';
// Utils
import { CHECKED_MONTH_PAGES } from '@/utils/months/monthPages';

/**
 * /countries, the index of the country guides (public, pre-rendered, indexed). It exists
 * only when at least one guide is checked; `pages` are the guides this build has (the
 * checked ones; drafts too on the dev server, tagged), A–Z.
 */
function CountriesIndexPage({ pages }) {
  const meta = countriesIndexMeta(pages.map((page) => page.name));

  return (
    <>
      <HelmetItem
        PageName={meta.pageName}
        title={meta.title}
        desc={meta.desc}
        indexing='index,follow'
        structuredData={[countriesIndexSchema(pages, meta)]}
        canonicalPath={meta.path}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'countries-title', 'aria-describedby': 'countries-subtitle' }}>
        <PageTitleCard
          page='Country guides'
          title={meta.pageName}
          headingId='countries-title'
          subtitle='When to go, month by month, with the weather, the festivals, local customs and the practical facts for each country. Every guide is written for this site and checked by hand.'
          subtitleId='countries-subtitle'
          stamp={['Where', 'next?']}
        />
        {CHECKED_MONTH_PAGES.length ? (
          <PaperCard title='Month by month' titleId='countries-months-heading'>
            <MonthLinks lead='Where to go in each month: the countries at their best, from these guides.' />
          </PaperCard>
        ) : null}
        <CountryIndexList pages={pages} />
        <CountryStartMap />
      </PublicPageLayout>
    </>
  );
}

export default CountriesIndexPage;
