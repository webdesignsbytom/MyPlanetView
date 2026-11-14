import React from 'react';
// Constants
import { FORGOT_PASS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  forgottenPasswordPageAdditionalMeta,
  forgottenPasswordPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import TravelTicket from '@/components/auth/TravelTicket';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';

function ForgettenPasswordPage() {
  const pageHelmet = helmetData[FORGOT_PASS_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={forgottenPasswordPageAdditionalMeta}
        structuredData={forgottenPasswordPageStructuredData}
        canonicalPath={FORGOT_PASS_PAGE_URL}
      />

      <AuthPageLayout
        mainProps={{
          'aria-labelledby': 'forgotten-password-heading',
          'aria-describedby': 'forgotten-password-subtitle',
        }}
      >
        <TravelTicket
          kicker='Lost ticket desk'
          title='Forgotten your password?'
          headingId='forgotten-password-heading'
          subtitle='Request a reset: we will email you a link to choose a new one.'
          subtitleId='forgotten-password-subtitle'
          stub={['Lost and found', 'Desk: Help', 'No queue']}
        >
          <section aria-label='Forgotten password form'>
            <ForgotPasswordForm />
          </section>
        </TravelTicket>
      </AuthPageLayout>
    </>
  );
}

export default ForgettenPasswordPage;
