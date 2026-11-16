import React from 'react';
// Constants
import {
  CompanyEmailAddress,
  CompanyName,
  LocationCity,
  OperatorName,
} from '@/utils/constants/constants';
// Components
import AppAnchor from '@/components/common/AppAnchor';

// The address may wrap after the @ (a phone's half-width column), not mid-word
const [emailUser, emailDomain] = CompanyEmailAddress.split('@');

// How to reach us, and who runs the site
function FooterContactSection() {
  return (
    <section className='grid content-start gap-y-3' aria-labelledby='footer-contact'>
      <h2 id='footer-contact' className='font-travel text-xl tracking-wide'>
        Contact
      </h2>

      <address className='grid gap-y-2 text-sm not-italic'>
        <AppAnchor
          href={`mailto:${CompanyEmailAddress}`}
          ariaLabel={`Email ${CompanyName}`}
          className='hover:text-poster-red-deep hover:underline break-words'
        >
          {emailUser}@<wbr />
          {emailDomain}
        </AppAnchor>
        <p className='opacity-80'>
          Run by {OperatorName}, {LocationCity}, Devon.
        </p>
      </address>
    </section>
  );
}

export default FooterContactSection;
