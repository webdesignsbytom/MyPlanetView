import React from 'react';
// Components
import AccountCard from './AccountCard';
import AccountProfileSection from './AccountProfileSection';
import AccountEmailSection from './AccountEmailSection';
import AccountSessionsSection from './AccountSessionsSection';
import AccountDeleteSection from './AccountDeleteSection';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';

function AccountPageMainContainer() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      role='main'
      aria-labelledby='account-title'
      className='grid w-full h-full'
    >
      <div className='grid gap-8 px-6 md:px-10 py-8 w-full max-w-3xl mx-auto'>
        <AccountCard id='account-profile' title='Profile'>
          <AccountProfileSection />
        </AccountCard>

        <AccountCard id='account-email' title='Email'>
          <AccountEmailSection />
        </AccountCard>

        <AccountCard id='account-password' title='Password'>
          <ChangePasswordForm />
        </AccountCard>

        <AccountCard id='account-sessions' title='Devices'>
          <AccountSessionsSection />
        </AccountCard>

        <AccountCard id='account-delete' title='Delete account' danger>
          <AccountDeleteSection />
        </AccountCard>
      </div>
    </main>
  );
}

export default AccountPageMainContainer;
