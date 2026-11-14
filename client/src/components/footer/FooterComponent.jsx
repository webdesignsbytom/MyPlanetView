import React from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Data
import { FooterLinkGroups } from '@/utils/data/footerData';
// Components
import FooterLogoSection from './FooterLogoSection';
import FooterNavSection from './FooterNavSection';
import FooterContactSection from './FooterContactSection';
import FooterCopyrightSection from './FooterCopyrightSection';

// The site footer as a piece of travel paperwork: aged parchment inside the shared
// ticket-edge, link columns in the travel face, a dashed perforation above the small print.
// A signed-in visitor's "Your map" column links to their map and account instead of
// sign-up and log-in (the pre-rendered pages are built signed out).
function FooterComponent() {
  const { user } = useAuth();
  return (
    <footer
      role='contentinfo'
      aria-label={`${CompanyName} site footer`}
      className='ticket-edge paper-aged grid overflow-hidden rounded-lg text-poster-ink no__highlights'
    >
      <div className='grid w-full gap-10 px-6 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]'>
        <div className='sm:col-span-2 lg:col-span-4 xl:col-span-1'>
          <FooterLogoSection />
        </div>
        {FooterLinkGroups.map(({ id, title, links, signedInLinks }) => (
          <FooterNavSection key={id} id={id} title={title} links={user && signedInLinks ? signedInLinks : links} />
        ))}
        <FooterContactSection />
      </div>
      <FooterCopyrightSection />
    </footer>
  );
}

export default FooterComponent;
