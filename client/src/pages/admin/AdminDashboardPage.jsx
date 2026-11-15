import React from 'react';
// Constants
import { ADMIN_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminDashboardMainContainer from '@/components/admin/AdminDashboardMainContainer';

function AdminDashboardPage() {
  const pageHelmet = helmetData[ADMIN_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-dashboard-heading' }}>
        <PageTitleCard page='Head office' title='Admin Dashboard' headingId='admin-dashboard-heading' />
        <AdminDashboardMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminDashboardPage;
