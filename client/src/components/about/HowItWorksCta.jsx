import React from 'react';
// Context
import { useAuth } from '@/auth/AuthContext';
// Constants
import { MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
// Data
import { homeCta } from '@/utils/data/homeData';
// Components
import AppLink from '@/components/common/AppLink';
import HowItWorksHeading from './HowItWorksHeading';

// The closing call to action in a double-ruled box: sign up, or open your map once
// signed in. Centred below lg; from lg the words sit left and the button right.
function HowItWorksCta() {
  const { user } = useAuth();
  const signedIn = Boolean(user);

  return (
    <section aria-labelledby='how-cta-title' className='grid w-full px-6 py-12 sm:px-8 sm:py-16'>
      <div className='grid w-full items-center justify-items-center gap-6 rounded-lg border-4 border-double border-colour9 p-8 text-center sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:justify-items-start lg:gap-x-12 lg:text-left'>
        <div className='grid gap-y-4'>
          <HowItWorksHeading id='how-cta-title' title={homeCta.title} className='' />
          <p className='max-w-prose leading-relaxed'>{homeCta.text}</p>
        </div>
        <AppLink
          to={signedIn ? MAP_PAGE_URL : SIGN_UP_PAGE_URL}
          label={signedIn ? 'Open your map' : 'Start your map'}
          description={signedIn ? 'Go to your My Planet View map' : 'Sign up for a free My Planet View map'}
          className='btn-poster lg:justify-self-end'
        />
      </div>
    </section>
  );
}

export default HowItWorksCta;
