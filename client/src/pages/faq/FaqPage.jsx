import React from 'react';
// Constants
import { FAQ_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  faqPageAdditionalMeta,
  faqPageStructuredData,
} from '@/utils/data/metaData';
import { faqSchemaItems } from '@/utils/data/faqData';
// Utils
import FAQSchema from '@/utils/seo/FAQSchema';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import FaqPageHeader from '@/components/faq/FaqPageHeader';
import FaqComponent from '@/components/faq/FaqComponent';

function FaqPage() {
  const pageHelmet = helmetData[FAQ_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={faqPageAdditionalMeta}
        structuredData={[faqPageStructuredData]}
        canonicalPath={FAQ_PAGE_URL}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'faq-title', 'aria-describedby': 'faq-subtitle' }}>
        <FaqPageHeader />
        <FaqComponent />
        <FAQSchema items={faqSchemaItems} />
      </PublicPageLayout>
    </>
  );
}

export default FaqPage;
