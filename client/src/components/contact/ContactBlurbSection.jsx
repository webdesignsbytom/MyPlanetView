import React from 'react';
// Icons
import { FiMail, FiHelpCircle } from 'react-icons/fi';
// Constants
import { CompanyEmailAddress } from '@/utils/constants/constants';
import { FAQ_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppAnchor from '@/components/common/AppAnchor';
import AppLink from '@/components/common/AppLink';
import PaperCard from '@/components/common/PaperCard';
import SocialMediaCTA from '@/components/socialMedia/SocialMediaCTA';

// Beside the contact form: the email address, the FAQ, and what to include
function ContactBlurbSection() {
  return (
    <PaperCard as='article' title='Get in touch' titleId='contact-blurb-title' kicker='Other ways' bodyClassName='gap-y-6'>
      <p className='leading-relaxed'>
        Use the form, or email us directly. If something on your map looks wrong, tell us which page you were on and
        what you expected to see.
      </p>

      <ul className='grid gap-y-4'>
        <li className='grid grid-cols-reg items-center gap-x-3'>
          <FiMail className='text-2xl text-colour6' aria-hidden='true' />
          <AppAnchor
            href={`mailto:${CompanyEmailAddress}`}
            ariaLabel={`Email ${CompanyEmailAddress}`}
            titleAttr={`Email ${CompanyEmailAddress}`}
            className='break-all font-semibold underline'
          >
            {CompanyEmailAddress}
          </AppAnchor>
        </li>
        <li className='grid grid-cols-reg items-center gap-x-3'>
          <FiHelpCircle className='text-2xl text-colour6' aria-hidden='true' />
          <span>
            Quick answer? <AppLink to={FAQ_PAGE_URL} label='Read the FAQ' className='font-semibold underline' />
          </span>
        </li>
      </ul>

      <SocialMediaCTA socialClassName='text-2xl text-colour6 hover:brightness-110' />
    </PaperCard>
  );
}

export default ContactBlurbSection;
