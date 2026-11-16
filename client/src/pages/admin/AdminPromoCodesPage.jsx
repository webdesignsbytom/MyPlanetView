import React from 'react';
// Constants
import { ADMIN_PROMO_CODES_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminPromoCodesMainContainer from '@/components/admin/promoCodes/AdminPromoCodesMainContainer';

// Influencer codes (ADMIN or DEVELOPER): make one, see what each brought, change or turn one off
function AdminPromoCodesPage() {
  const pageHelmet = helmetData[ADMIN_PROMO_CODES_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_PROMO_CODES_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-promo-codes-page-heading' }}>
        <PageTitleCard
          page='Head office'
          title='Promo Codes'
          headingId='admin-promo-codes-page-heading'
          subtitle='Creators’ sign-up codes, what they offer, and who they brought.'
        />
        <AdminPromoCodesMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminPromoCodesPage;
