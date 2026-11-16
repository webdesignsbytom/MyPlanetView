import React from 'react';
// Context
import { useAuth } from '@/auth/AuthContext';
// Constants
import { ACCOUNT_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
// Data
import { pricingCta } from '@/utils/data/pricingData';
// Components
import AppLink from '@/components/common/AppLink';

// The closing call to action, as on the About page: sign up, or once signed in, your
// plan on the account page. The first render is signed out, as the pre-rendered page is.
function PricingCta() {
  const { user } = useAuth();

  return (
    <section
      aria-labelledby='pricing-cta-heading'
      className='ticket-edge grid w-full overflow-hidden rounded-lg bg-paper-cream px-6 py-10 text-colour4 sm:px-8'
    >
      <div className='grid w-full items-center justify-items-center gap-6 rounded-lg border-4 border-double border-colour9 p-8 text-center sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:justify-items-start lg:gap-x-12 lg:text-left'>
        <div className='grid gap-y-4'>
          <h2 id='pricing-cta-heading' className='font-travel text-3xl uppercase leading-tight tracking-wide text-colour6 sm:text-4xl'>
            {pricingCta.title}
          </h2>
          <p className='max-w-prose leading-relaxed'>{pricingCta.text}</p>
        </div>
        <AppLink
          to={user ? ACCOUNT_PAGE_URL : SIGN_UP_PAGE_URL}
          label={user ? 'See your plan' : 'Start your map'}
          className='btn-poster lg:justify-self-end'
        />
      </div>
    </section>
  );
}

export default PricingCta;
