import React from 'react';
// Icons
import { FiUser, FiHeart, FiUsers } from 'react-icons/fi';
// Data
import { homeGroups } from '@/utils/data/homeData';
// Components
import HowItWorksHeading from './HowItWorksHeading';

const GROUP_ICONS = {
  solo: FiUser,
  couple: FiHeart,
  family: FiUsers,
};

// "Who it's for": solo, couple and family maps
function HowItWorksGroups() {
  return (
    <section
      aria-labelledby='how-groups-title'
      className='grid w-full px-6 py-12 sm:px-8 sm:py-16'
    >
      <div className='grid w-full gap-y-10'>
        <HowItWorksHeading
          id='how-groups-title'
          eyebrow='Who it is for'
          title='One map for one traveller, two, or the whole family'
        />

        <ul className='grid gap-6 md:grid-cols-3'>
          {homeGroups.map(({ id, title, text }) => {
            const Icon = GROUP_ICONS[id];
            return (
              <li
                key={id}
                className='paper-aged grid content-start justify-items-center gap-y-3 rounded-lg border-2 border-poster-brown p-6 text-center text-poster-ink shadow-paper'
              >
                <Icon className='text-3xl text-poster-red-deep' aria-hidden='true' />
                <h3 className='font-travel text-2xl leading-tight'>{title}</h3>
                <p className='leading-relaxed'>{text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default HowItWorksGroups;
