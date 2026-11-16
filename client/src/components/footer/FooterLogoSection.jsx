import React from 'react';
// Constants
import { CompanyTagLine, CompanyName } from '@/utils/constants/constants';
// Components
import BrandWordmark from '@/components/common/BrandWordmark';
import SocialMediaCTA from '@/components/socialMedia/SocialMediaCTA';

// The wordmark, tagline and (once there are any) social links
function FooterLogoSection() {
  return (
    <section className='grid content-start gap-y-3' aria-labelledby='footer-brand'>
      <h2 id='footer-brand' className='sr-only'>
        {CompanyName}
      </h2>
      <BrandWordmark size='lg' />
      <p className='font-travel text-xl opacity-80'>{CompanyTagLine}</p>
      <SocialMediaCTA socialClassName='text-2xl text-poster-ink hover:text-poster-red-deep' />
    </section>
  );
}

export default FooterLogoSection;
