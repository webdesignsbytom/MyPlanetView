import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Images (imported directly, so the navbar doesn't pull in the whole image manifest)
import logoAvif128 from '@/assets/images/brand/logo-128.avif';
import logoAvif256 from '@/assets/images/brand/logo-256.avif';
import logoWebp256 from '@/assets/images/brand/logo-256.webp';

const LOGO_SIZES = { sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-14 w-14', xl: 'h-32 w-32 xl:h-40 xl:w-40' };
const TEXT_SIZES = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl', xl: 'text-3xl' };

// my_planet's camera-and-globe logo with the name in the travel face. Inherits the text
// colour of what it sits on. size: 'sm' | 'md' | 'lg' | 'xl'; `stacked` puts the name
// under the logo (the home page's nav column); `hideNameOnPhones` shows the logo alone
// below sm (the navbar on phones).
function BrandWordmark({ size = 'md', stacked = false, hideNameOnPhones = false }) {
  const large = size === 'xl';
  return (
    <span
      className={`grid items-center gap-2 font-travel leading-none tracking-wide ${
        stacked ? 'justify-items-center text-center' : 'grid-cols-reg'
      } ${TEXT_SIZES[size]}`}
    >
      <picture className={`grid ${LOGO_SIZES[size]}`}>
        <source type='image/avif' srcSet={large ? `${logoAvif256} 256w` : `${logoAvif128} 128w, ${logoAvif256} 256w`} sizes={large ? '10rem' : '3.5rem'} />
        <img src={logoWebp256} alt='' width={256} height={256} decoding='async' className='h-full w-full object-contain' />
      </picture>
      <span className={hideNameOnPhones ? 'max-sm:hidden' : ''}>{CompanyName}</span>
    </span>
  );
}

export default BrandWordmark;
