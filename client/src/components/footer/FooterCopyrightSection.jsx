/* global __BUILD_YEAR__ */
import React, { useSyncExternalStore } from 'react';
// Constants
import { CompanyName, DEVELOPER_NAME, DEVELOPER_URL } from '@/utils/constants/constants';
// Components
import AppAnchor from '@/components/common/AppAnchor';

// A pre-rendered page says the year it was built in, and hydration needs the first render
// to say the same (__BUILD_YEAR__, vite.config.js); this year follows straight after
const noSubscription = () => () => {};
const thisYear = () => new Date().getFullYear();
const buildYear = () => __BUILD_YEAR__;

function FooterCopyrightSection() {
  const year = useSyncExternalStore(noSubscription, thisYear, buildYear);

  return (
    <section className='grid w-full gap-2 border-t-2 border-dashed border-poster-brown px-6 py-4 text-center text-sm sm:grid-cols-rev sm:px-8 sm:text-left'>
      <p>
        © {year} {CompanyName}
      </p>
      <p>
        Website by{' '}
        <AppAnchor
          href={DEVELOPER_URL}
          target='_blank'
          rel='noopener noreferrer nofollow'
          className='underline hover:text-poster-red-deep'
        >
          {DEVELOPER_NAME}
        </AppAnchor>
      </p>
    </section>
  );
}

export default FooterCopyrightSection;
