import React from 'react';
// Data
import { socialMediaLinks } from '@/utils/data/socialMediaData';
// Components
import SocialMediaPin from './SocialMediaPin';

function FixedSocialButtons() {
  // No profiles set in links.js: render nothing rather than an empty panel
  if (!socialMediaLinks.length) return null;

  return (
    <section
      className='fixed top-1/2 left-0 z-50'
      aria-label='Social media quick links'
    >
      <ul className='grid gap-y-2 bg-colour3 p-2 rounded-tr-xl rounded-br-xl -translate-y-1/2 list-none shadow-lift-sm'>
        {socialMediaLinks.map((item, index) => {
          return (
            <SocialMediaPin
              key={index}
              serviceName={item.serviceName}
              icon={item.icon}
              url={item.url}
              ariaLabel={item.ariaLabel}
              title={item.title}
              className={`rounded-full bg-colour6 p-2 shadow-lift-sm text-colour1 active:scale-95 hover:brightness-90 text-lg`}
            />
          );
        })}
      </ul>
    </section>
  );
}

export default FixedSocialButtons;
