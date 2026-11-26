import React from 'react';
// Constants
import { ADMIN_GIFTS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminGiftsMainContainer from '@/components/admin/gifts/AdminGiftsMainContainer';

// Gifts and referral rewards (ADMIN or DEVELOPER; the audit, 26 Nov 2026): a gift found by its
// code, the gifts bought lately, and who earned which referral reward
function AdminGiftsPage() {
  const pageHelmet = helmetData[ADMIN_GIFTS_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_GIFTS_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-gifts-page-heading' }}>
        <PageTitleCard
          page='Head office'
          title='Gifts and Referrals'
          headingId='admin-gifts-page-heading'
          subtitle='Gift codes bought and redeemed, and the rewards members earn for inviting friends.'
        />
        <AdminGiftsMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminGiftsPage;
