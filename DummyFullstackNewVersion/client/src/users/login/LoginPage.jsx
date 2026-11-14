import React from 'react';
// Constants
import { LOGIN_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  loginPageAdditionalMeta,
  loginPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import TravelTicket from '@/components/auth/TravelTicket';
import LoginForm from '@/components/forms/LoginForm';

function LoginPage() {
  const pageHelmet = helmetData[LOGIN_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={loginPageAdditionalMeta}
        structuredData={loginPageStructuredData}
        canonicalPath={LOGIN_PAGE_URL}
      />

      <AuthPageLayout mainProps={{ 'aria-labelledby': 'login-page-heading', 'aria-describedby': 'login-page-subtitle' }}>
        <TravelTicket
          kicker='Boarding pass'
          title='Welcome back'
          headingId='login-page-heading'
          subtitle='Sign in to open your map, your trips and the maps shared with you.'
          subtitleId='login-page-subtitle'
          route={{ from: 'Wherever you are', to: 'Your map' }}
          stub={['Return trip', 'Gate: World', 'Seat: Window']}
        >
          <section aria-label='Login form'>
            <LoginForm />
          </section>
        </TravelTicket>
      </AuthPageLayout>
    </>
  );
}

export default LoginPage;
