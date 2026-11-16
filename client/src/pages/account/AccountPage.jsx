import React from 'react';
// Constants
import { ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AppPageShell from '@/components/common/AppPageShell';
import StampBackdrop from '@/components/common/StampBackdrop';
import AccountPageHeader from '@/components/account/AccountPageHeader';
import AccountPageMainContainer from '@/components/account/AccountPageMainContainer';

function AccountPage() {
  const pageHelmet = helmetData[ACCOUNT_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta}
        structuredData={pageHelmet.structuredData}
        canonicalPath={ACCOUNT_PAGE_URL}
      />

      {/* Passport stamps over the red (the user's wish, 16 Nov 2026) */}
      <AppPageShell
        width='max-w-3xl'
        mainProps={{ 'aria-labelledby': 'account-title', 'aria-describedby': 'account-subtitle' }}
        backdrop={<StampBackdrop />}
      >
        <AccountPageHeader />
        <AccountPageMainContainer />
      </AppPageShell>
    </>
  );
}

export default AccountPage;
