import React from 'react';
// Constants
import { ADMIN_CONTACT_FORM_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import ContactFormDataSection from '@/components/contact/admin/ContactFormDataSection';

function ContactFormAdminPage() {
  const pageHelmet = helmetData[ADMIN_CONTACT_FORM_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_CONTACT_FORM_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-contact-forms-heading' }}>
        <PageTitleCard page='Head office' title='Admin - Contact Forms' headingId='admin-contact-forms-heading' />
        <ContactFormDataSection />
      </AppPageShell>
    </>
  );
}

export default ContactFormAdminPage;
