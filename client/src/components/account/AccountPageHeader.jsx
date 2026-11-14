import React from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';

function AccountPageHeader() {
  const { user } = useAuth();

  return (
    <header
      className='grid w-full'
      aria-labelledby='account-title'
      aria-describedby='account-subtitle'
    >
      <div className='grid gap-6 px-6 max-w-lg mx-auto text-center py-12'>
        <h1
          id='account-title'
          className='font-titleFont text-4xl uppercase md:text-5xl font-extrabold'
        >
          Your account
        </h1>
        <p id='account-subtitle' className='text-lg md:text-xl leading-snug'>
          Signed in as <span className='font-semibold'>{user?.email}</span>
        </p>
      </div>
    </header>
  );
}

export default AccountPageHeader;
