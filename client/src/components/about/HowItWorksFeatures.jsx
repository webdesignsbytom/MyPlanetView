import React from 'react';
// Icons
import { FiMap, FiImage, FiFlag, FiCompass, FiShare2 } from 'react-icons/fi';
// Data
import { homeFeatures, homeFeaturesIntro } from '@/utils/data/homeData';
// Components
import HowItWorksHeading from './HowItWorksHeading';

const FEATURE_ICONS = {
  map: FiMap,
  photos: FiImage,
  landmarks: FiFlag,
  trips: FiCompass,
  share: FiShare2,
};

// "How it works": the map, photos, landmarks and trips, then sharing by link (no app, no
// account: 23 Nov 2026, the user's wish), which spans the row while the cards are two to a
// row, so it stands out rather than sitting alone
function HowItWorksFeatures() {
  return (
    <section
      aria-labelledby='how-features-title'
      className='grid w-full px-6 py-12 sm:px-8 sm:py-16'
    >
      <div className='grid w-full gap-y-10'>
        <HowItWorksHeading
          id='how-features-title'
          eyebrow='How it works'
          title='Everywhere you have been, in one place'
        />
        <p className='max-w-prose justify-self-center text-center text-lg leading-relaxed'>{homeFeaturesIntro}</p>

        <ul className='grid gap-6 sm:grid-cols-2 xl:grid-cols-5'>
          {homeFeatures.map(({ id, title, text }) => {
            const Icon = FEATURE_ICONS[id];
            return (
              <li
                key={id}
                data-feature={id}
                className='paper-aged grid content-start gap-y-3 rounded-lg border-2 border-poster-brown p-6 text-poster-ink shadow-paper sm:last:odd:col-span-2 xl:last:odd:col-span-1'
              >
                <span
                  className='grid place-items-center size-12 rounded-full border-2 border-poster-brown bg-poster-red text-poster-ink text-2xl'
                  aria-hidden='true'
                >
                  <Icon />
                </span>
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

export default HowItWorksFeatures;
