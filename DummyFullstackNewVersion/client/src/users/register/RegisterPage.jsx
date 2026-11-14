import React from 'react';
// Constants
import { SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { CompanyName } from '@/utils/constants/constants';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  registerPageAdditionalMeta,
  registerPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import TravelTicket from '@/components/auth/TravelTicket';
import RegisterForm from '@/components/forms/RegisterForm';

function RegisterPage() {
  const pageHelmet = helmetData[SIGN_UP_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={registerPageAdditionalMeta}
        structuredData={registerPageStructuredData}
        canonicalPath={SIGN_UP_PAGE_URL}
      />

      <AuthPageLayout mainProps={{ 'aria-labelledby': 'register-page-heading', 'aria-describedby': 'register-page-subtitle' }}>
        <TravelTicket
          kicker='New passport'
          title={`Join ${CompanyName}`}
          headingId='register-page-heading'
          subtitle='Make your free account. Your map stays private until you choose to share it.'
          subtitleId='register-page-subtitle'
          route={{ from: 'Home', to: 'Everywhere' }}
          stub={['First flight', 'Class: Explorer', 'Seat: Window']}
        >
          <section aria-label='Registration form'>
            <RegisterForm />
          </section>
        </TravelTicket>
      </AuthPageLayout>
    </>
  );
}

export default RegisterPage;
