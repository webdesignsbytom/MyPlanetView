import React from 'react';
// Constants
import { ADMIN_USERS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminUsersMainContainer from '@/components/admin/users/AdminUsersMainContainer';

function AdminUsersPage() {
  const pageHelmet = helmetData[ADMIN_USERS_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_USERS_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-users-heading' }}>
        <PageTitleCard page='Head office' title='User Admin' headingId='admin-users-heading' />
        <AdminUsersMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminUsersPage;
