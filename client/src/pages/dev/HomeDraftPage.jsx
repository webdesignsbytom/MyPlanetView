import React from 'react';
// Constants
import { DEV_HOME_DRAFT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import HomeDraft from '@/components/homeDraft/HomeDraft';

// Dev server only: a draft of a new home page to design with, beside the real one (/)
function HomeDraftPage() {
  const pageHelmet = helmetData[DEV_HOME_DRAFT_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        canonicalPath={DEV_HOME_DRAFT_PAGE_URL}
      />
      <HomeDraft />
    </>
  );
}

export default HomeDraftPage;
