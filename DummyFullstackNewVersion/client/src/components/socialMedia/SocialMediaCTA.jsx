import React from 'react';
// Components
import SocialMediaPin from './SocialMediaPin';
// Data
import { socialMediaLinks } from '@/utils/data/socialMediaData';

function SocialMediaCTA({ socialClassName }) {
  // No profiles set in links.js: render nothing rather than an empty list
  if (!socialMediaLinks.length) return null;

  return (
    <section className='grid w-fit mx-auto'>
      <ul className='grid grid-flow-col gap-2 list-none'>
        {socialMediaLinks.map((pin) => (
          <SocialMediaPin
            key={pin.serviceName}
            serviceName={pin.serviceName}
            icon={pin.icon}
            url={pin.url}
            ariaLabel={pin.ariaLabel}
            title={pin.title}
            className={socialClassName}
          />
        ))}
      </ul>
    </section>
  );
}

export default SocialMediaCTA;
