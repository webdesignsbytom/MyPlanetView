import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Images (the camera-and-globe logo, as the navbar imports it)
import logoAvif256 from '@/assets/images/brand/logo-256.avif';
import logoWebp256 from '@/assets/images/brand/logo-256.webp';
// Utils
import { GROUP_LABELS } from '@/utils/passport/passportBook';

/**
 * The passport's cover, in the poster style: deep red board with gold lettering and a gold
 * rule, the camera-and-globe logo as the crest, "Passport" and the map's name. Fixed
 * artwork colours (poster-*), the same in light and dark mode, like a printed cover.
 */
function PassportCover({ map, headingId }) {
  const detail = [GROUP_LABELS[map.groupType], map.ownerName].filter(Boolean).join(' · ');
  return (
    <section aria-labelledby={headingId} className='grid h-full min-h-[30rem] place-items-center bg-poster-red-deep px-6 py-10 text-poster-gold-light'>
      <div className='grid w-full max-w-sm justify-items-center gap-5 border-2 border-poster-gold-light px-6 py-8 text-center outline outline-1 outline-offset-4 outline-poster-gold-light'>
        <p className='font-travel text-sm uppercase tracking-3xl'>{CompanyName}</p>
        <picture className='grid h-28 w-28 place-items-center rounded-full border-4 border-double border-poster-gold-light bg-poster-cream p-2'>
          <source type='image/avif' srcSet={`${logoAvif256} 256w`} sizes='7rem' />
          <img src={logoWebp256} alt='' width={256} height={256} decoding='async' className='h-full w-full object-contain' />
        </picture>
        <h2 id={headingId} className='font-travel text-5xl uppercase leading-none tracking-2xl'>
          Passport
        </h2>
        <p className='font-travel text-2xl uppercase leading-tight text-poster-cream sm:text-3xl'>{map.name}</p>
        {detail ? <p className='text-sm text-poster-cream'>{detail}</p> : null}
      </div>
    </section>
  );
}

export default PassportCover;
