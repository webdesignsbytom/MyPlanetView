import React from 'react';
// Constants
import { ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import Navbar from '@/components/nav/Navbar';
import AccountPageHeader from '@/components/account/AccountPageHeader';
import AccountPageMainContainer from '@/components/account/AccountPageMainContainer';
import FooterComponent from '@/components/footer/FooterComponent';

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

      <div className='grid min-h-screen overflow-hidden'>
        <div className='grid grid-rows-reg'>
          <Navbar />
          <AccountPageHeader />
        </div>

        <AccountPageMainContainer />

        <div className='pt-12'>
          <FooterComponent />
        </div>
      </div>
    </>
  );
}

export default AccountPage;
