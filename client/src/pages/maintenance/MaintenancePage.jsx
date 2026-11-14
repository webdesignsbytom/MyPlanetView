import React from 'react';
// Constants
import { MAINTENANCE_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  maintenancePageAdditionalMeta,
  maintenancePageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PageTitleCard from '@/components/common/PageTitleCard';

// Shown while the site is down for maintenance: one card, stamped "Closed for repairs"
function MaintenancePage() {
  const pageHelmet = helmetData[MAINTENANCE_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={maintenancePageAdditionalMeta}
        structuredData={maintenancePageStructuredData}
        canonicalPath={MAINTENANCE_PAGE_URL}
      />

      <PublicPageLayout footer={false} mainProps={{ 'aria-labelledby': 'maintenance-heading', 'aria-describedby': 'maintenance-subtitle' }}>
        <PageTitleCard
          page='Maintenance'
          title="We'll be back soon!"
          headingId='maintenance-heading'
          subtitle='Our site is currently undergoing scheduled maintenance.'
          subtitleId='maintenance-subtitle'
          stamp={['Closed', 'for', 'repairs']}
        >
          <p className='text-sm'>Thank you for your patience.</p>
        </PageTitleCard>
      </PublicPageLayout>
    </>
  );
}

export default MaintenancePage;
