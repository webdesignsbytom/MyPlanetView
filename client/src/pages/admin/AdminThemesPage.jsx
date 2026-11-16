import React from 'react';
// Constants
import { ADMIN_THEMES_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminThemesMainContainer from '@/components/admin/themes/AdminThemesMainContainer';

// Monthly photo themes (ADMIN or DEVELOPER): write the year ahead, change or delete one, see what each drew
function AdminThemesPage() {
  const pageHelmet = helmetData[ADMIN_THEMES_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_THEMES_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-themes-page-heading' }}>
        <PageTitleCard
          page='Head office'
          title='Photo Themes'
          headingId='admin-themes-page-heading'
          subtitle='One theme a month, written ahead, and how many photos each drew.'
        />
        <AdminThemesMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminThemesPage;
