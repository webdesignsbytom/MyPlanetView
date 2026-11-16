import React from 'react';
// Constants
import { ADMIN_OFFERS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminOffersMainContainer from '@/components/admin/offers/AdminOffersMainContainer';

// Travel offers (ADMIN or DEVELOPER): the partners' cards in galleries, slideshows,
// country pages and the Travel Desk; what each was clicked, and the import file
function AdminOffersPage() {
  const pageHelmet = helmetData[ADMIN_OFFERS_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_OFFERS_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-offers-page-heading' }}>
        <PageTitleCard
          page='Head office'
          title='Travel Offers'
          headingId='admin-offers-page-heading'
          subtitle='Partner offers on the cards and the Travel Desk: what each one shows, what it was clicked, and the import file.'
        />
        <AdminOffersMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminOffersPage;
