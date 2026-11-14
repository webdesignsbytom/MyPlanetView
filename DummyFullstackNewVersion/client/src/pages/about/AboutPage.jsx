import React from 'react';
// Constants
import { ABOUT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  aboutPageAdditionalMeta,
  aboutPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import AboutPageHeader from '@/components/about/AboutPageHeader';
import AboutPageMainContainer from '@/components/about/AboutPageMainContainer';

function AboutPage() {
  const pageHelmet = helmetData[ABOUT_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={aboutPageAdditionalMeta}
        structuredData={[aboutPageStructuredData]}
        canonicalPath={ABOUT_PAGE_URL}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'about-title', 'aria-describedby': 'about-subtitle' }}>
        <AboutPageHeader />
        <AboutPageMainContainer />
      </PublicPageLayout>
    </>
  );
}

export default AboutPage;
