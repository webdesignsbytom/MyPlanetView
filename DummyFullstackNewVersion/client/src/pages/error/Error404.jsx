import React from 'react';
// Constants
import { ERROR_404_PAGE_URL, HOME_PAGE_URL, FAQ_PAGE_URL, CONTACT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  errorPageAdditionalMeta,
  errorPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import ResponsiveImage from '@/components/common/ResponsiveImage';
import AppLink from '@/components/common/AppLink';


// Lost luggage: one paper card stamped "Return to sender", with the lost cat and the
// way back. Pre-rendered as dist/404.html (noindex).
function Error404() {
  const pageHelmet = helmetData[ERROR_404_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={[
          ...errorPageAdditionalMeta,
          ...(pageHelmet.additionalMeta || []),
          { name: 'robots', content: 'noindex, nofollow' },
        ]}
        structuredData={errorPageStructuredData}
        canonicalPath={ERROR_404_PAGE_URL}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'error-404-heading', 'aria-describedby': 'error-404-subtitle' }}>
        <PaperCard
          as='article'
          header={
            <PageTitleCard
              embedded
              page='Lost luggage'
              title='Error 404'
              headingId='error-404-heading'
              subtitle='This page has gone missing in transit.'
              subtitleId='error-404-subtitle'
              stamp={['Return', 'to', 'sender']}
            />
          }
          bodyClassName='items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-x-12'
        >
          <div className='grid gap-4'>
            <h2 className='font-travel text-2xl uppercase tracking-wide text-colour6 sm:text-3xl'>Page not found</h2>
            <p className='max-w-prose leading-relaxed'>
              The address may be mistyped, or the page has moved on to another destination. But you found a friend.
            </p>
            <nav aria-label='Ways back' className='grid grid-row-wrap gap-3'>
              <AppLink to={HOME_PAGE_URL} label='Back to the home page' className='btn-poster' />
              <AppLink to={FAQ_PAGE_URL} label='Read the FAQ' className='btn-paper' />
              <AppLink to={CONTACT_PAGE_URL} label='Contact us' className='btn-paper' />
            </nav>
          </div>
          <ResponsiveImage
            folder='pages/error'
            name='404-page-not-found-cat'
            alt='A funny and cute lost cat for the error page.'
            ratio='4/3'
            width={300}
            height={480}
            loading='lazy'
            decoding='async'
            sizes='(max-width: 640px) 100vw, 352px'
            className='h-auto w-full justify-self-center'
            imgClassName='rounded-md'
          />
        </PaperCard>
      </PublicPageLayout>
    </>
  );
}

export default Error404;
