import React from 'react';
// Constants
import { RESET_PASS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  resetPasswordPageAdditionalMeta,
  resetPasswordPageStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import TravelTicket from '@/components/auth/TravelTicket';
import ResetLostPasswordForm from '@/components/forms/ResetLostPasswordForm';

function ResetLostPasswordPage() {
  const pageHelmet = helmetData[RESET_PASS_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={resetPasswordPageAdditionalMeta}
        structuredData={resetPasswordPageStructuredData}
        canonicalPath={RESET_PASS_PAGE_URL}
      />

      <AuthPageLayout
        mainProps={{
          'aria-labelledby': 'reset-password-heading',
          'aria-describedby': 'reset-password-subtitle',
        }}
      >
        <TravelTicket
          kicker='Ticket reissue'
          title='Choose a new password'
          headingId='reset-password-heading'
          subtitle='Set a new password to get back to your map. Other devices will be signed out.'
          subtitleId='reset-password-subtitle'
          stub={['Reissued', 'Valid: 1 hour', 'Seat: Window']}
        >
          <section aria-label='Reset password form'>
            <ResetLostPasswordForm />
          </section>
        </TravelTicket>
      </AuthPageLayout>
    </>
  );
}

export default ResetLostPasswordPage;
