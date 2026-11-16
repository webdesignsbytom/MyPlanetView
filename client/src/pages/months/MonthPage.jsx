import React from 'react';
// Utils
import { MONTH_LABELS } from '@/utils/months/monthContent';
import { MONTH_PAGES } from '@/utils/months/monthPages';
import { monthPageMeta } from '@/utils/months/monthMeta';
import { monthPageSchema } from '@/utils/months/monthSchema';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PaperCard from '@/components/common/PaperCard';
import CountryStartMap from '@/components/countries/CountryStartMap';
import MonthDraftBanner from '@/components/months/MonthDraftBanner';
import MonthPageHeader from '@/components/months/MonthPageHeader';
import MonthBestList from '@/components/months/MonthBestList';
import MonthMoreList from '@/components/months/MonthMoreList';
import MonthNav from '@/components/months/MonthNav';

/**
 * "Where to go in <month>", /where-to-go/<month> (public, pre-rendered, indexed once
 * checked): the month's own introduction, then from the country guides the countries at
 * their best (poster, the season then, its festivals), those also good, and the regions at
 * their best where the rest of their country isn't, each linking to its guide; then the
 * other months and a way to start a map. `page` is the month file with its `picks`
 * (scripts/month-pages.mjs; lazyPages.js loads it with this code, so the first render is
 * whole). Drafts exist only on the dev server, with a banner, and are never indexed.
 */
function MonthPage({ page }) {
  const label = MONTH_LABELS[page.month - 1];
  const meta = monthPageMeta(page, {
    bestNames: page.picks.best.map((pick) => pick.name),
    goodNames: page.picks.good.map((pick) => pick.name),
  });
  const isDraft = page.status !== 'checked';
  // The section links its own months; drafts only show beside drafts (development)
  const months = MONTH_PAGES.filter((month) => month.status === 'checked' || isDraft);

  return (
    <>
      <HelmetItem
        PageName={meta.pageName}
        title={meta.title}
        desc={meta.desc}
        indexing={isDraft ? 'noindex,nofollow' : 'index,follow'}
        structuredData={[monthPageSchema(page, meta)]}
        canonicalPath={meta.path}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'month-title', 'aria-describedby': 'month-summary' }}>
        {isDraft ? <MonthDraftBanner slug={page.slug} /> : null}
        <MonthPageHeader page={page} />

        <PaperCard title={`${label} around the world`} titleId='month-intro-heading' bodyClassName='gap-3'>
          {page.intro.map((paragraph) => (
            <p key={paragraph} className='max-w-prose leading-relaxed'>
              {paragraph}
            </p>
          ))}
        </PaperCard>

        {page.picks.best.length ? <MonthBestList label={label} picks={page.picks.best} /> : null}
        {page.picks.good.length ? (
          <MonthMoreList title={`Also good in ${label}`} titleId='month-good-heading' picks={page.picks.good} kind='good' />
        ) : null}
        {page.picks.regions.length ? (
          <MonthMoreList title={`Regions at their best in ${label}`} titleId='month-regions-heading' picks={page.picks.regions} kind='regions' />
        ) : null}

        {months.length > 1 ? <MonthNav months={months} current={page.month} /> : null}
        <CountryStartMap />
      </PublicPageLayout>
    </>
  );
}

export default MonthPage;
