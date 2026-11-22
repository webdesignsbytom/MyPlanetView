import React from 'react';
// Components
import AccountCard from './AccountCard';
import AccountProfileSection from './AccountProfileSection';
import AccountGiftsSection from './AccountGiftsSection';
import AccountReferralSection from './AccountReferralSection';
import AccountImportSection from './AccountImportSection';
import AccountEmailsSection from './AccountEmailsSection';
import AccountPlanSection from './AccountPlanSection';
import AccountEmailSection from './AccountEmailSection';
import AccountSessionsSection from './AccountSessionsSection';
import AccountDataSection from './AccountDataSection';
import AccountDeleteSection from './AccountDeleteSection';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';

// The account page's paper cards, under its title (inside AppPageShell's <main>)
function AccountPageMainContainer() {
  return (
    <>
      <AccountCard id='account-profile' title='Profile'>
        <AccountProfileSection />
      </AccountCard>

      <AccountCard id='account-plan' title='Your plan'>
        <AccountPlanSection />
      </AccountCard>

      <AccountCard id='account-gifts' title='Gifts'>
        <AccountGiftsSection />
      </AccountCard>

      {/* Give a month, get a month (docs/API.md) */}
      <AccountCard id='account-invite' title='Invite a friend'>
        <AccountReferralSection />
      </AccountCard>

      <AccountCard id='account-import' title='Bring your travels'>
        <AccountImportSection />
      </AccountCard>

      <AccountCard id='account-emails' title='Emails we send'>
        <AccountEmailsSection />
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

      <AccountCard id='account-data' title='Your data'>
        <AccountDataSection />
      </AccountCard>

      <AccountCard id='account-delete' title='Delete account' danger>
        <AccountDeleteSection />
      </AccountCard>
    </>
  );
}

export default AccountPageMainContainer;
