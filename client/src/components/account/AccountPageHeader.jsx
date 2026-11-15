import React from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import PageTitleCard from '@/components/common/PageTitleCard';

// The account page's title, in the boarding pass's style (the page's <main> is labelled
// by it, in AccountPage)
function AccountPageHeader() {
  const { user } = useAuth();

  return (
    <PageTitleCard
      page='Passport office'
      title='Your account'
      headingId='account-title'
      subtitle={
        <>
          Signed in as <span className='font-semibold'>{user?.email}</span>
        </>
      }
      subtitleId='account-subtitle'
      stamp={['Approved']}
    />
  );
}

export default AccountPageHeader;
