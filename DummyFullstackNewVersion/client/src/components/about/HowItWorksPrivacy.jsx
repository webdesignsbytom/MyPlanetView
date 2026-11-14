import React from 'react';
// Icons
import { FiCheckCircle } from 'react-icons/fi';
// Constants
import { FAQ_PAGE_URL } from '@/utils/constants/routes';
// Data
import { homePrivacy } from '@/utils/data/homeData';
// Components
import AppLink from '@/components/common/AppLink';
import HowItWorksHeading from './HowItWorksHeading';

// The privacy promise: private by default, shared on your terms. Stacked and centred
// below lg; from lg the heading, intro and link sit left with the points beside them.
function HowItWorksPrivacy() {
  return (
    <section
      aria-labelledby='how-privacy-title'
      className='grid w-full px-6 py-12 sm:px-8 sm:py-16'
    >
      <div className='grid w-full gap-8 lg:grid-cols-2 lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:gap-x-12'>
        <HowItWorksHeading
          id='how-privacy-title'
          eyebrow='Your data'
          title={homePrivacy.title}
          className='text-center lg:text-left'
        />

        <p className='max-w-prose justify-self-center text-center text-lg leading-relaxed lg:justify-self-start lg:text-left'>
          {homePrivacy.intro}
        </p>

        <ul className='grid max-w-prose content-start justify-self-center gap-y-3 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:justify-self-start'>
          {homePrivacy.points.map((point) => (
            <li key={point} className='grid grid-cols-reg gap-x-3 items-start'>
              <FiCheckCircle className='text-xl text-colour6 translate-y-0.5' aria-hidden='true' />
              <span className='leading-relaxed'>{point}</span>
            </li>
          ))}
        </ul>

        <AppLink
          to={FAQ_PAGE_URL}
          label='Read more about privacy and sharing'
          className='btn-paper justify-self-center lg:self-start lg:justify-self-start'
        />
      </div>
    </section>
  );
}

export default HowItWorksPrivacy;
