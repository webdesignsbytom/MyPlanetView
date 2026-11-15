import React from 'react';
// Constants
import { ADMIN_EVENTS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminEventsMainContainer from '@/components/admin/events/AdminEventsMainContainer';

function AdminEventsPage() {
  const pageHelmet = helmetData[ADMIN_EVENTS_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_EVENTS_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-events-heading' }}>
        <PageTitleCard page='Head office' title='Audit Log' headingId='admin-events-heading' />
        <AdminEventsMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminEventsPage;
