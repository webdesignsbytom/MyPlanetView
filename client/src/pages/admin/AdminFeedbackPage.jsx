import React from 'react';
// Constants
import { ADMIN_FEEDBACK_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import AdminFeedbackMainContainer from '@/components/admin/feedback/AdminFeedbackMainContainer';

// Feedback sent from the map (ADMIN or DEVELOPER): read each report and its screenshot, move it
// along (New, In progress, Done, Won't do), keep notes, reply by email, delete it
function AdminFeedbackPage() {
  const pageHelmet = helmetData[ADMIN_FEEDBACK_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_FEEDBACK_PAGE_URL}
      />

      <AppPageShell width='max-w-6xl' mainProps={{ 'aria-labelledby': 'admin-feedback-page-heading' }}>
        <PageTitleCard
          page='Head office'
          title='Feedback'
          headingId='admin-feedback-page-heading'
          subtitle='Problems, ideas and questions sent from the map, newest first.'
        />
        <AdminFeedbackMainContainer />
      </AppPageShell>
    </>
  );
}

export default AdminFeedbackPage;
