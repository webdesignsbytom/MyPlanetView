import React from 'react';
// Constants
import { CONTACT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  contactPageAdditionalMeta,
  contactPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import ContactPageMainContainer from '@/components/contact/ContactPageMainContainer';

function ContactPage() {
  const pageHelmet = helmetData[CONTACT_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={contactPageAdditionalMeta}
        structuredData={[contactPageStructuredData]}
        canonicalPath={CONTACT_PAGE_URL}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'contact-title', 'aria-describedby': 'contact-subtitle' }}>
        <ContactPageMainContainer />
      </PublicPageLayout>
    </>
  );
}

export default ContactPage;
